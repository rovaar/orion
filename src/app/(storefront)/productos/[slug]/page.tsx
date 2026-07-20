import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug } from "@/lib/products";
import { ProductDetail } from "@/components/ProductDetail";

// Datos siempre frescos desde la BD (no pre-generar en el build).
export const dynamic = "force-dynamic";

// En Next 15+ los params de rutas dinámicas son una Promise.
interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

// SEO: título y descripción por producto (aprovecha el SSR de Next).
export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Producto no encontrado" };
  return {
    title: product.title,
    description: product.description ?? undefined,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  // Si no existe o no está activo, mostramos la página 404 de Next.
  if (!product) notFound();

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <ProductDetail product={product} />
    </main>
  );
}
