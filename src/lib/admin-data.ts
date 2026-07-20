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

export interface AdminProductRow {
  id: string;
  slug: string;
  title: string;
  status: string;
  category: string | null;
  image: string | null;
  variants: AdminVariantRow[];
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

/** Todos los productos (incluidos borradores y archivados). */
export async function getAdminProducts(): Promise<AdminProductRow[]> {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { variants: { include: { inventory: true } } },
  });

  return products.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    status: p.status,
    category: p.category,
    image: p.images[0] ?? null,
    variants: p.variants.map((v) => ({
      id: v.id,
      name: v.name,
      sku: v.sku,
      supplierPrice: String(v.supplierPrice),
      price: String(v.price),
      currency: v.currency,
      stock: v.inventory?.quantity ?? 0,
    })),
  }));
}
