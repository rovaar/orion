"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";

// Enlace al carrito con el contador de unidades. Client Component porque
// lee el estado del carrito (que solo existe en el navegador).
export function CartIndicator() {
  const { count } = useCart();

  return (
    <Link href="/carrito" className="relative hover:opacity-70">
      Carrito
      {count > 0 && (
        <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-neutral-900 px-1.5 text-xs font-medium text-white dark:bg-white dark:text-neutral-900">
          {count}
        </span>
      )}
    </Link>
  );
}
