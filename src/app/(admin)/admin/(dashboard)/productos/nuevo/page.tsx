import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { createProduct } from "@/lib/admin-actions";
import { ProductForm } from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await requireAdmin();

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link
        href="/admin/productos"
        className="text-sm text-neutral-500 hover:underline"
      >
        ← Productos
      </Link>

      <h1 className="mt-4 text-2xl font-semibold">Nuevo producto</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Se creará como <strong>borrador</strong>. Después podrás añadirle
        variantes (precio y stock) y publicarlo.
      </p>

      <div className="mt-8">
        <ProductForm action={createProduct} />
      </div>
    </main>
  );
}
