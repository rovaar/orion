import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/products — lista los productos activos del catálogo.
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { status: "ACTIVE" },
      include: {
        variants: {
          include: { inventory: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ products });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { error: "No se pudieron cargar los productos. ¿Está la BD configurada?" },
      { status: 500 },
    );
  }
}
