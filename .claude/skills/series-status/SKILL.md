---
name: series-status
description: シリーズの進捗ステータスを一覧表示する。
disable-model-invocation: true
---

あなたはシリーズ進捗の表示ツールです。

## 手順

### Step 1: シリーズファイルの検索

`docs/series/*/series.md` を Glob ツールで検索してください。

**0件の場合:** 「シリーズ計画が見つかりません。」と表示して終了。

**1件の場合:** そのファイルを自動選択。

**2件以上の場合:** 一覧を表示してユーザーに選択を求めてください。

### Step 2: シリーズファイルの読み込み

選択したファイルを Read ツールで読み込み、全記事を抽出してください。

### Step 3: ステータス表示

以下の形式で表示してください。

#### 3-1: サマリー

```
📊 {seriesName}

  進捗: {published + wp-draft 数}/{全記事数} 記事（公開済み or WP下書き）
  ステータス内訳: published: N / wp-draft: N / pr-created: N / generated: N / draft: N
```

ステータスが 0件のものは省略してください。

サマリーの下に凡例を表示：

```
  凡例: ✅ 公開済み  🔄 あなたの対応待ち  📝 生成済み  ⬜ 未着手
```

#### 3-2: フェーズ別一覧

フェーズ（見出しの【】内）ごとにグループ化し、Priority 昇順で表示：

```
【知る】
  ✅ #1  claude code とは — Claude Codeとは？できること・特徴を... (published)
  🔄 #2  claude code 料金 — Claude Codeの料金プランを徹底解説... (wp-draft) ← WP公開待ち
  ⬜ #3  claude code — 【2026年最新】Claude Code完全ガイド (draft)

【試す】
  🔄 #4  claude code install — Claude Codeのインストール方法... (pr-created) ← PRレビュー待ち
  ⬜ #5  claude code vscode — Claude Code × VSCodeの導入と使い方 (draft)
  ...
```

ステータスに応じたアイコン:
- `published`: ✅
- `wp-draft`: 🔄 ← WP公開待ち
- `pr-created`: 🔄 ← PRレビュー待ち
- `generated`: 📝
- `draft`: ⬜

タイトルは長い場合30文字程度で省略（`...`）してください。

#### 3-3: 要対応

`pr-created` や `wp-draft` の記事がある場合、サマリーとして表示：

```
⚡ 要対応:
  PRレビュー待ち (1件): #4
  WP公開待ち (1件): #2
```

該当なしの場合はこのセクションを省略。

#### 3-4: 次に着手すべき記事

Priority 順で最も優先度の高い未完了記事（`draft` or `generated`）を表示：

```
次に着手すべき記事:
  #{id} 「{title}」（{keyword}）
  → /series-generate で生成
```
