import type { InmoState, Listing, ToccoSyncLog } from "@/lib/inmoData";

type ToccoProperty = Partial<{
  id: string;
  title: string;
  operation: string;
  status: string;
  price: number;
  priceUnit: string;
  neighborhood: string;
  area: number;
  rooms: number;
  description: string;
  images: string[];
}>;

const normalizeToccoProperty = (item: ToccoProperty): Listing => ({
  id: item.id ? `tocco-${item.id}` : `tocco-${Date.now()}`,
  title: item.title ?? "Propiedad importada desde Tocco",
  type: item.operation === "temporary" ? "temporario" : "tradicional",
  status: item.status === "paused" ? "pausado" : "disponible",
  price: Number(item.price ?? 0),
  priceUnit: item.priceUnit === "night" ? "noche" : item.priceUnit === "rent" ? "mensual" : "venta",
  neighborhood: item.neighborhood ?? "Sin barrio",
  area: Number(item.area ?? 0),
  rooms: Number(item.rooms ?? 1),
  tag: "Tocco",
  highlight: "Sincronizada desde Tocco",
  description: item.description ?? "",
  images: item.images ?? [],
  videos: [],
  coverIndex: 0,
  attributes: {},
});

const createLog = ({
  status,
  message,
  importedCount,
  startedAt,
}: {
  status: ToccoSyncLog["status"];
  message: string;
  importedCount: number;
  startedAt: string;
}): ToccoSyncLog => ({
  id: `tocco-log-${Date.now()}`,
  status,
  message,
  importedCount,
  startedAt,
  finishedAt: new Date().toISOString(),
});

export const syncToccoProperties = async (state: InmoState): Promise<InmoState> => {
  const startedAt = new Date().toISOString();
  const baseUrl = process.env.TOCCO_API_BASE_URL;
  const apiKey = process.env.TOCCO_API_KEY;

  if (!baseUrl || !apiKey) {
    return {
      ...state,
      toccoSyncLogs: [
        createLog({
          status: "mocked",
          message:
            "Sin credenciales Tocco. Se ejecuto mock de sincronizacion sin modificar propiedades.",
          importedCount: 0,
          startedAt,
        }),
        ...state.toccoSyncLogs,
      ],
    };
  }

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/properties`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Tocco respondio ${response.status}`);
    }

    const payload = (await response.json()) as { properties?: ToccoProperty[] };
    const imported = (payload.properties ?? []).map(normalizeToccoProperty);
    const importedIds = new Set(imported.map((property) => property.id));
    const localWithoutImported = state.listings.filter(
      (property) => !importedIds.has(property.id)
    );

    return {
      ...state,
      listings: [...localWithoutImported, ...imported],
      toccoSyncLogs: [
        createLog({
          status: "success",
          message: "Sincronizacion Tocco completada.",
          importedCount: imported.length,
          startedAt,
        }),
        ...state.toccoSyncLogs,
      ],
    };
  } catch (error) {
    return {
      ...state,
      toccoSyncLogs: [
        createLog({
          status: "failed",
          message: error instanceof Error ? error.message : "Error desconocido en Tocco.",
          importedCount: 0,
          startedAt,
        }),
        ...state.toccoSyncLogs,
      ],
    };
  }
};
