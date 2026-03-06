# PR-Based Human Review Flow Design

Date: 2026-03-06

## Background

記事生成パイプライン (`/generate`) で生成された記事は、現在 `output/` (gitignore) に保存され、直接 WP に下書き投稿される。チームによるレビューや手動タスク（一次情報収集、スクリーンショット撮影など）のプロセスが欠如している。

## Goals

1. 生成された記事にチームの人間レビューを挟む
2. Claude Code では収集できない一次情報の手動タスクを PR 上で管理・完結させる
3. レビュー承認後に WP へ自動投稿する

## Design Decisions

- **Approach A (PR 一本完結)** を採用: 記事レビューと手動タスク管理を単一の PR に集約
- **GitHub Actions** で merge 時に WP 自動投稿
- **`articles/` ディレクトリ** をこのリポジトリに新設（汎用性はパラメータ化で担保）
- **`article.md`** をレビュー用に生成（HTML in JSON は可読性が低い）

## Overall Flow

```
/generate (Steps 0-8)
    | output/{sessionDir}/ に一時ファイル生成（従来通り、gitignore）
    v
Step 9: PR 作成
    | ブランチ作成 (article/{slug})
    | articles/{slug}/ にファイルをコミット
    | PR 作成（サマリー + レビュー結果 + 手動タスクチェックリスト）
    v
Human Review (PR)
    | チームが記事をレビュー（inline comment, suggestion）
    | 手動タスクがあれば PR ブランチにコミット追加
    | 必要に応じて Claude Code で修正・incorporate
    | Approve
    v
Merge → GitHub Actions → WP 自動投稿
```

## File Structure

```
articles/
  {slug}/
    article.json          # WP投稿用データ（従来フォーマット）
    article.md            # レビュー用 Markdown（htmlContent を可読化）
    review.json           # 自動レビュー結果
    fact-check.json       # ファクトチェック結果
    screenshots/          # スクリーンショット（自動 + 手動）
```

- `article.md`: PR での主なレビュー対象。htmlContent を Markdown に変換して可読性を確保
- `article.json`: WP 投稿用。GitHub Actions が消費
- `review.json` / `fact-check.json`: レビュアーへの参考情報

## Step 9: PR Creation (New)

従来の Step 9 (WP 直接投稿) を PR 作成に置き換える。

### 9-1. ブランチ作成

```bash
git checkout -b article/{slug}
```

### 9-2. ファイル配置

`output/{sessionDir}/` から `articles/{slug}/` へ必要ファイルをコピー:

- `article.json` → `articles/{slug}/article.json`
- `review.json` → `articles/{slug}/review.json`
- `fact-check.json` → `articles/{slug}/fact-check.json`
- `screenshots/` → `articles/{slug}/screenshots/`

さらに `article.json` の `htmlContent` から `article.md` を生成:

- HTML → Markdown 変換（h2 → ##, h3 → ###, p → テキスト, etc.）
- メタデータ（title, slug, metaDescription, tags）をフロントマターとして付与

### 9-3. コミット & プッシュ

```bash
git add articles/{slug}/
git commit -m "feat: add article '{title}'"
git push -u origin article/{slug}
```

### 9-4. PR 作成

`gh pr create` で PR を作成。

### PR Body Template

```markdown
## {title}

**Keyword**: {keyword}
**Slug**: {slug}
**Meta Description**: {metaDescription}
**Tags**: {tags}

---

### Auto Review
- **Score**: {overallScore}/100
- {key findings summary}

### Fact Check
- **Verdict**: {overallVerdict}
- {key findings summary}

---

### Manual Tasks
- [ ] {task1 description}
- [ ] {task2 description}

Manual tasks can be completed by committing to this branch:
- Screenshots: add to `articles/{slug}/screenshots/`
- Text data: comment on this PR

---

### Review Checklist
- [ ] 事実関係に誤りがないか
- [ ] 読者にとって分かりやすいか
- [ ] 文体がサイトのトーンに合っているか
```

手動タスクが 0 件の場合、Manual Tasks セクションは省略。

## GitHub Actions: WP Auto-Publish

### Trigger

`main` ブランチへの push で `articles/*/article.json` に変更があった場合。

### Workflow

```yaml
name: Publish to WordPress
on:
  push:
    branches: [main]
    paths: ['articles/*/article.json']

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - name: Detect changed articles
        id: changed
        run: |
          # main への push で変更された article.json を特定
          CHANGED=$(git diff --name-only HEAD~1 HEAD -- 'articles/*/article.json')
          echo "files=$CHANGED" >> $GITHUB_OUTPUT
      - name: Publish each article
        env:
          WP_SITE_URL: ${{ secrets.WP_SITE_URL }}
          WP_USERNAME: ${{ secrets.WP_USERNAME }}
          WP_APP_PASSWORD: ${{ secrets.WP_APP_PASSWORD }}
        run: |
          for f in ${{ steps.changed.outputs.files }}; do
            npx tsx scripts/wp-publish-draft.ts "$f"
          done
```

### Secrets

GitHub Repository Settings → Secrets に以下を設定:
- `WP_SITE_URL`
- `WP_USERNAME`
- `WP_APP_PASSWORD`
- SEO 関連: `WP_SEO_METHOD`, `WP_SEO_TITLE_KEY`, `WP_SEO_DESC_KEY`（必要に応じて）

## Manual Task Completion Flow

1. PR の Manual Tasks チェックリストを確認
2. スクリーンショット: PR ブランチに `articles/{slug}/screenshots/` へコミット
3. テキスト情報: PR にコメントとして追記
4. 必要に応じて Claude Code を PR ブランチで実行し `/incorporate` 相当の処理で記事に反映
5. チェックリストの該当項目を手動でチェック

## Changes to Existing Pipeline

### `/generate` SKILL.md

- Step 9 を「WP 直接投稿」から「PR 作成」に変更
- `isLocal` フラグの意味を変更: true = PR も作成しない（ローカル確認のみ）

### `.gitignore`

- `articles/` は git 管理対象（追加不要、デフォルトで tracked）

### New Files

- `.github/workflows/wp-publish.yml`: GitHub Actions ワークフロー
- `articles/.gitkeep`: ディレクトリ初期化用

### article.md Generation

`article.json` の `htmlContent` を Markdown に変換するロジックが必要。Step 9 内で Claude Code が直接変換する（専用スクリプトは不要）。
