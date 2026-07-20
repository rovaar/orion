import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import {
  checkoutSchema,
  calculateShipping,
  generateOrderNumber,
} from "@/lib/checkout";

// POST /api/checkout — inicia la compra.
//
// ⚠️ SEGURIDAD: el cliente solo manda variantId + cantidad. Los precios se
// releen SIEMPRE de la base de datos; nunca se confía en importes del navegador.
//
// FLUJO CON STRIPE:
//   1. validar -> 2. repreciar desde BD -> 3. crear pedido PENDING (sin tocar
//   stock) -> 4. crear Checkout Session -> 5. devolver la URL de pago.
//   El stock se descuenta y el pedido pasa a PAID en el WEBHOOK, cuando el
//   pago está confirmado. Así un carrito abandonado no consume inventario.
//
// FALLBACK DEV: si no hay STRIPE_SECRET_KEY y no estamos en producción, se
// simula el pago (pedido PAID + descuento de stock) para poder probar la tienda
// sin cuenta de Stripe.
export async function POST(request: NextRequest) {
  // 1. Validar la entrada
  const body = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Datos no válidos",
        issues: parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }
  const data = parsed.data;

  // 2. Cargar las variantes reales desde la BD (precio y stock de verdad)
  const variantIds = data.items.map((i) => i.variantId);
  const variants = await prisma.variant.findMany({
    where: { id: { in: variantIds } },
    include: { product: true, inventory: true },
  });

  // 3. Comprobar que todas existen, están publicadas y hay stock suficiente
  // El tipo se deriva de la consulta anterior: si cambia el `include`, cambia solo.
  const lines: { variant: (typeof variants)[number]; quantity: number }[] = [];
  for (const item of data.items) {
    const variant = variants.find((v) => v.id === item.variantId);
    if (!variant || variant.product.status !== "ACTIVE") {
      return NextResponse.json(
        { error: `Producto no disponible (${item.variantId})` },
        { status: 400 },
      );
    }
    const stock = variant.inventory?.quantity ?? 0;
    if (stock < item.quantity) {
      return NextResponse.json(
        {
          error: `Stock insuficiente de "${variant.product.title} — ${variant.name}". Quedan ${stock}.`,
        },
        { status: 409 },
      );
    }
    lines.push({ variant, quantity: item.quantity });
  }

  // 4. Calcular importes con los precios de la BD
  const subtotal = lines.reduce(
    (sum, l) => sum + Number(l.variant.price) * l.quantity,
    0,
  );
  const shipping = calculateShipping(subtotal);
  const total = subtotal + shipping;
  const currency = lines[0]?.variant.currency ?? "EUR";

  const stripeEnabled = isStripeConfigured();
  const simulatePayment = !stripeEnabled && process.env.NODE_ENV !== "production";

  if (!stripeEnabled && !simulatePayment) {
    console.error("STRIPE_SECRET_KEY no configurada en producción.");
    return NextResponse.json(
      { error: "El pago no está disponible ahora mismo." },
      { status: 503 },
    );
  }

  // 5. Crear el pedido. Con Stripe queda PENDING; simulado queda PAID.
  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          status: simulatePayment ? "PAID" : "PENDING",
          email: data.email,
          subtotal: subtotal.toFixed(2),
          shipping: shipping.toFixed(2),
          total: total.toFixed(2),
          currency,
          shippingName: data.shippingName,
          shippingPhone: data.shippingPhone || null,
          shippingLine1: data.shippingLine1,
          shippingLine2: data.shippingLine2 || null,
          shippingCity: data.shippingCity,
          shippingState: data.shippingState || null,
          shippingPostalCode: data.shippingPostalCode,
          shippingCountry: data.shippingCountry,
          items: {
            create: lines.map((l) => ({
              variantId: l.variant.id,
              // Snapshot: si mañana cambia el producto, el pedido no cambia.
              productTitle: l.variant.product.title,
              variantName: l.variant.name,
              sku: l.variant.sku,
              image: l.variant.image,
              unitPrice: l.variant.price,
              supplierPrice: l.variant.supplierPrice,
              quantity: l.quantity,
            })),
          },
        },
      });

      // Solo en pago simulado descontamos aquí. Con Stripe lo hace el webhook.
      if (simulatePayment) {
        for (const l of lines) {
          await tx.inventory.update({
            where: { variantId: l.variant.id },
            data: { quantity: { decrement: l.quantity } },
          });
        }
      }

      return created;
    });
  } catch (error) {
    console.error("POST /api/checkout (crear pedido) error:", error);
    return NextResponse.json(
      { error: "No se pudo completar el pedido. Inténtalo de nuevo." },
      { status: 500 },
    );
  }

  // 6a. Pago simulado: no hay redirección, el pedido ya está pagado.
  if (simulatePayment) {
    console.warn(
      "⚠️  Pago SIMULADO (sin STRIPE_SECRET_KEY). Configura Stripe para cobrar de verdad.",
    );
    return NextResponse.json(
      { orderNumber: order.orderNumber, simulated: true },
      { status: 201 },
    );
  }

  // 6b. Crear la Checkout Session de Stripe con los importes de la BD.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: data.email,
      // Vinculamos la sesión con nuestro pedido para reconocerlo en el webhook.
      client_reference_id: order.id,
      metadata: { orderId: order.id, orderNumber: order.orderNumber },
      line_items: lines.map((l) => ({
        quantity: l.quantity,
        price_data: {
          currency: currency.toLowerCase(),
          // Stripe trabaja en céntimos (enteros), no en euros decimales.
          unit_amount: Math.round(Number(l.variant.price) * 100),
          product_data: {
            name: `${l.variant.product.title} — ${l.variant.name}`,
            images: l.variant.image ? [l.variant.image] : undefined,
          },
        },
      })),
      shipping_options:
        shipping > 0
          ? [
              {
                shipping_rate_data: {
                  type: "fixed_amount",
                  display_name: "Envío estándar",
                  fixed_amount: {
                    amount: Math.round(shipping * 100),
                    currency: currency.toLowerCase(),
                  },
                },
              },
            ]
          : undefined,
      success_url: `${siteUrl}/pedido/${order.orderNumber}`,
      cancel_url: `${siteUrl}/checkout`,
    });

    // Guardamos el id de sesión para poder cruzarlo después.
    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error) {
    console.error("POST /api/checkout (Stripe) error:", error);
    // El pedido quedó PENDING sin sesión de pago: lo anulamos.
    await prisma.order
      .update({ where: { id: order.id }, data: { status: "CANCELLED" } })
      .catch(() => {});
    return NextResponse.json(
      { error: "No se pudo iniciar el pago. Inténtalo de nuevo." },
      { status: 502 },
    );
  }
}
