import "dotenv/config";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../node_modules/better-auth/dist/crypto/index.mjs";

// npx tsx scripts/create-user.ts

async function main() {
  const email = "";
  const name = "";
  const password = "";
  const role = "";
  const avatarUrl = "";

  // const email = "";
  // const name = "";
  // const password = "";
  // const role = "";
  // const avatarUrl = "";

  // Удаляем старого если есть
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.account.deleteMany({ where: { userId: existing.id } });
    await prisma.session.deleteMany({ where: { userId: existing.id } });
    await prisma.user.delete({ where: { id: existing.id } });
    console.log("🗑️ Старый пользователь удалён");
  }

  // Хешируем пароль именно так как это делает Better Auth
  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      image: avatarUrl,
      avatarUrl,
      role: role as any,
      emailVerified: true,
    },
  });

  await prisma.account.create({
    data: {
      userId: user.id,
      accountId: user.id,
      providerId: "credential",
      password: hashedPassword,
    },
  });

  console.log("✅ Пользователь создан:", user.email, "| Роль:", user.role);
  console.log("🔑 Хеш пароля:", hashedPassword.substring(0, 30) + "...");
}

main()
  .catch((e) => {
    console.error("❌ Ошибка:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
