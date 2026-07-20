import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// POST /api/waitlist — registra un email interesado (modo preview).
const schema = z.object({
  email: z.email("Introduce un email válido"),
  productSlug: z.string().trim().max(200).optional(),
  source: z.string().trim().max(100).optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos no válidos" },
      { status: 400 },
    );
  }

  const { email, source } = parsed.data;
  const productSlug = parsed.data.productSlug ?? ""; // "" = interés general

  try {
    // upsert por (email, productSlug): apuntarse dos veces no da error ni duplica.
    await prisma.waitlistEntry.upsert({
      where: {
        email_productSlug: { email, productSlug },
      },
      update: { source },
      create: { email, productSlug, source },
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/waitlist error:", error);
    return NextResponse.json(
      { error: "No se pudo registrar. Inténtalo de nuevo." },
      { status: 500 },
    );
  }
}
