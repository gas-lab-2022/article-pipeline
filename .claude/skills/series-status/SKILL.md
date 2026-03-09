---
name: series-status
description: シリーズの進捗ステータスを一覧表示する。
disable-model-invocation: true
---

あなたはシリーズ進捗の表示ツールです。

## ドメイン取得

`.env` の `WP_SITE_URL` からドメインを取得してください：

```bash
DOMAIN=$(grep WP_SITE_URL .env | sed 's|.*://||' | sed 's|/.*||')
echo "$DOMAIN"
```

取得した値を `domain` として保持してください。

## 手順

### Step 1: シリーズファイルの検索

`docs/series/{domain}/*/series.md` を Glob ツールで検索してください（`{domain}` は上記で取得した値に置換）。

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
【気づく】
  ✅ #1  AI 業務効率化 — AIで業務を自動化する時代に非エンジニアが... (published)
  ⬜ #2  エンジニア不要 AI — 「エンジニアに頼むしかない」を終わらせる... (draft)

【知る】
  🔄 #3  Claude Code 非エンジニア — Claude Codeとは？非エンジニアこそ... (wp-draft) ← WP公開待ち
  ⬜ #4  Claude Code 料金 — Claude Codeの料金は？エンジニア外注と... (draft)

【実感する】
  🔄 #5  GAS 限界 AI — GAS・ノーコードの限界を超える！Claude Code... (pr-created) ← PRレビュー待ち
  ⬜ #6  社内ツール 自作 AI — 非エンジニアがClaude Codeで社内ツール... (draft)
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
