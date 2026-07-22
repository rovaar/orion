import Image from "next/image";
import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { getAdminProductList } from "@/lib/admin-data";
import { updateProductStatus } from "@/lib/admin-actions";
import { formatMoney } from "@/lib/money";

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

const FILTERS = [
  { key: "todos", label: "Todos" },
  { key: "ACTIVE", label: "Publicados" },
  { key: "DRAFT", label: "Borradores" },
  { key: "ARCHIVED", label: "Archivados" },
];

export default async function AdminProductsPage({
  searchParams,
}: {
  // En Next 16 searchParams es una Promise.
  searchParams: Promise<{ estado?: string }>;
}) {
  await requireAdmin();
  const { estado = "todos" } = await searchParams;
  const all = await getAdminProductList();
  const products =
    estado === "todos" ? all : all.filter((p) => p.status === estado);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Productos</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {all.length} producto(s) ·{" "}
            {all.filter((p) => p.status === "ACTIVE").length} publicado(s)
          </p>
        </div>
        <Link
          href="/admin/productos/nuevo"
          className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 dark:bg-white dark:text-neutral-900"
        >
          + Nuevo producto
        </Link>
      </div>

      {/* Filtros por estado (se reflejan en la URL) */}
      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = estado === f.key;
          const count =
            f.key === "todos"
              ? all.length
              : all.filter((p) => p.status === f.key).length;
          return (
            <Link
              key={f.key}
              href={`/admin/productos?estado=${f.key}`}
              className={`rounded-full px-4 py-1.5 text-xs transition ${
                active
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "border border-neutral-300 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
              }`}
            >
              {f.label} ({count})
            </Link>
          );
        })}
      </div>

      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 py-16 text-center dark:border-neutral-700">
          <p className="text-neutral-500">
            {all.length === 0
              ? "Todavía no hay productos."
              : "Ningún producto con ese estado."}
          </p>
          {all.length === 0 && (
            <p className="mt-2 text-sm text-neutral-400">
              Crea uno con el botón de arriba o carga ejemplos con{" "}
              <code>npm run db:seed</code>.
            </p>
          )}
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full min-w-184 text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-400 dark:bg-neutral-900">
              <tr>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">Variantes</th>
                <th className="px-4 py-3 text-right font-medium">Stock</th>
                <th className="px-4 py-3 text-right font-medium">Precio</th>
                <th className="px-4 py-3 text-right font-medium">Margen</th>
                <th className="px-4 py-3 text-right font-medium">Vendidos</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {products.map((p) => (
                <tr
                  key={p.id}
                  className="transition hover:bg-neutral-50 dark:hover:bg-neutral-900"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-900">
                        {p.image && (
                          <Image
                            src={p.image}
                            alt=""
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/admin/productos/${p.id}`}
                          className="font-medium hover:underline"
                        >
                          {p.title}
                        </Link>
                        <p className="truncate text-xs text-neutral-400">
                          {p.category ?? "Sin categoría"} · /{p.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        STATUS_STYLES[p.status] ?? ""
                      }`}
                    >
                      {STATUS_LABELS[p.status] ?? p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-neutral-500">
                    {p.variantCount}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={
                        p.stock === 0 ? "text-red-600" : "text-neutral-500"
                      }
                    >
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {p.variantCount === 0 ? (
                      <span className="text-neutral-400">—</span>
                    ) : p.priceMin === p.priceMax ? (
                      formatMoney(p.priceMin, p.currency)
                    ) : (
                      `${formatMoney(p.priceMin, p.currency)} – ${formatMoney(
                        p.priceMax,
                        p.currency,
                      )}`
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {p.marginPct === null ? (
                      <span className="text-neutral-400">—</span>
                    ) : (
                      <span
                        className={
                          p.marginPct > 0 ? "text-green-600" : "text-red-600"
                        }
                      >
                        {p.marginPct.toFixed(0)}%
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-neutral-500">
                    {p.unitsSold}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {/* Atajo: publicar/despublicar sin entrar en la ficha. */}
                      <form action={updateProductStatus}>
                        <input type="hidden" name="productId" value={p.id} />
                        <input
                          type="hidden"
                          name="status"
                          value={p.status === "ACTIVE" ? "DRAFT" : "ACTIVE"}
                        />
                        <button
                          type="submit"
                          disabled={p.status !== "ACTIVE" && p.variantCount === 0}
                          title={
                            p.variantCount === 0
                              ? "Añade una variante antes de publicar"
                              : undefined
                          }
                          className="rounded-lg border border-neutral-300 px-3 py-1 text-xs whitespace-nowrap transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:hover:bg-neutral-800"
                        >
                          {p.status === "ACTIVE" ? "Despublicar" : "Publicar"}
                        </button>
                      </form>
                      <Link
                        href={`/admin/productos/${p.id}`}
                        className="rounded-lg border border-neutral-300 px-3 py-1 text-xs whitespace-nowrap transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                      >
                        Editar
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
