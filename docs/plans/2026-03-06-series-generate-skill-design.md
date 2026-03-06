# /series-generate スキル設計

## 概要

programming-zero.net の Claude Code シリーズ計画（`docs/plans/claude-code-series.json`）に基づいて記事を生成するラッパースキル。シリーズ固有の前処理・後処理を担い、記事生成本体は汎用の `/generate` パイプラインに委任する。

## 動機

- `/generate` は汎用の記事生成パイプラインとして維持したい
- シリーズ計画の読み込み、内部リンク構築、ステータス管理はシリーズ固有のロジック
- これらを `/series-generate` に分離し、関心の分離を実現する

## インターフェース

```bash
/series-generate next          # 優先順位に従って次の未生成記事を生成
/series-generate 2             # 記事#2（料金）を指定して生成
/series-generate 2 --local     # ローカルのみ（WP投稿スキップ）
```

## アーキテクチャ

```
/series-generate
  │
  ├── Phase 1: シリーズ前処理
  │     ├── claude-code-series.json 読み込み
  │     ├── 対象記事の特定（next or 指定ID）
  │     ├── 既存公開記事のURL取得（WP API）
  │     ├── seriesContext 構築
  │     └── 設計ドキュメントからリード戦略読み込み
  │
  ├── Phase 2: /generate パイプライン実行
  │     ├── generate/SKILL.md を Read ツールで読み込み
  │     └── その手順に従って実行（seriesContext は会話中に存在）
  │
  └── Phase 3: シリーズ後処理
        ├── claude-code-series.json のステータス・wpPostId・wpUrl 更新
        ├── SEOフィールド設定（seoTitle, metaDescription）
        ├── 既存記事への内部リンク追加を提案
        └── 次に書くべき記事を表示
```

## seriesContext の形式

Phase 1 で構築し、会話コンテキストに保持する:

```json
{
  "currentArticle": {
    "id": 2,
    "keyword": "claude code 料金",
    "title": "Claude Codeの料金プランを徹底解説【無料で使える？】",
    "phase": "知る",
    "subKeywords": ["無料", "plans", "pricing", "pro", "max", "月額"],
    "description": "料金プラン（Max/Pro/API）の詳細比較。無料枠の有無、コスパの良い選び方。"
  },
  "relatedArticles": [
    { "id": 1, "title": "Claude Codeとは？...", "url": "https://...", "status": "published" },
    { "id": 3, "title": "...", "url": null, "status": "draft" }
  ],
  "leadStrategy": "（該当記事のリード戦略、設計ドキュメントから抽出）"
}
```

## /generate への変更

Step 5（アウトライン）と Step 6（本文生成）からシリーズ固有ロジックを削除:

### Step 5 変更点
- 削除: `docs/plans/claude-code-series.json` の直接読み込みロジック
- 追加: 「会話中に `seriesContext` がある場合、関連記事情報をアウトライン設計に活用する」

### Step 6 変更点
- 削除: `seriesContext` 構築のためのシリーズ計画読み込み指示
- 変更: 内部リンク挿入ルールを汎用化（「seriesContext がある場合、URL があればリンク、null なら言及のみ」）

### article.json フォーマット変更
- `seoTitle` フィールドを追加（既にCLAUDE.mdに反映済み）

## 「next」の優先順位ロジック

設計ドキュメント（`docs/plans/2026-03-05-claude-code-guide-series-design.md`）の「実行優先順位」セクションに定義された順序に従う:

1. status が "draft" の記事のみ対象
2. 実行優先順位テーブルの順序でソート
3. 最初の未生成記事を選択

## ファイル配置

```
.claude/skills/series-generate/SKILL.md  ← 新規作成（プロジェクトレベル）
docs/plans/claude-code-series.json       ← 既存（ステータス管理に使用、後処理で更新）
docs/plans/2026-03-05-claude-code-guide-series-design.md  ← 既存（リード戦略等の参照元）
```

## 実装タスク

1. `/generate` SKILL.md からシリーズ固有ロジックを削除・汎用化
2. `/series-generate` SKILL.md を新規作成
3. `claude-code-series.json` に実行優先順位フィールドを追加
4. CLAUDE.md を更新（新スキルの追加）
5. 動作確認
