# ファクトチェック

- **チェック日時**: 2026-03-09T22:00:00+09:00
- **記事タイトル**: 【AI業務効率化】非エンジニアが知るべき「自動化の新常識」とは
- **総合判定**: warning
- **検証結果**: 5/6 verified

## サマリー

6件の事実主張を検証した結果、5件が verified、1件が unverified と判定されました。Gartner の「ノーコード・ローコード導入企業の約65%が1年以内に開発停滞を経験」という統計は、Gartner の公式発表として確認できませんでした。Gartner が公表している「65%」という数値は「2024年までにアプリケーション開発の65%以上がローコードで行われる」という成長予測であり、開発停滞率ではありません。この主張は修正が必要です。その他の主張はすべて公式情報源で裏付けが取れました。

## 検証結果一覧

### 1. ❓ ノーコード・ローコードを導入した企業の約65%が1年以内に開発停滞を経験（Gartner報告）
- **カテゴリ**: 数値・統計
- **根拠**: Gartner の公式発表や複数の統計まとめサイトを調査したが、「65%が開発停滞」という統計は確認できなかった。Gartner が発表している「65%」は「2024年までにアプリケーション開発活動の65%以上がローコードで行われる」という成長予測であり、開発停滞に関する数値ではない。ノーコード・ローコードのスケーラビリティ課題は複数の情報源で指摘されているが（47%の組織がスケーリング懸念を表明など）、「65%が1年以内に開発停滞」という具体的な統計の出典は見つからなかった。
- **修正提案**: 「調査会社Gartnerの報告によると、ノーコード・ローコードを導入した企業の約65%が1年以内に開発停滞を経験しているとされています。」を削除するか、検証可能な統計に差し替えることを推奨。例: 「ノーコード・ローコードツールを導入した企業の多くが、スケーラビリティや複雑な要件への対応で壁にぶつかるケースが報告されています。」のように、特定の数値を避けた表現に変更する。

### 2. ✅ GASには実行時間6分の制限がある
- **カテゴリ**: 手順・仕様
- **根拠**: Google 公式ドキュメント（Quotas for Google Services）および多数の技術記事で確認。Google Apps Script のスクリプト実行時間は1回の呼び出しにつき最大6分間に制限されている。6分を超えると「Exceeded maximum execution time」例外がスローされる。
- **修正提案**: なし。正確な情報。

### 3. ✅ Claude Codeの開発元であるAnthropic社の社内でも、弁護士やマーケターなど非エンジニアがAIコーディングツールを使ってツールを自作している
- **カテゴリ**: 固有名詞の属性
- **根拠**: Anthropic 公式ブログ「How Anthropic teams use Claude Code」で確認。法務チームの Associate General Counsel である Mark Pike 氏（コーディング経験なし）がプロトタイプの「Phone Tree」システムを構築した事例、Growth Marketing チームが非技術者でありながら広告バリエーション生成の自動ワークフローを構築した事例が報告されている。
- **修正提案**: なし。正確な情報。

### 4. ✅ Claude Code は Anthropic 社が提供しているツールである
- **カテゴリ**: 固有名詞の属性
- **根拠**: Anthropic 公式サイト（anthropic.com）、Claude Code 公式ドキュメント（code.claude.com）、GitHub リポジトリ（github.com/anthropics/claude-code）で確認。Claude Code は Anthropic 社が開発・提供するエージェント型コーディングツール。
- **修正提案**: なし。正確な情報。

### 5. ✅ GASはJavaScriptベースのプログラミング言語である
- **カテゴリ**: 手順・仕様
- **根拠**: Google 公式ドキュメント（developers.google.com/apps-script/overview）で「Google Apps Script is a rapid application development platform... using modern JavaScript」と明記。Wikipedia でも「a scripting platform developed by Google for light-weight application development in the Google Workspace platform... based on JavaScript」と記載。Chrome V8 JavaScript エンジンで動作する。
- **修正提案**: なし。正確な情報。

### 6. ✅ Claude Code のセキュリティに関する公式ドキュメントページが存在する
- **カテゴリ**: 手順・仕様
- **根拠**: Claude Code 公式ドキュメントサイトにセキュリティページが存在することを確認（code.claude.com/docs/en/security）。ただし、記事中のリンク先 URL（docs.anthropic.com/en/docs/claude-code/security）はドキュメントサイトの URL 構造が変更されている可能性がある。現在の正式な URL は code.claude.com/docs/en/security。
- **修正提案**: リンク先 URL を最新の公式ドキュメント URL（https://code.claude.com/docs/en/security）に更新することを推奨。同様に、Claude Code Overview のリンク（docs.anthropic.com/en/docs/claude-code/overview）も https://code.claude.com/docs/en/overview への更新を検討。
