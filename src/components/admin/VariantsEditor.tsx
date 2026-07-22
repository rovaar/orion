"use client";

// Editor de variantes de un producto: una fila-formulario por variante más un
// formulario para añadir. No usamos <table> porque cada fila es un <form> y el
// HTML no permite un formulario que envuelva varias celdas.

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/admin-form-state";
import { ConfirmButton } from "./ConfirmButton";

export interface VariantData {
  id: string;
  name: string;
  sku: string;
  supplierPrice: string;
  price: string;
  currency: string;
  stock: number;
  /** Nº de líneas de pedido que la referencian: si es > 0 no se puede borrar. */
  orderCount: number;
}

type SaveAction = (prev: FormState, formData: FormData) => Promise<FormState>;

interface Props {
  productId: string;
  variants: VariantData[];
  updateAction: SaveAction;
  createAction: SaveAction;
  deleteAction: (formData: FormData) => Promise<void>;
}

const FIELD =
  "w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900";
const HEAD = "text-xs font-medium uppercase tracking-wide text-neutral-400";
/** Rejilla compartida por la cabecera y todas las filas. */
const GRID =
  "grid grid-cols-2 gap-3 sm:grid-cols-[1.4fr_1fr_5rem_6rem_6rem_auto] sm:items-center";

function SaveButton({ label = "Guardar" }: { label?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs whitespace-nowrap transition hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
    >
      {pending ? "…" : label}
    </button>
  );
}

function VariantRow({
  variant,
  updateAction,
  deleteAction,
}: {
  variant: VariantData;
  updateAction: SaveAction;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  const [state, formAction] = useActionState(updateAction, EMPTY_FORM_STATE);
  const canDelete = variant.orderCount === 0;

  return (
    <div className="border-t border-neutral-200 py-3 dark:border-neutral-800">
      <div className="flex items-start gap-2">
        <form action={formAction} className={`flex-1 ${GRID}`}>
          <input type="hidden" name="variantId" value={variant.id} />
          <input
            name="name"
            required
            defaultValue={variant.name}
            aria-label="Nombre de la variante"
            className={FIELD}
          />
          <input
            name="sku"
            required
            defaultValue={variant.sku}
            aria-label="SKU"
            className={`font-mono text-xs ${FIELD}`}
          />
          <input
            name="stock"
            type="number"
            min="0"
            step="1"
            defaultValue={variant.stock}
            aria-label="Stock"
            className={`text-right ${FIELD}`}
          />
          <input
            name="supplierPrice"
            type="number"
            min="0"
            step="0.01"
            defaultValue={variant.supplierPrice}
            aria-label="Coste del proveedor"
            className={`text-right ${FIELD}`}
          />
          <input
            name="price"
            type="number"
            min="0.01"
            step="0.01"
            defaultValue={variant.price}
            aria-label="Precio de venta"
            className={`text-right ${FIELD}`}
          />
          <SaveButton />
        </form>

        {/* Formulario aparte: los <form> no se pueden anidar. */}
        <form action={deleteAction}>
          <input type="hidden" name="variantId" value={variant.id} />
          <ConfirmButton
            message={`¿Eliminar la variante "${variant.name}"?`}
            disabled={!canDelete}
            title={
              canDelete
                ? "Eliminar variante"
                : "No se puede eliminar: aparece en pedidos"
            }
            className="rounded-lg border border-neutral-300 px-2 py-1.5 text-xs text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-neutral-300 disabled:hover:bg-transparent dark:border-neutral-700 dark:hover:bg-red-950"
          >
            ✕
          </ConfirmButton>
        </form>
      </div>

      {!canDelete && (
        <p className="mt-1 text-xs text-neutral-400">
          Aparece en {variant.orderCount} pedido(s): no se puede eliminar.
        </p>
      )}
      {state.error && (
        <p className="mt-1 text-xs text-red-600">{state.error}</p>
      )}
    </div>
  );
}

function NewVariantForm({
  productId,
  createAction,
}: {
  productId: string;
  createAction: SaveAction;
}) {
  const [state, formAction] = useActionState(createAction, EMPTY_FORM_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  // Al crear una variante, vaciamos el formulario para poder encadenar varias.
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <div className="border-t border-neutral-200 pt-4 dark:border-neutral-800">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
        Añadir variante
      </p>
      <form ref={formRef} action={formAction} className={GRID}>
        <input type="hidden" name="productId" value={productId} />
        <input
          name="name"
          required
          placeholder="Negro / M"
          aria-label="Nombre de la variante"
          className={FIELD}
        />
        <input
          name="sku"
          required
          placeholder="SKU-001"
          aria-label="SKU"
          className={`font-mono text-xs ${FIELD}`}
        />
        <input
          name="stock"
          type="number"
          min="0"
          step="1"
          defaultValue={0}
          aria-label="Stock"
          className={`text-right ${FIELD}`}
        />
        <input
          name="supplierPrice"
          type="number"
          min="0"
          step="0.01"
          placeholder="Coste"
          required
          aria-label="Coste del proveedor"
          className={`text-right ${FIELD}`}
        />
        <input
          name="price"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Venta"
          required
          aria-label="Precio de venta"
          className={`text-right ${FIELD}`}
        />
        <SaveButton label="Añadir" />
      </form>
      {state.error && <p className="mt-2 text-xs text-red-600">{state.error}</p>}
    </div>
  );
}

export function VariantsEditor({
  productId,
  variants,
  updateAction,
  createAction,
  deleteAction,
}: Props) {
  return (
    <div>
      {variants.length > 0 && (
        <div className={`hidden pb-2 sm:grid ${GRID}`}>
          <span className={HEAD}>Variante</span>
          <span className={HEAD}>SKU</span>
          <span className={`${HEAD} text-right`}>Stock</span>
          <span className={`${HEAD} text-right`}>Coste</span>
          <span className={`${HEAD} text-right`}>Venta</span>
          <span />
        </div>
      )}

      {variants.length === 0 && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          Este producto no tiene variantes todavía. Añade al menos una (precio y
          stock viven en la variante) para poder publicarlo.
        </p>
      )}

      {variants.map((v) => (
        <VariantRow
          key={v.id}
          variant={v}
          updateAction={updateAction}
          deleteAction={deleteAction}
        />
      ))}

      <div className="mt-4">
        <NewVariantForm productId={productId} createAction={createAction} />
      </div>
    </div>
  );
}
