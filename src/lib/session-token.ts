// Firma y verificación del token de sesión (JWT con `jose`).
//
// Este módulo es deliberadamente "puro": no toca cookies ni next/headers, para
// poder usarlo también desde proxy.ts, que corre en un runtime distinto.

import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "orion_session";
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

export interface SessionPayload {
  userId: string;
  role: string;
  expiresAt: number; // epoch ms
}

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET falta o es demasiado corto (mínimo 32 caracteres). " +
        "Genera uno con: node -e \"console.log(require('crypto').randomBytes(48).toString('base64url'))\"",
    );
  }
  return new TextEncoder().encode(secret);
}

/** Firma el payload de sesión como JWT. */
export async function encryptSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(new Date(payload.expiresAt))
    .sign(getSecretKey());
}

/** Verifica la firma y devuelve el payload, o null si el token no es válido. */
export async function decryptSession(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    // Firma inválida, token caducado o manipulado.
    return null;
  }
}
