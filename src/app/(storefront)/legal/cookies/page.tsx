import type { Metadata } from "next";

export const metadata: Metadata = { title: "Política de cookies" };

// PLANTILLA — revísala con tu gestoría. Nota: si en el futuro añades
// herramientas que sí usan cookies (p.ej. píxeles de Meta/TikTok Ads), tendrás
// que mostrar un banner de consentimiento de cookies.
export default function CookiesPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
        Política de cookies
      </h1>

      <p className="mt-4 rounded-lg bg-amber-50 p-3 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
        ⚠️ Plantilla pendiente de completar y revisar.
      </p>

      <h2 className="mt-8 font-semibold text-neutral-900 dark:text-neutral-100">
        Qué usamos actualmente
      </h2>
      <p className="mt-2">
        Usamos una analítica web que <strong>no emplea cookies</strong> ni
        rastrea a los usuarios de forma individual (Vercel Web Analytics), por lo
        que no se muestra banner de cookies.
      </p>
      <p className="mt-2">
        Podemos usar cookies técnicas estrictamente necesarias para el
        funcionamiento del sitio (por ejemplo, mantener tu sesión o tu carrito
        cuando la tienda esté activa).
      </p>

      <h2 className="mt-6 font-semibold text-neutral-900 dark:text-neutral-100">
        Cookies de terceros
      </h2>
      <p className="mt-2">
        Si en el futuro incorporamos herramientas de publicidad o seguimiento que
        instalen cookies, actualizaremos esta política y solicitaremos tu
        consentimiento mediante un banner antes de activarlas.
      </p>

      <p className="mt-8 text-xs text-neutral-400">
        Última actualización: [FECHA]
      </p>
    </main>
  );
}
