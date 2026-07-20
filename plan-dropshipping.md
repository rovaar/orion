# Orion — Plan de Proyecto — Tienda Dropshipping a Medida

> **Estado:** Fase 2 (Arquitectura técnica) implementada. Ver [`README.md`](./README.md) para arrancar.
> Versiones reales instaladas: Next.js 16, React 19, Tailwind v4, Prisma 7 (con driver adapter `@prisma/adapter-pg`).

## 🎯 Resumen

Tienda online 100% a medida (full stack propio) integrada con **CJdropshipping** para automatizar sourcing, sincronización de catálogo/stock y creación de pedidos. Objetivo: desarrollar y validar el proyecto con **coste cero** hasta tener ventas reales.

---

## 🧱 Stack tecnológico

| Capa | Tecnología | Coste |
|---|---|---|
| Frontend | Next.js 14+ (React + TypeScript) | Gratis |
| Backend | API Routes de Next.js (o Node/Express separado) | Gratis |
| Base de datos | PostgreSQL | Gratis (tier) |
| ORM | Prisma | Gratis |
| Hosting frontend | Vercel | Gratis (tier) |
| Hosting DB | Supabase o Neon | Gratis (tier) |
| Pagos | Stripe | Sin coste fijo, comisión por venta |
| Emails transaccionales | Resend | Gratis (tier) |
| Proveedor dropshipping | CJdropshipping (API) | Gratis, pagas solo por pedido real |
| Diseño / branding | Figma o Canva | Gratis |

> 💡 Todo el desarrollo se puede hacer sin gastar dinero. Los únicos costes reales aparecen cuando: (1) compras un dominio propio, (2) entra un pedido real de un cliente y lo envías a CJdropshipping, o (3) decides invertir en publicidad.

---

## 🗂️ Estructura de carpetas sugerida (Next.js + TypeScript)

```
mi-tienda/
├── prisma/
│   ├── schema.prisma          # Modelos: Product, Variant, Order, User, Inventory
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── (storefront)/
│   │   │   ├── page.tsx               # Home
│   │   │   ├── productos/[slug]/page.tsx
│   │   │   ├── carrito/page.tsx
│   │   │   └── checkout/page.tsx
│   │   ├── (admin)/
│   │   │   ├── admin/page.tsx         # Panel gestión pedidos/precios
│   │   │   └── admin/productos/page.tsx
│   │   └── api/
│   │       ├── products/route.ts      # CRUD catálogo interno
│   │       ├── orders/route.ts        # Creación de pedidos
│   │       ├── webhooks/
│   │       │   ├── stripe/route.ts    # Confirmación de pago
│   │       │   └── cj/route.ts        # Notificaciones CJdropshipping
│   │       └── cron/
│   │           └── sync-stock/route.ts # Job de sincronización periódica
│   ├── lib/
│   │   ├── cj-client.ts       # Wrapper del API de CJdropshipping
│   │   ├── stripe.ts
│   │   ├── prisma.ts
│   │   └── email.ts
│   ├── components/
│   └── types/
├── .env.local
├── package.json
└── README.md
```

---

## 🔌 Integración con CJdropshipping — flujo automatizado

1. **Importar catálogo**: llamada al API de CJ para traer productos (nombre, imágenes, variantes, precio proveedor).
2. **Aplicar margen**: guardas tu propio precio de venta en tu base de datos (precio_proveedor × margen).
3. **Sincronización periódica (cron job)**: cada X horas, un job llama al API de CJ para actualizar stock y precio de proveedor, y actualiza tu base de datos.
4. **Cliente compra en tu web** → Stripe confirma el pago → webhook de Stripe dispara la creación del pedido.
5. **Pedido automático a CJ**: tu backend llama al endpoint de creación de pedido del API de CJ, pasando dirección de envío y producto.
6. **Tracking**: CJ notifica cambios de estado (procesando, enviado, entregado) vía su API/webhook → actualizas el estado en tu base de datos → envías email al cliente.

**Variables de entorno necesarias:**
```
CJ_API_KEY=
CJ_API_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
DATABASE_URL=
RESEND_API_KEY=
```

---

## 📅 Fases del proyecto

### Fase 1 — Validación y marca (1-2 semanas)
- Definir nicho concreto, buyer persona, 5-10 productos ganadores.
- Naming, logo simple, identidad visual.
- Analizar 2-3 competidores.

### Fase 2 — Arquitectura técnica (1 semana)
- Setup repo: `npx create-next-app@latest` + TypeScript + ESLint/Prettier + Prisma.
- Modelado de datos (productos, variantes, pedidos, usuarios, inventario).
- Diseño de la API interna.

### Fase 3 — Integración con CJdropshipping (1-2 semanas)
- Registro gratuito en CJdropshipping + generación de API key.
- Cliente `cj-client.ts`: funciones `getProducts()`, `getStock()`, `createOrder()`, `getOrderStatus()`.
- Cron job de sincronización de stock/precio.
- Lógica de creación automática de pedido tras pago confirmado.

### Fase 4 — Tienda funcional (2-3 semanas)
- Catálogo, ficha de producto, carrito, checkout con Stripe.
- Panel admin (gestión de precios/márgenes, listado de pedidos).
- Emails transaccionales (confirmación, envío).

### Fase 5 — Legal y operativa
- Alta como autónomo/negocio.
- Términos y condiciones, política de devoluciones, RGPD/cookies.
- Definir márgenes reales considerando tiempos de envío.

### Fase 6 — Marketing y lanzamiento
- SEO on-page (aprovechando SSR de Next.js).
- Ads (Meta/TikTok) o contenido orgánico según presupuesto.
- Test A/B de producto ganador con presupuesto bajo antes de escalar.

---

## ✅ Checklist rápido antes de lanzar

- [ ] Cuenta CJdropshipping creada y API key generada
- [ ] Base de datos con esquema de productos/pedidos migrado
- [ ] Sincronización de stock funcionando (cron probado manualmente)
- [ ] Checkout con Stripe en modo test funcionando end-to-end
- [ ] Webhook de Stripe → creación de pedido en CJ probado con pedido de prueba
- [ ] Emails transaccionales configurados
- [ ] Términos, privacidad y cookies publicados
- [ ] Dominio propio conectado a Vercel

---

## 🔗 Recursos

- Documentación API CJdropshipping: https://developers.cjdropshipping.com/
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs
- Stripe (pagos + webhooks): https://stripe.com/docs
- Resend (emails): https://resend.com/docs
