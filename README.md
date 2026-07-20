# Orion

Tienda online a medida integrada con **CJdropshipping**. Stack full-stack propio
con objetivo de coste cero hasta tener ventas reales.

Ver el plan completo y las fases del proyecto en [`plan-dropshipping.md`](./plan-dropshipping.md).

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Prisma 7** + **PostgreSQL** (driver adapter `@prisma/adapter-pg`)
- **Stripe** (pagos) · **Resend** (emails) · **CJdropshipping** (proveedor) — se integran en sus fases

## Requisitos

- Node.js 20+ (probado con Node 24)
- Una base de datos PostgreSQL. Opciones gratis:
  - **Local sin instalar nada:** `npx prisma dev`
  - **Cloud:** [Supabase](https://supabase.com) o [Neon](https://neon.tech) (tier gratuito)

## Puesta en marcha

```bash
# 1. Instalar dependencias (regenera el cliente Prisma automáticamente)
npm install

# 2. Configurar variables de entorno
cp .env.example .env
#   -> edita .env y pon tu DATABASE_URL real

# 3. Crear las tablas en la base de datos
#    Con `npx prisma dev` en local usa db push (su Postgres emulado no
#    soporta la shadow DB que necesita migrate dev):
npx prisma db push
#    Con un Postgres real (Neon/Supabase) usa migraciones formales:
#    npm run db:migrate

# 4. (Opcional) Datos de ejemplo
npm run db:seed

# 5. Arrancar en desarrollo
npm run dev
```

Abre http://localhost:3000.

> Con `npx prisma dev`, los puertos cambian al reiniciarlo. Si falla la
> conexión, copia el nuevo `DATABASE_URL`/`SHADOW_DATABASE_URL` a `.env`.

## Panel de administración

Crea tu usuario administrador (la contraseña se guarda hasheada con bcrypt):

```bash
npm run admin:create -- tu@email.com "TuContraseñaSegura"
```

Entra en http://localhost:3000/admin/login

Desde el panel puedes ver pedidos con sus márgenes, cambiar estados, ajustar
precios de venta y publicar/despublicar productos.

Requiere `SESSION_SECRET` en `.env` (mínimo 32 caracteres). Genera uno con:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

### Seguridad (defensa en dos capas)

Siguiendo la guía de Next, la autorización **no** depende de una sola capa:

1. **`src/proxy.ts`** (antes `middleware.ts`, renombrado en Next 16) — hace una
   comprobación *optimista*: lee la cookie y verifica la firma del JWT. Nunca
   consulta la base de datos, porque se ejecuta en todas las peticiones.
2. **`src/lib/dal.ts`** — la comprobación *real*, lo más cerca posible de los
   datos: verifica contra la BD que el usuario existe y sigue siendo `ADMIN`.
   Se llama en cada página del panel y en **cada Server Action** (son endpoints
   HTTP reales e invocables directamente).

La sesión es un JWT firmado (`jose`) en una cookie `httpOnly`, `sameSite=lax`,
y `secure` en producción.

## Pagos con Stripe (modo prueba)

Sin `STRIPE_SECRET_KEY`, el checkout usa un **pago simulado** en desarrollo
(crea el pedido como `PAID` directamente), para poder probar la tienda sin
cuenta. Para usar Stripe de verdad:

**1. Claves.** En el panel de Stripe con *Modo de prueba* activo, ve a
Desarrolladores → Claves de API y ponlas en `.env`:

```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**2. Stripe CLI** (para que los webhooks lleguen a `localhost`):

```bash
# Instalar (Windows, con scoop):
scoop install stripe
# o descarga el .exe: https://github.com/stripe/stripe-cli/releases

stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

El comando `listen` imprime un secreto `whsec_...`. Cópialo a `.env`:

```
STRIPE_WEBHOOK_SECRET=whsec_...
```

**3. Reinicia `npm run dev`** (los cambios en `.env` no se recargan solos).

**4. Prueba** con una tarjeta de test: `4242 4242 4242 4242`, cualquier
caducidad futura y cualquier CVC.

### Flujo de pago

1. `POST /api/checkout` valida, **recalcula los precios desde la BD** (nunca
   confía en el navegador) y crea el pedido como `PENDING` sin tocar stock.
2. Redirige a Stripe Checkout.
3. Stripe llama a `POST /api/webhooks/stripe`; se verifica la **firma** con el
   cuerpo crudo, se marca el pedido `PAID` y **ahí** se descuenta el stock.
   La operación es **idempotente** (Stripe reintenta eventos).
4. El cliente vuelve a `/pedido/[orderNumber]`.

## Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build de producción |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Aplica migraciones a la BD (`prisma migrate dev`) |
| `npm run db:studio` | Explorador visual de la BD (`prisma studio`) |
| `npm run db:generate` | Regenera el cliente Prisma |

## Estructura

```
src/
├── app/
│   ├── (storefront)/          # Tienda pública: home, producto, carrito, checkout
│   ├── (admin)/               # Panel de gestión (/admin)
│   └── api/
│       ├── products/          # Catálogo interno
│       ├── orders/            # Pedidos
│       ├── webhooks/          # stripe/ y cj/
│       └── cron/sync-stock/   # Job de sincronización de stock
├── lib/
│   ├── prisma.ts              # Cliente Prisma (singleton)
│   ├── cj-client.ts           # Wrapper del API de CJdropshipping
│   ├── stripe.ts              # Cliente de Stripe
│   ├── email.ts               # Emails con Resend
│   └── money.ts               # Utilidades de dinero
└── generated/prisma/          # Cliente Prisma generado (ignorado en git)
prisma/
└── schema.prisma              # Modelos de datos
```

## Estado por fases

- ✅ **Fase 2 — Arquitectura técnica:** scaffold, esquema de BD, estructura, librerías (esqueletos).
- ⬜ **Fase 3 — Integración CJdropshipping:** implementar `cj-client`, cron de stock, webhook CJ.
- ⬜ **Fase 4 — Tienda funcional:** catálogo, carrito, checkout con Stripe, panel admin, emails.
- ⬜ **Fase 5 — Legal y operativa.**
- ⬜ **Fase 6 — Marketing y lanzamiento.**

Los ficheros de integración (`cj-client.ts`, `stripe.ts`, `email.ts`) y los route
handlers marcados con `501` contienen `TODO` que indican qué falta y en qué fase.
