import Link from "next/link";
import { CartIndicator } from "@/components/CartIndicator";
import { isPreview } from "@/lib/store-config";

// Layout compartido por toda la tienda pública (grupo (storefront)).
// La cabecera y el pie aparecen en home, ficha de producto, carrito y checkout.
export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/80 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            ORION
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/" className="hover:opacity-70">
              Catálogo
            </Link>
            {/* En preview no hay compra: ocultamos el carrito. */}
            {!isPreview && <CartIndicator />}
          </nav>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="border-t border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Orion. Todos los derechos reservados.</p>
          <nav className="flex flex-wrap gap-4">
            <Link href="/legal/aviso-legal" className="hover:opacity-70">
              Aviso legal
            </Link>
            <Link href="/legal/privacidad" className="hover:opacity-70">
              Privacidad
            </Link>
            <Link href="/legal/cookies" className="hover:opacity-70">
              Cookies
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
