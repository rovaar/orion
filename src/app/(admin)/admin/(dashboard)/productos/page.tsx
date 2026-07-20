import Image from "next/image";
import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { getAdminProducts } from "@/lib/admin-data";
import { updateVariantPrice, updateProductStatus } from "@/lib/admin-actions";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  DRAFT: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  ARCHIVED: "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
};

export default async function AdminProductsPage() {
  await requireAdmin();
  const products = await getAdminProducts();

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Productos</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Ajusta tus precios de venta y publica o retira productos de la tienda.
        El coste es lo que pagas al proveedor.
      </p>

      {products.length === 0 ? (
        <p className="py-16 text-center text-neutral-500">
          No hay productos. Ejecuta <code>npm run db:seed</code> para cargar
          ejemplos.
        </p>
      ) : (
        <div className="mt-8 space-y-6">
          {products.map((product) => (
            <section
              key={product.id}
              className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800"
            >
              {/* Cabecera del producto */}
              <div className="flex items-center gap-4 border-b border-neutral-200 p-4 dark:border-neutral-800">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-900">
                  {product.image && (
                    <Image
                      src={product.image}
                      alt={product.title}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-medium">{product.title}</h2>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        STATUS_STYLES[product.status] ?? ""
                      }`}
                    >
                      {product.status}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    {product.category ?? "Sin categoría"} ·{" "}
                    <Link
                      href={`/productos/${product.slug}`}
                      className="hover:underline"
                    >
                      /{product.slug} ↗
                    </Link>
                  </p>
                </div>

                {/* Publicar / despublicar */}
                <form action={updateProductStatus} className="flex gap-2">
                  <input type="hidden" name="productId" value={product.id} />
                  <input
                    type="hidden"
                    name="status"
                    value={product.status === "ACTIVE" ? "DRAFT" : "ACTIVE"}
                  />
                  <button
                    type="submit"
                    className="rounded-full border border-neutral-300 px-4 py-1.5 text-xs transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                  >
                    {product.status === "ACTIVE" ? "Despublicar" : "Publicar"}
                  </button>
                </form>
              </div>

              {/* Variantes */}
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-400 dark:bg-neutral-900">
                  <tr>
                    <th className="px-4 py-2 font-medium">Variante</th>
                    <th className="px-4 py-2 text-right font-medium">Stock</th>
                    <th className="px-4 py-2 text-right font-medium">Coste</th>
                    <th className="px-4 py-2 text-right font-medium">Margen</th>
                    <th className="px-4 py-2 text-right font-medium">
                      Precio de venta
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {product.variants.map((v) => {
                    const cost = Number(v.supplierPrice);
                    const price = Number(v.price);
                    const profit = price - cost;
                    const multiplier = cost > 0 ? price / cost : 0;

                    return (
                      <tr key={v.id}>
                        <td className="px-4 py-3">
                          {v.name}
                          <span className="block text-xs text-neutral-400">
                            {v.sku}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={
                              v.stock === 0 ? "text-red-600" : "text-neutral-500"
                            }
                          >
                            {v.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-neutral-500">
                          {formatMoney(v.supplierPrice, v.currency)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-green-600">
                            {formatMoney(profit, v.currency)}
                          </span>
                          <span className="block text-xs text-neutral-400">
                            ×{multiplier.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <form
                            action={updateVariantPrice}
                            className="flex items-center justify-end gap-2"
                          >
                            <input type="hidden" name="variantId" value={v.id} />
                            <input
                              type="number"
                              name="price"
                              step="0.01"
                              min="0.01"
                              defaultValue={v.price}
                              className="w-24 rounded-lg border border-neutral-300 px-2 py-1 text-right text-sm dark:border-neutral-700 dark:bg-neutral-900"
                            />
                            <button
                              type="submit"
                              className="rounded-lg border border-neutral-300 px-3 py-1 text-xs transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                            >
                              Guardar
                            </button>
                          </form>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
