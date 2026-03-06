# Claude Code スクリーンショット スキル設計

**日付**: 2026-03-06
**アプローチ**: コンポーネントCSS テンプレート + スキルが自然言語から組み立て

## 概要

Claude Code のターミナルUIを忠実に再現するHTMLテンプレートと、自然言語の説明からスクリーンショットを生成する専用スキル `/cc-screenshot` を新設する。

既存の `/screenshot` スキルとは独立した新スキルとして作成する。

## 用途

記事内の説明用スクリーンショット。Claude Code の使い方を説明する記事で「こういう画面が出ます」的に使う。内容はシーンごとに毎回異なる。

## カラーパレット

```css
--cc-bg:            #1a1a2e    /* 背景: ダークネイビー */
--cc-bg-lighter:    #252538    /* スキルボックス等の薄い背景 */
--cc-text:          #e0e0e8    /* メインテキスト */
--cc-text-bold:     #f4f4f5    /* 太字・重要テキスト */
--cc-muted:         #71717a    /* 薄いテキスト: ステータス、ヒント */
--cc-accent:        #c9835e    /* オレンジ: 見出し、思考インジケーター */
--cc-green:         #4ade80    /* ステータスドット */
--cc-blue:          #7aa2f7    /* ハイライト */
--cc-separator:     #333348    /* セパレーター線 */
--cc-diff-red-bg:   #3f1f1f    /* Diff 削除行背景 */
--cc-diff-red:      #f87171    /* Diff 削除テキスト */
--cc-diff-green-bg: #1a3a2a    /* Diff 追加行背景 */
--cc-diff-green:    #4ade80    /* Diff 追加テキスト */
```

## UIコンポーネント

| クラス | 用途 | 見た目 |
|--------|------|--------|
| `cc-response` | Claude応答行 | `●` ドット + テキスト |
| `cc-skill` | スキル呼び出し | `▶` オレンジ三角 + 角丸ボックス |
| `cc-tool-loaded` | ツール読込 | `▷` オレンジ三角 + 薄いボックス |
| `cc-search` | 検索結果 | `●` カラードット + muted テキスト |
| `cc-search-detail` | 検索詳細 | ツリー文字 + インデント + muted |
| `cc-thinking` | 思考中 | `✻`/`+` オレンジ + accent テキスト |
| `cc-agent-tree` | エージェントツリー | ヘッダー + `├─ │ └` ツリー構造 |
| `cc-diff` | Diff ビュー | 行番号 + 赤/緑ハイライト行 |
| `cc-permission` | 許可ダイアログ | 質問 + 選択肢 + ヒント |
| `cc-prompt` | 入力プロンプト | `›` シェブロン + `▌` カーソル |
| `cc-separator` | 区切り線 | 薄いグレー水平線 |
| `cc-status` | ステータスバー | muted テキスト |
| `cc-header` | ヘッダー（任意） | バージョン + モデル + ディレクトリ |
| `cc-list` | 番号付きリスト | 番号 + テキスト |

## テンプレート

**ファイル**: `templates/claude-code-mockup.html`

- `{{CONTENT}}` プレースホルダーをスキルが生成したHTMLで置換
- 全コンポーネントのCSSをテンプレートに内包
- 幅は CSS 変数 `--cc-width` で調整可能（デフォルト 900px）
- フォント: "SF Mono", Menlo, Monaco, monospace

## スキル

**ファイル**: `.claude/skills/cc-screenshot/SKILL.md`

### フロー

1. ユーザーに自然言語で表示内容を質問
2. 説明を解釈してUIコンポーネントを選択・組み立て、HTMLを生成
3. テンプレートの `{{CONTENT}}` を置換
4. 一時HTML書き出し → HTTP配信 → Playwright で `.cc-container` 要素を撮影
5. リネーム・クリーンアップ

### 入力

自然言語による画面説明。例:
- 「/generate スキルを実行中に3つのエージェントが並列で動いている画面」
- 「CLAUDE.md を編集する Diff ビューと許可ダイアログ」

### 出力

`output/screenshots/cc-{slug}-{YYYYMMDD-HHMMSS}.png`
