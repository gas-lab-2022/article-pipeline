# ファクトチェック

- **チェック日時**: 2026-03-08T22:45:00+09:00
- **記事タイトル**: Claude Codeとは？できること・特徴をわかりやすく解説
- **総合判定**: fail
- **検証結果**: 10/12 verified

## サマリー

12件の事実主張を検証した結果、10件が信頼できる情報源で裏付けが取れました。ただし2件に問題があります。（1）iOSアプリからの利用に関する記述は、専用iOSアプリの存在を裏付ける情報が見つからず、事実と異なる可能性があります。Slack経由でWebベースのClaude Codeセッションを開始することは可能ですが、iOSアプリでの直接利用とは異なります。（2）Teamプランの料金「$30/ユーザー」は不正確です。2026年3月時点では、Standardシートが$25/月（年払い）または$30/月（月払い）であり、Claude Code利用にはPremiumシート（$150/月）が必要です。記事の表記は読者に誤解を与える恐れがあります。

## 検証結果一覧

### 1. ✅ Claude CodeはAI企業Anthropicが開発したエージェント型のAIコーディングツールである

- **カテゴリ**: 固有名詞の属性
- **該当箇所**: 「Claude Codeは、AI企業Anthropicが開発したエージェント型のAIコーディングツールです」
- **根拠**: Anthropic公式サイト、GitHub リポジトリ（anthropics/claude-code）、複数のテックメディア（Built In、TechCrunch、Axios等）すべてがClaude CodeをAnthropicが開発したエージェント型コーディングツールと説明している。

### 2. ✅ Claude Codeは5つの利用環境（ターミナル、VSCode、JetBrains IDE、デスクトップアプリ、Web版）に対応している

- **カテゴリ**: 手順・仕様
- **該当箇所**: 5つの利用環境の表（ターミナル、VSCode、JetBrains IDE、デスクトップアプリ、Web版）
- **根拠**: 公式ドキュメント（code.claude.com/docs）でターミナルCLI、VSCode拡張、JetBrains IDEプラグイン、Claudeデスクトップアプリ、Webインターフェースの5環境が確認できる。kvssetty.medium.comの記事でも「2026年時点で9種類以上のアクセス方法」と報じており、記事記載の5環境はすべて含まれている。

### 3. ❌ Slack連携やiOSアプリからの利用にも対応している

- **カテゴリ**: 手順・仕様
- **該当箇所**: 「Slack連携やiOSアプリからの利用にも対応しています。外出先からスマートフォンでタスクを開始し、帰宅後にターミナルで続きを行う、といった使い方も可能です」
- **根拠**: Slack連携は確認済み（公式ドキュメント、TechCrunch報道）。しかし「iOSアプリからの利用」については、専用iOSアプリの存在を裏付ける情報が見つからない。SlackアプリからClaude Codeのセッションを起動することは可能だが、それはWebベースのセッションであり「iOSアプリから利用」とは異なる。
- **修正提案**: 「Slack連携にも対応しており、Slackからコーディングタスクを依頼してWebベースのClaude Codeセッションを自動起動できます」のように修正し、iOSアプリへの言及を削除するか、正確な利用形態に修正することを推奨。

### 4. ✅ MCP（Model Context Protocol）はClaude Codeを外部ツールとつなぐための仕組みである

- **カテゴリ**: 手順・仕様
- **該当箇所**: 「MCP（Model Context Protocol）は、Claude Codeを外部ツールとつなぐための仕組みです」
- **根拠**: 公式ドキュメント（code.claude.com/docs/en/mcp）で「Claude Code can connect to hundreds of external tools and data sources through the Model Context Protocol (MCP)」と説明されている。modelcontextprotocol.ioでもオープンソース標準として定義されている。

### 5. ✅ プロジェクトのルートにCLAUDE.mdファイルを置くことでClaude Codeの動作をカスタマイズできる

- **カテゴリ**: 手順・仕様
- **該当箇所**: 「プロジェクトのルートにCLAUDE.mdというファイルを置くことで、Claude Codeの動作をカスタマイズできます」
- **根拠**: 公式ドキュメント（code.claude.com/docs/en/memory）およびSFEIR Instituteの解説で、CLAUDE.mdがMarkdown設定ファイルとしてセッション開始時に自動読込されることが確認済み。

### 6. ❌ 料金表：Teamプランは$30/ユーザー

- **カテゴリ**: 数値・統計
- **該当箇所**: 料金表「Team｜$30/ユーザー｜利用可能｜チーム導入する方」
- **根拠**: 2026年3月時点の料金は以下の通り：Freeプラン無料（✅）、Proプラン$20/月（✅）、Maxプラン$100〜$200（✅）。ただしTeamプランは、Standardシートが$25/月（年払い）/$30/月（月払い）、Premiumシートが$150/月。重要な点として、Claude Codeを利用するにはPremiumシート（$150/月）が必要であり、「$30/ユーザーでClaude Code利用可能」は不正確。
- **修正提案**: Teamプランの欄を「$25〜$150/ユーザー」に修正し、注釈で「Claude Code利用にはPremiumシート（$150/月）が必要」と明記することを推奨。

### 7. ✅ Claude Codeを無料で使うことはできない（有料プラン必須）

- **カテゴリ**: 手順・仕様
- **該当箇所**: 「Claude Codeを無料で使うことはできません。Claudeの有料プランへの加入が必要です」
- **根拠**: 公式料金ページ（claude.com/pricing）、複数のレビューサイト（ClaudeLog、Northflank、VentureBeat等）で、Freeプランではのlaude Code利用不可と確認されている。

### 8. ✅ Claude CodeはMac・Windows・Linuxのすべてに対応している

- **カテゴリ**: 手順・仕様
- **該当箇所**: 「Claude CodeはMac・Windows・Linuxのすべてに対応しています」
- **根拠**: 公式ドキュメント（code.claude.com/docs/en/setup）で macOS 13.0+、Windows 10 1809+、Ubuntu 20.04+/Debian 10+/Alpine Linux 3.19+ への対応が明記されている。

### 9. ✅ Mac/Linuxのインストールコマンドは `curl -fsSL https://claude.ai/install.sh | bash`

- **カテゴリ**: 手順・仕様
- **該当箇所**: `curl -fsSL https://claude.ai/install.sh | bash`
- **根拠**: 公式ドキュメント、GitHub リポジトリ、複数のインストールガイド（ClaudeLog、morphllm.com等）すべてで同一コマンドが推奨インストール方法として記載されている。

### 10. ✅ Auto Memory機能により作業中に学んだことを自動的に記憶する

- **カテゴリ**: 手順・仕様
- **該当箇所**: 「Auto Memory機能により、作業中に学んだことをClaude Codeが自動的に記憶し、次回以降のセッションに活かしてくれます」
- **根拠**: 公式ドキュメント（code.claude.com/docs/en/memory）で「Auto memory lets Claude accumulate knowledge across sessions without you writing anything」と説明されている。Medium記事やThe Decoder記事でも機能の存在が確認済み。

### 11. ✅ GitHub Copilotは主にコード補完（次の1行の予測）が中心である

- **カテゴリ**: 手順・仕様
- **該当箇所**: 「GitHub Copilotは主にコード補完（次の1行の予測）が中心です」
- **根拠**: SitePoint、Medium等の比較記事で「Copilot is Reactive: It waits for you. You open a file, you start typing a function name, and it suggests a body」「Real-time code completion within a file is Copilot's decisive advantage」と説明されている。ただし2026年にはCopilotもマルチファイル編集プレビュー機能を追加しており、エージェント機能も拡充しつつある点は留意が必要。

### 12. ✅ API経由の場合は使った分だけの従量課金となる

- **カテゴリ**: 手順・仕様
- **該当箇所**: 「API経由の場合は使った分だけの従量課金となります」
- **根拠**: 公式APIドキュメント（platform.claude.com/docs/en/about-claude/pricing）でトークン単位の従量課金体系が明記されている（例: Opus 4.6は入力$5/百万トークン、出力$25/百万トークン）。
