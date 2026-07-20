import { requireAdmin } from "@/lib/dal";
import { getWaitlist, getWaitlistStats } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

export default async function AdminWaitlistPage() {
  await requireAdmin();
  const [entries, stats] = await Promise.all([getWaitlist(), getWaitlistStats()]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Lista de espera</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Gente interesada mientras la tienda está en modo preview. Estos son tus
        primeros clientes potenciales.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <p className="text-xs uppercase tracking-wide text-neutral-400">
            Emails únicos
          </p>
          <p className="mt-1 text-2xl font-semibold">{stats.uniqueEmails}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <p className="text-xs uppercase tracking-wide text-neutral-400">
            Registros totales
          </p>
          <p className="mt-1 text-2xl font-semibold">{stats.total}</p>
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="py-16 text-center text-neutral-500">
          Aún no hay nadie apuntado.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left dark:border-neutral-800 dark:bg-neutral-900">
              <tr>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Interesado en</th>
                <th className="px-4 py-3 font-medium">Origen</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {entries.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3 font-medium">{e.email}</td>
                  <td className="px-4 py-3 text-neutral-500">
                    {e.productSlug || "General"}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {e.source ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {e.createdAt.toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
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
