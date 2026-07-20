import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Dominios externos permitidos para next/image.
    // picsum.photos: fotos de ejemplo durante la maquetación.
    // TODO: al integrar CJ, añadir aquí el dominio de sus imágenes.
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
};

export default nextConfig;
