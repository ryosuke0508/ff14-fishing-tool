import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "ヌシ一覧｜ヌシ釣りツール（仮）",
};

export default async function FishListPage() {
  const { data: fishList, error } = await supabase
    .from("fish")
    .select("name, area, fishing_spot, time_range, weather, remarks")
    .eq("is_nushi", true)
    .order("name");

  if (error) {
    throw new Error(`ヌシ一覧の取得に失敗しました: ${error.message}`);
  }

  return (
    <div className="flex flex-1 flex-col px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <h2 className="mb-2 text-lg font-bold text-sky-900 sm:text-xl">
          ヌシ一覧
        </h2>
        <p className="mb-6 text-sm text-sky-800">
          データベースに登録されたヌシを表示しています。
        </p>
        <div className="overflow-x-auto rounded-lg border border-sky-200 bg-white/60">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-sky-100 text-sky-900">
              <tr>
                <th className="px-4 py-3 font-semibold">魚名</th>
                <th className="px-4 py-3 font-semibold">釣れるエリア</th>
                <th className="px-4 py-3 font-semibold">釣り場</th>
                <th className="px-4 py-3 font-semibold">
                  釣れる時間帯（エオルゼア時間）
                </th>
                <th className="px-4 py-3 font-semibold">必要な天候</th>
                <th className="px-4 py-3 font-semibold">備考</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100">
              {fishList.length === 0 && (
                <tr>
                  <td className="px-4 py-3 text-sky-700" colSpan={6}>
                    まだヌシが登録されていません。
                  </td>
                </tr>
              )}
              {fishList.map((fish) => (
                <tr key={fish.name}>
                  <td className="px-4 py-3">{fish.name}</td>
                  <td className="px-4 py-3">{fish.area}</td>
                  <td className="px-4 py-3">{fish.fishing_spot ?? "未設定"}</td>
                  <td className="px-4 py-3">{fish.time_range ?? "未設定"}</td>
                  <td className="px-4 py-3">{fish.weather ?? "未設定"}</td>
                  <td className="px-4 py-3">{fish.remarks ?? "特になし"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
