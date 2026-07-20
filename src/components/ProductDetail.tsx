"use client";

import { useState } from "react";
import Image from "next/image";
import type { ProductView } from "@/lib/products";
import { formatMoney } from "@/lib/money";
import { useCart } from "@/lib/cart-context";
import { isPreview } from "@/lib/store-config";
import { WaitlistForm } from "@/components/WaitlistForm";

// Vista interactiva de la ficha: selección de variante y cantidad.
// (Client Component porque usa estado y eventos del usuario.)
export function ProductDetail({ product }: { product: ProductView }) {
  const { addItem } = useCart();
  const [selectedId, setSelectedId] = useState(product.variants[0]?.id);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const selected =
    product.variants.find((v) => v.id === selectedId) ?? product.variants[0];
  const outOfStock = !selected || selected.stock <= 0;

  function handleAddToCart() {
    if (!selected || outOfStock) return;
    addItem(
      {
        variantId: selected.id,
        productSlug: product.slug,
        productTitle: product.title,
        variantName: selected.name,
        price: selected.price,
        currency: selected.currency,
        image: selected.image ?? product.images[0] ?? null,
        maxStock: selected.stock,
      },
      quantity,
    );
    // Feedback breve en el botón.
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="grid gap-10 md:grid-cols-2">
      {/* Galería */}
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-900">
        {product.images[0] && (
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        )}
      </div>

      {/* Info y compra */}
      <div className="flex flex-col">
        {product.category && (
          <p className="text-xs uppercase tracking-wide text-neutral-400">
            {product.category}
          </p>
        )}
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          {product.title}
        </h1>

        <p className="mt-4 text-2xl font-semibold">
          {selected
            ? formatMoney(selected.price, selected.currency)
            : formatMoney(product.fromPrice, product.currency)}
        </p>

        {product.description && (
          <p className="mt-4 text-neutral-500">{product.description}</p>
        )}

        {/* Selector de variante */}
        {product.variants.length > 1 && (
          <div className="mt-6">
            <p className="mb-2 text-sm font-medium">Variante</p>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v) => {
                const isSelected = v.id === selectedId;
                const disabled = v.stock <= 0;
                return (
                  <button
                    key={v.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => setSelectedId(v.id)}
                    className={[
                      "rounded-full border px-4 py-2 text-sm transition",
                      isSelected
                        ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                        : "border-neutral-300 hover:border-neutral-500 dark:border-neutral-700",
                      disabled ? "cursor-not-allowed opacity-40 line-through" : "",
                    ].join(" ")}
                  >
                    {v.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Stock */}
        <p className="mt-4 text-sm">
          {outOfStock ? (
            <span className="text-red-600">Agotado</span>
          ) : (
            <span className="text-green-600">
              {selected.stock} disponibles
            </span>
          )}
        </p>

        {/* Cantidad */}
        <div className="mt-6 flex items-center gap-3">
          <label htmlFor="qty" className="text-sm font-medium">
            Cantidad
          </label>
          <input
            id="qty"
            type="number"
            min={1}
            max={selected?.stock ?? 1}
            value={quantity}
            onChange={(e) =>
              setQuantity(Math.max(1, Number(e.target.value) || 1))
            }
            className="w-20 rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>

        {/* En preview: lista de espera. En live: añadir al carrito. */}
        {isPreview ? (
          <div className="mt-8">
            <p className="mb-2 text-sm font-medium">
              Muy pronto disponible. Déjanos tu email y te avisamos:
            </p>
            <WaitlistForm productSlug={product.slug} source="producto" />
          </div>
        ) : (
          <button
            type="button"
            disabled={outOfStock}
            onClick={handleAddToCart}
            className="mt-8 rounded-full bg-neutral-900 px-8 py-3 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {added ? "✓ Añadido" : "Añadir al carrito"}
          </button>
        )}
      </div>
    </div>
  );
}
