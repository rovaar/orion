"use client";

// Formulario de la ficha de producto. Se usa tanto para crear como para editar:
// solo cambia la Server Action que recibe.
//
// useActionState (React 19) nos da el estado que devuelve la acción, así podemos
// enseñar errores de validación (slug repetido, etc.) sin recargar la página.

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/admin-form-state";
import { ImagesField } from "@/components/admin/ImagesField";

interface Props {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  /** Ausente al crear. */
  product?: {
    id: string;
    title: string;
    slug: string;
    description: string;
    category: string;
    status: string;
    images: string[];
  };
}

const FIELD =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900";
const LABEL = "block text-xs font-medium uppercase tracking-wide text-neutral-500";

function SubmitButton({ label }: { label: string }) {
  // useFormStatus lee el estado del <form> padre: deshabilita mientras envía.
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
    >
      {pending ? "Guardando…" : label}
    </button>
  );
}

export function ProductForm({ action, product }: Props) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);
  const isEdit = Boolean(product);

  return (
    <form action={formAction} className="space-y-5">
      {product && <input type="hidden" name="productId" value={product.id} />}

      <div>
        <label className={LABEL} htmlFor="title">
          Título
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={product?.title}
          placeholder="Lámpara de escritorio LED"
          className={`mt-1 ${FIELD}`}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={LABEL} htmlFor="slug">
            Slug (URL)
          </label>
          <input
            id="slug"
            name="slug"
            defaultValue={product?.slug}
            placeholder="se genera del título"
            className={`mt-1 ${FIELD}`}
          />
          <p className="mt-1 text-xs text-neutral-400">
            La dirección pública: /productos/<em>slug</em>. Cambiarlo rompe los
            enlaces antiguos.
          </p>
        </div>

        <div>
          <label className={LABEL} htmlFor="category">
            Categoría
          </label>
          <input
            id="category"
            name="category"
            defaultValue={product?.category}
            placeholder="Hogar"
            className={`mt-1 ${FIELD}`}
          />
        </div>
      </div>

      <div>
        <label className={LABEL} htmlFor="description">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={product?.description}
          className={`mt-1 ${FIELD}`}
        />
      </div>

      <ImagesField defaultValue={product?.images} />

      {/* Al crear, el producto nace siempre en DRAFT: aún no tiene variantes. */}
      {isEdit && (
        <div>
          <label className={LABEL} htmlFor="status">
            Estado
          </label>
          <select
            id="status"
            name="status"
            defaultValue={product?.status}
            className={`mt-1 sm:w-64 ${FIELD}`}
          >
            <option value="DRAFT">Borrador — no visible en la tienda</option>
            <option value="ACTIVE">Publicado — a la venta</option>
            <option value="ARCHIVED">Archivado — retirado</option>
          </select>
        </div>
      )}
      {!isEdit && <input type="hidden" name="status" value="DRAFT" />}

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
          Cambios guardados.
        </p>
      )}

      <SubmitButton label={isEdit ? "Guardar cambios" : "Crear producto"} />
    </form>
  );
}
