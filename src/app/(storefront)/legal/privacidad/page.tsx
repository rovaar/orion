import type { Metadata } from "next";

export const metadata: Metadata = { title: "Política de privacidad" };

// PLANTILLA — rellena los [corchetes] y revísala con tu gestoría.
export default function PrivacidadPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
        Política de privacidad
      </h1>

      <p className="mt-4 rounded-lg bg-amber-50 p-3 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
        ⚠️ Plantilla pendiente de completar. Sustituye los [corchetes] por tus
        datos reales y revísala con un profesional antes del lanzamiento.
      </p>

      <h2 className="mt-8 font-semibold text-neutral-900 dark:text-neutral-100">
        1. Responsable del tratamiento
      </h2>
      <p className="mt-2">
        [NOMBRE / RAZÓN SOCIAL] — NIF/CIF [NIF/CIF] — [EMAIL].
      </p>

      <h2 className="mt-6 font-semibold text-neutral-900 dark:text-neutral-100">
        2. Qué datos recogemos y con qué finalidad
      </h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>
          <strong>Lista de espera:</strong> tu dirección de email, para avisarte
          del lanzamiento y de novedades de Orion.
        </li>
        <li>
          <strong>Pedidos (cuando la tienda esté activa):</strong> datos de
          contacto y envío, para tramitar y entregar tu compra.
        </li>
      </ul>

      <h2 className="mt-6 font-semibold text-neutral-900 dark:text-neutral-100">
        3. Base legal
      </h2>
      <p className="mt-2">
        El tratamiento de tu email para la lista de espera se basa en tu
        consentimiento, que puedes retirar en cualquier momento. La gestión de
        pedidos se basa en la ejecución de un contrato.
      </p>

      <h2 className="mt-6 font-semibold text-neutral-900 dark:text-neutral-100">
        4. Conservación
      </h2>
      <p className="mt-2">
        Conservamos tus datos mientras exista la relación o hasta que solicites
        su supresión. Los datos de pedidos se conservan durante los plazos
        legales aplicables (fiscales y mercantiles).
      </p>

      <h2 className="mt-6 font-semibold text-neutral-900 dark:text-neutral-100">
        5. Destinatarios
      </h2>
      <p className="mt-2">
        Podemos usar proveedores que tratan datos por nuestra cuenta (alojamiento,
        analítica, pasarela de pago, proveedor logístico). No vendemos tus datos.
      </p>

      <h2 className="mt-6 font-semibold text-neutral-900 dark:text-neutral-100">
        6. Tus derechos
      </h2>
      <p className="mt-2">
        Puedes ejercer tus derechos de acceso, rectificación, supresión,
        oposición, limitación y portabilidad escribiendo a [EMAIL]. También
        puedes reclamar ante la Agencia Española de Protección de Datos
        (www.aepd.es).
      </p>

      <p className="mt-8 text-xs text-neutral-400">
        Última actualización: [FECHA]
      </p>
    </main>
  );
}
