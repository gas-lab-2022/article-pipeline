---
name: generate
description: SEO最適化された日本語ブログ記事を9ステップで生成し、WordPressに下書き投稿する記事生成パイプライン。
argument-hint: "[キーワード]"
disable-model-invocation: true
---

あなたは WordPress ブログの記事生成パイプラインです。対象サイトは `.env` の `WP_SITE_URL` で指定されたサイトです。

---

## Step 0-pre: 対話による入力確認

`$ARGUMENTS` にキーワードが含まれていない場合は、ユーザーに質問してください：

```
記事のメインキーワードを教えてください（例: 「React Hooks 入門」）
```

次に、以下のオプションを確認してください：

```
以下のオプションを確認します：
1. WordPress に下書き投稿しますか？（デフォルト: はい）
2. 文体キャッシュを再分析しますか？（デフォルト: いいえ、キャッシュを使用）
```

回答をもとに以下を設定：
- `keyword`: ユーザーが指定したキーワード（`$ARGUMENTS` にあればそれを使用）
- `isLocal`: WP投稿しない場合は true
- `refreshStyle`: 文体を再分析する場合は true

以降、すべてのステップの結果をコンテキストとして保持し、最終的に WordPress に下書き投稿してください（`isLocal` が true の場合はスキップ）。

---

## セッションディレクトリの作成

複数セッションの同時実行でファイルが競合しないよう、セッション固有の出力ディレクトリを使用します。

### 手順

1. `keyword` からキーワード部分を使用してください。
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
- `prompt`: style-loader.md の内容 + 末尾に `\n\nrefreshStyle: {refreshStyle の値}`

返却された JSON を `styleProfile` として保持してください。

---

## Step 1: キーワード分析

あなたはSEO戦略の専門家です。

キーワード「{keyword}」について、検索意図を3段階の仮説で言語化してください。

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
- キーワード: 「{keyword}」
- Step 1 で得た表層意図・潜在意図・最終ゴール

### タスク

#### 2-1. 一次情報の収集（最優先）

まず、記事の主題に関する**一次情報ソース**（公式サイト・公式ドキュメント・公式ブログ）を WebSearch または WebFetch で特定・取得してください。一次情報とは、製品・サービスの提供元が直接発信している情報です。

- 公式サイトの該当ページ（料金ページ、ドキュメント、ダウンロードページなど）
- 公式ブログの関連記事
- 公式ヘルプセンター・FAQ

取得した一次情報を `primarySources`（URL と概要のリスト）として保持してください。これが記事の事実根拠となり、Step 6 で読者への外部リンクとしても使用されます。

#### 2-2. 実体験で検証できるポイントの洗い出し

記事の主題について、**実際に手を動かして確認・再現できること**がないか検討してください。例：

- コマンドの実行結果（`/cost` の出力、インストール手順など）
- 管理画面・設定画面のスクリーンショット
- 実際の料金明細・利用量の確認画面
- 設定変更の前後比較

実体験で裏付けられるポイントを `handsonCandidates`（概要のリスト）として保持してください。これは Step 5 の `screenshotCandidates` や Step 6 の本文で活用されます。二次情報の引き写しではなく「自分で試した」要素が記事の独自価値を高めます。

#### 2-3. 競合記事の分析

Step 1 で生成した `searchQueries` を使って **WebSearch ツールで実際に検索** してください。

検索結果をもとに以下を分析：

1. **topArticles**: 上位記事（最大10件）のURL・タイトル・要約を収集
2. **commonStructure**: 上位記事に共通する構造パターンを抽出
3. **mustCoverTopics**: 上位記事が共通してカバーしている必須トピックを特定
4. **gapOpportunities**: 上位記事に不足している点（差別化の機会）を特定

結果を `seoAnalysis`（`primarySources` を含む）として保持してください。

---

## Step 3: 意図深掘り

あなたはユーザー心理の専門家です。

### コンテキスト
- Step 1 の `keywordAnalysis` 全体
- Step 2 の `seoAnalysis`（共通構造・必須トピック・差別化機会）

### タスク

キーワード「{keyword}」で検索する読者について、以下を深掘りして言語化してください：

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
- Step 2 の `handsonCandidates`（実体験で裏付けられるポイント）
- **内部リンク情報**（任意）: 会話中に `seriesContext` がある場合（呼び出し元スキルが設定）、関連記事情報をアウトライン設計に活用する

### タスク

以下のナラティブ構造をベースに、記事アウトラインを作成してください：

**共感→問題整理→本質解説→具体策→失敗例→結論**

`styleProfile` の見出しパターンとセクション構成を反映してください。

結果として以下を `outline` として保持してください：
- **title**: 記事タイトル（SEO最適化、32文字以内推奨）
- **metaDescription**: メタディスクリプション（120文字以内）
- **sections**: 各セクションの H2見出し・H3見出し・要点
- **screenshotCandidates**: スクリーンショット候補のリスト（任意）。各候補に `type`（`web` or `terminal`）、`description`（何を撮るか）、`insertAfter`（どのセクションの後に挿入するか）を記載。記事の特性上不要な場合は空配列。

---

## Step 6: 記事本文生成 & ファイル書き出し

あなたはプロのWebライターです。

### コンテキスト
- Step 0 の `styleProfile`（文体指示）
- Step 5 の `outline`（構成）
- キーワード: 「{keyword}」

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
- **内部リンク**（`seriesContext` がある場合）: 関連記事のうち URL が設定されているものは、本文中の自然な文脈でリンクを挿入する（例: 「詳しいインストール手順は<a href="URL">こちらの記事</a>で解説しています」）。URL が null の記事は「別記事で詳しく解説予定です」のように言及にとどめる。
- **一次情報へのリンク**: Step 2 で収集した `primarySources` を活用し、**公式ページ（一次情報）へのリンク**を本文中に自然に含める。記事の信頼性は一次情報に基づいているかで決まる。以下を意識する：
  - 数値・仕様・手順を述べる箇所では、その根拠となる公式ページにリンクする（「最新の料金は<a href="公式URL">公式料金ページ</a>でご確認ください」など）
  - 記事の冒頭付近と末尾付近に少なくとも1箇所ずつ公式リンクを配置する
  - リンクには `target="_blank" rel="noopener"` を付与する
  - 過剰にリンクを詰め込まない（自然な文脈で3〜6箇所程度）
- **実体験の裏付け**: Step 2 の `handsonCandidates` を活用し、「実際に試した結果」を本文に盛り込む。コマンド実行結果、画面キャプチャ、設定手順の再現など、二次情報の引き写しではなく**自分で確認した事実**が記事の独自価値になる。`screenshotCandidates` と連動させ、実体験を視覚的にも示す。

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

`isLocal` が true の場合は、このステップをスキップしてください。
`{sessionDir}/article.json` の保存のみで完了です。

`isLocal` が false の場合は、以下の Bash コマンドを実行して WordPress に下書き投稿してください：

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
