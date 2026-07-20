"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";

// Formulario de lista de espera. Capta el email y registra un evento de
// "intención" en analytics para medir el interés real por cada producto.
export function WaitlistForm({
  productSlug,
  source,
  compact = false,
}: {
  productSlug?: string;
  source?: string;
  compact?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, productSlug, source }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "No se pudo registrar.");
        return;
      }

      // Evento de intención: mide cuánta gente deja su email (y por qué producto).
      track("waitlist_signup", { productSlug: productSlug ?? "general" });
      setStatus("done");
    } catch {
      setStatus("error");
      setMessage("Error de conexión. Inténtalo de nuevo.");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-300">
        ✓ ¡Listo! Te avisaremos en cuanto esté disponible.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? "" : "space-y-2"}>
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          className="flex-1 rounded-full border border-neutral-300 px-4 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="whitespace-nowrap rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {status === "loading" ? "…" : "Avísame"}
        </button>
      </div>
      {message && (
        <p className="text-sm text-red-600">{message}</p>
      )}
      {!compact && (
        <p className="text-xs text-neutral-400">
          Sin spam. Solo te escribimos cuando abramos.
        </p>
      )}
    </form>
  );
}
