import { NextResponse } from "next/server";
import type { Listing } from "@/lib/inmoData";
import { readInmoState, writeInmoState } from "@/lib/server/inmoRepository";

const getAdmin = async (request: Request) => {
  const adminId = request.headers.get("x-admin-id");
  if (!adminId) return null;
  const result = await readInmoState();
  const admin = result.data.adminUsers.find((item) => item.id === adminId && item.active);
  return admin ? { admin, state: result.data } : null;
};

export async function POST(request: Request) {
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

  const nextState = {
    ...context.state,
    listings: previous
      ? context.state.listings.map((item) => (item.id === listing.id ? listing : item))
      : [...context.state.listings, listing],
  };

  const result = await writeInmoState(nextState);
  return NextResponse.json({ ok: true, source: result.source, property: listing });
}

export async function DELETE(request: Request) {
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

  const nextState = {
    ...context.state,
    listings: context.state.listings.filter((item) => item.id !== propertyId),
  };

  const result = await writeInmoState(nextState);
  return NextResponse.json({ ok: true, source: result.source });
}
