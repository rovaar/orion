import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { logout } from "@/lib/auth-actions";

// Layout del panel autenticado. Al estar en el grupo (dashboard), NO envuelve
// a /admin/login.
//
// requireAdmin() aquí es la comprobación REAL (consulta la BD). El proxy solo
// hizo un filtrado rápido leyendo la cookie.
export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="text-lg font-semibold tracking-tight">
              ORION <span className="text-neutral-400">admin</span>
            </Link>
            <nav className="flex gap-6 text-sm">
              <Link href="/admin" className="hover:opacity-70">
                Pedidos
              </Link>
              <Link href="/admin/productos" className="hover:opacity-70">
                Productos
              </Link>
              <Link href="/admin/lista-espera" className="hover:opacity-70">
                Lista de espera
              </Link>
              <Link href="/" className="text-neutral-400 hover:opacity-70">
                Ver tienda ↗
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <span className="text-neutral-500">{admin.email}</span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-full border border-neutral-300 px-4 py-1.5 transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="flex-1">{children}</div>
    </div>
  );
}
