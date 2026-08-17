const XIVAPI_BASE = "https://v2.xivapi.com/api";

export type ApiFish = {
  name: string;
  area: string;
};

type FishParameterRow = {
  row_id: number;
  fields: {
    Item?: {
      fields?: {
        Name?: string;
      };
    };
    FishingSpot?: {
      fields?: {
        PlaceName?: {
          fields?: {
            Name?: string;
          };
        };
      };
    };
  };
};

type FishParameterResponse = {
  rows: FishParameterRow[];
};

export async function fetchFishList(limit = 30): Promise<ApiFish[]> {
  const params = new URLSearchParams({
    language: "ja",
    fields: "Item.Name,FishingSpot.PlaceName.Name",
    limit: String(limit),
  });

  const res = await fetch(
    `${XIVAPI_BASE}/sheet/FishParameter?${params.toString()}`,
    { next: { revalidate: 60 * 60 * 24 } },
  );

  if (!res.ok) {
    throw new Error(`XIVAPIからの魚データ取得に失敗しました (status: ${res.status})`);
  }

  const json: FishParameterResponse = await res.json();

  return json.rows
    .map((row) => ({
      name: row.fields.Item?.fields?.Name ?? "",
      area: row.fields.FishingSpot?.fields?.PlaceName?.fields?.Name ?? "",
    }))
    .filter((fish) => fish.name !== "");
}
