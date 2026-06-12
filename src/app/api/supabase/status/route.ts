import { NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

const tables = [
  "platform_settings",
  "roles",
  "profiles",
  "agents",
  "clients",
  "properties",
  "property_images",
  "property_favorites",
  "leads",
  "lead_events",
  "property_metrics",
  "tocco_sync_logs",
];

export async function GET() {
  const configured = isSupabaseConfigured();
  const supabase = getSupabaseServerClient();

  if (!configured || !supabase) {
    return NextResponse.json({
      ok: false,
      configured: false,
      usingServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      error: "Faltan variables NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en .env.local.",
    });
  }

  const checks = await Promise.all(
    tables.map(async (table) => {
      const result = await supabase.from(table).select("id").limit(1);
      return {
        table,
        ok: !result.error,
        error: result.error?.message,
      };
    })
  );

  return NextResponse.json({
    ok: checks.every((check) => check.ok),
    configured: true,
    usingServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    tables: checks,
  });
}
