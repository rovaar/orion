"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatMoney } from "@/lib/money";
import { calculateShipping, FREE_SHIPPING_THRESHOLD } from "@/lib/checkout";
import { isPreview } from "@/lib/store-config";
import { PreviewNotice } from "@/components/PreviewNotice";

// Checkout: datos de envío + resumen. Al enviar, el servidor recalcula
// los importes desde la BD (aquí solo mostramos una previsualización).
export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, count } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currency = items[0]?.currency ?? "EUR";
  const shipping = calculateShipping(subtotal);
  const total = subtotal + shipping;

  // En modo preview no se puede pagar: mostramos la lista de espera.
  if (isPreview) return <PreviewNotice source="checkout" />;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const payload = {
      email: String(form.get("email") ?? ""),
      shippingName: String(form.get("shippingName") ?? ""),
      shippingPhone: String(form.get("shippingPhone") ?? ""),
      shippingLine1: String(form.get("shippingLine1") ?? ""),
      shippingLine2: String(form.get("shippingLine2") ?? ""),
      shippingCity: String(form.get("shippingCity") ?? ""),
      shippingState: String(form.get("shippingState") ?? ""),
      shippingPostalCode: String(form.get("shippingPostalCode") ?? ""),
      shippingCountry: String(form.get("shippingCountry") ?? "ES"),
      // Solo mandamos qué y cuánto; el precio lo pone el servidor.
      items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
    };

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "No se pudo completar el pedido.");
        setSubmitting(false);
        return;
      }

      // Con Stripe: nos devuelve la URL de la pasarela de pago.
      // No vaciamos el carrito aquí: si el cliente abandona el pago, lo conserva.
      if (data.url) {
        window.location.href = data.url;
        return;
      }

      // Pago simulado (sin claves de Stripe): vamos directos a la confirmación.
      router.push(`/pedido/${data.orderNumber}`);
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
      setSubmitting(false);
    }
  }

  if (count === 0) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="text-2xl font-semibold">No hay nada que pagar</h1>
        <p className="mt-4 text-neutral-500">Tu carrito está vacío.</p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          Ver catálogo
        </Link>
      </main>
    );
  }

  const inputClass =
    "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900";

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Finalizar compra</h1>

      <div className="mt-8 grid gap-10 md:grid-cols-[1fr_360px]">
        {/* Formulario de envío */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="font-medium">Datos de envío</h2>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm">
              Email *
            </label>
            <input id="email" name="email" type="email" required className={inputClass} />
          </div>

          <div>
            <label htmlFor="shippingName" className="mb-1 block text-sm">
              Nombre y apellidos *
            </label>
            <input id="shippingName" name="shippingName" required className={inputClass} />
          </div>

          <div>
            <label htmlFor="shippingPhone" className="mb-1 block text-sm">
              Teléfono
            </label>
            <input id="shippingPhone" name="shippingPhone" className={inputClass} />
          </div>

          <div>
            <label htmlFor="shippingLine1" className="mb-1 block text-sm">
              Dirección *
            </label>
            <input id="shippingLine1" name="shippingLine1" required className={inputClass} />
          </div>

          <div>
            <label htmlFor="shippingLine2" className="mb-1 block text-sm">
              Piso, puerta (opcional)
            </label>
            <input id="shippingLine2" name="shippingLine2" className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="shippingPostalCode" className="mb-1 block text-sm">
                Código postal *
              </label>
              <input
                id="shippingPostalCode"
                name="shippingPostalCode"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="shippingCity" className="mb-1 block text-sm">
                Ciudad *
              </label>
              <input id="shippingCity" name="shippingCity" required className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="shippingState" className="mb-1 block text-sm">
                Provincia
              </label>
              <input id="shippingState" name="shippingState" className={inputClass} />
            </div>
            <div>
              <label htmlFor="shippingCountry" className="mb-1 block text-sm">
                País *
              </label>
              <input
                id="shippingCountry"
                name="shippingCountry"
                required
                defaultValue="ES"
                className={inputClass}
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {submitting ? "Procesando…" : `Pagar ${formatMoney(total, currency)}`}
          </button>

          <p className="text-center text-xs text-neutral-400">
            Pago simulado (modo desarrollo). Stripe se conecta en el siguiente paso.
          </p>
        </form>

        {/* Resumen del pedido */}
        <aside className="h-fit rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
          <h2 className="font-medium">Tu pedido</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {items.map((i) => (
              <li key={i.variantId} className="flex justify-between gap-3">
                <span className="text-neutral-500">
                  {i.productTitle} — {i.variantName} × {i.quantity}
                </span>
                <span>{formatMoney(Number(i.price) * i.quantity, i.currency)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 space-y-2 border-t border-neutral-200 pt-4 text-sm dark:border-neutral-800">
            <div className="flex justify-between">
              <span className="text-neutral-500">Subtotal</span>
              <span>{formatMoney(subtotal, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Envío</span>
              <span>
                {shipping === 0 ? "Gratis" : formatMoney(shipping, currency)}
              </span>
            </div>
            {shipping > 0 && (
              <p className="text-xs text-neutral-400">
                Envío gratis a partir de {formatMoney(FREE_SHIPPING_THRESHOLD, currency)}.
              </p>
            )}
            <div className="flex justify-between border-t border-neutral-200 pt-3 text-base font-semibold dark:border-neutral-800">
              <span>Total</span>
              <span>{formatMoney(total, currency)}</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
