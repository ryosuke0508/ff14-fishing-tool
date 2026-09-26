// 釣れるエリアの絞り込みフォーム
// 絞り込みのプルダウンを階層構造に従って連動させる
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

// 釣れるエリアの階層構造を表す型
export type AreaHierarchyEntry = {
  expansion: string | null;       // 拡張パッケージ名
  expansionId: number | null;     // 拡張パッケージID
  greaterRegion: string | null;   // 地方名
  greaterRegionId: number | null; // 地方ID
  area: string | null;            // 釣れるエリア名
};

// 名前でユニーク化し、idがあればid順、なければ50音順に並べる
function uniqueSorted(entries: { name: string; id: number | null }[]) {
  const map = new Map<string, number | null>();
  for (const { name, id } of entries) {
    if (!map.has(name)) map.set(name, id);
  }
  return [...map.entries()]
    .sort((a, b) => {
      if (a[1] !== null && b[1] !== null) return a[1] - b[1];
      return a[0].localeCompare(b[0], "ja");
    })
    .map(([name]) => name);
}

// 絞り込みフォーム
export default function FilterForm({
  hierarchy,
}: {
  hierarchy: AreaHierarchyEntry[];
}) {
  const searchParams = useSearchParams();

  const [expansion, setExpansion] = useState(
    searchParams.get("expansion") ?? "",
  );
  const [greaterRegion, setGreaterRegion] = useState(
    searchParams.get("greater_region") ?? "",
  );
  const [area, setArea] = useState(searchParams.get("area") ?? "");

  // 拡張パッケージの選択肢は常に全件
  const expansionOptions = useMemo(
    () =>
      uniqueSorted(
        hierarchy
          .filter((h) => h.expansion)
          .map((h) => ({ name: h.expansion as string, id: h.expansionId })),
      ),
    [hierarchy],
  );

  // 地方の選択肢は、選択中の拡張パッケージに属するものだけ
  const greaterRegionOptions = useMemo(
    () =>
      uniqueSorted(
        hierarchy
          .filter(
            (h) => h.greaterRegion && (!expansion || h.expansion === expansion),
          )
          .map((h) => ({
            name: h.greaterRegion as string,
            id: h.greaterRegionId,
          })),
      ),
    [hierarchy, expansion],
  );

  // エリアの選択肢は、選択中の拡張パッケージ・地方に属するものだけ
  const areaOptions = useMemo(
    () =>
      uniqueSorted(
        hierarchy
          .filter(
            (h) =>
              h.area &&
              (!expansion || h.expansion === expansion) &&
              (!greaterRegion || h.greaterRegion === greaterRegion),
          )
          .map((h) => ({ name: h.area as string, id: null })),
      ),
    [hierarchy, expansion, greaterRegion],
  );

  // 拡張パッケージを変更したとき、選択中の地方・エリアが属さない場合はクリアする
  const handleExpansionChange = (value: string) => {
    setExpansion(value);
    if (
      greaterRegion &&
      !hierarchy.some(
        (h) => h.expansion === value && h.greaterRegion === greaterRegion,
      )
    ) {
      setGreaterRegion("");
      setArea("");
      return;
    }
    if (area && !hierarchy.some((h) => h.expansion === value && h.area === area)) {
      setArea("");
    }
  };

  // 地方を変更したとき、選択中のエリアが属さない場合はクリアする
  const handleGreaterRegionChange = (value: string) => {
    setGreaterRegion(value);
    if (
      area &&
      !hierarchy.some((h) => h.greaterRegion === value && h.area === area)
    ) {
      setArea("");
    }
  };

  // 絞り込み条件が1つでもあれば解除ボタンを表示する
  const hasFilter = Boolean(expansion || greaterRegion || area);

  return (
    <form className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-sky-200 bg-white/60 p-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="expansion" className="text-xs text-sky-800">
          拡張パッケージ
        </label>
        <select
          id="expansion"
          name="expansion"
          value={expansion}
          onChange={(e) => handleExpansionChange(e.target.value)}
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
          value={greaterRegion}
          onChange={(e) => handleGreaterRegionChange(e.target.value)}
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
        <label htmlFor="area" className="text-xs text-sky-800">
          釣れるエリア
        </label>
        <select
          id="area"
          name="area"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="rounded border border-sky-300 bg-white px-2 py-1 text-sm"
        >
          <option value="">すべて</option>
          {areaOptions.map((v) => (
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
  );
}
