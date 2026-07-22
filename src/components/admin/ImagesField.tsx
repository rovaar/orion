"use client";

// Campo de imágenes de la ficha de producto.
//
// Mantiene la lista en estado de React y la manda al servidor en un <input
// hidden> (una URL por línea), que es lo que ya esperaba readProductForm().
// Así el formulario sigue siendo un <form> normal con Server Action.
//
// Las fotos subidas se guardan en cuanto las eliges (uploadProductImages), pero
// no quedan asociadas al producto hasta que pulsas "Guardar".

import { useRef, useState, useTransition } from "react";
import { uploadProductImages } from "@/lib/admin-actions";

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

interface Props {
  /** URLs iniciales (vacío al crear). */
  defaultValue?: string[];
}

export function ImagesField({ defaultValue = [] }: Props) {
  const [images, setImages] = useState<string[]>(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);
  const urlInput = useRef<HTMLInputElement>(null);

  function upload(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;

    setError(null);
    const formData = new FormData();
    for (const file of list) formData.append("files", file);

    startTransition(async () => {
      const result = await uploadProductImages(formData);
      // Añadimos lo que sí se guardó aunque alguna imagen fallara.
      if (result.urls.length > 0) {
        setImages((current) => [...current, ...result.urls]);
      }
      if (result.error) setError(result.error);
    });
  }

  function addUrl() {
    const value = urlInput.current?.value.trim();
    if (!value) return;
    if (images.includes(value)) {
      setError("Esa imagen ya está en la lista");
      return;
    }
    setError(null);
    setImages((current) => [...current, value]);
    if (urlInput.current) urlInput.current.value = "";
  }

  function remove(index: number) {
    setImages((current) => current.filter((_, i) => i !== index));
  }

  /** Mueve una imagen una posición a la izquierda o a la derecha. */
  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= images.length) return;
    setImages((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <div>
      <span className="block text-xs font-medium uppercase tracking-wide text-neutral-500">
        Imágenes
      </span>

      {/* Lo único que viaja al servidor. */}
      <input type="hidden" name="images" value={images.join("\n")} />

      {images.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-3">
          {images.map((url, index) => (
            <li
              key={url}
              className="group relative h-24 w-24 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900"
            >
              {/* <img> y no next/image: aquí pueden aparecer dominios externos
                  que no están en remotePatterns y romperían la página. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Imagen ${index + 1}`}
                className="h-full w-full object-cover"
              />

              {index === 0 && (
                <span className="absolute left-1 top-1 rounded bg-neutral-900/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  Principal
                </span>
              )}

              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-neutral-900/70 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label="Mover antes"
                  className="px-2 py-1 text-xs text-white disabled:opacity-30"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label="Quitar imagen"
                  className="px-2 py-1 text-xs text-white hover:text-red-300"
                >
                  Borrar
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === images.length - 1}
                  aria-label="Mover después"
                  className="px-2 py-1 text-xs text-white disabled:opacity-30"
                >
                  →
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Zona de subida: acepta clic y arrastrar-soltar. */}
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          upload(event.dataTransfer.files);
        }}
        className="mt-3 rounded-lg border border-dashed border-neutral-300 px-4 py-6 text-center dark:border-neutral-700"
      >
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(event) => {
            if (event.target.files) upload(event.target.files);
            // Permite volver a elegir el mismo fichero después de borrarlo.
            event.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={pending}
          className="rounded-full border border-neutral-300 px-4 py-1.5 text-sm font-medium transition hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-600 dark:hover:bg-neutral-800"
        >
          {pending ? "Subiendo…" : "Subir del ordenador"}
        </button>
        <p className="mt-2 text-xs text-neutral-400">
          O arrastra las fotos aquí. JPG, PNG, WebP o AVIF, hasta 4 MB cada una.
        </p>
      </div>

      {/* Alternativa para fotos que ya viven en otro sitio (CJ, por ejemplo). */}
      <div className="mt-3 flex gap-2">
        <input
          ref={urlInput}
          type="url"
          placeholder="…o pega la URL de una imagen externa"
          onKeyDown={(event) => {
            // Enter aquí añadiría la URL y además enviaría el formulario.
            if (event.key === "Enter") {
              event.preventDefault();
              addUrl();
            }
          }}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button
          type="button"
          onClick={addUrl}
          className="shrink-0 rounded-lg border border-neutral-300 px-3 text-sm transition hover:bg-neutral-50 dark:border-neutral-600 dark:hover:bg-neutral-800"
        >
          Añadir
        </button>
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
      <p className="mt-2 text-xs text-neutral-400">
        La primera imagen es la principal: es la que sale en el catálogo. Las
        URLs externas necesitan que su dominio esté en <code>next.config.ts</code>.
      </p>
    </div>
  );
}
