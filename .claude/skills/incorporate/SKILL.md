---
name: incorporate
description: 手動で収集した実体験データ（スクリーンショット、コマンド出力、テキスト）を記事に反映し、WordPressを更新する。
argument-hint: "[セッションディレクトリ]"
disable-model-invocation: true
---

あなたは記事に実体験データを組み込むエージェントです。`/generate` で生成された `handson-tasks.json` に基づき、ユーザーが手動で収集したデータを記事に反映します。

---

## Step 0: 入力確認

`$ARGUMENTS` にセッションディレクトリのパスが含まれていない場合は、まずドメインを取得し、`output/{domain}/` 配下の `handson-tasks.json` を持つディレクトリを検索してください：

```bash
DOMAIN=$(grep WP_SITE_URL .env | sed 's|.*://||' | sed 's|/.*||')
find "output/$DOMAIN" -name "handson-tasks.json" -maxdepth 2 | sort -r | head -10
```

見つかったディレクトリを一覧表示し、ユーザーに選択を求めてください。

パスが指定された場合はそれを `sessionDir` として使用。

---

## Step 1: タスク一覧の表示

`{sessionDir}/handson-tasks.json` を Read ツールで読み込み、`handsonTasks` として保持してください。

`status` が `pending` のタスクを一覧表示：

```
記事: 「{articleTitle}」
WP Post ID: {wpPostId}

未完了タスク:

  #0 [screenshot] Claudeの料金ページのスクリーンショット
     目的: 最新の料金プラン構成を視覚的に示す
     挿入先: 「料金プランの比較」の後

  #1 [terminal-output] /cost コマンドの実行結果
     目的: 実際の利用コストの具体例として掲載
     挿入先: 「API従量課金の費用管理」の後

タスク番号を指定するか、「全て」で順番に処理します。
```

すべて `done` の場合は「すべてのタスクが完了済みです」と表示して終了。

---

## Step 2: タスク処理ループ

選択されたタスク（または全タスク）について、`type` に応じて処理してください。

### type: screenshot / cc-screenshot

```
タスク #{id}: {description}

スクリーンショットのファイルパスを教えてください（ドラッグ&ドロップ可）
```

ユーザーからファイルパスを受け取ったら：

1. Read ツールで画像ファイルが存在することを確認
2. `cc-screenshot` の場合は以下を検証し、問題があればユーザーに指摘：
   - 画像が鮮明で文字が読めるか
   - 記事の説明と画面の内容が一致しているか
   - 個人情報・機密情報（フルパス、API キー、トークン等）が映り込んでいないか
3. WP メディアライブラリにアップロード：

   ```bash
   npx tsx scripts/wp-upload-media.ts "{filePath}" "{altText}"
   ```

4. 出力の JSON から `url` を取得
5. 記事 HTML 内の `<!-- HANDSON:{id} -->` を以下に置換：

   ```html
   <figure class="wp-block-image"><img src="{url}" alt="{altText}" /><figcaption>{description}</figcaption></figure>
   ```

### type: terminal-output

```
タスク #{id}: {description}

コマンド出力のテキストを貼り付けてください（コマンド名も含めて）
```

ユーザーからテキストを受け取ったら：

1. Read ツールで `templates/terminal-mockup.html` を読み込む
2. 受け取ったテキストからリアルなターミナル表示を設計し、`{{TITLE}}` と `{{LINES}}` を置換
3. Write ツールで `{sessionDir}/screenshots/_temp-terminal.html` に書き出す
4. Bash で HTTP サーバーを起動: `python3 -m http.server 3847 --directory {sessionDir}/screenshots &`
5. `mcp__playwright__browser_navigate` で `http://localhost:3847/_temp-terminal.html` を開く
6. `mcp__playwright__browser_snapshot` で `.terminal` 要素の `ref` を特定
7. `mcp__playwright__browser_take_screenshot` で撮影
8. クリーンアップ:

   ```bash
   rm -f {sessionDir}/screenshots/_temp-terminal.html
   kill $(lsof -ti:3847) 2>/dev/null
   ```

9. WP メディアライブラリにアップロード：

   ```bash
   npx tsx scripts/wp-upload-media.ts "{screenshotPath}" "{altText}"
   ```

10. 記事 HTML 内の `<!-- HANDSON:{id} -->` を `<figure>` に置換（screenshot と同じ形式）

### type: text

```
タスク #{id}: {description}

記事に追加するテキストを入力してください
```

ユーザーからテキストを受け取ったら：

1. テキストを `styleProfile` の文体に合わせて整形（ユーザーが文体を指定していなければそのまま使用）
2. 記事 HTML 内の `<!-- HANDSON:{id} -->` を適切な HTML（`<p>` タグ等）に置換

### 処理後

各タスクの処理が完了したら、`handson-tasks.json` の該当タスクの `status` を `"done"` に更新してください（Edit ツール使用）。

---

## Step 3: 記事の保存 & WP 更新

すべての処理が完了したら：

1. 更新した article.json を Write ツールで `{sessionDir}/article.json` に上書き保存

2. `wpPostId` が設定されている場合、WordPress を更新するか確認：

   ```
   WordPress の記事を更新しますか？（Post ID: {wpPostId}）
   ```

   「はい」の場合：

   ```bash
   npx tsx scripts/wp-update-post.ts {wpPostId} {sessionDir}/article.json
   ```

---

## 完了

処理結果をまとめて報告してください：

- 記事タイトル
- 処理したタスク数 / 全タスク数
- 残りの未完了タスク（あれば）
- WordPress 更新の有無
