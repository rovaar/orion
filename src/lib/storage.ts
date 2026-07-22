import "server-only";

// Almacenamiento de imágenes del catálogo.
//
// Implementación actual: los bytes viven en Postgres (tabla ImageAsset) y se
// sirven desde /api/imagenes/[id]. El resto de la aplicación solo conoce la URL
// que devuelve saveImage(), nunca la tabla: para migrar a un blob store
// (Vercel Blob, S3, Cloudinary) basta con reescribir este fichero.

import { prisma } from "@/lib/prisma";

/** Límite por fichero. Sube también `bodySizeLimit` en next.config.ts si lo cambias. */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/** Formatos que aceptamos. WebP/AVIF pesan mucho menos para la misma calidad. */
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

/** Prefijo de las URLs que sirve esta aplicación. */
const URL_PREFIX = "/api/imagenes/";

export type SaveImageResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

function formatMB(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Guarda un fichero subido y devuelve la URL con la que referenciarlo. */
export async function saveImage(file: File): Promise<SaveImageResult> {
  if (file.size === 0) {
    return { ok: false, error: "El fichero está vacío" };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      error: `«${file.name}» pesa ${formatMB(file.size)}; el máximo son ${formatMB(MAX_IMAGE_BYTES)}`,
    };
  }
  // No nos fiamos del `type` que manda el navegador para nada crítico, pero
  // como filtro de conveniencia es suficiente: estos bytes solo se devuelven
  // con el Content-Type de la lista blanca, nunca se ejecutan.
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return {
      ok: false,
      error: `«${file.name}» no es JPG, PNG, WebP ni AVIF`,
    };
  }

  const data = new Uint8Array(await file.arrayBuffer());

  const image = await prisma.imageAsset.create({
    data: { mimeType: file.type, size: data.byteLength, data },
    select: { id: true },
  });

  return { ok: true, url: `${URL_PREFIX}${image.id}` };
}

/** ¿Esta URL apunta a una imagen nuestra (y no a un dominio externo)? */
export function isStoredImage(url: string): boolean {
  return url.startsWith(URL_PREFIX);
}

/**
 * Borra las imágenes propias de una lista de URLs. Las externas se ignoran.
 * Se usa al eliminar un producto para no dejar bytes huérfanos en la BD.
 */
export async function deleteImages(urls: string[]): Promise<void> {
  const ids = urls
    .filter(isStoredImage)
    .map((url) => url.slice(URL_PREFIX.length))
    .filter(Boolean);

  if (ids.length === 0) return;

  await prisma.imageAsset.deleteMany({ where: { id: { in: ids } } });
}
