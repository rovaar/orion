// Configuración global de la tienda.
//
// El modo controla si se puede comprar de verdad o si estamos en fase de
// validación (lista de espera). Se lee de NEXT_PUBLIC_STORE_MODE para poder
// cambiarlo sin tocar código: el día del lanzamiento pones "live".
//
// Al empezar por "NEXT_PUBLIC_", la variable está disponible también en el
// navegador (Client Components), no solo en el servidor.

export type StoreMode = "preview" | "live";

export const STORE_MODE: StoreMode =
  process.env.NEXT_PUBLIC_STORE_MODE === "live" ? "live" : "preview";

/** En preview no se cobra: se capta el interés con lista de espera. */
export const isPreview = STORE_MODE === "preview";

/** true cuando la tienda vende de verdad. */
export const isLive = STORE_MODE === "live";
