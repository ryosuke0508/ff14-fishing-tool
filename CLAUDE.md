@AGENTS.md

# プロジェクト固有の注意点

技術構成・ディレクトリ構成・テーブルスキーマは [README.md](README.md) を参照。ここには、コードや README だけでは分かりにくい運用上の注意点をまとめる。

## デプロイ前に必ず `npm run build` を実行する

`npm run dev`（Turbopack dev）は型エラーがあっても普通に動いてしまうことがあるが、Vercelの本番ビルドは型チェックに失敗するとデプロイが失敗する。過去に「devでは動くのにVercelでビルドが落ちる」を2回経験している。push前に必ずローカルで `npm run build` を通すこと。

## Supabaseクライアントに生成型（Database型）を渡していない

`src/lib/supabase.ts` の `createClient` は型引数なしで呼んでいる。そのため、テーブル結合（例: `fish.select("..., areas(...)")`）の結果は、実際は単一オブジェクトの多対一関係でも配列型と推論されてしまう。`src/app/fish/page.tsx` の `FishRow` 型のように、クエリ結果の形を手動で型定義してキャスト（`as unknown as FishRow[]`）する必要がある。

## Supabaseの無料プランは一定期間アクセスがないと自動停止（Pause）する

サイトが急に真っ白/500エラーになったり、SupabaseのURLがDNSで名前解決できなくなったりしたら、まずSupabaseダッシュボードでプロジェクトが「Paused」になっていないか確認する。「Restore」で再開すればデータは消えずに直る。パフォーマンスの問題ではなくこれが原因だったことが過去に一度あった。

## `scripts/` フォルダはコミットしない運用にしている

`scripts/nushi-import/`（ff14-fish-tracker-appのデータとXIVAPIを突き合わせてヌシの釣行条件SQLを生成）や `scripts/area-id-import/`（XIVAPIからarea_id・areasテーブルのデータを生成）は、一度きりのデータ投入用スクリプト置き場として意図的にGit管理外にしている。新しい環境（別マシン・別クローン）には存在しない前提で考えること。ユーザーから明示的に「コミットして」と言われない限り、`git add`/コミットに含めない。

## データベースへの書き込みはユーザーがSupabaseのSQL Editorで手動実行する

このプロジェクトでは`service_role`キーを一切使っていない（`.env.local`にあるのは`anon`キーのみ）。テーブル作成・カラム追加・データ投入などが必要な場合は、Claude側でSQLファイルを生成し（スキーマ変更は`supabase/migrations/`に連番で追加、データ投入は`supabase/`直下に用途が分かる名前で追加）、ユーザーにSupabaseの「SQL Editor」で実行してもらう。RLS（Row Level Security）は読み取り（SELECT）のみ公開しており、書き込みポリシーは意図的に設定していない。

## Vercelの環境変数

`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` はVercel側のプロジェクト設定に手動で追加する必要がある（`.env.local`はGit管理外なのでVercelには自動で渡らない）。この2つは`NEXT_PUBLIC_`接頭辞の通りブラウザに公開される前提の値であり、Sensitive設定にする必要はない。

## コミットの進め方

- コミットメッセージは、実際の差分を確認した上でこちらから案を提示し、ユーザーの確認を得てから実行する
- 1つのコミットに複数の変更が混ざる場合は、コミットメッセージにその旨を一言添える
- `main`ブランチに直接push（PRは使っていない）
