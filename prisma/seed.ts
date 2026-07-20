// Seed de datos de ejemplo para desarrollo.
// Ejecutar con: npm run db:seed
//
// Nota: este script corre fuera de Next.js (con tsx), así que no usa el alias
// "@/..." — importa el cliente por ruta relativa y monta su propia conexión.

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Catálogo de ejemplo: cada producto con sus variantes e inventario.
const products = [
  {
    slug: "auriculares-orbit",
    title: "Auriculares Orbit",
    description:
      "Auriculares inalámbricos con cancelación de ruido y 30h de batería.",
    category: "Audio",
    images: ["https://picsum.photos/seed/orbit/800/800"],
    variants: [
      { name: "Negro", color: "Negro", supplierPrice: "18.50", price: "49.90", stock: 25 },
      { name: "Blanco", color: "Blanco", supplierPrice: "18.50", price: "49.90", stock: 12 },
    ],
  },
  {
    slug: "lampara-nebula",
    title: "Lámpara Nebula",
    description:
      "Lámpara de proyección de estrellas con 16 colores y mando a distancia.",
    category: "Hogar",
    images: ["https://picsum.photos/seed/nebula/800/800"],
    variants: [
      { name: "Única", color: null, supplierPrice: "9.90", price: "29.90", stock: 40 },
    ],
  },
  {
    slug: "mochila-vega",
    title: "Mochila Vega",
    description:
      "Mochila antirrobo con puerto USB, impermeable y compartimento para portátil de 15\".",
    category: "Accesorios",
    images: ["https://picsum.photos/seed/vega/800/800"],
    variants: [
      { name: "Gris", color: "Gris", supplierPrice: "14.00", price: "39.90", stock: 18 },
      { name: "Azul", color: "Azul", supplierPrice: "14.00", price: "39.90", stock: 7 },
      { name: "Negro", color: "Negro", supplierPrice: "14.00", price: "39.90", stock: 0 },
    ],
  },
  {
    slug: "reloj-sirius",
    title: "Reloj Sirius",
    description:
      "Smartwatch con monitor de frecuencia cardíaca, SpO2 y notificaciones.",
    category: "Wearables",
    images: ["https://picsum.photos/seed/sirius/800/800"],
    variants: [
      { name: "Correa negra", color: "Negro", supplierPrice: "22.00", price: "59.90", stock: 15 },
      { name: "Correa rosa", color: "Rosa", supplierPrice: "22.00", price: "59.90", stock: 9 },
    ],
  },
];

async function main() {
  console.log("🌱 Sembrando datos de ejemplo...");

  for (const p of products) {
    // upsert por slug: idempotente (se puede re-ejecutar sin duplicar).
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        title: p.title,
        description: p.description,
        category: p.category,
        images: p.images,
        status: "ACTIVE",
      },
      create: {
        slug: p.slug,
        title: p.title,
        description: p.description,
        category: p.category,
        images: p.images,
        status: "ACTIVE",
      },
    });

    for (const v of p.variants) {
      const sku = `${p.slug}-${v.name}`.toLowerCase().replace(/\s+/g, "-");
      await prisma.variant.upsert({
        where: { sku },
        update: {
          name: v.name,
          supplierPrice: v.supplierPrice,
          price: v.price,
          attributes: v.color ? { color: v.color } : undefined,
          image: p.images[0],
        },
        create: {
          productId: product.id,
          sku,
          name: v.name,
          supplierPrice: v.supplierPrice,
          price: v.price,
          attributes: v.color ? { color: v.color } : undefined,
          image: p.images[0],
          inventory: { create: { quantity: v.stock } },
        },
      });

      // Si la variante ya existía, aseguramos el inventario aparte.
      const variant = await prisma.variant.findUnique({ where: { sku } });
      if (variant) {
        await prisma.inventory.upsert({
          where: { variantId: variant.id },
          update: { quantity: v.stock },
          create: { variantId: variant.id, quantity: v.stock },
        });
      }
    }

    console.log(`  ✓ ${p.title} (${p.variants.length} variantes)`);
  }

  console.log("✅ Seed completado.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
