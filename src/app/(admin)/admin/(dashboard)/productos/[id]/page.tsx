import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/dal";
import { getAdminProduct } from "@/lib/admin-data";
import {
  updateProduct,
  deleteProduct,
  createVariant,
  updateVariant,
  deleteVariant,
} from "@/lib/admin-actions";
import { ProductForm } from "@/components/admin/ProductForm";
import { VariantsEditor } from "@/components/admin/VariantsEditor";
import { ConfirmButton } from "@/components/admin/ConfirmButton";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  DRAFT: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  ARCHIVED:
    "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Publicado",
  DRAFT: "Borrador",
  ARCHIVED: "Archivado",
};

export default async function AdminProductDetailPage({
  params,
}: {
  // En Next 16 los params de rutas dinámicas son una Promise.
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const product = await getAdminProduct(id);
  if (!product) notFound();

  const hasSales = product.orderCount > 0;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link
        href="/admin/productos"
        className="text-sm text-neutral-500 hover:underline"
      >
        ← Productos
      </Link>

      {/* Cabecera */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900">
            {product.images[0] && (
              <Image
                src={product.images[0]}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold">{product.title}</h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  STATUS_STYLES[product.status] ?? ""
                }`}
              >
                {STATUS_LABELS[product.status] ?? product.status}
              </span>
            </div>
            <p className="mt-1 text-xs text-neutral-400">
              <Link
                href={`/productos/${product.slug}`}
                className="hover:underline"
              >
                /productos/{product.slug} ↗
              </Link>{" "}
              · creado el{" "}
              {product.createdAt.toLocaleDateString("es-ES")}
            </p>
          </div>
        </div>
      </div>

      {/* Ficha */}
      <section className="mt-8 rounded-xl border border-neutral-200 p-6 dark:border-neutral-800">
        <h2 className="mb-5 text-sm font-medium uppercase tracking-wide text-neutral-500">
          Ficha
        </h2>
        <ProductForm action={updateProduct} product={product} />
      </section>

      {/* Variantes */}
      <section className="mt-6 rounded-xl border border-neutral-200 p-6 dark:border-neutral-800">
        <h2 className="mb-1 text-sm font-medium uppercase tracking-wide text-neutral-500">
          Variantes
        </h2>
        <p className="mb-5 text-sm text-neutral-500">
          El precio y el stock viven aquí, no en el producto. El coste es lo que
          pagas al proveedor.
        </p>
        <VariantsEditor
          productId={product.id}
          variants={product.variants}
          updateAction={updateVariant}
          createAction={createVariant}
          deleteAction={deleteVariant}
        />
      </section>

      {/* Zona peligrosa */}
      <section className="mt-6 rounded-xl border border-red-200 p-6 dark:border-red-950">
        <h2 className="text-sm font-medium uppercase tracking-wide text-red-600">
          Eliminar producto
        </h2>
        <p className="mt-2 mb-4 text-sm text-neutral-500">
          {hasSales
            ? `Este producto aparece en ${product.orderCount} línea(s) de pedido, así que no se borra: se archivará (deja de verse en la tienda, pero el histórico se conserva).`
            : "Nunca se ha vendido, así que se borrará de la base de datos junto con sus variantes. Esta acción no se puede deshacer."}
        </p>
        <form action={deleteProduct}>
          <input type="hidden" name="productId" value={product.id} />
          <ConfirmButton
            message={
              hasSales
                ? `¿Archivar "${product.title}"?`
                : `¿Eliminar "${product.title}" definitivamente? No se puede deshacer.`
            }
            className="rounded-full border border-red-300 px-5 py-2 text-sm text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
          >
            {hasSales ? "Archivar producto" : "Eliminar definitivamente"}
          </ConfirmButton>
        </form>
      </section>
    </main>
  );
}
