import { NextResponse } from "next/server";
import type { Listing } from "@/lib/inmoData";
import { deleteListing, readInmoState, upsertListing } from "@/lib/server/inmoRepository";

const getAdmin = async (request: Request) => {
  const adminId = request.headers.get("x-admin-id");
  if (!adminId) return null;
  const result = await readInmoState();
  const admin = result.data.adminUsers.find((item) => item.id === adminId && item.active);
  return admin ? { admin, state: result.data } : null;
};

export async function POST(request: Request) {
  try {
    const context = await getAdmin(request);
    if (!context) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const incoming = (await request.json()) as Listing;
    const previous = context.state.listings.find((item) => item.id === incoming.id);
    const isOwner = context.admin.role === "owner";
    const canEdit =
      isOwner ||
      previous?.createdByAdminId === context.admin.id ||
      (!previous && context.admin.role === "colaborador");

    if (!canEdit) {
      return NextResponse.json(
        { ok: false, error: "El colaborador solo puede editar propiedades propias." },
        { status: 403 }
      );
    }

    const listing: Listing = {
      ...incoming,
      agentId: isOwner ? incoming.agentId : undefined,
      createdByAdminId:
        previous?.createdByAdminId ??
        (isOwner ? incoming.createdByAdminId : context.admin.id),
    };

    const result = await upsertListing(listing);
    if (result.source !== "supabase") {
      return NextResponse.json(
        {
          ok: false,
          source: result.source,
          error:
            "Supabase está conectado para lectura, pero falta SUPABASE_SERVICE_ROLE_KEY para guardar sin bloqueo de RLS.",
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true, source: result.source, property: listing });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No se pudo guardar en Supabase.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const context = await getAdmin(request);
    if (!context) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("id");
    if (!propertyId) {
      return NextResponse.json({ ok: false, error: "Missing property id" }, { status: 400 });
    }

    const listing = context.state.listings.find((item) => item.id === propertyId);
    const isOwner = context.admin.role === "owner";
    const canDelete = isOwner || listing?.createdByAdminId === context.admin.id;
    if (!canDelete) {
      return NextResponse.json(
        { ok: false, error: "El colaborador solo puede eliminar propiedades propias." },
        { status: 403 }
      );
    }

    const result = await deleteListing(propertyId);
    if (result.source !== "supabase") {
      return NextResponse.json(
        {
          ok: false,
          source: result.source,
          error:
            "Supabase está conectado para lectura, pero falta SUPABASE_SERVICE_ROLE_KEY para eliminar sin bloqueo de RLS.",
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true, source: result.source });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No se pudo eliminar en Supabase.",
      },
      { status: 500 }
    );
  }
}
