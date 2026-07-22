// Consultas del panel de administración.
// Todas asumen que quien llama ya ha verificado el acceso con requireAdmin().

import "server-only";
import { prisma } from "@/lib/prisma";

export interface AdminOrderRow {
  id: string;
  orderNumber: string;
  status: string;
  email: string;
  total: string;
  currency: string;
  createdAt: Date;
  itemCount: number;
  shippingName: string;
  shippingCity: string;
  shippingCountry: string;
  /** Beneficio estimado: (precio venta - coste proveedor) por unidad. */
  margin: string;
}

/** Últimos pedidos, del más reciente al más antiguo. */
export async function getAdminOrders(limit = 50): Promise<AdminOrderRow[]> {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { items: true },
  });

  return orders.map((o) => {
    const margin = o.items.reduce(
      (sum, i) =>
        sum + (Number(i.unitPrice) - Number(i.supplierPrice)) * i.quantity,
      0,
    );
    return {
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      email: o.email,
      total: String(o.total),
      currency: o.currency,
      createdAt: o.createdAt,
      itemCount: o.items.reduce((n, i) => n + i.quantity, 0),
      shippingName: o.shippingName,
      shippingCity: o.shippingCity,
      shippingCountry: o.shippingCountry,
      margin: margin.toFixed(2),
    };
  });
}

export interface AdminStats {
  totalOrders: number;
  paidOrders: number;
  revenue: string;
  profit: string;
  currency: string;
}

/** Métricas rápidas para la cabecera del panel (solo pedidos cobrados). */
export async function getAdminStats(): Promise<AdminStats> {
  const [totalOrders, paidOrders] = await Promise.all([
    prisma.order.count(),
    prisma.order.findMany({
      where: { status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] } },
      include: { items: true },
    }),
  ]);

  const revenue = paidOrders.reduce((s, o) => s + Number(o.total), 0);
  const profit = paidOrders.reduce(
    (s, o) =>
      s +
      o.items.reduce(
        (n, i) => n + (Number(i.unitPrice) - Number(i.supplierPrice)) * i.quantity,
        0,
      ),
    0,
  );

  return {
    totalOrders,
    paidOrders: paidOrders.length,
    revenue: revenue.toFixed(2),
    profit: profit.toFixed(2),
    currency: paidOrders[0]?.currency ?? "EUR",
  };
}

export interface AdminVariantRow {
  id: string;
  name: string;
  sku: string;
  supplierPrice: string;
  price: string;
  currency: string;
  stock: number;
}

export interface WaitlistRow {
  id: string;
  email: string;
  productSlug: string; // "" = interés general
  source: string | null;
  createdAt: Date;
}

/** Emails de la lista de espera, del más reciente al más antiguo. */
export async function getWaitlist(): Promise<WaitlistRow[]> {
  const entries = await prisma.waitlistEntry.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return entries.map((e) => ({
    id: e.id,
    email: e.email,
    productSlug: e.productSlug,
    source: e.source,
    createdAt: e.createdAt,
  }));
}

/** Nº total de apuntados y nº de emails únicos. */
export async function getWaitlistStats(): Promise<{
  total: number;
  uniqueEmails: number;
}> {
  const [total, distinct] = await Promise.all([
    prisma.waitlistEntry.count(),
    prisma.waitlistEntry.findMany({
      distinct: ["email"],
      select: { email: true },
    }),
  ]);
  return { total, uniqueEmails: distinct.length };
}

export interface AdminProductListRow {
  id: string;
  slug: string;
  title: string;
  status: string;
  category: string | null;
  image: string | null;
  variantCount: number;
  /** Stock sumado de todas las variantes. */
  stock: number;
  /** Rango de precio de venta (iguales si solo hay una variante). */
  priceMin: string;
  priceMax: string;
  currency: string;
  /** Margen medio en % sobre el precio de venta. null si no hay variantes. */
  marginPct: number | null;
  /** Unidades vendidas (aparece en algún pedido). Si es 0 se puede borrar. */
  unitsSold: number;
  updatedAt: Date;
}

/** Listado para la tabla del panel: una fila por producto, ya agregada. */
export async function getAdminProductList(): Promise<AdminProductListRow[]> {
  const [products, sales] = await Promise.all([
    prisma.product.findMany({
      orderBy: { updatedAt: "desc" },
      include: { variants: { include: { inventory: true } } },
    }),
    // Unidades vendidas por variante, en una sola consulta agregada.
    prisma.orderItem.groupBy({
      by: ["variantId"],
      _sum: { quantity: true },
    }),
  ]);

  const soldByVariant = new Map(
    sales.map((s) => [s.variantId, s._sum.quantity ?? 0]),
  );

  return products.map((p) => {
    const prices = p.variants.map((v) => Number(v.price));
    const margins = p.variants
      .map((v) => {
        const price = Number(v.price);
        return price > 0 ? ((price - Number(v.supplierPrice)) / price) * 100 : 0;
      })
      .filter((m) => Number.isFinite(m));

    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      status: p.status,
      category: p.category,
      image: p.images[0] ?? null,
      variantCount: p.variants.length,
      stock: p.variants.reduce((n, v) => n + (v.inventory?.quantity ?? 0), 0),
      priceMin: prices.length ? Math.min(...prices).toFixed(2) : "0.00",
      priceMax: prices.length ? Math.max(...prices).toFixed(2) : "0.00",
      currency: p.variants[0]?.currency ?? "EUR",
      marginPct: margins.length
        ? margins.reduce((a, b) => a + b, 0) / margins.length
        : null,
      unitsSold: p.variants.reduce(
        (n, v) => n + (soldByVariant.get(v.id) ?? 0),
        0,
      ),
      updatedAt: p.updatedAt,
    };
  });
}

export interface AdminProductDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  status: string;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
  /** Líneas de pedido que referencian este producto; si es 0 se puede borrar. */
  orderCount: number;
  variants: (AdminVariantRow & { orderCount: number })[];
}

/** Ficha completa de un producto para su página de edición. */
export async function getAdminProduct(
  id: string,
): Promise<AdminProductDetail | null> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: {
        orderBy: { createdAt: "asc" },
        include: {
          inventory: true,
          _count: { select: { orderItems: true } },
        },
      },
    },
  });
  if (!product) return null;

  const variants = product.variants.map((v) => ({
    id: v.id,
    name: v.name,
    sku: v.sku,
    supplierPrice: String(v.supplierPrice),
    price: String(v.price),
    currency: v.currency,
    stock: v.inventory?.quantity ?? 0,
    orderCount: v._count.orderItems,
  }));

  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    // Los formularios trabajan con strings: null se convierte aquí, no en la UI.
    description: product.description ?? "",
    category: product.category ?? "",
    status: product.status,
    images: product.images,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    orderCount: variants.reduce((n, v) => n + v.orderCount, 0),
    variants,
  };
}
