import type { Metadata } from "next";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import FilterForm, { type AreaHierarchyEntry } from "./FilterForm";

export const metadata: Metadata = {
  title: "魚一覧｜ヌシ釣りツール（仮）",
};

// ページネーションの1ページあたりの件数
const PAGE_SIZE = 100;

// 時間の表示形式を整形する
function formatTime(time: string | null) {
  return time ? time.slice(0, 5) : null;
}

// 釣れる時間帯の表示形式を整形する
function formatTimeRange(from: string | null, to: string | null) {
  const start = formatTime(from);
  const end = formatTime(to);
  if (start && end) return `${start}〜${end}`;
  return start ?? end ?? "未設定";
}

// fish.areasは多対一のJOIN結果（実際は単一オブジェクト）だが、
// Database型を渡していないSupabaseクライアントでは配列と推論されてしまうため、明示的に型定義する
type FishRow = {
  id: string;
  name: string;
  is_nushi: boolean;
  time_from: string | null;
  time_to: string | null;
  weather: string | null;
  bait: string | null;
  remarks: string | null;
  areas: { area: string; fishing_spot: string | null } | null;
};

type AreaOption = {
  region: string | null;
  region_id: number | null;
  greater_region: string | null;
  greater_region_id: number | null;
  expansion: string | null;
  expansion_id: number | null;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

// ページネーション・絞り込みのリンクURLを組み立てる（現在の絞り込み条件を維持したまま）
function buildHref(
  filters: Record<string, string | undefined>,
  page: number,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/fish?${query}` : "/fish";
}

// 魚一覧表示のページコンポーネント
export default async function FishListPage(props: PageProps<"/fish">) {
  const searchParams = await props.searchParams;

  const filters = {
    region: firstParam(searchParams.region),
    greater_region: firstParam(searchParams.greater_region),
    expansion: firstParam(searchParams.expansion),
  };

  // 絞り込みプルダウンの選択肢をareasテーブルから取得
  const { data: areaOptions, error: areaOptionsError } = await supabase
    .from("areas")
    .select(
      "region, region_id, greater_region, greater_region_id, expansion, expansion_id",
    );

  if (areaOptionsError) {
    throw new Error(`絞り込み候補の取得に失敗しました: ${areaOptionsError.message}`);
  }

  const options = (areaOptions ?? []) as AreaOption[];
  const hierarchy: AreaHierarchyEntry[] = options.map((o) => ({
    expansion: o.expansion,
    expansionId: o.expansion_id,
    greaterRegion: o.greater_region,
    greaterRegionId: o.greater_region_id,
    region: o.region,
    regionId: o.region_id,
  }));

  // 絞り込み条件をfish/areasの両方のクエリに適用するヘルパー
  const applyFilters = <T,>(query: T): T => {
    let q = query as unknown as {
      eq: (column: string, value: string) => typeof q;
    };
    if (filters.region) q = q.eq("areas.region", filters.region);
    if (filters.greater_region)
      q = q.eq("areas.greater_region", filters.greater_region);
    if (filters.expansion) q = q.eq("areas.expansion", filters.expansion);
    return q as unknown as T;
  };

  const { count, error: countError } = await applyFilters(
    supabase
      .from("fish")
      .select("*, areas!inner(region, greater_region, expansion)", {
        count: "exact",
        head: true,
      }),
  );

  if (countError) {
    throw new Error(`魚一覧の件数取得に失敗しました: ${countError.message}`);
  }

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const requestedPage = Math.max(1, Number(searchParams.page ?? "1") || 1);
  const page = Math.min(requestedPage, totalPages);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // DBから魚一覧を取得（areasテーブルをinner joinして絞り込み・エリア情報を取得）
  const { data, error } = await applyFilters(
    supabase
      .from("fish")
      .select(
        "id, name, is_nushi, time_from, time_to, weather, bait, remarks, areas!inner(area, fishing_spot, region, greater_region, expansion)",
      )
      .order("name"),
  ).range(from, to);

  if (error) {
    throw new Error(`魚一覧の取得に失敗しました: ${error.message}`);
  }

  const fishList = data as unknown as FishRow[];

  return (
    <div className="flex flex-1 flex-col px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <h2 className="mb-2 text-lg font-bold text-sky-900 sm:text-xl">
          魚一覧
        </h2>
        <p className="mb-6 text-sm text-sky-800">
          データベースに登録された魚を表示しています。
        </p>

        <FilterForm hierarchy={hierarchy} />

        <div className="overflow-x-auto rounded-lg border border-sky-200 bg-white/60">
          <table className="w-full min-w-[1120px] text-left text-sm">
            <thead className="bg-sky-100 text-sky-900">
              <tr>
                <th className="px-4 py-3 font-semibold">魚名</th>
                <th className="px-4 py-3 font-semibold">ヌシ</th>
                <th className="px-4 py-3 font-semibold">釣れるエリア</th>
                <th className="px-4 py-3 font-semibold">釣り場</th>
                <th className="px-4 py-3 font-semibold">釣れる時間帯（エオルゼア時間）</th>
                <th className="px-4 py-3 font-semibold">必要な天候</th>
                <th className="px-4 py-3 font-semibold">餌</th>
                <th className="px-4 py-3 font-semibold">備考</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100">
              {fishList.length === 0 && (
                <tr>
                  <td className="px-4 py-3 text-sky-700" colSpan={8}>
                    該当する魚が見つかりませんでした。
                  </td>
                </tr>
              )}
              {fishList.map((fish) => (
                <tr key={fish.id}>
                  <td className="px-4 py-3">{fish.name}</td>
                  <td className="px-4 py-3">{fish.is_nushi ? "○" : ""}</td>
                  <td className="px-4 py-3">{fish.areas?.area ?? "不明"}</td>
                  <td className="px-4 py-3">{fish.areas?.fishing_spot ?? "未設定"}</td>
                  <td className="px-4 py-3">
                    {formatTimeRange(fish.time_from, fish.time_to)}
                  </td>
                  <td className="px-4 py-3">{fish.weather ?? "未設定"}</td>
                  <td className="px-4 py-3">{fish.bait ?? "未設定"}</td>
                  <td className="px-4 py-3">{fish.remarks ?? "特になし"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* ページネーション */}
        <div className="mt-6 flex flex-col gap-3">
          {/* ページ情報の表示 */}
          <p className="text-sm text-sky-800">
            {fishList.length > 0
              ? `${from + 1}〜${from + fishList.length}件目（全${count ?? 0}件）`
              : ""}
          </p>
          {/* ページネーションのリンク */}
          <nav className="flex flex-wrap items-center gap-2">
            <Link
              href={buildHref(filters, Math.max(1, page - 1))}
              aria-disabled={page === 1}
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                page === 1
                  ? "pointer-events-none bg-sky-100 text-sky-300"
                  : "bg-sky-500 text-white hover:bg-sky-600"
              }`}
            >
              前へ
            </Link>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (pageNumber) => (
                <Link
                  key={pageNumber}
                  href={buildHref(filters, pageNumber)}
                  aria-current={pageNumber === page ? "page" : undefined}
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    pageNumber === page
                      ? "bg-sky-700 text-white"
                      : "bg-sky-100 text-sky-900 hover:bg-sky-200"
                  }`}
                >
                  {pageNumber}
                </Link>
              ),
            )}
            <Link
              href={buildHref(filters, Math.min(totalPages, page + 1))}
              aria-disabled={page === totalPages}
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                page === totalPages
                  ? "pointer-events-none bg-sky-100 text-sky-300"
                  : "bg-sky-500 text-white hover:bg-sky-600"
              }`}
            >
              次へ
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}
