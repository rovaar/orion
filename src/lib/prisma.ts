// Cliente Prisma como singleton.
//
// En desarrollo, Next.js recarga el código en caliente (hot reload) muchas
// veces. Sin este patrón, cada recarga crearía una nueva conexión a la BD y
// acabaríamos agotando el pool de conexiones. Guardamos la instancia en
// globalThis para reutilizarla entre recargas.

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma 7 se conecta a Postgres mediante un "driver adapter" (ya no hay
// motor embebido). Le pasamos la cadena de conexión desde DATABASE_URL.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
