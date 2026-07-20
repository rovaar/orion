// Capa de acceso a datos de pedidos.

import { prisma } from "@/lib/prisma";

export interface OrderItemView {
  id: string;
  productTitle: string;
  variantName: string;
  quantity: number;
  unitPrice: string;
  image: string | null;
}

export interface OrderView {
  orderNumber: string;
  status: string;
  email: string;
  subtotal: string;
  shipping: string;
  total: string;
  currency: string;
  createdAt: Date;
  shippingName: string;
  shippingLine1: string;
  shippingLine2: string | null;
  shippingCity: string;
  shippingPostalCode: string;
  shippingCountry: string;
  trackingNumber: string | null;
  items: OrderItemView[];
}

/** Carga un pedido por su número (p.ej. "ORION-K3F9QX"). */
export async function getOrderByNumber(
  orderNumber: string,
): Promise<OrderView | null> {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });
  if (!order) return null;

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    email: order.email,
    subtotal: String(order.subtotal),
    shipping: String(order.shipping),
    total: String(order.total),
    currency: order.currency,
    createdAt: order.createdAt,
    shippingName: order.shippingName,
    shippingLine1: order.shippingLine1,
    shippingLine2: order.shippingLine2,
    shippingCity: order.shippingCity,
    shippingPostalCode: order.shippingPostalCode,
    shippingCountry: order.shippingCountry,
    trackingNumber: order.trackingNumber,
    items: order.items.map((i) => ({
      id: i.id,
      productTitle: i.productTitle,
      variantName: i.variantName,
      quantity: i.quantity,
      unitPrice: String(i.unitPrice),
      image: i.image,
    })),
  };
}
