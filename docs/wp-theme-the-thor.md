# THE THOR テーマ対応ガイド

THE THOR（FIT Inc.）テーマ固有のWordPress設定・API対応をまとめる。

## SEOフィールド

THE THORはテーマ組み込みのSEO機能を持ち、投稿編集画面に「SEO対策」メタボックスを表示する。
これらはWP REST APIには公開されず、XML-RPCまたはカスタムフィールド直接操作で設定する。

### カスタムフィールドキー

| 管理画面の表示 | メタキー | 説明 |
|---|---|---|
| title設定 | `titleName` | SEOタイトル（`<title>`タグ）。未入力時は「記事タイトル\|サイト名」が自動生成される |
| meta description設定 | `description` | メタディスクリプション。検索結果に表示される説明文 |
| meta robot設定 | `noindex`, `nofollow`, `nosnippet`, `noarchive` | robots メタタグ（チェックボックス） |

### .env 設定

THE THOR を使用する場合、`.env` に以下を追加:

```env
WP_SEO_METHOD=xmlrpc
WP_SEO_TITLE_KEY=titleName
WP_SEO_DESC_KEY=description
```

これにより `wp-publish-draft.ts` / `wp-update-post.ts` が投稿後に XML-RPC で SEO フィールドを自動設定する。
`WP_SEO_METHOD` が未設定または `none` の場合はスキップされるため、他テーマでも安全。

### CLI

```bash
npx tsx scripts/wp-set-seo-fields.ts <postId> [seoTitle] [metaDescription]
```

### パイプライン統合

article.json の `seoTitle` と `metaDescription` が使用される:
- `seoTitle`: THE THORの「title設定」に反映。省略時はテーマが自動生成
- `metaDescription`: THE THORの「meta description設定」に反映

## title設定の運用ルール

- 投稿タイトルとSEOタイトルが同じなら `seoTitle` は省略可（テーマが自動生成）
- 投稿タイトルが長い場合やKWの並びを変えたい場合に `seoTitle` を明示的に設定
- テーマは未入力時に「記事タイトル|Programming ZERO」形式で自動出力。サイト名付与が不要なら明示的に設定する

## 吹き出し（体験談・一次情報用）

THE THOR の吹き出しパーツを使い、体験談や一次情報のコメントを視覚的に差別化する。

### HTML 構造

```html
<!-- 左画像・背景スタイル -->
<div class="balloon">
  <div class="balloon__img balloon__img-left">
    <div></div>
  </div>
  <div class="balloon__text balloon__text-right">
    <p>体験談テキスト</p>
  </div>
</div>

<!-- 左画像・ボーダースタイル -->
<div class="balloon balloon-boder">
  <div class="balloon__img balloon__img-left">
    <div></div>
  </div>
  <div class="balloon__text balloon__text-right">
    <p>体験談テキスト</p>
  </div>
</div>

<!-- 右画像・背景スタイル -->
<div class="balloon">
  <div class="balloon__img balloon__img-right">
    <div></div>
  </div>
  <div class="balloon__text balloon__text-left">
    <p>体験談テキスト</p>
  </div>
</div>
```

### 使い分け

| スタイル | 用途 |
|---|---|
| 左画像・背景 | 筆者の体験談・感想（メイン） |
| 左画像・ボーダー | 補足コメント・ワンポイントアドバイス |
| 右画像 | 対話形式（読者の疑問を代弁する場合など） |

### 設定

吹き出し画像は WordPress カスタマイザーで登録:
外観 → カスタマイズ → パーツスタイル設定[THE] → 吹き出し設定

### 記事生成での使用ルール

- 1記事あたり **2〜4箇所** 程度（多用しすぎない）
- 体験に基づく感想・気づき・注意点に使用する
- 単なる説明文には使用しない（通常の `<p>` で十分）
- 吹き出し内は **1〜3文** の短いコメントにする

## 既知の制限

- REST APIで `show_in_rest` に登録されていないため、REST APIの `meta` フィールドでは読み書き不可
- XML-RPCが無効化されている環境では動作しない
- robots メタタグ（noindex等）は現在パイプライン未対応（必要になれば追加）
