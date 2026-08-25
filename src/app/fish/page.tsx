import type { Metadata } from "next";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

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
  fishing_spot: string | null;
  region: string | null;
  region_id: number | null;
  greater_region: string | null;
  greater_region_id: number | null;
  expansion: string | null;
  expansion_id: number | null;
};

// {name, id}のペアを重複排除し、id順に並べる（idがない場合は名前順）
function uniqueOptions(
  entries: { name: string | null; id: number | null }[],
): string[] {
  const map = new Map<string, number | null>();
  for (const { name, id } of entries) {
    if (name && !map.has(name)) map.set(name, id);
  }
  return [...map.entries()]
    .sort((a, b) => {
      if (a[1] !== null && b[1] !== null) return a[1] - b[1];
      return a[0].localeCompare(b[0], "ja");
    })
    .map(([name]) => name);
}

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
    fishing_spot: firstParam(searchParams.fishing_spot),
    region: firstParam(searchParams.region),
    greater_region: firstParam(searchParams.greater_region),
    expansion: firstParam(searchParams.expansion),
  };

  // 絞り込みプルダウンの選択肢をareasテーブルから取得
  const { data: areaOptions, error: areaOptionsError } = await supabase
    .from("areas")
    .select(
      "fishing_spot, region, region_id, greater_region, greater_region_id, expansion, expansion_id",
    );

  if (areaOptionsError) {
    throw new Error(`絞り込み候補の取得に失敗しました: ${areaOptionsError.message}`);
  }

  const options = (areaOptions ?? []) as AreaOption[];
  const fishingSpotOptions = uniqueOptions(
    options.map((o) => ({ name: o.fishing_spot, id: null })),
  );
  const regionOptions = uniqueOptions(
    options.map((o) => ({ name: o.region, id: o.region_id })),
  );
  const greaterRegionOptions = uniqueOptions(
    options.map((o) => ({ name: o.greater_region, id: o.greater_region_id })),
  );
  const expansionOptions = uniqueOptions(
    options.map((o) => ({ name: o.expansion, id: o.expansion_id })),
  );

  // 絞り込み条件をfish/areasの両方のクエリに適用するヘルパー
  const applyFilters = <T,>(query: T): T => {
    let q = query as unknown as {
      eq: (column: string, value: string) => typeof q;
    };
    if (filters.fishing_spot) q = q.eq("areas.fishing_spot", filters.fishing_spot);
    if (filters.region) q = q.eq("areas.region", filters.region);
    if (filters.greater_region)
      q = q.eq("areas.greater_region", filters.greater_region);
    if (filters.expansion) q = q.eq("areas.expansion", filters.expansion);
    return q as unknown as T;
  };

  const { count, error: countError } = await applyFilters(
    supabase
      .from("fish")
      .select("*, areas!inner(fishing_spot, region, greater_region, expansion)", {
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
  const hasFilter = Object.values(filters).some(Boolean);

  return (
    <div className="flex flex-1 flex-col px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <h2 className="mb-2 text-lg font-bold text-sky-900 sm:text-xl">
          魚一覧
        </h2>
        <p className="mb-6 text-sm text-sky-800">
          データベースに登録された魚を表示しています。
        </p>

        {/* 絞り込みフォーム */}
        <form className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-sky-200 bg-white/60 p-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="expansion" className="text-xs text-sky-800">
              拡張パッケージ
            </label>
            <select
              id="expansion"
              name="expansion"
              defaultValue={filters.expansion ?? ""}
              className="rounded border border-sky-300 bg-white px-2 py-1 text-sm"
            >
              <option value="">すべて</option>
              {expansionOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="greater_region" className="text-xs text-sky-800">
              地方
            </label>
            <select
              id="greater_region"
              name="greater_region"
              defaultValue={filters.greater_region ?? ""}
              className="rounded border border-sky-300 bg-white px-2 py-1 text-sm"
            >
              <option value="">すべて</option>
              {greaterRegionOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="region" className="text-xs text-sky-800">
              地域
            </label>
            <select
              id="region"
              name="region"
              defaultValue={filters.region ?? ""}
              className="rounded border border-sky-300 bg-white px-2 py-1 text-sm"
            >
              <option value="">すべて</option>
              {regionOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="fishing_spot" className="text-xs text-sky-800">
              釣り場
            </label>
            <select
              id="fishing_spot"
              name="fishing_spot"
              defaultValue={filters.fishing_spot ?? ""}
              className="rounded border border-sky-300 bg-white px-2 py-1 text-sm"
            >
              <option value="">すべて</option>
              {fishingSpotOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded-full bg-sky-500 px-5 py-1.5 text-sm font-medium text-white hover:bg-sky-600"
          >
            絞り込む
          </button>
          {hasFilter && (
            <Link
              href="/fish"
              className="rounded-full bg-sky-100 px-5 py-1.5 text-sm font-medium text-sky-900 hover:bg-sky-200"
            >
              解除
            </Link>
          )}
        </form>

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
