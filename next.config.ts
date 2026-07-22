import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Dominios externos permitidos para next/image.
    // picsum.photos: fotos de ejemplo durante la maquetación.
    // TODO: al integrar CJ, añadir aquí el dominio de sus imágenes.
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
    ],
    // Las imágenes subidas desde el panel se sirven desde /api/imagenes/[id],
    // que es una ruta propia: no necesita entrar aquí.
  },
  experimental: {
    serverActions: {
      // Las Server Actions aceptan 1 MB por defecto. Subimos fotos de hasta
      // 4 MB (ver MAX_IMAGE_BYTES en src/lib/storage.ts) + el envoltorio del
      // multipart, así que dejamos algo de margen.
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
