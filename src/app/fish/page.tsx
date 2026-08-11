import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ヌシ一覧｜ヌシ釣りツール（仮）",
};

type Fish = {
  name: string;
  area: string;
  timeRange: string;
  weather: string;
  remarks?: string;
};

const fishList: Fish[] = [
  {
    name: "サンプルヌシA（仮データ）",
    area: "ラノシア／○○湖",
    timeRange: "18:00〜22:00",
    weather: "曇り",
  },
  {
    name: "サンプルヌシB（仮データ）",
    area: "黒衣森／△△川",
    timeRange: "6:00〜10:00",
    weather: "快晴",
  },
  {
    name: "サンプルヌシC（仮データ）",
    area: "東ザナラーン／□□海岸",
    timeRange: "終日",
    weather: "指定なし",
    remarks: "事前にサンプルヌシAを3匹釣る必要がある",
  },
];

export default function FishListPage() {
  return (
    <div className="flex flex-1 flex-col px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <h2 className="mb-2 text-lg font-bold text-sky-900 sm:text-xl">
          ヌシ一覧
        </h2>
        <p className="mb-6 text-sm text-sky-800">
          現在は仮のデータです。今後、外部APIから実際の情報を取得する予定です。
        </p>
        <div className="overflow-x-auto rounded-lg border border-sky-200 bg-white/60">
          <table className="w-full min-w-[840px] text-left text-sm">
            <thead className="bg-sky-100 text-sky-900">
              <tr>
                <th className="px-4 py-3 font-semibold">魚名</th>
                <th className="px-4 py-3 font-semibold">釣れるエリア</th>
                <th className="px-4 py-3 font-semibold">
                  釣れる時間帯（エオルゼア時間）
                </th>
                <th className="px-4 py-3 font-semibold">必要な天候</th>
                <th className="px-4 py-3 font-semibold">備考</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100">
              {fishList.map((fish) => (
                <tr key={fish.name}>
                  <td className="px-4 py-3">{fish.name}</td>
                  <td className="px-4 py-3">{fish.area}</td>
                  <td className="px-4 py-3">{fish.timeRange}</td>
                  <td className="px-4 py-3">{fish.weather}</td>
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
