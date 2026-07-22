"use server";

// Server Actions del panel de administración.
//
// ⚠️ CADA acción llama a requireAdmin() por su cuenta. Las Server Actions son
// endpoints HTTP reales: cualquiera podría invocarlas directamente, así que no
// basta con que el proxy proteja las páginas.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/dal";
import type { FormState } from "@/lib/admin-form-state";

const ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

const updateStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(ORDER_STATUSES),
});

/** Cambia el estado de un pedido desde el panel. */
export async function updateOrderStatus(formData: FormData) {
  await requireAdmin();

  const parsed = updateStatusSchema.safeParse({
    orderId: formData.get("orderId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  await prisma.order.update({
    where: { id: parsed.data.orderId },
    data: { status: parsed.data.status },
  });

  revalidatePath("/admin");
}

const toggleStatusSchema = z.object({
  productId: z.string().min(1),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
});

/** Publica o despublica un producto de la tienda. */
export async function updateProductStatus(formData: FormData) {
  await requireAdmin();

  const parsed = toggleStatusSchema.safeParse({
    productId: formData.get("productId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  // Un producto sin variantes no tiene precio ni stock: no puede publicarse.
  if (parsed.data.status === "ACTIVE") {
    const variants = await prisma.variant.count({
      where: { productId: parsed.data.productId },
    });
    if (variants === 0) return;
  }

  await prisma.product.update({
    where: { id: parsed.data.productId },
    data: { status: parsed.data.status },
  });

  revalidateCatalog(parsed.data.productId);
}

// ---------------------------------------------------------------------------
// Productos: crear / editar / eliminar
// ---------------------------------------------------------------------------

/** Invalida el catálogo público y las vistas del panel. */
function revalidateCatalog(productId?: string) {
  revalidatePath("/");
  revalidatePath("/admin/productos");
  if (productId) revalidatePath(`/admin/productos/${productId}`);
}

/** "Camiseta Oversize L" -> "camiseta-oversize-l" */
function slugify(input: string): string {
  return input
    .normalize("NFD") // separa las tildes de la letra
    .replace(/[̀-ͯ]/g, "") // y las elimina
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** ¿Es un error de Prisma por violar un índice único? */
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "P2002"
  );
}

const productSchema = z.object({
  title: z.string().trim().min(2, "El título debe tener al menos 2 caracteres"),
  slug: z
    .string()
    .trim()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "El slug solo admite minúsculas, números y guiones",
    ),
  description: z.string().trim().max(5000).optional(),
  category: z.string().trim().max(60).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  images: z.array(z.url("Alguna imagen no es una URL válida")),
});

/** Lee y normaliza los campos del formulario de producto. */
function readProductForm(formData: FormData) {
  const title = String(formData.get("title") ?? "");
  const rawSlug = String(formData.get("slug") ?? "").trim();

  return productSchema.safeParse({
    title,
    // Si no escribes slug, se genera a partir del título.
    slug: rawSlug ? slugify(rawSlug) : slugify(title),
    description: String(formData.get("description") ?? "").trim() || undefined,
    category: String(formData.get("category") ?? "").trim() || undefined,
    status: formData.get("status"),
    // El textarea trae una URL por línea.
    images: String(formData.get("images") ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
  });
}

/**
 * Crea un producto en borrador y redirige a su ficha para añadir variantes.
 * Se usa con useActionState, por eso recibe el estado anterior.
 */
export async function createProduct(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const parsed = readProductForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  let productId: string;
  try {
    const product = await prisma.product.create({
      data: {
        title: parsed.data.title,
        slug: parsed.data.slug,
        description: parsed.data.description ?? null,
        category: parsed.data.category ?? null,
        // Nace siempre en borrador: aún no tiene variantes.
        status: "DRAFT",
        images: parsed.data.images,
      },
    });
    productId = product.id;
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { error: `Ya existe un producto con el slug "${parsed.data.slug}"` };
    }
    throw error;
  }

  revalidateCatalog(productId);
  // redirect() lanza una excepción de control: va fuera del try/catch.
  redirect(`/admin/productos/${productId}`);
}

/** Guarda los cambios de la ficha de un producto. */
export async function updateProduct(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const productId = String(formData.get("productId") ?? "");
  if (!productId) return { error: "Falta el identificador del producto" };

  const parsed = readProductForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  if (parsed.data.status === "ACTIVE") {
    const variants = await prisma.variant.count({ where: { productId } });
    if (variants === 0) {
      return { error: "Añade al menos una variante antes de publicar" };
    }
  }

  try {
    await prisma.product.update({
      where: { id: productId },
      data: {
        title: parsed.data.title,
        slug: parsed.data.slug,
        description: parsed.data.description ?? null,
        category: parsed.data.category ?? null,
        status: parsed.data.status,
        images: parsed.data.images,
      },
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { error: `Ya existe un producto con el slug "${parsed.data.slug}"` };
    }
    throw error;
  }

  revalidateCatalog(productId);
  return { ok: true };
}

/**
 * Borra un producto de la base de datos. Solo se permite si nunca se ha
 * vendido: si tiene ventas, se archiva (los pedidos guardan un snapshot, pero
 * preferimos no perder la referencia).
 */
export async function deleteProduct(formData: FormData) {
  await requireAdmin();

  const productId = String(formData.get("productId") ?? "");
  if (!productId) return;

  const sold = await prisma.orderItem.count({
    where: { variant: { productId } },
  });
  if (sold > 0) {
    await prisma.product.update({
      where: { id: productId },
      data: { status: "ARCHIVED" },
    });
  } else {
    // Las variantes e inventarios caen en cascada (ver schema.prisma).
    await prisma.product.delete({ where: { id: productId } });
  }

  revalidateCatalog(productId);
  redirect("/admin/productos");
}

// ---------------------------------------------------------------------------
// Variantes: crear / editar / eliminar
// ---------------------------------------------------------------------------

const variantSchema = z.object({
  name: z.string().trim().min(1, "La variante necesita un nombre"),
  sku: z.string().trim().min(1, "El SKU es obligatorio").max(64),
  supplierPrice: z.coerce
    .number()
    .min(0, "El coste no puede ser negativo")
    .max(999999),
  price: z.coerce.number().positive("El precio debe ser mayor que 0").max(999999),
  stock: z.coerce.number().int().min(0, "El stock no puede ser negativo"),
});

function readVariantForm(formData: FormData) {
  return variantSchema.safeParse({
    name: formData.get("name"),
    sku: formData.get("sku"),
    supplierPrice: formData.get("supplierPrice"),
    price: formData.get("price"),
    stock: formData.get("stock"),
  });
}

/** Añade una variante (con su inventario) a un producto. */
export async function createVariant(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const productId = String(formData.get("productId") ?? "");
  if (!productId) return { error: "Falta el identificador del producto" };

  const parsed = readVariantForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.variant.create({
      data: {
        productId,
        name: parsed.data.name,
        sku: parsed.data.sku,
        // Los Decimal se pasan como string para no perder precisión.
        supplierPrice: parsed.data.supplierPrice.toFixed(2),
        price: parsed.data.price.toFixed(2),
        inventory: { create: { quantity: parsed.data.stock } },
      },
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { error: `El SKU "${parsed.data.sku}" ya existe` };
    }
    throw error;
  }

  revalidateCatalog(productId);
  return { ok: true };
}

/** Guarda los cambios de una variante (nombre, SKU, precios y stock). */
export async function updateVariant(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const variantId = String(formData.get("variantId") ?? "");
  if (!variantId) return { error: "Falta el identificador de la variante" };

  const parsed = readVariantForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const variant = await prisma.variant.update({
      where: { id: variantId },
      data: {
        name: parsed.data.name,
        sku: parsed.data.sku,
        supplierPrice: parsed.data.supplierPrice.toFixed(2),
        price: parsed.data.price.toFixed(2),
        inventory: {
          // upsert: puede no existir si la variante se creó antes que su inventario.
          upsert: {
            create: { quantity: parsed.data.stock },
            update: { quantity: parsed.data.stock },
          },
        },
      },
    });
    revalidateCatalog(variant.productId);
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { error: `El SKU "${parsed.data.sku}" ya existe` };
    }
    throw error;
  }

  return { ok: true };
}

/** Elimina una variante. Se bloquea si aparece en algún pedido. */
export async function deleteVariant(formData: FormData) {
  await requireAdmin();

  const variantId = String(formData.get("variantId") ?? "");
  if (!variantId) return;

  const sold = await prisma.orderItem.count({ where: { variantId } });
  if (sold > 0) return;

  const variant = await prisma.variant.delete({ where: { id: variantId } });
  revalidateCatalog(variant.productId);
}
