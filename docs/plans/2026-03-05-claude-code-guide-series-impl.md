# Claude Code Guide Series Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `/screenshot` スキルを新規作成し、`/generate` にシリーズ記事の内部リンク機能を追加して、Claude Code完全ガイド16記事シリーズを生成できるようにする。

**Architecture:** 3つの独立した成果物を順番に作成: (1) ターミナル風HTMLテンプレート + Playwright MCPで撮影する `/screenshot` スキル、(2) シリーズ記事一覧を管理する JSON ファイル、(3) `/generate` スキルへのシリーズコンテキスト参照追加。

**Tech Stack:** HTML/CSS（テンプレート）, Playwright MCP（スクリーンショット）, Claude Code Skills（SKILL.md）

---

## Task 1: ターミナル風HTMLテンプレート作成

**Files:**
- Create: `templates/terminal-mockup.html`

**Step 1: templates/ ディレクトリ作成**

Run: `mkdir -p templates`

**Step 2: HTMLテンプレートを作成**

macOS Terminal風のHTMLファイルを作成する。プレースホルダー `{{TITLE}}`, `{{LINES}}` を含み、スキルが動的に置換する設計。

```html
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #1a1a2e;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 40px;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }
  .terminal {
    background: #1e1e2e;
    border-radius: 10px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    width: 720px;
    overflow: hidden;
  }
  .titlebar {
    background: #2d2d3f;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .btn { width: 12px; height: 12px; border-radius: 50%; }
  .btn-close { background: #ff5f57; }
  .btn-minimize { background: #febc2e; }
  .btn-maximize { background: #28c840; }
  .titlebar-text {
    flex: 1;
    text-align: center;
    color: #888;
    font-size: 13px;
    margin-right: 56px;
  }
  .content {
    padding: 20px;
    font-family: 'SF Mono', 'Menlo', 'Monaco', 'Cascadia Code', 'Consolas', monospace;
    font-size: 14px;
    line-height: 1.6;
    color: #cdd6f4;
    min-height: 100px;
  }
  .line { white-space: pre-wrap; word-break: break-all; }
  .prompt { color: #a6e3a1; }
  .command { color: #cdd6f4; }
  .output { color: #9399b2; }
  .comment { color: #6c7086; }
  .highlight { color: #f9e2af; }
  .error { color: #f38ba8; }
  .info { color: #89b4fa; }
</style>
</head>
<body>
<div class="terminal">
  <div class="titlebar">
    <div class="btn btn-close"></div>
    <div class="btn btn-minimize"></div>
    <div class="btn btn-maximize"></div>
    <div class="titlebar-text">{{TITLE}}</div>
  </div>
  <div class="content">
{{LINES}}
  </div>
</div>
</body>
</html>
```

**Step 3: テンプレートの動作確認**

Playwright MCP でテンプレートをそのまま開き、スクリーンショットが撮れることを確認する。

1. `{{TITLE}}` を `Terminal — zsh` に、`{{LINES}}` をサンプルの行に手動で置換したテスト用HTMLを `templates/terminal-mockup-test.html` に作成
2. Playwright MCP の `browser_navigate` で `file:///path/to/templates/terminal-mockup-test.html` を開く
3. `browser_take_screenshot` でスクリーンショットを撮影
4. 画像を目視確認し、ターミナル風の見た目になっていることを確認
5. テスト用HTMLを削除

**Step 4: コミット**

```bash
git add templates/terminal-mockup.html
git commit -m "feat: add macOS-style terminal mockup HTML template"
```

---

## Task 2: `/screenshot` スキル作成

**Files:**
- Create: `.claude/skills/screenshot/SKILL.md`

**Step 1: スキルファイルを作成**

`.claude/skills/screenshot/SKILL.md` を以下の内容で作成する。

スキルの仕様:
- 引数: `<モード> <ソース> [オプション]`
- モード:
  - `web <URL>` — Playwright MCP で URL を開いてスクリーンショット
  - `terminal <説明>` — ターミナル風HTMLモックアップを生成してスクリーンショット
- オプション:
  - `--output <path>` — 保存先パス（デフォルト: `output/screenshots/`）
  - `--selector <CSS>` — web モードで特定要素のみ撮影（オプション）
- 出力: スクリーンショット画像ファイルのパス

SKILL.md の内容:

```markdown
---
name: screenshot
description: Playwright MCPを使ってWebページまたはターミナル風モックアップのスクリーンショットを撮影する。
argument-hint: "<web URL | terminal 説明> [--output path] [--selector CSS]"
disable-model-invocation: true
---

あなたはスクリーンショット撮影の専門家です。
Playwright MCP サーバーを使って、指定された対象のスクリーンショットを撮影してください。

## 引数の解析

`$ARGUMENTS` を解析してください：

1. 最初のトークンがモードです:
   - `web` → Web撮影モード（次のトークンがURL）
   - `terminal` → ターミナルモック撮影モード（残りが説明テキスト）

2. オプション:
   - `--output <path>`: 保存先ディレクトリ（デフォルト: `output/screenshots/`）
   - `--selector <CSS>`: web モードで特定要素のみ撮影

---

## 出力ディレクトリの準備

```bash
mkdir -p <output-path>
```

---

## Mode A: Web撮影

### 手順

1. `mcp__playwright__browser_navigate` で指定 URL を開く
2. ページの読み込みを待つ（`mcp__playwright__browser_wait_for` で `networkidle` を待機）
3. `--selector` が指定されている場合:
   - `mcp__playwright__browser_take_screenshot` で `element` パラメータにセレクタを指定して撮影
4. `--selector` がない場合:
   - `mcp__playwright__browser_take_screenshot` でフルページ撮影
5. 撮影した画像のパスを表示

---

## Mode B: ターミナルモック撮影

### 手順

1. `templates/terminal-mockup.html` を Read ツールで読み込む

2. ユーザーの説明テキストをもとに、ターミナルに表示するコマンドと出力を設計する:
   - 何のコマンドを実行するシーンか
   - プロンプト行（`$ ` 付き）と出力行を分ける
   - 適切にCSSクラスを使う:
     - `<span class="prompt">$ </span><span class="command">コマンド</span>` — コマンド行
     - `<span class="output">出力テキスト</span>` — 通常の出力
     - `<span class="highlight">強調テキスト</span>` — 黄色で強調
     - `<span class="info">情報テキスト</span>` — 青色で情報
     - `<span class="error">エラーテキスト</span>` — 赤色でエラー
     - `<span class="comment"># コメント</span>` — グレーでコメント

3. テンプレートの `{{TITLE}}` と `{{LINES}}` を置換:
   - `{{TITLE}}`: 適切なウィンドウタイトル（例: `Terminal — zsh`）
   - `{{LINES}}`: 手順2で設計した行を `<div class="line">...</div>` で囲んだHTML

4. 置換済みHTMLを一時ファイル `output/screenshots/_temp-terminal.html` に Write ツールで書き出す

5. `mcp__playwright__browser_navigate` で `file://{絶対パス}/output/screenshots/_temp-terminal.html` を開く

6. `mcp__playwright__browser_take_screenshot` で `.terminal` 要素を撮影（`element` パラメータにセレクタ `.terminal` を指定）

7. 画像ファイルを適切な名前にリネーム（Bash の `mv` で）

8. 一時HTMLファイルを削除:
```bash
rm output/screenshots/_temp-terminal.html
```

---

## 完了

撮影結果を報告してください:
- 撮影モード（web / terminal）
- 保存先パス
- 撮影内容の簡潔な説明
```

**Step 2: スキルの動作確認**

`/screenshot terminal Claude Codeのインストールコマンド` を実行して、スクリーンショットが生成されることを確認する。

**Step 3: コミット**

```bash
git add .claude/skills/screenshot/SKILL.md
git commit -m "feat: add /screenshot skill for web and terminal mockup screenshots"
```

---

## Task 3: シリーズ記事管理ファイル作成

**Files:**
- Create: `docs/plans/claude-code-series.json`

**Step 1: シリーズ管理JSONを作成**

全16記事の情報を管理するJSONファイル。`/generate` 実行時にコンテキストとして読み込む。

```json
{
  "seriesName": "Claude Code完全ガイド",
  "targetSite": "programming-zero.net",
  "articles": [
    {
      "id": 1,
      "phase": "知る",
      "keyword": "claude code とは",
      "title": "Claude Codeとは？できること・特徴をわかりやすく解説",
      "subKeywords": ["何ができる", "初心者"],
      "status": "draft",
      "wpPostId": null,
      "wpUrl": null,
      "relatedArticles": [2, 3, 4],
      "description": "Claude Codeの概要・特徴を初心者向けに解説。ターミナルベースのAIコーディングツールとは何か。"
    },
    {
      "id": 2,
      "phase": "知る",
      "keyword": "claude code 料金",
      "title": "Claude Codeの料金プランを徹底解説【無料で使える？】",
      "subKeywords": ["無料", "plans", "pricing", "pro", "max", "月額", "価格", "api料金"],
      "status": "draft",
      "wpPostId": null,
      "wpUrl": null,
      "relatedArticles": [1, 3, 4],
      "description": "料金プラン（Max/Pro/API）の詳細比較。無料枠の有無、コスパの良い選び方。"
    },
    {
      "id": 3,
      "phase": "知る",
      "keyword": "claude code",
      "title": "【2026年最新】Claude Code完全ガイド",
      "subKeywords": [],
      "status": "draft",
      "wpPostId": null,
      "wpUrl": null,
      "relatedArticles": [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      "description": "ハブ記事。全記事へのリンク集+シリーズ概要。最後に作成し随時更新。"
    },
    {
      "id": 4,
      "phase": "試す",
      "keyword": "claude code install",
      "title": "Claude Codeのインストール方法【Mac/Windows対応】",
      "subKeywords": ["download", "setup", "インストール", "始め方", "環境構築"],
      "status": "draft",
      "wpPostId": null,
      "wpUrl": null,
      "relatedArticles": [1, 5, 6],
      "description": "Mac/Windows/Linuxでのインストール手順。Node.js準備からclaude --version確認まで。"
    },
    {
      "id": 5,
      "phase": "試す",
      "keyword": "claude code vscode",
      "title": "Claude Code × VSCodeの導入と使い方",
      "subKeywords": ["vscode extension", "vscode 使い方"],
      "status": "draft",
      "wpPostId": null,
      "wpUrl": null,
      "relatedArticles": [4, 6, 7],
      "description": "VSCode拡張の導入方法。ターミナル版との違い、使い分け。"
    },
    {
      "id": 6,
      "phase": "使う",
      "keyword": "claude code 使い方",
      "title": "Claude Codeの使い方・基本コマンド完全リファレンス",
      "subKeywords": ["commands", "始め方"],
      "status": "draft",
      "wpPostId": null,
      "wpUrl": null,
      "relatedArticles": [4, 5, 7, 9],
      "description": "基本コマンド一覧。/init, /compact, スラッシュコマンドの使い方。"
    },
    {
      "id": 7,
      "phase": "使う",
      "keyword": "claude code 設定",
      "title": "Claude Codeの設定・カスタマイズ完全ガイド",
      "subKeywords": ["設定方法", "best practice", "models"],
      "status": "draft",
      "wpPostId": null,
      "wpUrl": null,
      "relatedArticles": [6, 9, 11],
      "description": "settings.json, CLAUDE.md, hooks, permissionsの設定方法。"
    },
    {
      "id": 8,
      "phase": "使う",
      "keyword": "claude code 活用 非エンジニア",
      "title": "非エンジニア・経営層のためのClaude Code活用ガイド",
      "subKeywords": ["初心者", "何ができる", "活用"],
      "status": "draft",
      "wpPostId": null,
      "wpUrl": null,
      "relatedArticles": [1, 2, 6],
      "description": "経営層・マネージャー向け。チーム導入判断、ROI、非コーディング活用例。"
    },
    {
      "id": 9,
      "phase": "使う",
      "keyword": "claude code コツ",
      "title": "Claude Codeのプロンプトのコツ・上手な指示の出し方",
      "subKeywords": ["best practice"],
      "status": "draft",
      "wpPostId": null,
      "wpUrl": null,
      "relatedArticles": [6, 7, 13],
      "description": "効果的な指示の出し方、CLAUDE.mdの書き方、コンテキスト管理。"
    },
    {
      "id": 10,
      "phase": "使う",
      "keyword": "claude code トラブルシューティング",
      "title": "Claude Codeトラブルシューティング・よくある質問",
      "subKeywords": ["overloaded", "timeout", "遅い", "rate limit", "limits"],
      "status": "draft",
      "wpPostId": null,
      "wpUrl": null,
      "relatedArticles": [2, 4, 6],
      "description": "よくあるエラーと対処法。overloaded, timeout, rate limit等。"
    },
    {
      "id": 11,
      "phase": "深める",
      "keyword": "claude code mcp",
      "title": "Claude CodeのMCPとは？仕組みと設定方法",
      "subKeywords": ["mcp config", "mcp設定", "mcp server"],
      "status": "draft",
      "wpPostId": null,
      "wpUrl": null,
      "relatedArticles": [7, 12, 13],
      "description": "MCP概念の解説。なぜ必要か、アーキテクチャ、基本的な設定方法。"
    },
    {
      "id": 12,
      "phase": "深める",
      "keyword": "claude code mcp おすすめ",
      "title": "Claude Code MCPおすすめサーバーと実践ガイド",
      "subKeywords": ["mcp github", "mcp playwright", "mcp figma"],
      "status": "draft",
      "wpPostId": null,
      "wpUrl": null,
      "relatedArticles": [11, 13, 14],
      "description": "実用的なMCPサーバーの導入手順。filesystem, GitHub, Slack, Playwright等。"
    },
    {
      "id": 13,
      "phase": "深める",
      "keyword": "claude code agent",
      "title": "Claude Codeのエージェント機能とは？仕組みと活用法",
      "subKeywords": ["plugins"],
      "status": "draft",
      "wpPostId": null,
      "wpUrl": null,
      "relatedArticles": [9, 11, 14],
      "description": "サブエージェント、並列実行、カスタムエージェントの作り方と活用例。"
    },
    {
      "id": 14,
      "phase": "深める",
      "keyword": "claude code github",
      "title": "Claude Code × GitHub連携でPR作成・レビューを自動化",
      "subKeywords": ["mcp github"],
      "status": "draft",
      "wpPostId": null,
      "wpUrl": null,
      "relatedArticles": [11, 12, 13],
      "description": "gh CLI連携、PR作成、Issue対応、コードレビューの自動化実例。"
    },
    {
      "id": 15,
      "phase": "選ぶ",
      "keyword": "claude code vs cursor",
      "title": "Claude Code vs Cursor 徹底比較【どっちを選ぶべき？】",
      "subKeywords": ["cline vs", "cursor vs"],
      "status": "draft",
      "wpPostId": null,
      "wpUrl": null,
      "relatedArticles": [1, 2, 16],
      "description": "機能・料金・使い勝手をCursorと比較。ユースケース別おすすめ。"
    },
    {
      "id": 16,
      "phase": "選ぶ",
      "keyword": "claude code vs github copilot",
      "title": "Claude Code vs GitHub Copilot 徹底比較",
      "subKeywords": ["codex vs", "devin vs", "vs gemini cli"],
      "status": "draft",
      "wpPostId": null,
      "wpUrl": null,
      "relatedArticles": [1, 2, 15],
      "description": "GitHub Copilotとの機能比較。併用のすすめ、得意分野の違い。"
    }
  ]
}
```

**Step 2: .gitignore は変更不要を確認**

`docs/plans/` 配下はgitignore対象外であることを確認。

**Step 3: コミット**

```bash
git add docs/plans/claude-code-series.json
git commit -m "docs: add Claude Code guide series management file (16 articles)"
```

---

## Task 4: `/generate` スキルにシリーズコンテキスト参照を追加

**Files:**
- Modify: `.claude/skills/generate/SKILL.md`

**Step 1: 現在のSKILL.mdを読む**

Read ツールで `.claude/skills/generate/SKILL.md` を確認。

**Step 2: Step 5（アウトライン）にシリーズコンテキストを追加**

Step 5 の「コンテキスト」セクションに以下を追加:

```markdown
- **シリーズ計画**（存在する場合）: `docs/plans/claude-code-series.json` を Read ツールで読み込み、`$ARGUMENTS` のキーワードに一致する記事エントリの `relatedArticles` を取得。該当する関連記事のタイトル・キーワードをアウトライン設計に活用する。
```

**Step 3: Step 6（本文生成）に内部リンク指示を追加**

Step 6 の「執筆方針」セクションに以下を追加:

```markdown
- **内部リンク**: シリーズ計画が存在し、関連記事の `wpUrl` が設定されている場合、本文中で自然な文脈で関連記事へのリンクを挿入する（例: 「詳しいインストール手順は[こちらの記事](URL)で解説しています」）。`wpUrl` が null の場合は、リンクではなく「別記事で詳しく解説予定です」のように言及するにとどめる。
```

**Step 4: Step 5 に具体的な手順を追加**

Step 5 の「タスク」の先頭に以下を追加:

```markdown
### シリーズ計画の読み込み（オプション）

`docs/plans/claude-code-series.json` が存在する場合は Read ツールで読み込み、以下を行ってください：

1. `articles` 配列から、`keyword` が現在のキーワード（`$ARGUMENTS`）に最も近いエントリを特定
2. そのエントリの `relatedArticles`（ID配列）から関連記事を取得
3. 関連記事の `title` と `wpUrl` を `seriesContext` として保持

`seriesContext` はアウトライン設計時に「どの記事へ誘導するか」の参考にしてください。
```

**Step 5: 変更の動作確認**

`npx tsc --noEmit` で型チェック（SKILL.mdはMarkdownなので型チェック対象外だが、他に壊れていないことを確認）。

**Step 6: コミット**

```bash
git add .claude/skills/generate/SKILL.md
git commit -m "feat: add series context support to /generate for internal linking"
```

---

## Task 5: .gitignore にスクリーンショット出力を追加

**Files:**
- Modify: `.gitignore`

**Step 1: .gitignore を読む**

Read ツールで `.gitignore` を確認。

**Step 2: スクリーンショット出力パターンを追加**

`output/**/*.png` と `output/**/*.html` を追加:

```
output/**/*.png
output/**/*.html
```

**Step 3: コミット**

```bash
git add .gitignore
git commit -m "chore: add screenshot output patterns to .gitignore"
```

---

## Task 6: README / CLAUDE.md の更新

**Files:**
- Modify: `CLAUDE.md`

**Step 1: CLAUDE.md を読む**

Read ツールで `CLAUDE.md` を確認。

**Step 2: Skills & Commands セクションに `/screenshot` を追加**

```markdown
# スクリーンショット撮影（Webページ）
/screenshot web <URL> [--output path] [--selector CSS]

# スクリーンショット撮影（ターミナル風モックアップ）
/screenshot terminal <説明> [--output path]
```

**Step 3: Architecture セクションに追加**

```markdown
.claude/skills/screenshot/SKILL.md   ← スクリーンショット撮影スキル（Web + ターミナルモック）
templates/terminal-mockup.html       ← ターミナル風HTMLテンプレート
docs/plans/claude-code-series.json   ← シリーズ記事管理ファイル（16記事）
```

**Step 4: コミット**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with /screenshot skill and series plan"
```
