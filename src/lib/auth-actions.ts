"use server";

// Server Actions de autenticación del panel de admin.

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";

// Hash "de mentira" con el que comparar cuando el usuario no existe. Así el
// login tarda lo mismo exista o no el email, y no se puede deducir qué
// direcciones están registradas midiendo el tiempo de respuesta.
const DUMMY_HASH = "$2b$10$CwTycUXWue0Thq9StjUM0uJ8.CkiTfC0nRDPMBEbdb3xZfrK2wPPe";

const loginSchema = z.object({
  email: z.email("Introduce un email válido"),
  password: z.string().min(1, "Introduce la contraseña"),
});

export interface LoginState {
  error?: string;
}

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, passwordHash: true },
  });

  const hash = user?.passwordHash ?? DUMMY_HASH;
  const passwordOk = await bcrypt.compare(password, hash);

  // Mensaje genérico a propósito: no revelamos si falla el email o la
  // contraseña, ni si el usuario existe pero no es admin.
  if (!user || !user.passwordHash || !passwordOk || user.role !== "ADMIN") {
    return { error: "Credenciales incorrectas" };
  }

  await createSession(user.id, user.role);

  // redirect() lanza una excepción de control: debe ir fuera de try/catch.
  redirect("/admin");
}

export async function logout() {
  await deleteSession();
  redirect("/admin/login");
}
