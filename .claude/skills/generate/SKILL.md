---
name: generate
description: SEO最適化された日本語ブログ記事を9ステップで生成し、WordPressに下書き投稿する記事生成パイプライン。
argument-hint: "<キーワード> [--local] [--refresh-style]"
disable-model-invocation: true
---

あなたは WordPress ブログの記事生成パイプラインです。対象サイトは `.env` の `WP_SITE_URL` で指定されたサイトです。
以下の手順を順番に実行し、キーワード「$ARGUMENTS」に基づいて高品質な記事を生成してください。

すべてのステップの結果をコンテキストとして保持し、最終的に WordPress に下書き投稿してください。

---

## セッションディレクトリの作成

複数セッションの同時実行でファイルが競合しないよう、セッション固有の出力ディレクトリを使用します。

### 手順

1. `$ARGUMENTS` からキーワード部分を抽出してください（`--local`, `--refresh-style` などのフラグは除外）。
2. キーワードのスペースをハイフンに置換して `slug` を生成してください（例: 「React Hooks 入門」→「React-Hooks-入門」）。
3. 以下の Bash コマンドでセッションディレクトリを作成してください（`<slug>` は手順 2 の値に置換）：

```bash
SESSION_DIR="output/$(date +%Y%m%d-%H%M%S)-<slug>"
mkdir -p "$SESSION_DIR"
echo "$SESSION_DIR"
```

4. 出力されたパスを `sessionDir` として保持してください（例: `output/20260305-143000-React-Hooks-入門`）。

以降、すべての出力ファイルは `{sessionDir}/` 配下に書き出します。

---

## Step 0: 文体分析

`.claude/agents/style-loader.md` を Read ツールで読み込み、その内容を Agent ツールの prompt に設定して呼び出してください：
- `subagent_type`: `general-purpose`
- `description`: `文体プロファイル読み込み`
- `prompt`: style-loader.md の内容 + 末尾に `\n\nrefreshStyle: {$ARGUMENTS に --refresh-style が含まれていれば true、なければ false}`

返却された JSON を `styleProfile` として保持してください。

---

## Step 1: キーワード分析

あなたはSEO戦略の専門家です。

キーワード「$ARGUMENTS」について、検索意図を3段階の仮説で言語化してください。

### 分析タスク

1. **surfaceIntent（表層意図）**: ユーザーが文字通り知りたいこと
2. **latentIntent（潜在意図）**: 表面に出ていないが本当に解決したい課題
3. **finalGoal（最終ゴール）**: この検索の先にある理想の状態

さらに、この意図を深く理解するために有用な派生検索クエリを3〜5個生成してください（`searchQueries`）。

結果を `keywordAnalysis` として保持してください。

---

## Step 2: SEO分析（WebSearch 使用）

あなたはSEO分析の専門家です。

### コンテキスト
- キーワード: 「$ARGUMENTS」
- Step 1 で得た表層意図・潜在意図・最終ゴール

### タスク

Step 1 で生成した `searchQueries` を使って **WebSearch ツールで実際に検索** してください。

検索結果をもとに以下を分析：

1. **topArticles**: 上位記事（最大10件）のURL・タイトル・要約を収集
2. **commonStructure**: 上位記事に共通する構造パターンを抽出
3. **mustCoverTopics**: 上位記事が共通してカバーしている必須トピックを特定
4. **gapOpportunities**: 上位記事に不足している点（差別化の機会）を特定

結果を `seoAnalysis` として保持してください。

---

## Step 3: 意図深掘り

あなたはユーザー心理の専門家です。

### コンテキスト
- Step 1 の `keywordAnalysis` 全体
- Step 2 の `seoAnalysis`（共通構造・必須トピック・差別化機会）

### タスク

キーワード「$ARGUMENTS」で検索する読者について、以下を深掘りして言語化してください：

1. **readerSituation（読者の状況）**: 検索時の典型的な状況・背景
2. **readerAnxieties（読者の不安）**: 抱えている不安や懸念（3〜5個）
3. **decisionBarriers（決断障壁）**: 行動に移れない理由（3〜5個）
4. **desiredOutcomes（読後に望む結果）**: 記事を読んだ後どうなりたいか（3〜5個）

結果を `intentDeepDive` として保持してください。

---

## Step 4: 差別化設計

あなたはコンテンツ戦略の専門家です。

### コンテキスト
- Step 1 の `keywordAnalysis`
- Step 2 の `seoAnalysis`
- Step 3 の `intentDeepDive`

### タスク

上位記事を「超える」ための差別化ポイントを、以下の4カテゴリから設計してください：

1. **構造化**: 情報の整理・視覚化・チートシート化
2. **データ**: 具体的な数値・事例・比較データ
3. **因果説明**: 「なぜそうなるのか」の深い説明
4. **失敗パターン**: 読者が陥りやすい失敗とその回避法

全カテゴリを使う必要はありません。効果的なものを選んでください。

結果として `differentiationPoints`（配列）と `uniqueValueProposition`（この記事ならではの価値を一文で）を `differentiation` として保持してください。

---

## Step 5: アウトライン作成

あなたは記事設計の専門家です。

### コンテキスト
- Step 0 の `styleProfile`（見出しパターン・セクション構成）
- Step 1 の `keywordAnalysis`
- Step 2 の `seoAnalysis`（必須カバー項目）
- Step 3 の `intentDeepDive`（読者心理）
- Step 4 の `differentiation`（差別化ポイント・独自価値）
- **シリーズ計画**（任意）: `docs/plans/claude-code-series.json` が存在する場合、Read ツールで読み込む。`articles` 配列から `keyword` が現在のキーワードに最も近いエントリを特定し、その `relatedArticles`（ID 配列）から関連記事の `title` と `wpUrl` を `seriesContext` として保持する。

### タスク

### シリーズ計画の読み込み（オプション）

`docs/plans/claude-code-series.json` を Read ツールで読み込んでください（ファイルが存在しない場合はスキップ）。

存在する場合:
1. `articles` 配列から、`keyword` が現在のキーワード（`$ARGUMENTS`）に最も近いエントリを特定
2. そのエントリの `relatedArticles`（ID 配列）から関連記事を取得
3. 関連記事の `title` と `wpUrl` を `seriesContext` として保持
4. アウトライン設計時に「どの記事へ誘導するか」の参考にする

以下のナラティブ構造をベースに、記事アウトラインを作成してください：

**共感→問題整理→本質解説→具体策→失敗例→結論**

`styleProfile` の見出しパターンとセクション構成を反映してください。

結果として以下を `outline` として保持してください：
- **title**: 記事タイトル（SEO最適化、32文字以内推奨）
- **metaDescription**: メタディスクリプション（120文字以内）
- **sections**: 各セクションの H2見出し・H3見出し・要点

---

## Step 6: 記事本文生成 & ファイル書き出し

あなたはプロのWebライターです。

### コンテキスト
- Step 0 の `styleProfile`（文体指示）
- Step 5 の `outline`（構成）
- キーワード: 「$ARGUMENTS」

### 文体指示（既存記事スタイルに合わせる）

`styleProfile` の以下を厳守してください：
- 文体（writingStyle）
- 語尾パターン（sentenceEndings）
- トーン（tone）
- 見出しパターン（headingPattern）
- セクション構成（sectionStructure）

### 執筆方針

- **腹落ち・納得**を重視：「なぜそうなるのか」を丁寧に説明
- 抽象的な説明だけでなく、具体例・コード例・数値を交える
- 読者の不安を先回りして解消する
- H2/H3タグを適切に使用し、WordPress のブロックエディタと互換性のあるHTMLで出力
- タイトルは本文に含めない（WordPressが自動付与するため）
- **内部リンク**（シリーズ計画がある場合）: `seriesContext` の関連記事のうち `wpUrl` が設定されているものは、本文中の自然な文脈でリンクを挿入する（例: 「詳しいインストール手順は<a href="URL">こちらの記事</a>で解説しています」）。`wpUrl` が null の記事は「別記事で詳しく解説予定です」のように言及にとどめる。

### 出力

以下の JSON を生成してください：

```json
{
  "title": "記事タイトル",
  "slug": "english-hyphenated-slug",
  "htmlContent": "<h2>...</h2><p>...</p>...",
  "metaDescription": "メタディスクリプション",
  "tags": ["タグ1", "タグ2", "タグ3"]
}
```

### slug（パーマリンク）の生成ルール

既存記事のスラッグスタイルに合わせるため、以下の Bash コマンドで直近20件のスラッグを取得してください：

```bash
node -e "
require('dotenv/config');
const s = process.env.WP_SITE_URL, u = process.env.WP_USERNAME, p = process.env.WP_APP_PASSWORD;
const c = Buffer.from(u+':'+p).toString('base64');
fetch(s+'/wp-json/wp/v2/posts?per_page=20&orderby=date&order=desc&_fields=slug,title',{headers:{Authorization:'Basic '+c}})
  .then(r=>r.json()).then(d=>d.forEach(x=>console.log(x.slug+'  ←  '+x.title.rendered)));
"
```

取得したスラッグの命名パターン（言語・区切り文字・長さ・接尾辞の傾向）を分析し、それに合わせたスラッグを生成してください。

**共通ルール（パターンに関わらず厳守）:**
1. 日本語は使わない（URLエンコードで長くなる・SNSシェア時に壊れるため）
2. 小文字とハイフンのみ使用
3. 短すぎず長すぎず（2〜6語程度）

生成した JSON を `{sessionDir}/article.json` にファイルとして書き出してください（Write ツールを使用）。

---

## Step 7: 記事レビュー

`{sessionDir}/article.json` を Read ツールで読み込み、`article` として保持してください。

`.claude/agents/article-reviewer.md` を Read ツールで読み込み、その内容を Agent ツールの prompt に設定して呼び出してください：
- `subagent_type`: `general-purpose`
- `description`: `記事レビュー実行`
- `prompt`: article-reviewer.md の内容 + 末尾に以下を付与：

```
outputPath: {sessionDir}/review.json
styleProfile: {styleProfile の JSON}
article: {article の JSON}
```

エージェントが `{sessionDir}/review.json` を書き出します。返却テキストからスコアとサマリーを取得してください。

---

## Step 8: ファクトチェック

`.claude/agents/fact-checker.md` を Read ツールで読み込み、その内容を Agent ツールの prompt に設定して呼び出してください：
- `subagent_type`: `general-purpose`
- `description`: `ファクトチェック実行`
- `prompt`: fact-checker.md の内容 + 末尾に以下を付与：

```
outputPath: {sessionDir}/fact-check.json
article: {article の JSON}
```

エージェントが `{sessionDir}/fact-check.json` を書き出します。返却テキストから総合判定とサマリーを取得してください。

---

## Step 9: WordPress 下書き投稿（オプション）

`$ARGUMENTS` に `--local` が含まれている場合は、このステップをスキップしてください。
`{sessionDir}/article.json` の保存のみで完了です。

`--local` が含まれていない場合は、以下の Bash コマンドを実行して WordPress に下書き投稿してください：

```bash
npx tsx scripts/wp-publish-draft.ts {sessionDir}/article.json
```

投稿が成功したら、Post ID と編集 URL を表示してください。

---

## 完了

すべてのステップが完了しました。以下をまとめて報告してください：
- 記事タイトル
- `{sessionDir}/article.json` のパス
- レビュー結果の総合評価（`{sessionDir}/review.json`）
- ファクトチェック結果の総合判定（`{sessionDir}/fact-check.json`）
- WordPress に投稿した場合は編集 URL
