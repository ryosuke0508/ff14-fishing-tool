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
      page.tsx       魚一覧ページ（/fish）。Supabaseのfishテーブル（areasテーブルをJOIN）を全件、100件ずつページネーションして表示
  lib/
    supabase.ts      Supabaseクライアントの初期化（.env.localの接続情報を使用）
    xivapi.ts        XIVAPIから魚名・釣れるエリアを取得する関数（現在は未使用。データ投入は scripts/ 配下のスクリプトで実施）
supabase/
  migrations/
    0001_create_fish_table.sql              fishテーブルの作成、RLS（Row Level Security）の有効化と読み取り公開ポリシー
    0002_grant_fish_select.sql              anon/authenticatedロールへのSELECT権限付与
    0003_split_time_range_add_bait.sql      time_rangeをtime_from/time_toに分割し、baitカラムを追加
    0004_recreate_fish_table_column_order.sql   釣りの技術系カラムを追加しつつ、カラムの並び順を整理するためテーブルを再作成
    0006_add_area_id.sql                    area_idカラムを追加
    0007_create_areas_table.sql             areasテーブルを新規作成（area/fishing_spot/region/greater_region/expansion）
    0008_fish_area_id_fk_and_cleanup.sql    fishからarea/fishing_spotを削除し、area_idをareasへの外部キーに変更
  seed.sql                     XIVAPIから取得した全魚（name/area/fishing_spot/xivapi_item_id）を一括投入するSQL。is_nushiはデフォルトfalseで入るので、実際のヌシはSupabaseのTable Editorから手動でtrueに変更する
  update_nushi_conditions.sql  ff14-fish-tracker-appのデータ（scripts/nushi-import参照）を元に、ヌシの釣れる条件をupdateするSQL
  update_area_id.sql           XIVAPIのPlaceName IDをarea_idにupdateするSQL（scripts/area-id-import参照）
  areas_seed.sql                areasテーブルへ、XIVAPIから取得した328件のエリア情報を投入するSQL（scripts/area-id-import参照）
scripts/
  nushi-import/      fishData.yaml(ff14-fish-tracker-app)とXIVAPIを突き合わせ、ヌシの釣れる条件のupdate文を生成するスクリプト（未コミット、作業記録用）
  area-id-import/    XIVAPIからarea_id・areasテーブルのデータを取得し、SQLを生成するスクリプト（未コミット、作業記録用）
```

## fishテーブルの主なカラム

| カラム名 | 内容 |
|---|---|
| `name` | 魚名 |
| `is_nushi` | ヌシかどうか |
| `area_id` | エリアのID（`areas`テーブルへの外部キー） |
| `time_from` | 釣れる時間帯の開始（エオルゼア時間、`time`型） |
| `time_to` | 釣れる時間帯の終了（エオルゼア時間、`time`型） |
| `weather` | 必要な天候 |
| `previous_weather` | 天候が変わる直前に必要な天候 |
| `bait` | 餌 |
| `predators` | 事前に釣っておく必要がある魚（備考的な情報） |
| `tug` | アタリの強さ（英語表記） |
| `hookset` | 必要なフッキング技術（英語表記） |
| `gig` | スピアフィッシング時のヤスのサイズ（英語表記） |
| `folklore` | フォークロアの習得が必要か |
| `fish_eyes` | フィッシュアイズの使用が必要か |
| `lure` | 指定の疑似餌（英語表記） |
| `moochable` | 他プレイヤーがモーチングに使えるか |
| `mooching` | モーチングで釣れるか |
| `remarks` | 備考（自由記述） |
| `xivapi_item_id` | XIVAPIのFishParameter行ID（名寄せ用） |

## areasテーブルの主なカラム

`fish.area_id`から参照される、エリア・地域の階層情報。

| カラム名 | 内容 |
|---|---|
| `id` | エリアのXIVAPI PlaceName ID（`fish.area_id`と対応、主キー） |
| `area` | 釣れるエリア（例: リムサ・ロミンサ） |
| `fishing_spot` | 釣り場（エリアより詳細な地点、例: 上甲板層） |
| `region` | 地域（TerritoryType.PlaceNameZone、例: リムサ・ロミンサ市街） |
| `region_id` | 地域のXIVAPI PlaceName ID |
| `greater_region` | より広い地方区分（TerritoryType.PlaceNameRegion、例: ラノシア） |
| `greater_region_id` | より広い地方区分のXIVAPI PlaceName ID |
| `expansion` | 拡張パッケージ（TerritoryType.ExVersion、例: 新生エオルゼア、蒼天のイシュガルド） |
| `expansion_id` | 拡張パッケージのXIVAPI ExVersion ID |

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
