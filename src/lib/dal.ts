// Data Access Layer de autenticación.
//
// Esta es la línea de defensa REAL. El proxy (proxy.ts) solo hace una
// comprobación optimista leyendo la cookie; aquí verificamos de verdad,
// lo más cerca posible de los datos, tal y como recomienda Next.
//
// Se usa `cache()` de React para que, aunque varios componentes de la misma
// página llamen a requireAdmin(), la consulta a BD se haga una sola vez.

import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { decryptSession, SESSION_COOKIE } from "@/lib/session";

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
}

/** Lee y valida la sesión de la cookie. No toca la BD. */
export const getSession = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return decryptSession(token);
});

/**
 * Devuelve el admin autenticado o null.
 * Comprueba contra la BD que el usuario sigue existiendo y sigue siendo ADMIN
 * (así, si le quitas el rol, pierde el acceso aunque su token siga vigente).
 */
export const getAdmin = cache(async (): Promise<AdminUser | null> => {
  const session = await getSession();
  if (!session?.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!user || user.role !== "ADMIN") return null;
  return { id: user.id, email: user.email, name: user.name };
});

/**
 * Igual que getAdmin() pero redirige al login si no hay admin válido.
 * Úsalo al principio de CADA página y acción del panel.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
