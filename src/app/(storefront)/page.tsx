import { getActiveProducts } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { WaitlistForm } from "@/components/WaitlistForm";
import { isPreview } from "@/lib/store-config";

// Datos siempre frescos desde la BD (no pre-generar en el build).
export const dynamic = "force-dynamic";

// Home = catálogo. Server Component: consulta la BD en el servidor y renderiza.
export default async function HomePage() {
  const products = await getActiveProducts();

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <section className="py-8 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-neutral-400">
          Orion
        </p>
        {isPreview ? (
          <>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Algo bueno está en camino
            </h1>
            <p className="mx-auto mt-4 max-w-md text-neutral-500">
              Estamos preparando el lanzamiento de Orion. Apúntate y sé de los
              primeros en comprar (y en enterarte de las ofertas de salida).
            </p>
            <div className="mx-auto mt-8 max-w-md">
              <WaitlistForm source="home" />
            </div>
            <p className="mt-12 text-sm font-medium uppercase tracking-wide text-neutral-400">
              Un adelanto
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Nuestra selección
            </h1>
            <p className="mt-4 text-neutral-500">
              Productos elegidos con cuidado. Envío directo a tu casa.
            </p>
          </>
        )}
      </section>

      {products.length === 0 ? (
        <p className="py-16 text-center text-neutral-500">
          Aún no hay productos publicados.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-5 py-8 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  );
}
