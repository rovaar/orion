import { NextResponse } from "next/server";

// POST /api/orders — creación de pedido.
// FASE 4: el flujo real crea el pedido normalmente vía el webhook de Stripe
// tras confirmarse el pago. Este endpoint queda para futuros usos (p.ej.
// crear un pedido PENDING antes de redirigir a Stripe Checkout).
export async function POST() {
  return NextResponse.json(
    { error: "No implementado todavía (Fase 4)." },
    { status: 501 },
  );
}
