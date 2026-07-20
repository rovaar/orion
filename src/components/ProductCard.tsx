import Image from "next/image";
import Link from "next/link";
import type { ProductView } from "@/lib/products";
import { formatMoney } from "@/lib/money";

// Tarjeta de producto para la rejilla del catálogo.
export function ProductCard({ product }: { product: ProductView }) {
  const image = product.images[0];

  return (
    <Link
      href={`/productos/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-neutral-200 transition hover:shadow-md dark:border-neutral-800"
    >
      <div className="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-900">
        {image ? (
          <Image
            src={image}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition group-hover:scale-105"
          />
        ) : null}
        {!product.inStock && (
          <span className="absolute left-3 top-3 rounded-full bg-neutral-900/80 px-2.5 py-1 text-xs font-medium text-white">
            Agotado
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        {product.category && (
          <p className="text-xs uppercase tracking-wide text-neutral-400">
            {product.category}
          </p>
        )}
        <h3 className="mt-1 font-medium">{product.title}</h3>
        <p className="mt-auto pt-3 text-sm text-neutral-500">
          Desde{" "}
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
            {formatMoney(product.fromPrice, product.currency)}
          </span>
        </p>
      </div>
    </Link>
  );
}
