import type { SupabaseClient } from "@supabase/supabase-js";
import {
  defaultState,
  STATE_VERSION,
  type AdminRole,
  type InmoState,
  type LeadStatus,
  type PriceCurrency,
  type PriceUnit,
  type PropertyStatus,
  type PropertyType,
} from "@/lib/inmoData";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { mergeState } from "@/lib/stateMerge";

const SETTINGS_ID = "default";

type RepositoryResult<T> = {
  data: T;
  source: "supabase" | "fallback";
};

const ensureArray = <T>(value: T[] | null) => value ?? [];

const assertSupabaseOk = (
  result: { error?: { message?: string } | null },
  action: string
) => {
  if (result.error) {
    throw new Error(`${action}: ${result.error.message ?? "Error de Supabase"}`);
  }
};

const deleteMissing = async (
  supabase: SupabaseClient,
  table: string,
  ids: string[]
) => {
  if (!ids.length) {
    const result = await supabase.from(table).delete().neq("id", "__keep_none__");
    assertSupabaseOk(result, `deleteMissing ${table}`);
    return;
  }
  const result = await supabase.from(table).delete().not("id", "in", `(${ids.join(",")})`);
  assertSupabaseOk(result, `deleteMissing ${table}`);
};

export const readInmoState = async (): Promise<RepositoryResult<InmoState>> => {
  const supabase = getSupabaseServerClient();
  if (!supabase || !isSupabaseConfigured()) {
    return { data: defaultState, source: "fallback" };
  }

  const [
    settings,
    profiles,
    agents,
    clients,
    properties,
    propertyImages,
    favorites,
    leads,
    leadEvents,
    metrics,
    toccoLogs,
  ] = await Promise.all([
    supabase.from("platform_settings").select("*").eq("id", SETTINGS_ID).maybeSingle(),
    supabase.from("profiles").select("*"),
    supabase.from("agents").select("*"),
    supabase.from("clients").select("*"),
    supabase.from("properties").select("*"),
    supabase.from("property_images").select("*").order("sort_order"),
    supabase.from("property_favorites").select("*"),
    supabase.from("leads").select("*"),
    supabase.from("lead_events").select("*"),
    supabase.from("property_metrics").select("*"),
    supabase.from("tocco_sync_logs").select("*").order("started_at", { ascending: false }),
  ]);

  const readErrors = [
    ["platform_settings", settings.error?.message],
    ["profiles", profiles.error?.message],
    ["agents", agents.error?.message],
    ["clients", clients.error?.message],
    ["properties", properties.error?.message],
    ["property_images", propertyImages.error?.message],
    ["property_favorites", favorites.error?.message],
    ["leads", leads.error?.message],
    ["lead_events", leadEvents.error?.message],
    ["property_metrics", metrics.error?.message],
    ["tocco_sync_logs", toccoLogs.error?.message],
  ].filter(([, error]) => error);

  if (readErrors.length) {
    console.warn(
      "Supabase state read failed",
      readErrors.map(([table, error]) => `${table}: ${error}`).join(" | ")
    );
    return { data: defaultState, source: "fallback" };
  }

  const imagesByProperty = new Map<string, string[]>();
  ensureArray(propertyImages.data).forEach((image) => {
    const list = imagesByProperty.get(image.property_id) ?? [];
    list.push(image.url);
    imagesByProperty.set(image.property_id, list);
  });

  const incoming: Partial<InmoState> = {
    version: STATE_VERSION,
    theme: settings.data?.theme ?? defaultState.theme,
    homeContent: settings.data?.home_content ?? defaultState.homeContent,
    adminUsers: ensureArray(profiles.data)
      .filter((profile) => profile.kind === "admin")
      .map((profile) => ({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        password: profile.password ?? "",
        role: (profile.role === "owner" ? "owner" : "colaborador") as AdminRole,
        active: Boolean(profile.active),
      })),
    agents: ensureArray(agents.data).map((agent) => ({
      id: agent.id,
      name: agent.name,
      role: agent.role,
      phone: agent.phone,
      email: agent.email,
      photo: agent.photo ?? undefined,
    })),
    clientUsers: ensureArray(clients.data).map((client) => ({
      id: client.id,
      name: client.name,
      email: client.email,
      password: client.password ?? "",
      phone: client.phone,
      idNumber: client.id_number ?? "",
      emailVerified: Boolean(client.email_verified),
      verificationToken: client.verification_token ?? undefined,
      active: Boolean(client.active),
    })),
    listings: ensureArray(properties.data).map((property) => ({
      id: property.id,
      title: property.title,
      createdByAdminId: property.created_by_admin_id ?? undefined,
      type: property.type as PropertyType,
      status: property.status as PropertyStatus,
      price: Number(property.price ?? 0),
      priceUnit: property.price_unit as PriceUnit,
      currency: (property.currency === "USD" ? "USD" : "ARS") as PriceCurrency,
      neighborhood: property.neighborhood,
      area: Number(property.area ?? 0),
      rooms: Number(property.rooms ?? 0),
      tag: property.tag ?? "",
      highlight: property.highlight ?? "",
      description: property.description ?? "",
      images: imagesByProperty.get(property.id) ?? [],
      videos: property.videos ?? [],
      coverIndex: Number(property.cover_index ?? 0),
      agentId: property.agent_id ?? undefined,
      attributes: property.attributes ?? {},
    })),
    propertyFavorites: ensureArray(favorites.data).map((favorite) => ({
      id: favorite.id,
      clientId: favorite.client_id,
      propertyId: favorite.property_id,
      createdAt: favorite.created_at,
    })),
    leads: ensureArray(leads.data).map((lead) => ({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      propertyId: lead.property_id ?? undefined,
      agentId: lead.agent_id ?? undefined,
      clientId: lead.client_id ?? undefined,
      status: lead.status as LeadStatus,
      createdAt: lead.created_at,
      updatedAt: lead.updated_at,
      notes: lead.notes ?? undefined,
    })),
    leadEvents: ensureArray(leadEvents.data).map((event) => ({
      id: event.id,
      leadId: event.lead_id,
      fromStatus: event.from_status ?? undefined,
      toStatus: event.to_status as LeadStatus,
      note: event.note ?? undefined,
      createdAt: event.created_at,
    })),
    propertyMetrics: ensureArray(metrics.data).map((metric) => ({
      id: metric.id,
      propertyId: metric.property_id,
      views: Number(metric.views ?? 0),
      leads: Number(metric.leads ?? 0),
      favorites: Number(metric.favorites ?? 0),
      lastViewedAt: metric.last_viewed_at ?? undefined,
    })),
    toccoSyncLogs: ensureArray(toccoLogs.data).map((log) => ({
      id: log.id,
      status: log.status,
      message: log.message,
      importedCount: Number(log.imported_count ?? 0),
      startedAt: log.started_at,
      finishedAt: log.finished_at,
    })),
  };

  return { data: mergeState(defaultState, incoming), source: "supabase" };
};

export const writeInmoState = async (state: InmoState) => {
  const supabase = getSupabaseServerClient();
  if (!supabase || !isSupabaseConfigured()) {
    return { source: "fallback" as const };
  }

  assertSupabaseOk(await supabase.from("platform_settings").upsert({
    id: SETTINGS_ID,
    theme: state.theme,
    home_content: state.homeContent,
    updated_at: new Date().toISOString(),
  }), "upsert platform_settings");

  const adminRows = state.adminUsers.map((admin) => ({
    id: admin.id,
    kind: "admin",
    name: admin.name,
    email: admin.email,
    password: admin.password,
    role: admin.role,
    active: admin.active,
    updated_at: new Date().toISOString(),
  }));
  if (adminRows.length) {
    assertSupabaseOk(await supabase.from("profiles").upsert(adminRows), "upsert profiles");
  }
  await deleteMissing(supabase, "profiles", state.adminUsers.map((admin) => admin.id));

  if (state.agents.length) {
    assertSupabaseOk(await supabase.from("agents").upsert(
      state.agents.map((agent) => ({
        id: agent.id,
        name: agent.name,
        role: agent.role,
        phone: agent.phone,
        email: agent.email,
        photo: agent.photo ?? null,
        updated_at: new Date().toISOString(),
      }))
    ), "upsert agents");
  }
  await deleteMissing(supabase, "agents", state.agents.map((agent) => agent.id));

  if (state.clientUsers.length) {
    assertSupabaseOk(await supabase.from("clients").upsert(
      state.clientUsers.map((client) => ({
        id: client.id,
        name: client.name,
        email: client.email,
        password: client.password,
        phone: client.phone,
        id_number: client.idNumber,
        email_verified: client.emailVerified,
        verification_token: client.verificationToken ?? null,
        active: client.active,
        updated_at: new Date().toISOString(),
      }))
    ), "upsert clients");
  }
  await deleteMissing(supabase, "clients", state.clientUsers.map((client) => client.id));

  if (state.listings.length) {
    assertSupabaseOk(await supabase.from("properties").upsert(
      state.listings.map((property) => ({
        id: property.id,
        title: property.title,
        type: property.type,
        status: property.status,
        price: property.price,
        price_unit: property.priceUnit,
        currency: property.currency ?? "ARS",
        neighborhood: property.neighborhood,
        area: property.area,
        rooms: property.rooms,
        tag: property.tag,
        highlight: property.highlight,
        description: property.description,
        videos: property.videos ?? [],
        cover_index: property.coverIndex,
        agent_id: property.agentId ?? null,
        created_by_admin_id: property.createdByAdminId ?? null,
        attributes: property.attributes,
        updated_at: new Date().toISOString(),
      }))
    ), "upsert properties");
  }
  await deleteMissing(supabase, "properties", state.listings.map((property) => property.id));

  const imageRows = state.listings.flatMap((property) =>
    property.images.map((url, index) => ({
      id: `${property.id}-${index}`,
      property_id: property.id,
      url,
      sort_order: index,
    }))
  );
  if (imageRows.length) {
    assertSupabaseOk(await supabase.from("property_images").upsert(imageRows), "upsert property_images");
  }
  await deleteMissing(supabase, "property_images", imageRows.map((image) => image.id));

  if (state.propertyFavorites.length) {
    assertSupabaseOk(await supabase.from("property_favorites").upsert(
      state.propertyFavorites.map((favorite) => ({
        id: favorite.id,
        client_id: favorite.clientId,
        property_id: favorite.propertyId,
        created_at: favorite.createdAt,
      }))
    ), "upsert property_favorites");
  }
  await deleteMissing(
    supabase,
    "property_favorites",
    state.propertyFavorites.map((favorite) => favorite.id)
  );

  if (state.leads.length) {
    assertSupabaseOk(await supabase.from("leads").upsert(
      state.leads.map((lead) => ({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        property_id: lead.propertyId ?? null,
        agent_id: lead.agentId ?? null,
        client_id: lead.clientId ?? null,
        status: lead.status,
        notes: lead.notes ?? null,
        created_at: lead.createdAt,
        updated_at: lead.updatedAt,
      }))
    ), "upsert leads");
  }
  await deleteMissing(supabase, "leads", state.leads.map((lead) => lead.id));

  if (state.leadEvents.length) {
    assertSupabaseOk(await supabase.from("lead_events").upsert(
      state.leadEvents.map((event) => ({
        id: event.id,
        lead_id: event.leadId,
        from_status: event.fromStatus ?? null,
        to_status: event.toStatus,
        note: event.note ?? null,
        created_at: event.createdAt,
      }))
    ), "upsert lead_events");
  }
  await deleteMissing(supabase, "lead_events", state.leadEvents.map((event) => event.id));

  if (state.propertyMetrics.length) {
    assertSupabaseOk(await supabase.from("property_metrics").upsert(
      state.propertyMetrics.map((metric) => ({
        id: metric.id,
        property_id: metric.propertyId,
        views: metric.views,
        leads: metric.leads,
        favorites: metric.favorites,
        last_viewed_at: metric.lastViewedAt ?? null,
      }))
    ), "upsert property_metrics");
  }
  await deleteMissing(
    supabase,
    "property_metrics",
    state.propertyMetrics.map((metric) => metric.id)
  );

  if (state.toccoSyncLogs.length) {
    assertSupabaseOk(await supabase.from("tocco_sync_logs").upsert(
      state.toccoSyncLogs.map((log) => ({
        id: log.id,
        status: log.status,
        message: log.message,
        imported_count: log.importedCount,
        started_at: log.startedAt,
        finished_at: log.finishedAt,
      }))
    ), "upsert tocco_sync_logs");
  }

  return { source: "supabase" as const };
};
