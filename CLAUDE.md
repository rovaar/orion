@AGENTS.md

# Orion

Tienda de dropshipping. **Estado y arquitectura completos en
[`docs/ESTADO-DEL-PROYECTO.md`](docs/ESTADO-DEL-PROYECTO.md) — léelo antes de trabajar.**

Contexto rápido:
- Stack: Next.js 16 (App Router) + React 19 + Tailwind v4 + Prisma 7 (adapter pg) + Postgres.
- Online en modo *preview* (lista de espera) en https://orion.boutique
  (Neon + GitHub `rovaar/orion` + Vercel, auto-deploy desde `main`).
- Next 16 rompe convenciones: `middleware.ts` → `proxy.ts`, params de rutas son
  `Promise`. Consulta `node_modules/next/dist/docs/` antes de programar.
