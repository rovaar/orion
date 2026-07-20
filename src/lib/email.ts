// Emails transaccionales con Resend.
// Docs: https://resend.com/docs
//
// FASE 4: instalaremos el SDK con `npm install resend` y activaremos el envío.
// De momento definimos las firmas para poder llamarlas desde los webhooks.

export interface OrderEmailData {
  to: string;
  orderNumber: string;
  total: string; // ya formateado, p.ej. "29,90 €"
  trackingUrl?: string;
}

function assertResendKey(): string {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("Falta RESEND_API_KEY en el entorno (Fase 4).");
  }
  return key;
}

/** Email de confirmación de pedido (tras pago). */
export async function sendOrderConfirmation(data: OrderEmailData): Promise<void> {
  assertResendKey();
  void data;
  // TODO Fase 4: enviar con Resend.
  console.warn("email.sendOrderConfirmation() no implementado todavía (Fase 4).");
}

/** Email de envío con tracking. */
export async function sendShippingNotification(data: OrderEmailData): Promise<void> {
  assertResendKey();
  void data;
  // TODO Fase 4: enviar con Resend.
  console.warn("email.sendShippingNotification() no implementado todavía (Fase 4).");
}
