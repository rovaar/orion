// Crea (o actualiza) un usuario administrador.
//
// Uso:
//   npm run admin:create -- tu@email.com "TuContraseñaSegura"
//
// La contraseña NUNCA se guarda en claro: se almacena su hash bcrypt.

import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const [email, password] = process.argv.slice(2);

  if (!email || !password) {
    console.error(
      'Uso: npm run admin:create -- tu@email.com "TuContraseñaSegura"',
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("La contraseña debe tener al menos 8 caracteres.");
    process.exit(1);
  }

  // 10 rondas de bcrypt: buen equilibrio entre seguridad y velocidad.
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: "ADMIN" },
    create: { email, passwordHash, role: "ADMIN" },
  });

  console.log(`✅ Administrador listo: ${user.email}`);
  console.log("   Entra en http://localhost:3000/admin/login");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
