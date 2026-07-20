"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart-context";

// Vacía el carrito al llegar a la confirmación del pedido.
// Se hace aquí (y no antes de ir a Stripe) para que, si el cliente abandona
// el pago, conserve su carrito intacto.
export function ClearCartOnMount() {
  const { clear, count } = useCart();

  useEffect(() => {
    if (count > 0) clear();
  }, [count, clear]);

  return null;
}
