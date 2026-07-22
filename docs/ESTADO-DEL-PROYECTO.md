# Orion — Estado del proyecto

> Documento vivo. Resume qué es Orion, cómo está construido, qué está hecho y
> qué falta. Actualízalo cuando cambie algo importante.
>
> **Última actualización:** 2026-07-22 · **Estado:** 🟢 Online en modo *preview*
> (lista de espera). Aún no se vende.

---

## 1. Qué es Orion

Tienda online de **dropshipping** (full-stack propio) pensada para integrarse con
**CJdropshipping**: sourcing de productos, sincronización de stock/precio y
creación automática de pedidos al proveedor. Objetivo: coste cero hasta tener
ventas reales. Plan de negocio completo en [`plan-dropshipping.md`](../plan-dropshipping.md).

**En producción:** https://orion.boutique
(la URL de Vercel `orion-one-lac.vercel.app` sigue activa, pero el dominio oficial
es `orion.boutique`).

---

## 2. Stack tecnológico (versiones reales)

| Capa | Tecnología | Notas |
|---|---|---|
| Framework | **Next.js 16** (App Router) | ⚠️ Rompe convenciones antiguas (ver §9) |
| UI | **React 19** + **Tailwind CSS v4** | Server Components por defecto |
| Lenguaje | **TypeScript 5** | |
| ORM | **Prisma 7** + driver adapter `@prisma/adapter-pg` | Prisma 7 no trae motor embebido |
| BD (prod) | **PostgreSQL en Neon** (EU London) | Conexión *pooled* en Vercel |
| BD (local) | `npx prisma dev` (Postgres emulado sobre SQLite) | |
| Hosting | **Vercel** | Auto-deploy desde GitHub |
| Pagos | **Stripe** (SDK v22) | Integrado, pendiente de claves reales |
| Emails | **Resend** | Solo esqueleto (Fase 4) |
| Analítica | **Vercel Analytics** | Sin cookies |
| Auth admin | `jose` (JWT) + `bcryptjs` | Implementación propia |
| Validación | `zod` 4 | |

---

## 3. Estructura del proyecto

```
src/
├── app/
│   ├── layout.tsx                 # Layout raíz (metadata, <Analytics/>)
│   ├── (storefront)/              # Tienda pública (cabecera + pie)
│   │   ├── layout.tsx
│   │   ├── page.tsx               # Home = catálogo / hero de lista de espera
│   │   ├── productos/[slug]/      # Ficha de producto
│   │   ├── carrito/               # Carrito
│   │   ├── checkout/              # Checkout
│   │   ├── pedido/[orderNumber]/  # Confirmación de pedido
│   │   └── legal/                 # aviso-legal, privacidad, cookies
│   ├── (admin)/admin/
│   │   ├── login/                 # Login (fuera del grupo autenticado)
│   │   └── (dashboard)/           # Panel protegido (layout con requireAdmin)
│   │       ├── page.tsx           # Pedidos + métricas
│   │       ├── productos/         # Tabla de productos (filtros por estado)
│   │       │   ├── nuevo/         # Alta de producto
│   │       │   └── [id]/          # Ficha: datos, variantes y borrado
│   │       └── lista-espera/      # Emails captados
│   └── api/
│       ├── products/              # GET catálogo activo
│       ├── imagenes/[id]/         # GET imagen subida desde el panel
│       ├── checkout/              # POST crea pedido (Stripe o simulado)
│       ├── waitlist/              # POST registra email
│       ├── webhooks/stripe/       # Confirmación de pago (firma + idempotente)
│       ├── webhooks/cj/           # (501) tracking CJ — Fase 3
│       ├── orders/                # (501)
│       └── cron/sync-stock/       # (501) sincronización stock — Fase 3
├── components/                    # ProductCard, ProductDetail, WaitlistForm,
│   │                              #   CartIndicator, PreviewNotice, ClearCartOnMount
│   └── admin/                     # ProductForm, ImagesField, VariantsEditor,
│                                  #   ConfirmButton
├── lib/                           # Lógica de negocio (ver §5)
├── proxy.ts                       # Guarda optimista de /admin (antes middleware.ts)
└── generated/prisma/              # Cliente Prisma generado (gitignored)
prisma/
├── schema.prisma                  # Modelos
├── seed.ts                        # Datos de ejemplo (npm run db:seed)
└── create-admin.ts                # Crear admin (npm run admin:create)
```

---

## 4. Modelo de datos (`prisma/schema.prisma`)

- **User** — clientes y admins (`role`). `passwordHash` solo para admins.
- **Product** → **Variant** → **Inventory** (1-a-1). El dinero vive en `Variant`
  (`supplierPrice` = coste CJ, `price` = venta). Mapeo a CJ con `cjProductId` /
  `cjVariantId`. `Product.status`: DRAFT / ACTIVE / ARCHIVED.
- **Order** + **OrderItem** — `OrderItem` guarda *snapshot* (título, precio…) para
  que el histórico no cambie si editas el producto. Campos de Stripe
  (`stripePaymentIntentId`, `stripeSessionId`), de CJ (`cjOrderId`), dirección de
  envío y tracking. `OrderStatus`: PENDING → PAID → PROCESSING → SHIPPED →
  DELIVERED / CANCELLED / REFUNDED.
- **WaitlistEntry** — email + `productSlug` (`""` = interés general) + `source`.
  `@@unique([email, productSlug])`. (No se usa `null` porque una única con NULL no
  deduplica en Postgres.)

> Dinero siempre en `Decimal(10,2)`, nunca `Float`. Al cruzar de Server a Client
> Component se serializa a `string`.

---

## 5. Librerías (`src/lib/`)

| Fichero | Qué hace |
|---|---|
| `prisma.ts` | Cliente Prisma singleton (con driver adapter pg) |
| `products.ts` / `orders.ts` | Consultas de catálogo y pedidos para la tienda |
| `admin-data.ts` / `admin-actions.ts` | Consultas y Server Actions del panel |
| `admin-form-state.ts` | Tipo `FormState` que devuelven las acciones usadas con `useActionState` |
| `checkout.ts` | Validación zod, reglas de envío, nº de pedido |
| `store-config.ts` | Flag `NEXT_PUBLIC_STORE_MODE` (preview/live) |
| `session.ts` / `session-token.ts` | Cookie de sesión / firma JWT (separado para el proxy) |
| `dal.ts` | `requireAdmin()` — comprobación real de auth (consulta BD) |
| `auth-actions.ts` | login / logout (Server Actions) |
| `stripe.ts` | Cliente Stripe perezoso |
| `cj-client.ts` / `email.ts` | Esqueletos (Fase 3 / Fase 4) |
| `money.ts` | Formateo de dinero, cálculo de margen |

---

## 6. Funcionalidades implementadas

### Tienda
- Catálogo (home) y ficha de producto con selector de variante, stock y cantidad.
- Carrito con estado global (`useSyncExternalStore` + `localStorage`), persistente.
- Checkout con formulario de envío + Stripe Checkout (o pago simulado en dev).
- Página de confirmación con estados (PENDING / PAID / CANCELLED).

### Pagos (Stripe)
- `/api/checkout`: valida, **recalcula precios desde la BD** (nunca del cliente),
  crea pedido PENDING, redirige a Stripe.
- `/api/webhooks/stripe`: verifica **firma con cuerpo crudo**, marca PAID y
  descuenta stock de forma **idempotente**.
- Falta: probar end-to-end con claves reales de Stripe (ver §8).

### Panel admin (`/admin`)
- Login propio, pedidos con márgenes y cambio de estado, lista de espera.
- **Productos: CRUD completo.** Tabla con filtros por estado (stock, rango de
  precio, margen medio, unidades vendidas) → ficha individual por producto con
  datos, imágenes, estado y editor de variantes (crear/editar/eliminar,
  precio, coste y stock).
- **Imágenes**: se suben desde el ordenador (o se pega una URL externa, útil
  para CJ), con miniaturas, reordenación y borrado. Los ficheros se guardan
  como bytes en la tabla `ImageAsset` y se sirven en `/api/imagenes/[id]` con
  cache `immutable`. Toda la lógica de almacenamiento está aislada en
  `src/lib/storage.ts`: si el catálogo crece y Postgres se queda corto, se
  cambia a un blob store tocando solo ese fichero. Límite: 4 MB por imagen
  (ver también `serverActions.bodySizeLimit` en `next.config.ts`).
- Reglas: un producto no se puede publicar sin variantes; al eliminar, si tiene
  ventas se **archiva** en vez de borrarse (y las variantes con pedidos no se
  pueden borrar) para no romper el histórico. Al quitar una imagen subida o
  borrar un producto, sus bytes se eliminan de la BD.

### Validación / lanzamiento (modo preview)
- Con `NEXT_PUBLIC_STORE_MODE=preview`: se oculta el carrito/checkout y se
  sustituye "comprar" por **lista de espera**.
- Vercel Analytics + evento `waitlist_signup`.
- Página legales (plantillas).

---

## 7. Seguridad (decisiones clave)

- **Precios siempre desde la BD** en el checkout: el cliente solo manda
  `variantId` + cantidad. Probado que un precio falso (0,01 €) se ignora.
- **Transacción atómica** al crear pedido / descontar stock.
- **Webhook de Stripe**: firma verificada + idempotencia (no descuenta stock dos veces).
- **Auth admin en dos capas** (recomendación oficial de Next):
  1. `src/proxy.ts` — comprobación *optimista* (solo lee la cookie, nunca BD).
  2. `src/lib/dal.ts` `requireAdmin()` — comprobación *real* (consulta BD) en cada
     página **y cada Server Action** (son endpoints HTTP invocables directamente).
- Sesión = JWT firmado (`jose`) en cookie `httpOnly`, `sameSite=lax`, `secure` en prod.
- Contraseñas con bcrypt (10 rondas), login con error genérico y comparación *dummy*.

---

## 8. Despliegue

- **Repo:** github.com/rovaar/orion (rama `main`, auto-deploy en cada push).
- **Vercel:** proyecto `orionv01` → https://orion.boutique
- **Dominio:** `orion.boutique`, con los nameservers apuntando a Vercel
  (`ns1/ns2.vercel-dns.com`), así que el DNS se gestiona desde el panel de Vercel.
  Certificado HTTPS emitido automáticamente.
- **Neon:** Postgres EU (London), plan gratis.

### ⚠️ Gotchas importantes
- **Neon + Vercel exige la connection string POOLED** (host con `-pooler`). La
  directa da error 500 en serverless. Regla: **directa** para migraciones/`db push`
  desde local; **pooled** en la variable de entorno de Vercel.
- El cliente Prisma se regenera en Vercel con el script `postinstall` (`prisma generate`).

### Variables de entorno en Vercel (producción)
| Variable | Valor |
|---|---|
| `DATABASE_URL` | connection string **pooled** de Neon |
| `SESSION_SECRET` | secreto propio (distinto del local) |
| `NEXT_PUBLIC_STORE_MODE` | `preview` |
| `NEXT_PUBLIC_SITE_URL` | `https://orion.boutique` |

---

## 9. Next.js 16 — cambios que nos han afectado

El `AGENTS.md` avisa: **leer `node_modules/next/dist/docs/` antes de programar.**
Cambios ya encontrados:
- `middleware.ts` → renombrado a **`proxy.ts`** (en `src/`, exporta `proxy` + `config.matcher`).
- Params de rutas dinámicas son **`Promise`** (`const { slug } = await params`).
- Tailwind v4: configuración en CSS, sin `tailwind.config.js`.
- Regla `react-hooks/set-state-in-effect`: para leer de `localStorage` se usa
  `useSyncExternalStore`, no `Context + useEffect`.

---

## 10. Comandos habituales

```bash
npm run dev            # desarrollo (necesita la BD: npx prisma dev en otra terminal)
npm run build          # build de producción
npm run lint           # eslint
npx prisma db push     # aplicar el esquema a la BD (local usa db push, no migrate)
npm run db:seed        # datos de ejemplo
npm run admin:create -- email "pass"   # crear/actualizar admin
npm run db:studio      # explorador visual de la BD
```

> ⚠️ Ahora mismo `.env` local apunta a **Neon (producción)**. Para desarrollar sin
> tocar producción, vuelve a descomentar la `DATABASE_URL` local (prisma dev) en `.env`.

---

## 11. Qué falta (roadmap)

### Para "vender de verdad" (pasar de preview a live)
1. **Fase 3 — CJdropshipping** (lo más importante): implementar `cj-client.ts`
   (auth, getProducts, getStock, createOrder, getOrderStatus), el cron de stock
   (`/api/cron/sync-stock`) y el webhook de tracking (`/api/webhooks/cj`). Sin esto,
   un pedido pagado **no llega al proveedor**.
2. **Stripe en modo live** + probar con Stripe CLI (webhooks). Requiere alta fiscal.
3. **Emails** (Resend): confirmación de pedido y envío (`email.ts`).
4. **Rellenar las páginas legales** con datos reales.
5. Cambiar `NEXT_PUBLIC_STORE_MODE` a `live`.

### Tareas del usuario (no técnicas)
- **Fase 1**: nicho, productos ganadores, logo/branding real (ahora hay fotos de relleno).
- **Fase 5**: alta como autónomo/empresa (en estudio con gestoría).
- **Fase 6**: marketing y captación.

### Mejoras opcionales
- Categorías/filtros, buscador, "mis pedidos".
- Cambiar la contraseña del admin de ejemplo (`admin@orion.test`).

---

## 12. Cuentas y servicios

| Servicio | Estado | Para qué |
|---|---|---|
| GitHub | ✅ rovaar/orion | Código + auto-deploy |
| Vercel | ✅ orionv01 | Hosting |
| Dominio | ✅ orion.boutique | DNS gestionado por Vercel |
| Neon | ✅ | Base de datos |
| Stripe | 🟡 cuenta creada (modo prueba) | Pagos — faltan claves en el proyecto |
| CJdropshipping | ⬜ pendiente | Proveedor — Fase 3 |
| Resend | ⬜ pendiente | Emails — Fase 4 |
