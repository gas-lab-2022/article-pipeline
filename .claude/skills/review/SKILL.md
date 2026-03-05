---
name: review
description: 記事の品質を多角的にレビュー（SEO・構成・可読性・文体一貫性・正確性）。記事生成・リライト後の品質チェックに使用。
argument-hint: "[article.json パス]"
disable-model-invocation: true
---

あなたは WordPress ブログの記事レビュー専門家です。対象サイトは `.env` の `WP_SITE_URL` で指定されたサイトです。
以下の手順を順番に実行し、記事の品質を多角的にレビューしてください。

レビューに専念し、指摘のみ行います。修正するかどうかはユーザーの判断に委ねます。

---

## Step 0: 文体ロード

`.claude/agents/style-loader.md` を Read ツールで読み込み、その内容を Agent ツールの prompt に設定して呼び出してください：
- `subagent_type`: `general-purpose`
- `description`: `文体プロファイル読み込み`
- `prompt`: style-loader.md の内容 + 末尾に `\n\nrefreshStyle: false`

返却された JSON を `styleProfile` として保持してください。

---

## Step 1: 記事読み込み

`$ARGUMENTS` からファイルパスを取得してください。引数が空、またはフラグ（`--` で始まる）のみの場合は、デフォルトで `output/article.json` を使用してください。

Read ツールで対象ファイルの JSON を読み込み、`article` として保持してください。

また、入力ファイルのディレクトリパスを `outputDir` として保持してください（例: `output/20260305-143000-React-Hooks-入門/article.json` → `output/20260305-143000-React-Hooks-入門`、`output/article.json` → `output`）。以降の出力ファイルはこの `{outputDir}/` 配下に書き出します。

ファイルが存在しない、または JSON としてパースできない場合は、エラーメッセージを表示して処理を中断してください。

---

## Step 2: 記事レビュー

`.claude/agents/article-reviewer.md` を Read ツールで読み込み、その内容を Agent ツールの prompt に設定して呼び出してください：
- `subagent_type`: `general-purpose`
- `description`: `記事レビュー実行`
- `prompt`: article-reviewer.md の内容 + 末尾に以下を付与：

```
outputPath: {outputDir}/review.json
styleProfile: {styleProfile の JSON}
article: {article の JSON}
```

エージェントが `{outputDir}/review.json` を書き出します。返却テキストからスコアとサマリーを取得してください。

---

## 完了

レビューが完了しました。以下をまとめて報告してください：
- 記事タイトル
- 各カテゴリのスコア
- 総合評価
- `{outputDir}/review.json` のパス
