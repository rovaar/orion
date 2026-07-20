import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getOrderByNumber } from "@/lib/orders";
import { formatMoney } from "@/lib/money";
import { ClearCartOnMount } from "@/components/ClearCartOnMount";

export const dynamic = "force-dynamic";

interface OrderPageProps {
  params: Promise<{ orderNumber: string }>;
}

export const metadata: Metadata = {
  title: "Pedido confirmado",
};

export default async function OrderConfirmationPage({ params }: OrderPageProps) {
  const { orderNumber } = await params;
  const order = await getOrderByNumber(orderNumber);

  if (!order) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      {/* El pedido ya existe: podemos vaciar el carrito con seguridad. */}
      <ClearCartOnMount />

      <div className="text-center">
        {order.status === "PENDING" ? (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-2xl dark:bg-amber-950">
              ⏳
            </div>
            <h1 className="mt-6 text-2xl font-semibold">Confirmando tu pago…</h1>
            <p className="mt-2 text-neutral-500">
              Estamos esperando la confirmación de la pasarela. Puede tardar unos
              segundos; recarga la página en un momento.
            </p>
          </>
        ) : order.status === "CANCELLED" ? (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl dark:bg-red-950">
              ✕
            </div>
            <h1 className="mt-6 text-2xl font-semibold">Pedido cancelado</h1>
            <p className="mt-2 text-neutral-500">
              El pago no se completó. No se te ha cobrado nada.
            </p>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl dark:bg-green-950">
              ✓
            </div>
            <h1 className="mt-6 text-2xl font-semibold">¡Gracias por tu pedido!</h1>
            <p className="mt-2 text-neutral-500">
              Te hemos enviado la confirmación a{" "}
              <span className="font-medium">{order.email}</span>.
            </p>
          </>
        )}
        <p className="mt-4 inline-block rounded-full border border-neutral-300 px-4 py-1.5 text-sm dark:border-neutral-700">
          Nº de pedido: <span className="font-semibold">{order.orderNumber}</span>
        </p>
      </div>

      {/* Líneas */}
      <section className="mt-10 rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
        <h2 className="font-medium">Resumen</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3">
              <span className="text-neutral-500">
                {item.productTitle} — {item.variantName} × {item.quantity}
              </span>
              <span>
                {formatMoney(Number(item.unitPrice) * item.quantity, order.currency)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 space-y-2 border-t border-neutral-200 pt-4 text-sm dark:border-neutral-800">
          <div className="flex justify-between">
            <span className="text-neutral-500">Subtotal</span>
            <span>{formatMoney(order.subtotal, order.currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Envío</span>
            <span>
              {Number(order.shipping) === 0
                ? "Gratis"
                : formatMoney(order.shipping, order.currency)}
            </span>
          </div>
          <div className="flex justify-between border-t border-neutral-200 pt-3 text-base font-semibold dark:border-neutral-800">
            <span>Total</span>
            <span>{formatMoney(order.total, order.currency)}</span>
          </div>
        </div>
      </section>

      {/* Dirección de envío */}
      <section className="mt-6 rounded-xl border border-neutral-200 p-5 text-sm dark:border-neutral-800">
        <h2 className="font-medium">Dirección de envío</h2>
        <address className="mt-3 not-italic text-neutral-500">
          {order.shippingName}
          <br />
          {order.shippingLine1}
          {order.shippingLine2 && (
            <>
              <br />
              {order.shippingLine2}
            </>
          )}
          <br />
          {order.shippingPostalCode} {order.shippingCity}
          <br />
          {order.shippingCountry}
        </address>
      </section>

      <div className="mt-8 text-center">
        <Link
          href="/"
          className="inline-block rounded-full border border-neutral-300 px-6 py-3 text-sm font-medium transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          Seguir comprando
        </Link>
      </div>
    </main>
  );
}
