"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatMoney } from "@/lib/money";
import { isPreview } from "@/lib/store-config";
import { PreviewNotice } from "@/components/PreviewNotice";

// Página del carrito. Lee y modifica el estado global (useCart).
export default function CartPage() {
  const { items, subtotal, count, updateQuantity, removeItem } = useCart();
  const currency = items[0]?.currency ?? "EUR";

  if (isPreview) return <PreviewNotice source="carrito" />;

  if (count === 0) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="text-2xl font-semibold">Tu carrito está vacío</h1>
        <p className="mt-4 text-neutral-500">
          Añade productos desde el catálogo.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          Ver catálogo
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Tu carrito</h1>

      <ul className="mt-8 divide-y divide-neutral-200 dark:divide-neutral-800">
        {items.map((item) => (
          <li key={item.variantId} className="flex gap-4 py-5">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-900">
              {item.image && (
                <Image
                  src={item.image}
                  alt={item.productTitle}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              )}
            </div>

            <div className="flex flex-1 flex-col">
              <div className="flex justify-between gap-4">
                <div>
                  <Link
                    href={`/productos/${item.productSlug}`}
                    className="font-medium hover:underline"
                  >
                    {item.productTitle}
                  </Link>
                  <p className="text-sm text-neutral-500">{item.variantName}</p>
                </div>
                <p className="font-medium">
                  {formatMoney(Number(item.price) * item.quantity, item.currency)}
                </p>
              </div>

              <div className="mt-auto flex items-center justify-between">
                {/* Control de cantidad */}
                <div className="flex items-center rounded-full border border-neutral-300 dark:border-neutral-700">
                  <button
                    type="button"
                    aria-label="Reducir cantidad"
                    onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                    className="px-3 py-1.5 text-lg leading-none hover:opacity-60"
                  >
                    −
                  </button>
                  <span className="min-w-8 text-center text-sm">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Aumentar cantidad"
                    disabled={item.quantity >= item.maxStock}
                    onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                    className="px-3 py-1.5 text-lg leading-none hover:opacity-60 disabled:opacity-30"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(item.variantId)}
                  className="text-sm text-neutral-500 hover:text-red-600"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Resumen */}
      <div className="mt-8 border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <div className="flex justify-between text-lg font-semibold">
          <span>Subtotal</span>
          <span>{formatMoney(subtotal, currency)}</span>
        </div>
        <p className="mt-1 text-sm text-neutral-500">
          Los gastos de envío se calculan en el siguiente paso.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
          <Link
            href="/checkout"
            className="flex-1 rounded-full bg-neutral-900 px-6 py-3 text-center text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Finalizar compra
          </Link>
          <Link
            href="/"
            className="flex-1 rounded-full border border-neutral-300 px-6 py-3 text-center text-sm font-medium transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            Seguir comprando
          </Link>
        </div>
      </div>
    </main>
  );
}
