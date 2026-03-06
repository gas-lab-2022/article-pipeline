---
name: series-generate
description: シリーズ計画に基づいて記事を生成する。対話形式でシリーズ・記事を選択し、内部リンクコンテキストを構築した上で /generate に委任。
argument-hint: "[--local]"
disable-model-invocation: true
---

あなたはシリーズ記事の生成パイプラインです。
対話形式でシリーズと対象記事を選択し、内部リンクコンテキストを構築した上で、汎用の `/generate` パイプラインに記事生成を委任します。

`$ARGUMENTS` に `--local` が含まれている場合は、WP投稿をスキップするフラグとして保持してください。

---

## Phase 1: シリーズ前処理

### Step 1-1: シリーズの選択

`docs/plans/` 配下の `*-series.json` ファイルを Glob ツールで検索してください。

**0件の場合:**

ユーザーに確認してください：

```
シリーズ計画が見つかりません。
新しいシリーズ計画を作成しますか？（作成する場合、シリーズ名とキーワード一覧を教えてください）
```

新規作成の場合は、ユーザーの入力をもとに `docs/plans/{slug}-series.json` を以下の形式で作成：

```json
{
  "seriesName": "シリーズ名",
  "targetSite": "（.env の WP_SITE_URL から取得）",
  "designDoc": null,
  "articles": []
}
```

作成後、記事の追加をユーザーと対話で進めてください。

**1件の場合:**

そのファイルを自動選択し、`seriesPlan` として読み込み。

**2件以上の場合:**

一覧を表示してユーザーに選択を求めてください：

```
複数のシリーズ計画が見つかりました：

1. {seriesName}（{articles.length}記事、公開済み: {published数}）
2. {seriesName}（{articles.length}記事、公開済み: {published数}）

どのシリーズで記事を生成しますか？（番号で選択）
```

### Step 1-2: 設計ドキュメントの読み込み

`seriesPlan` に `designDoc` フィールドがあり、値が null でなければ、そのパスを Read ツールで読み込んで `seriesDesign` として保持してください。

### Step 1-3: 対象記事の選択

`seriesPlan.articles` から `status` が `"published"` でない記事を抽出し、`priority` 昇順でソートして一覧表示：

```
シリーズ「{seriesName}」の未生成記事:

  推奨 → #{id} 「{title}」（{keyword}）— {phase}フェーズ
         #{id} 「{title}」（{keyword}）— {phase}フェーズ
         #{id} 「{title}」（{keyword}）— {phase}フェーズ
         ...

推奨の記事で進めますか？または番号を指定してください。
```

最も `priority` が小さい記事を「推奨」として表示。ユーザーが「ok」「はい」等で承認すれば推奨を選択、番号指定があればその記事を選択。

選択した記事を `targetArticle` として保持。

### Step 1-4: 既存公開記事のURL取得

`seriesPlan.articles` のうち `wpUrl` が設定されている記事のリストを作成。
もし `wpUrl` が null だが `wpPostId` がある記事があれば、以下の Bash コマンドで URL を取得：

```bash
npx tsx -e "
import 'dotenv/config';
async function main() {
  const siteUrl = process.env.WP_SITE_URL;
  const username = process.env.WP_USERNAME;
  const appPassword = process.env.WP_APP_PASSWORD;
  const credentials = Buffer.from(username + ':' + appPassword).toString('base64');
  const postId = {wpPostId};
  const res = await fetch(siteUrl + '/wp-json/wp/v2/posts/' + postId + '?_fields=link', {
    headers: { Authorization: 'Basic ' + credentials }
  });
  const data = await res.json();
  console.log(data.link);
}
main();
"
```

### Step 1-5: seriesContext の構築

以下の JSON を `seriesContext` として構築し、会話コンテキストに保持してください：

```json
{
  "currentArticle": {
    "id": "<targetArticle.id>",
    "keyword": "<targetArticle.keyword>",
    "title": "<targetArticle.title>",
    "phase": "<targetArticle.phase>",
    "subKeywords": ["<targetArticle.subKeywords>"],
    "description": "<targetArticle.description>"
  },
  "relatedArticles": [
    {
      "id": "<関連記事ID>",
      "title": "<関連記事タイトル>",
      "url": "<wpUrl or null>",
      "status": "<status>"
    }
  ],
  "leadStrategy": "<seriesDesign からこの記事に該当するリード戦略を抽出。seriesDesign がない or 該当なしの場合は null>"
}
```

`relatedArticles` は `targetArticle.relatedArticles`（ID配列）を使って `seriesPlan.articles` から取得。

### Step 1-6: ユーザーに確認

構築した `seriesContext` の概要を表示し、続行確認：

```
対象記事: #{id} 「{title}」
フェーズ: {phase}
メインKW: {keyword}
サブKW: {subKeywords}

内部リンク:
- 関連記事: {relatedArticles の数}件（公開済み: {URL有りの数}件、未公開: {URL無しの数}件）
- 内部リンク候補: {URL有りの関連記事タイトル一覧}
- リード戦略: {leadStrategy の内容 or "なし"}

この内容で記事生成を開始しますか？
```

---

## Phase 2: /generate パイプライン実行

`.claude/skills/generate/SKILL.md` を Read ツールで読み込み、そのすべての手順に従って記事を生成してください。

**キーワード引数**: `targetArticle.keyword`（`--local` フラグがあればそれも付与）

**重要**: Phase 1 で構築した `seriesContext` は会話中に存在しています。`/generate` の Step 5（アウトライン）と Step 6（本文生成）で自然に活用されます。

---

## Phase 3: シリーズ後処理

### Step 3-1: SEOフィールド設定

`/generate` が WP に投稿した場合（`--local` でない場合）、article.json の `seoTitle` と `metaDescription` を確認し、設定されていることを確認してください。

`/generate` の Step 9 で `wp-publish-draft.ts` が実行されると、SEOフィールドは自動設定されます。

### Step 3-2: シリーズ計画の更新

読み込んだシリーズ計画ファイルの対象記事エントリを更新してください（Edit ツール使用）：

- `status`: `"generated"`（`--local` の場合）または `"wp-draft"`（WP投稿済みの場合）
- `wpPostId`: WP投稿時の Post ID（`--local` の場合は null のまま）
- `wpUrl`: WP投稿時の記事URL（`--local` の場合は null のまま）

### Step 3-3: 内部リンク追加の提案

`seriesContext.relatedArticles` のうち `status` が `"published"` または `"wp-draft"` の記事に対して、新記事への内部リンク追加を提案：

```
以下の既存記事に、今回の記事「{title}」への内部リンクを追加することを推奨します：

1. #{id} 「{title}」（{url}）
   → 追加箇所の提案: ...

`/edit {url}` で個別に修正できます。
```

### Step 3-4: 次の記事の表示

`seriesPlan.articles` から次に生成すべき記事（`priority` 順で次の未生成記事）を表示：

```
次に生成すべき記事:
#{id} 「{title}」（{keyword}）
→ /series-generate で生成
```

---

## 完了

Phase 1〜3 の結果をまとめて報告してください：
- 生成した記事: #{id}「{title}」
- article.json パス
- レビュースコア
- ファクトチェック結果
- WP投稿URL（該当する場合）
- シリーズ進捗: {生成済み}/{全体} 記事
- 内部リンク追加の提案
- 次に生成すべき記事
