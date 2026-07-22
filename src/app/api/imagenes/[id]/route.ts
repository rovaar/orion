// Sirve las imágenes subidas desde el panel (ver src/lib/storage.ts).
//
// Es pública a propósito: son las fotos del catálogo. Lo que nunca hace es
// devolver un Content-Type que el navegador pueda ejecutar — solo se guardan
// tipos de la lista blanca de storage.ts.

import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  // En Next 16 los params de una ruta dinámica son una promesa.
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const image = await prisma.imageAsset.findUnique({
    where: { id },
    select: { data: true, mimeType: true, size: true },
  });

  if (!image) {
    return new Response("Imagen no encontrada", { status: 404 });
  }

  return new Response(image.data, {
    headers: {
      "Content-Type": image.mimeType,
      "Content-Length": String(image.size),
      // Una imagen nunca se sobrescribe: su id cambia si cambias la foto.
      // Por eso podemos cachearla para siempre y no volver a despertar la BD.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
