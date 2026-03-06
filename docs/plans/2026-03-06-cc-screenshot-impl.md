# Claude Code スクリーンショット 実装計画

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Claude Code のターミナルUIを忠実に再現する HTML テンプレートと `/cc-screenshot` スキルを作成する

**Architecture:** 1つの HTML テンプレート (`templates/claude-code-mockup.html`) に全 UI コンポーネントの CSS を定義。スキル (`/cc-screenshot`) がユーザーの自然言語説明を解釈して HTML を組み立て、Playwright で撮影する。

**Tech Stack:** HTML/CSS, Playwright MCP, Python HTTP server (撮影用)

**設計ドキュメント:** `docs/plans/2026-03-06-cc-screenshot-design.md`

**参考スクリーンショット（実際の Claude Code UI）:** ユーザーのデスクトップにある5枚のスクリーンショット。テンプレート作成後に目視比較する。

---

### Task 1: HTML テンプレート作成 — ベース構造とカラーパレット

**Files:**
- Create: `templates/claude-code-mockup.html`

**Step 1: テンプレートファイルを作成**

以下の構造で作成する:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Claude Code Mockup</title>
  <style>
    :root {
      --cc-width: 900px;
      --cc-bg: #1a1a2e;
      --cc-bg-lighter: #252538;
      --cc-text: #e0e0e8;
      --cc-text-bold: #f4f4f5;
      --cc-muted: #71717a;
      --cc-accent: #c9835e;
      --cc-green: #4ade80;
      --cc-blue: #7aa2f7;
      --cc-separator: #333348;
      --cc-diff-red-bg: #3f1f1f;
      --cc-diff-red: #f87171;
      --cc-diff-green-bg: #1a3a2a;
      --cc-diff-green: #4ade80;
    }

    *, *::before, *::after {
      margin: 0; padding: 0; box-sizing: border-box;
    }

    body {
      background: #111;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      font-family: "SF Mono", Menlo, Monaco, Consolas, monospace;
    }

    .cc-container {
      width: var(--cc-width);
      background-color: var(--cc-bg);
      color: var(--cc-text);
      font-size: 14px;
      line-height: 1.5;
      padding: 20px 24px;
    }
  </style>
</head>
<body>
  <div class="cc-container">
{{CONTENT}}
  </div>
</body>
</html>
```

この時点では CSS 変数とベースコンテナのみ。コンポーネント CSS は Task 2 で追加。

---

### Task 2: コンポーネント CSS を追加 — 応答・スキル・ツール・検索・思考

**Files:**
- Modify: `templates/claude-code-mockup.html` (style セクションに追加)

**Step 1: 以下のコンポーネント CSS を追加**

```css
/* --- cc-header: バージョン・モデル・ディレクトリ --- */
.cc-header { margin-bottom: 16px; }
.cc-header-version {
  color: var(--cc-text-bold);
  font-weight: bold;
  font-size: 15px;
}
.cc-header-info {
  color: var(--cc-muted);
  font-size: 13px;
}

/* --- cc-response: Claude 応答行 --- */
.cc-response {
  padding: 4px 0;
  color: var(--cc-text);
}
.cc-dot {
  margin-right: 8px;
}
.cc-dot.green { color: var(--cc-green); }
.cc-dot.white { color: var(--cc-text-bold); }
.cc-dot.yellow { color: #facc15; }

/* --- cc-skill: スキル呼び出し --- */
.cc-skill {
  display: inline-flex;
  align-items: center;
  background-color: var(--cc-bg-lighter);
  border-radius: 6px;
  padding: 4px 12px;
  margin: 6px 0;
}
.cc-skill-icon {
  color: var(--cc-accent);
  margin-right: 8px;
}
.cc-skill-name {
  color: var(--cc-text-bold);
  font-weight: bold;
}

/* --- cc-tool-loaded: ツール読込 --- */
.cc-tool-loaded {
  display: inline-flex;
  align-items: center;
  background-color: var(--cc-bg-lighter);
  border-radius: 4px;
  padding: 2px 10px;
  margin: 4px 0;
  color: var(--cc-text);
}
.cc-tool-icon {
  color: var(--cc-accent);
  margin-right: 8px;
}

/* --- cc-search: 検索結果行 --- */
.cc-search {
  padding: 4px 0;
  color: var(--cc-muted);
}

/* --- cc-search-detail: 検索詳細（インデント） --- */
.cc-search-detail {
  padding: 2px 0 2px 24px;
  color: var(--cc-muted);
}
.cc-tree {
  color: var(--cc-muted);
}

/* --- cc-thinking: 思考中インジケーター --- */
.cc-thinking {
  padding: 6px 0;
  color: var(--cc-accent);
}
.cc-thinking-icon {
  margin-right: 6px;
}
```

---

### Task 3: コンポーネント CSS を追加 — エージェントツリー・Diff・許可・プロンプト

**Files:**
- Modify: `templates/claude-code-mockup.html` (style セクションに追加)

**Step 1: 以下のコンポーネント CSS を追加**

```css
/* --- cc-agent-tree: エージェントツリー --- */
.cc-agent-tree {
  margin: 6px 0;
}
.cc-agent-header {
  padding: 4px 0;
  color: var(--cc-text);
}
.cc-tree-line {
  padding: 1px 0 1px 16px;
  color: var(--cc-text);
  white-space: pre;
}
.cc-tree-line.indent {
  padding-left: 32px;
}
.cc-tree-hint {
  padding: 2px 0 2px 16px;
  color: var(--cc-muted);
  font-size: 13px;
}

/* --- cc-diff: Diff ビュー --- */
.cc-diff {
  margin: 8px 0;
  border: 1px solid var(--cc-separator);
  border-radius: 4px;
  overflow: hidden;
}
.cc-diff-header {
  padding: 8px 12px;
  border-bottom: 1px dashed var(--cc-separator);
}
.cc-diff-title {
  color: var(--cc-text-bold);
  font-weight: bold;
}
.cc-diff-filename {
  color: var(--cc-text);
}
.cc-diff-line {
  padding: 1px 12px;
  white-space: pre;
}
.cc-diff-line .line-number {
  display: inline-block;
  width: 36px;
  text-align: right;
  color: var(--cc-muted);
  margin-right: 8px;
  user-select: none;
}
.cc-diff-line.removed {
  background-color: var(--cc-diff-red-bg);
  color: var(--cc-diff-red);
}
.cc-diff-line.added {
  background-color: var(--cc-diff-green-bg);
  color: var(--cc-diff-green);
}

/* --- cc-permission: 許可ダイアログ --- */
.cc-permission {
  margin: 8px 0;
}
.cc-permission-question {
  padding: 6px 0;
  color: var(--cc-text);
}
.cc-permission-option {
  padding: 2px 0 2px 8px;
  color: var(--cc-text);
}
.cc-permission-option.selected {
  color: var(--cc-text-bold);
}
.cc-permission-option .cc-chevron {
  color: var(--cc-text-bold);
  margin-right: 4px;
}
.cc-permission-hint {
  padding: 6px 0;
  color: var(--cc-muted);
  font-size: 13px;
}

/* --- cc-prompt: 入力プロンプト --- */
.cc-prompt {
  padding: 8px 0;
  color: var(--cc-text);
}
.cc-chevron {
  margin-right: 4px;
}
.cc-cursor {
  color: var(--cc-text-bold);
  animation: blink 1s step-end infinite;
}
@keyframes blink {
  50% { opacity: 0; }
}

/* --- cc-separator: 区切り線 --- */
.cc-separator {
  border: none;
  border-top: 1px solid var(--cc-separator);
  margin: 4px 0;
}

/* --- cc-status: ステータスバー --- */
.cc-status {
  padding: 4px 0;
  color: var(--cc-muted);
  font-size: 13px;
}

/* --- cc-list: 番号付きリスト --- */
.cc-list {
  padding: 4px 0 4px 8px;
  color: var(--cc-text);
}
.cc-list-item {
  padding: 2px 0;
}
.cc-list-item strong {
  color: var(--cc-text-bold);
}

/* --- ユーティリティ --- */
.cc-bold { color: var(--cc-text-bold); font-weight: bold; }
.cc-muted-text { color: var(--cc-muted); }
.cc-accent-text { color: var(--cc-accent); }
.cc-blue-text { color: var(--cc-blue); }
.cc-spacer { height: 8px; }
```

---

### Task 4: テスト用サンプル HTML を作成して目視確認

**Files:**
- Create: `templates/claude-code-mockup-test.html` (テスト用、後で削除)

**Step 1: テンプレートをコピーし、全コンポーネントを含むサンプルコンテンツを埋め込む**

`{{CONTENT}}` に以下のようなサンプルを入れて全コンポーネントを表示:

```html
<!-- ヘッダー -->
<div class="cc-header">
  <div class="cc-header-version">Claude Code v2.1.70</div>
  <div class="cc-header-info">Opus 4.6 with high effort · Claude Max</div>
  <div class="cc-header-info">~/dev/article-pipeline</div>
</div>

<!-- スキル呼び出し -->
<div class="cc-skill"><span class="cc-skill-icon">▶</span><span class="cc-skill-name">/generate</span></div>

<!-- Claude 応答 -->
<div class="cc-response"><span class="cc-dot white">●</span> I'll start by reading the source-of-truth files to identify what needs updating.</div>

<!-- ツール読込 -->
<div class="cc-tool-loaded"><span class="cc-tool-icon">▷</span> Tool loaded.</div>

<!-- 検索結果 -->
<div class="cc-search"><span class="cc-dot green">●</span> Searched for 4 patterns, read 2 files <span class="cc-muted-text">(ctrl+o to expand)</span></div>

<!-- エージェントツリー -->
<div class="cc-agent-tree">
  <div class="cc-agent-header"><span class="cc-dot green">●</span> Running 3 Explore agents… <span class="cc-muted-text">(ctrl+o to expand)</span></div>
  <div class="cc-tree-line"><span class="cc-tree">├─</span> SEO競合分析 · 5 tool uses · 12.3k tokens</div>
  <div class="cc-tree-line indent"><span class="cc-tree">└</span> Searching…</div>
  <div class="cc-tree-line"><span class="cc-tree">├─</span> キーワード深掘り · 3 tool uses · 8.1k tokens</div>
  <div class="cc-tree-line indent"><span class="cc-tree">└</span> Reading 3 files…</div>
  <div class="cc-tree-line"><span class="cc-tree">└─</span> 一次情報収集 · 4 tool uses · 10.5k tokens</div>
  <div class="cc-tree-line indent"><span class="cc-tree"> └</span> Fetching…</div>
  <div class="cc-tree-hint">ctrl+b to run in background</div>
</div>

<!-- 思考中 -->
<div class="cc-thinking"><span class="cc-thinking-icon">✻</span> Percolating… <span class="cc-muted-text">(32s · ↓ 1.2k tokens · thinking with high effort)</span></div>

<!-- セパレーター + プロンプト + ステータス -->
<hr class="cc-separator">
<div class="cc-prompt"><span class="cc-chevron">›</span> <span class="cc-cursor">▌</span></div>
<hr class="cc-separator">
<div class="cc-status">esc to interrupt</div>

<!-- 空行 -->
<div class="cc-spacer"></div>
<div class="cc-spacer"></div>

<!-- Diff ビュー -->
<div class="cc-response"><span class="cc-dot white">●</span> Update(CLAUDE.md)</div>
<div class="cc-diff">
  <div class="cc-diff-header">
    <div class="cc-diff-title">Edit file</div>
    <div class="cc-diff-filename">CLAUDE.md</div>
  </div>
  <div class="cc-diff-line"><span class="line-number">60</span> .claude/skills/generate/SKILL.md</div>
  <div class="cc-diff-line removed"><span class="line-number">61</span>-.claude/skills/series-generate old text</div>
  <div class="cc-diff-line added"><span class="line-number">61</span>+.claude/skills/series-generate new text</div>
  <div class="cc-diff-line"><span class="line-number">62</span> .claude/skills/revise/SKILL.md</div>
</div>

<!-- 許可ダイアログ -->
<div class="cc-permission">
  <div class="cc-permission-question">Do you want to make this edit to CLAUDE.md?</div>
  <div class="cc-permission-option selected"><span class="cc-chevron">›</span> 1. Yes</div>
  <div class="cc-permission-option">  2. Yes, allow all edits during this session <span class="cc-muted-text">(shift+tab)</span></div>
  <div class="cc-permission-option">  3. No</div>
  <div class="cc-permission-hint">Esc to cancel · Tab to amend</div>
</div>
```

**Step 2: HTTP サーバーで表示して目視確認**

```bash
python3 -m http.server 3847 --directory templates &
# ブラウザで http://localhost:3847/claude-code-mockup-test.html を開く
```

**Step 3: 実際の Claude Code スクリーンショットと比較し、色・間隔・フォントサイズを調整**

確認ポイント:
- 背景色が実際の Claude Code に近いか
- テキストの色・太さが合っているか
- コンポーネント間の間隔が自然か
- Diff の赤/緑ハイライトが実物と似ているか
- 全体の雰囲気が「Claude Code のスクショ」に見えるか

調整が必要であれば `templates/claude-code-mockup.html` の CSS 変数やスタイルを修正。

**Step 4: 確認完了後、テストファイルを削除**

```bash
rm templates/claude-code-mockup-test.html
kill $(lsof -ti:3847) 2>/dev/null
```

---

### Task 5: スキル SKILL.md を作成

**Files:**
- Create: `.claude/skills/cc-screenshot/SKILL.md`

**Step 1: スキルファイルを作成**

スキルの構造:
- Step 0: ユーザーに自然言語で画面説明を質問
- Step 1: テンプレート読み込み
- Step 2: 説明を解釈してコンポーネントを選択・HTML を組み立て
- Step 3: `{{CONTENT}}` を置換して一時ファイル書き出し
- Step 4: HTTP サーバー起動 → Playwright で撮影
- Step 5: リネーム・クリーンアップ・結果報告

スキル内にコンポーネントカタログ（各コンポーネントの HTML 記法例）を含め、スキル実行時にどのコンポーネントをどう組み合わせるかの参照として使う。

---

### Task 6: CLAUDE.md を更新

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Skills & Commands セクションに追加**

```markdown
# Claude Code 画面のスクリーンショット（自然言語で指定）
/cc-screenshot
```

**Step 2: Architecture セクションに追加**

```markdown
.claude/skills/cc-screenshot/SKILL.md  ← Claude Code UI スクリーンショット生成
templates/claude-code-mockup.html      ← Claude Code UI 再現 HTML テンプレート
```

---

### Task 7: コミット

**Step 1: 全変更をコミット**

```bash
git add templates/claude-code-mockup.html \
      .claude/skills/cc-screenshot/SKILL.md \
      CLAUDE.md \
      docs/plans/2026-03-06-cc-screenshot-design.md \
      docs/plans/2026-03-06-cc-screenshot-impl.md
git commit -m "feat: add /cc-screenshot skill for Claude Code UI mockup screenshots"
```
