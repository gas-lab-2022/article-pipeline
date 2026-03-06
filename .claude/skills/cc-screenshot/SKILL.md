---
name: cc-screenshot
description: Claude Code のターミナル UI モックアップを HTML で組み立て、Playwright でスクリーンショットを撮影する。
disable-model-invocation: true
---

あなたは Claude Code の画面モックアップを生成するツールです。ユーザーの自然言語の説明から、Claude Code のターミナル UI を忠実に再現した HTML を組み立て、Playwright MCP でスクリーンショットを撮影します。

---

## Step 0: 対話による入力確認

ユーザーに撮影内容を質問してください：

```
Claude Code のどんな画面を撮影しますか？
（例: 「/generate スキル実行中に3つのエージェントが並列で動いている画面」）
```

設定:
- `description`: ユーザーが指定した画面説明
- `outputDir`: `output/screenshots/`（デフォルト。記事生成中はセッションディレクトリを使用）

---

## Step 1: テンプレートの読み込み

Read ツールで `templates/claude-code-mockup.html` を読み込んでください。

---

## Step 2: HTML コンテンツの組み立て

`description` を解釈して、以下のコンポーネントカタログから適切なものを選び、HTML を組み立ててください。

**重要**: 実際の Claude Code の画面に忠実なテキスト内容を生成すること。ユーザーの説明の意図を汲み取り、リアルな出力になるよう工夫してください。

### コンポーネントカタログ

#### ヘッダー（オプション。多くの場合省略してよい）

マスコット付きヘッダーを使う場合は `templates/cc-header-logo.png` から base64 data URI を生成して `<img>` タグを使用:

```html
<div class="cc-header-with-logo">
  <img class="cc-logo cc-logo-sm" src="data:image/png;base64,..." alt="Claude Code">
  <div class="cc-header">
    <div class="cc-header-version">Claude Code v2.1.70</div>
    <div class="cc-header-model">Opus 4.6 with high effort · Claude Max</div>
    <div class="cc-header-dir">~/dev/project-name</div>
  </div>
</div>
```

base64 data URI の生成: `base64 -i templates/cc-mascot.png | tr -d '\n'`

テキストのみのヘッダー（ロゴなし）:

```html
<div class="cc-header">
  <div class="cc-header-version">Claude Code v2.1.70</div>
  <div class="cc-header-model">Opus 4.6 with high effort · Claude Max</div>
  <div class="cc-header-dir">~/dev/project-name</div>
</div>
```

#### Claude の応答行

```html
<div class="cc-response"><span class="cc-dot white">●</span> 応答テキスト</div>
<div class="cc-response"><span class="cc-dot green">●</span> 応答テキスト</div>
```

ドットの色: `white`（通常応答）、`green`（検索/エージェント完了）、`blue`（情報）

#### スキル呼び出し

```html
<div class="cc-skill"><span class="cc-skill-icon">▶</span><span class="cc-skill-name">/skill-name</span></div>
```

#### ツール読込

```html
<div class="cc-tool-loaded"><span class="cc-tool-icon">▷</span> Tool loaded.</div>
```

#### 検索結果

```html
<div class="cc-search"><span class="cc-dot green">●</span> Searched for N patterns, read N files <span class="cc-search-hint">(ctrl+o to expand)</span></div>
<div class="cc-search-detail"><span class="cc-tree-char">└</span> "filename.ts"</div>
```

#### 思考中インジケーター

```html
<!-- 開始時 -->
<div class="cc-thinking"><span class="cc-thinking-icon">+</span> Percolating&hellip; <span class="cc-thinking-meta">(thinking with high effort)</span></div>

<!-- 経過時間あり -->
<div class="cc-thinking"><span class="cc-thinking-icon">✻</span> Percolating&hellip; <span class="cc-thinking-meta">(55s · ↓ 1.9k tokens · thinking with high effort)</span></div>
```

`+` は開始直後、`✻` は経過中。

#### エージェントツリー

```html
<div class="cc-agent-tree">
  <div class="cc-agent-header"><span class="cc-dot">●</span> Running N Explore agents&hellip; <span class="cc-agent-hint">(ctrl+o to expand)</span></div>
  <div class="cc-tree-line"><span class="cc-tree-branch">├─ </span><span class="cc-tree-label">エージェント名</span> <span class="cc-tree-meta">· N tool uses · N.Nk tokens</span></div>
  <div class="cc-tree-line indent"><span class="cc-tree-branch">│  └ </span><span class="cc-tree-status">Reading N files…</span></div>
  <div class="cc-tree-line"><span class="cc-tree-branch">└─ </span><span class="cc-tree-label">最後のエージェント</span> <span class="cc-tree-meta">· N tool uses · N.Nk tokens</span></div>
  <div class="cc-tree-line indent"><span class="cc-tree-branch">   └ </span><span class="cc-tree-status">Done</span></div>
  <div class="cc-tree-hint">ctrl+b to run in background</div>
</div>
```

完了状態のヘッダー: `● N Explore agents finished (ctrl+o to expand)`、ステータス: `Done`

#### Diff ビュー

```html
<div class="cc-diff">
  <div class="cc-diff-header">
    <div class="cc-diff-title">Edit file</div>
    <div class="cc-diff-filename">filename.ts</div>
  </div>
  <div class="cc-diff-line context"><span class="line-number">10</span><span class="line-content"> 変更なし行</span></div>
  <div class="cc-diff-line removed"><span class="line-number">11</span><span class="line-content">-削除行</span></div>
  <div class="cc-diff-line added"><span class="line-number">11</span><span class="line-content">+追加行</span></div>
  <div class="cc-diff-line context"><span class="line-number">12</span><span class="line-content"> 変更なし行</span></div>
</div>
```

#### 許可ダイアログ

```html
<div class="cc-permission">
  <div class="cc-permission-question">Do you want to make this edit to filename.ts?</div>
  <div class="cc-permission-option selected"><span class="cc-chevron">›</span> 1. Yes</div>
  <div class="cc-permission-option">&nbsp; 2. Yes, allow all edits during this session <span class="cc-muted-text">(shift+tab)</span></div>
  <div class="cc-permission-option">&nbsp; 3. No</div>
  <div class="cc-permission-hint">Esc to cancel · Tab to amend</div>
</div>
```

#### 入力プロンプト

```html
<!-- 空のプロンプト（待機中） -->
<div class="cc-prompt"><span class="cc-chevron">›</span> <span class="cc-cursor"></span></div>

<!-- ユーザー入力あり -->
<div class="cc-prompt"><span class="cc-chevron">›</span> 入力テキスト</div>
```

#### セパレーター

```html
<hr class="cc-separator">
```

#### ステータスバー

```html
<div class="cc-status">esc to interrupt</div>
<div class="cc-status">? for shortcuts</div>
```

#### 番号付きリスト

```html
<div class="cc-list">
  <div class="cc-list-item"><span class="cc-list-num">1.</span> <span class="cc-list-label">ラベル</span> <span class="cc-list-desc">– 説明テキスト</span></div>
</div>
```

#### スペーサー

```html
<div class="cc-gap"></div>     <!-- 8px -->
<div class="cc-gap-lg"></div>  <!-- 16px -->
```

#### ユーティリティ

```html
<span class="cc-bold">太字テキスト</span>
<span class="cc-code">コード名</span>
<span class="cc-muted-text">薄いテキスト</span>
<span class="cc-accent-text">オレンジテキスト</span>
<span class="cc-blue-text">青テキスト</span>
```

### 典型的な画面構成パターン

**パターン A: タスク実行中**
1. スキル呼び出し → Tool loaded → 応答 → 検索結果 → エージェントツリー → 思考中
2. セパレーター → プロンプト → セパレーター → ステータス("esc to interrupt")

**パターン B: ファイル編集**
1. 応答（Update(filename)）→ Diff ビュー → 許可ダイアログ

**パターン C: タスク完了**
1. 応答 → リスト → セパレーター → プロンプト（空）

---

## Step 3: テンプレートの置換と書き出し

1. テンプレートの `{{CONTENT}}` を Step 2 で組み立てた HTML で置換
2. Write ツールで `{outputDir}/_temp-cc.html` に書き出し

---

## Step 4: スクリーンショット撮影

1. Bash ツールで出力ディレクトリを作成し、HTTP サーバーを起動:

   ```bash
   mkdir -p {outputDir}
   python3 -m http.server 3847 --directory {outputDir} &
   ```

2. `mcp__playwright__browser_navigate` で `http://localhost:3847/_temp-cc.html` を開く

3. `mcp__playwright__browser_snapshot` でページ構造を取得し、`.cc-container` 要素の `ref` を特定

4. `mcp__playwright__browser_take_screenshot` で `.cc-container` 要素を撮影

---

## Step 5: クリーンアップと結果報告

1. 撮影画像を適切な名前にリネーム:

   ```
   cc-{slugified-description}-{YYYYMMDD-HHMMSS}.png
   ```

2. 一時ファイルの削除と HTTP サーバーの停止:

   ```bash
   rm {outputDir}/_temp-cc.html
   kill $(lsof -ti:3847) 2>/dev/null
   ```

3. 結果を報告:

   - **保存先パス**: 画像ファイルの絶対パス
   - **撮影内容**: 何を撮影したかの簡潔な説明
