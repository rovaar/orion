// Reglas de negocio y validación del checkout.
// Se comparte entre el formulario (cliente) y el API (servidor).

import { z } from "zod";

// --- Gastos de envío ---
export const SHIPPING_COST = 4.95;
export const FREE_SHIPPING_THRESHOLD = 50;

/** Envío gratis a partir de cierto importe. */
export function calculateShipping(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
}

// --- Validación ---
// Nota: el cliente envía SOLO variantId + cantidad. Los precios los recalcula
// el servidor desde la BD: nunca se confía en importes que vengan del navegador.
export const checkoutSchema = z.object({
  email: z.email("Introduce un email válido"),
  shippingName: z.string().trim().min(1, "El nombre es obligatorio"),
  shippingPhone: z.string().trim().optional(),
  shippingLine1: z.string().trim().min(1, "La dirección es obligatoria"),
  shippingLine2: z.string().trim().optional(),
  shippingCity: z.string().trim().min(1, "La ciudad es obligatoria"),
  shippingState: z.string().trim().optional(),
  shippingPostalCode: z.string().trim().min(1, "El código postal es obligatorio"),
  shippingCountry: z.string().trim().min(2, "El país es obligatorio"),
  items: z
    .array(
      z.object({
        variantId: z.string().min(1),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1, "El carrito está vacío"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/** Genera un número de pedido legible, p.ej. "ORION-K3F9QX". */
export function generateOrderNumber(): string {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORION-${suffix}`;
}
