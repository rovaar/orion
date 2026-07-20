// Gestión de la cookie de sesión del admin (solo servidor).
//
// La lógica del token vive en session-token.ts (reutilizable desde proxy.ts).
// Aquí solo se lee/escribe la cookie.
//
// La cookie es httpOnly => el JavaScript del navegador NO puede leerla, lo que
// protege el token frente a ataques XSS.

import "server-only";
import { cookies } from "next/headers";
import {
  encryptSession,
  SESSION_COOKIE,
  SESSION_DURATION_MS,
} from "@/lib/session-token";

export { SESSION_COOKIE, decryptSession } from "@/lib/session-token";
export type { SessionPayload } from "@/lib/session-token";

/** Crea la sesión y la guarda en la cookie. */
export async function createSession(userId: string, role: string) {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const token = await encryptSession({ userId, role, expiresAt });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true, // no accesible desde JS del navegador
    secure: process.env.NODE_ENV === "production", // solo HTTPS en producción
    sameSite: "lax", // mitiga CSRF
    path: "/",
    expires: new Date(expiresAt),
  });
}

/** Cierra la sesión borrando la cookie. */
export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
