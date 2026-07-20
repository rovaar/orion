// Proxy (antes "middleware"). Se ejecuta antes de renderizar las rutas.
//
// ⚠️ IMPORTANTE: esto es solo una comprobación OPTIMISTA. Corre en cada
// petición (incluidas las precargadas), así que aquí solo leemos la cookie y
// verificamos la firma del token: NUNCA consultamos la base de datos.
//
// La comprobación de verdad la hace requireAdmin() en src/lib/dal.ts, dentro
// de cada página del panel. El proxy no es la única línea de defensa.

import { NextResponse, type NextRequest } from "next/server";
import { decryptSession, SESSION_COOKIE } from "@/lib/session-token";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // La página de login debe ser accesible sin sesión.
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await decryptSession(token);

  if (!session || session.role !== "ADMIN") {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Solo se aplica a las rutas del panel.
  matcher: "/admin/:path*",
};
