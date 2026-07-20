"use server";

// Server Actions del panel de administración.
//
// ⚠️ CADA acción llama a requireAdmin() por su cuenta. Las Server Actions son
// endpoints HTTP reales: cualquiera podría invocarlas directamente, así que no
// basta con que el proxy proteja las páginas.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/dal";

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

const updatePriceSchema = z.object({
  variantId: z.string().min(1),
  // Llega como texto del formulario; lo convertimos y validamos que sea > 0.
  price: z.coerce.number().positive("El precio debe ser mayor que 0"),
});

/** Actualiza el precio de venta de una variante (ajuste de margen). */
export async function updateVariantPrice(formData: FormData) {
  await requireAdmin();

  const parsed = updatePriceSchema.safeParse({
    variantId: formData.get("variantId"),
    price: formData.get("price"),
  });
  if (!parsed.success) return;

  await prisma.variant.update({
    where: { id: parsed.data.variantId },
    data: { price: parsed.data.price.toFixed(2) },
  });

  revalidatePath("/admin/productos");
  revalidatePath("/");
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

  await prisma.product.update({
    where: { id: parsed.data.productId },
    data: { status: parsed.data.status },
  });

  revalidatePath("/admin/productos");
  revalidatePath("/");
}
