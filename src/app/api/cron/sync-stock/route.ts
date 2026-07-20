import { NextRequest, NextResponse } from "next/server";

// GET /api/cron/sync-stock — job periódico de sincronización de stock/precio.
// Se protege con un secreto compartido para que solo lo pueda disparar el
// planificador (Vercel Cron) y no cualquiera desde internet.
//
// FASE 3: por cada variante con cjVariantId, llamar a cj-client.getStock(),
// actualizar Inventory.quantity y Variant.supplierPrice, y refrescar
// lastSyncedAt.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // TODO Fase 3: implementar la sincronización real con CJ.
  return NextResponse.json(
    { ok: false, message: "Sincronización no implementada todavía (Fase 3)." },
    { status: 501 },
  );
}
