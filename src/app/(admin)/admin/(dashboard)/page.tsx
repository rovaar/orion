import { requireAdmin } from "@/lib/dal";
import { getAdminOrders, getAdminStats } from "@/lib/admin-data";
import { updateOrderStatus } from "@/lib/admin-actions";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

const STATUSES = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

// Colores por estado, para leer la tabla de un vistazo.
const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  PAID: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  PROCESSING: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  SHIPPED: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  DELIVERED: "bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  REFUNDED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export default async function AdminOrdersPage() {
  // Comprobación real, aunque el layout ya la haga: defensa en profundidad.
  await requireAdmin();

  const [orders, stats] = await Promise.all([getAdminOrders(), getAdminStats()]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Pedidos</h1>

      {/* Métricas */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Pedidos totales" value={String(stats.totalOrders)} />
        <Stat label="Pedidos cobrados" value={String(stats.paidOrders)} />
        <Stat
          label="Ingresos"
          value={formatMoney(stats.revenue, stats.currency)}
        />
        <Stat
          label="Beneficio estimado"
          value={formatMoney(stats.profit, stats.currency)}
          hint="Venta − coste proveedor"
        />
      </div>

      {/* Tabla de pedidos */}
      {orders.length === 0 ? (
        <p className="py-16 text-center text-neutral-500">
          Todavía no hay pedidos.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left dark:border-neutral-800 dark:bg-neutral-900">
              <tr>
                <th className="px-4 py-3 font-medium">Pedido</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Envío a</th>
                <th className="px-4 py-3 text-right font-medium">Uds.</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-right font-medium">Margen</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
                  <td className="px-4 py-3 text-neutral-500">
                    {order.createdAt.toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{order.email}</td>
                  <td className="px-4 py-3 text-neutral-500">
                    {order.shippingName}
                    <span className="block text-xs text-neutral-400">
                      {order.shippingCity} ({order.shippingCountry})
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">{order.itemCount}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatMoney(order.total, order.currency)}
                  </td>
                  <td className="px-4 py-3 text-right text-green-600">
                    {formatMoney(order.margin, order.currency)}
                  </td>
                  <td className="px-4 py-3">
                    {/* Cambiar estado: se envía al submit del select */}
                    <form action={updateOrderStatus} className="flex items-center gap-2">
                      <input type="hidden" name="orderId" value={order.id} />
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          STATUS_STYLES[order.status] ?? ""
                        }`}
                      >
                        {order.status}
                      </span>
                      <select
                        name="status"
                        defaultValue={order.status}
                        className="rounded-lg border border-neutral-300 bg-transparent px-2 py-1 text-xs dark:border-neutral-700"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="rounded-lg border border-neutral-300 px-2 py-1 text-xs transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                      >
                        Guardar
                      </button>
                    </form>
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

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <p className="text-xs uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-neutral-400">{hint}</p>}
    </div>
  );
}
