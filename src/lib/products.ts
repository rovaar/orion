// Capa de acceso a datos del catálogo.
// Centraliza las consultas de productos para que las páginas queden limpias.
//
// Los precios (Decimal) se serializan a string aquí, porque el objeto
// Prisma.Decimal no se puede pasar tal cual desde un Server Component a un
// Client Component. Devolvemos tipos "planos" listos para la UI.

import { prisma } from "@/lib/prisma";

export interface VariantView {
  id: string;
  name: string;
  price: string; // "49.90"
  currency: string;
  stock: number;
  attributes: Record<string, string> | null;
  image: string | null;
}

export interface ProductView {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  images: string[];
  variants: VariantView[];
  fromPrice: string; // precio más bajo entre las variantes
  currency: string;
  inStock: boolean;
}

type VariantWithInventory = {
  id: string;
  name: string;
  price: unknown;
  currency: string;
  attributes: unknown;
  image: string | null;
  inventory: { quantity: number } | null;
};

function toVariantView(v: VariantWithInventory): VariantView {
  return {
    id: v.id,
    name: v.name,
    price: String(v.price),
    currency: v.currency,
    stock: v.inventory?.quantity ?? 0,
    attributes: (v.attributes as Record<string, string> | null) ?? null,
    image: v.image,
  };
}

function buildProductView(p: {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  images: string[];
  variants: VariantWithInventory[];
}): ProductView {
  const variants = p.variants.map(toVariantView);
  const prices = variants.map((v) => Number(v.price));
  const fromPrice = prices.length ? Math.min(...prices) : 0;
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description,
    category: p.category,
    images: p.images,
    variants,
    fromPrice: fromPrice.toFixed(2),
    currency: variants[0]?.currency ?? "EUR",
    inStock: variants.some((v) => v.stock > 0),
  };
}

/** Lista los productos activos para el catálogo. */
export async function getActiveProducts(): Promise<ProductView[]> {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    include: { variants: { include: { inventory: true } } },
    orderBy: { createdAt: "desc" },
  });
  return products.map(buildProductView);
}

/** Carga un producto activo por su slug (o null si no existe / no está activo). */
export async function getProductBySlug(slug: string): Promise<ProductView | null> {
  const product = await prisma.product.findFirst({
    where: { slug, status: "ACTIVE" },
    include: { variants: { include: { inventory: true } } },
  });
  return product ? buildProductView(product) : null;
}
