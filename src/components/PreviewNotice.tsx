import { WaitlistForm } from "@/components/WaitlistForm";

// Aviso mostrado en carrito/checkout mientras la tienda está en modo preview.
export function PreviewNotice({ source }: { source: string }) {
  return (
    <main className="mx-auto max-w-lg px-6 py-20 text-center">
      <p className="text-sm font-medium uppercase tracking-[0.3em] text-neutral-400">
        Próximamente
      </p>
      <h1 className="mt-4 text-2xl font-semibold">Aún no hemos abierto</h1>
      <p className="mt-3 text-neutral-500">
        Estamos preparando la tienda. Déjanos tu email y serás de los primeros en
        comprar cuando lancemos.
      </p>
      <div className="mt-8">
        <WaitlistForm source={source} />
      </div>
    </main>
  );
}
