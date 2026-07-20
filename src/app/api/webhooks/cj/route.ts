import { NextResponse } from "next/server";

// POST /api/webhooks/cj — CJdropshipping notifica cambios de estado del pedido.
// FASE 3: al recibir un cambio (enviado/entregado), actualizar el Order
// correspondiente (status, trackingNumber, carrier) y notificar al cliente.
export async function POST() {
  return NextResponse.json(
    { error: "Webhook de CJ no implementado todavía (Fase 3)." },
    { status: 501 },
  );
}
