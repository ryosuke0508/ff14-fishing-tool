# ヌシ釣りツール（仮）

FF14（ファイナルファンタジー14）の「ヌシ釣り」に関する情報をまとめるWebツールです。

**現在作成中です。** 今後、ヌシの一覧や釣れる時間帯などの機能を追加していく予定です。

## 技術構成

- **フレームワーク**: Next.js（App Router）+ TypeScript
- **スタイリング**: Tailwind CSS
- **データベース**: [Supabase](https://supabase.com)（Postgres）
- **外部API**: [XIVAPI v2](https://v2.xivapi.com/)（ゲーム内の魚データ参照用）
- **デプロイ**: Vercel

## ディレクトリ構成

```
src/
  app/
    layout.tsx      共通レイアウト。ヘッダー（サイトタイトル・ナビゲーション）を全ページ共通で表示
    page.tsx         トップページ（/）
    globals.css      全体のテーマ（背景色など）とTailwindの読み込み設定
    fish/
      page.tsx       ヌシ一覧ページ（/fish）。Supabaseのfishテーブルから is_nushi = true の行を取得して表示
  lib/
    supabase.ts      Supabaseクライアントの初期化（.env.localの接続情報を使用）
    xivapi.ts        XIVAPIから魚名・釣れるエリアを取得する関数（現在は未使用。今後、fishテーブルへのデータ一括投入処理で使う予定）
supabase/
  migrations/
    0001_create_fish_table.sql              fishテーブルの作成、RLS（Row Level Security）の有効化と読み取り公開ポリシー
    0002_grant_fish_select.sql              anon/authenticatedロールへのSELECT権限付与
    0003_split_time_range_add_bait.sql      time_rangeをtime_from/time_toに分割し、baitカラムを追加
    0004_recreate_fish_table_column_order.sql   カラムの並び順を整理するためテーブルを再作成
  seed.sql   XIVAPIから取得した全魚（name/area/fishing_spot/xivapi_item_id）を一括投入するSQL。is_nushiはデフォルトfalseで入るので、実際のヌシはSupabaseのTable Editorから手動でtrueに変更する
```

## fishテーブルの主なカラム

| カラム名 | 内容 |
|---|---|
| `name` | 魚名 |
| `is_nushi` | ヌシかどうか（`true`のものだけ一覧ページに表示） |
| `area` | 釣れるエリア |
| `fishing_spot` | 釣り場（エリアより詳細な地点） |
| `time_from` | 釣れる時間帯の開始（エオルゼア時間、`time`型） |
| `time_to` | 釣れる時間帯の終了（エオルゼア時間、`time`型） |
| `weather` | 必要な天候 |
| `bait` | 餌 |
| `remarks` | 備考（特殊な釣り条件など） |
| `xivapi_item_id` | XIVAPIのItem行ID（将来の名寄せ用、null可） |

## 環境変数

`.env.local`（Gitには含まれません）に以下を設定しています。

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Getting Started

開発サーバーを起動:

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) をブラウザで開いて確認できます。
