// Utilidades para trabajar con dinero.
//
// En la BD el dinero se guarda como Decimal (Prisma lo entrega como un objeto
// Prisma.Decimal o string, nunca como number, para no perder precisión).
// Estas funciones convierten y formatean de forma consistente.

/** Formatea un importe a la moneda indicada (por defecto EUR, locale es-ES). */
export function formatMoney(
  amount: number | string,
  currency = "EUR",
  locale = "es-ES",
): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(value);
}

/** Calcula el precio de venta a partir del coste y un margen (p.ej. 2.5 = x2.5). */
export function applyMargin(supplierPrice: number, margin: number): number {
  return Math.round(supplierPrice * margin * 100) / 100;
}
