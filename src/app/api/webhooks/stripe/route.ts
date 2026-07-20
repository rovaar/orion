import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

// POST /api/webhooks/stripe — Stripe nos avisa del resultado del pago.
//
// ⚠️ Dos cosas críticas:
//
// 1. FIRMA: hay que verificar el cuerpo CRUDO (request.text()) contra la
//    cabecera stripe-signature con STRIPE_WEBHOOK_SECRET. Si parseáramos el
//    JSON antes, la firma no cuadraría. Sin esto, cualquiera podría enviarnos
//    un "pago confirmado" falso.
//
// 2. IDEMPOTENCIA: Stripe reintenta los eventos. Marcamos PAID con un
//    updateMany condicionado a status PENDING: si el evento llega repetido,
//    updated.count === 0 y no volvemos a descontar stock.

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("Falta STRIPE_WEBHOOK_SECRET.");
    return NextResponse.json({ error: "Webhook no configurado" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Falta la firma" }, { status: 400 });
  }

  // Cuerpo CRUDO, imprescindible para validar la firma.
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("Firma de webhook inválida:", error);
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const orderId = session.metadata?.orderId ?? session.client_reference_id;
      if (!orderId) {
        console.error("Sesión sin orderId en metadata:", session.id);
        break;
      }
      await markOrderPaid(orderId, session);
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object;
      const orderId = session.metadata?.orderId ?? session.client_reference_id;
      if (orderId) {
        // El cliente no llegó a pagar: anulamos el pedido pendiente.
        await prisma.order.updateMany({
          where: { id: orderId, status: "PENDING" },
          data: { status: "CANCELLED" },
        });
      }
      break;
    }

    default:
      // Otros eventos no nos interesan de momento.
      break;
  }

  // Stripe necesita un 200 rápido; si no, reintenta.
  return NextResponse.json({ received: true });
}

/** Marca el pedido como pagado y descuenta stock, de forma idempotente. */
async function markOrderPaid(orderId: string, session: Stripe.Checkout.Session) {
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);

  try {
    const processed = await prisma.$transaction(async (tx) => {
      // Guardia de idempotencia: solo avanza si sigue PENDING.
      const updated = await tx.order.updateMany({
        where: { id: orderId, status: "PENDING" },
        data: { status: "PAID", stripePaymentIntentId: paymentIntentId },
      });

      if (updated.count === 0) return false; // ya procesado antes

      // Ahora sí, el pago está confirmado: descontamos inventario.
      const items = await tx.orderItem.findMany({ where: { orderId } });
      for (const item of items) {
        if (!item.variantId) continue;
        await tx.inventory.updateMany({
          where: { variantId: item.variantId },
          data: { quantity: { decrement: item.quantity } },
        });
      }
      return true;
    });

    if (!processed) {
      console.log(`Pedido ${orderId} ya estaba procesado; evento ignorado.`);
      return;
    }

    console.log(`✅ Pedido ${orderId} pagado y stock descontado.`);

    // TODO Fase 3: crear el pedido en CJdropshipping (cj-client.createOrder).
    // TODO Fase 4: enviar email de confirmación (email.sendOrderConfirmation).
  } catch (error) {
    // Devolvemos 200 igualmente para que Stripe no reintente en bucle, pero
    // lo dejamos registrado para revisarlo a mano.
    console.error(`Error procesando el pago del pedido ${orderId}:`, error);
  }
}
