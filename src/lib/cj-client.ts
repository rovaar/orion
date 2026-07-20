// Wrapper del API de CJdropshipping.
// Docs oficiales: https://developers.cjdropshipping.com/
//
// FASE 3: aquí implementaremos la integración real. De momento definimos los
// tipos y las firmas de las funciones que el resto del proyecto usará, para
// programar contra una interfaz estable. Cada función marca con TODO la
// llamada real que falta.
//
// Autenticación CJ: se obtiene un accessToken (POST getAccessToken con
// email + API key) que caduca; conviene cachearlo. Lo dejamos para Fase 3.

const CJ_BASE_URL = "https://developers.cjdropshipping.com/api2.0/v1";

// --- Tipos de dominio (lo que devolvemos hacia dentro de la app) ---

export interface CjProduct {
  cjProductId: string;
  title: string;
  description?: string;
  images: string[];
  variants: CjVariant[];
}

export interface CjVariant {
  cjVariantId: string;
  sku: string;
  name: string;
  supplierPrice: number; // coste en CJ
}

export interface CjStock {
  cjVariantId: string;
  quantity: number;
}

export interface CjOrderInput {
  orderNumber: string;
  shippingName: string;
  shippingPhone?: string;
  shippingLine1: string;
  shippingLine2?: string;
  shippingCity: string;
  shippingState?: string;
  shippingPostalCode: string;
  shippingCountry: string;
  items: { cjVariantId: string; quantity: number }[];
}

export interface CjOrderResult {
  cjOrderId: string;
}

export type CjOrderStatus =
  | "CREATED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface CjTracking {
  cjOrderId: string;
  status: CjOrderStatus;
  trackingNumber?: string;
  carrier?: string;
}

function assertCredentials(): { apiKey: string; apiSecret: string } {
  const apiKey = process.env.CJ_API_KEY;
  const apiSecret = process.env.CJ_API_SECRET;
  if (!apiKey || !apiSecret) {
    throw new Error(
      "Faltan CJ_API_KEY / CJ_API_SECRET en el entorno. Configúralas en .env (Fase 3).",
    );
  }
  return { apiKey, apiSecret };
}

// --- Funciones públicas (a implementar en Fase 3) ---

/** Trae productos del catálogo de CJ para importarlos. */
export async function getProducts(): Promise<CjProduct[]> {
  assertCredentials();
  // TODO Fase 3: GET ${CJ_BASE_URL}/product/list con paginación y auth.
  void CJ_BASE_URL;
  throw new Error("cj-client.getProducts() no implementado todavía (Fase 3).");
}

/** Consulta stock actualizado de una lista de variantes. */
export async function getStock(cjVariantIds: string[]): Promise<CjStock[]> {
  assertCredentials();
  void cjVariantIds;
  // TODO Fase 3: consultar stock/inventario en CJ.
  throw new Error("cj-client.getStock() no implementado todavía (Fase 3).");
}

/** Crea un pedido en CJ tras confirmarse el pago del cliente. */
export async function createOrder(input: CjOrderInput): Promise<CjOrderResult> {
  assertCredentials();
  void input;
  // TODO Fase 3: POST ${CJ_BASE_URL}/shopping/order/createOrder.
  throw new Error("cj-client.createOrder() no implementado todavía (Fase 3).");
}

/** Consulta el estado / tracking de un pedido en CJ. */
export async function getOrderStatus(cjOrderId: string): Promise<CjTracking> {
  assertCredentials();
  void cjOrderId;
  // TODO Fase 3: GET estado del pedido en CJ.
  throw new Error("cj-client.getOrderStatus() no implementado todavía (Fase 3).");
}
