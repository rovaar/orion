// Cliente de Stripe (pagos).
// Docs: https://stripe.com/docs/api
//
// La clave se lee de STRIPE_SECRET_KEY. En desarrollo debe ser una clave de
// TEST (sk_test_...). Nunca se expone al navegador: este módulo solo se
// importa desde código de servidor (route handlers).

import Stripe from "stripe";

let cached: Stripe | null = null;

/**
 * Devuelve el cliente de Stripe, creándolo la primera vez.
 * Es una función (y no una constante) para que la app no reviente al
 * arrancar si la clave todavía no está configurada: solo falla si de verdad
 * se intenta cobrar.
 */
export function getStripe(): Stripe {
  if (cached) return cached;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "Falta STRIPE_SECRET_KEY en .env. Cópiala del panel de Stripe (modo prueba).",
    );
  }

  cached = new Stripe(key, { typescript: true });
  return cached;
}

/** true si Stripe está configurado (para degradar con elegancia). */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
