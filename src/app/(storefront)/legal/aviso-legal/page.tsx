import type { Metadata } from "next";

export const metadata: Metadata = { title: "Aviso legal" };

// PLANTILLA — rellena los [corchetes] con tus datos reales y revísala con tu
// gestoría antes de vender. No es asesoramiento legal.
export default function AvisoLegalPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
        Aviso legal
      </h1>

      <p className="mt-4 rounded-lg bg-amber-50 p-3 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
        ⚠️ Plantilla pendiente de completar. Sustituye los [corchetes] por tus
        datos reales y revísala con un profesional antes del lanzamiento.
      </p>

      <h2 className="mt-8 font-semibold text-neutral-900 dark:text-neutral-100">
        1. Datos identificativos
      </h2>
      <p className="mt-2">
        Titular: [NOMBRE Y APELLIDOS o RAZÓN SOCIAL]
        <br />
        NIF/CIF: [NIF/CIF]
        <br />
        Domicilio: [DIRECCIÓN]
        <br />
        Email de contacto: [EMAIL]
        <br />
        Nombre comercial: Orion
      </p>

      <h2 className="mt-6 font-semibold text-neutral-900 dark:text-neutral-100">
        2. Objeto
      </h2>
      <p className="mt-2">
        El presente aviso regula el uso del sitio web Orion (en adelante, el
        &laquo;Sitio&raquo;), cuya titularidad corresponde a la persona indicada
        arriba.
      </p>

      <h2 className="mt-6 font-semibold text-neutral-900 dark:text-neutral-100">
        3. Condiciones de uso
      </h2>
      <p className="mt-2">
        El acceso al Sitio es gratuito. El usuario se compromete a hacer un uso
        adecuado de los contenidos y a no emplearlos para actividades ilícitas.
      </p>

      <h2 className="mt-6 font-semibold text-neutral-900 dark:text-neutral-100">
        4. Propiedad intelectual
      </h2>
      <p className="mt-2">
        Todos los contenidos del Sitio son titularidad del responsable o de
        terceros que han autorizado su uso, y están protegidos por la normativa
        de propiedad intelectual.
      </p>

      <h2 className="mt-6 font-semibold text-neutral-900 dark:text-neutral-100">
        5. Legislación aplicable
      </h2>
      <p className="mt-2">
        Este aviso se rige por la legislación española.
      </p>

      <p className="mt-8 text-xs text-neutral-400">
        Última actualización: [FECHA]
      </p>
    </main>
  );
}
