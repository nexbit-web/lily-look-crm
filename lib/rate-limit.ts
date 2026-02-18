import { prisma } from "@/lib/prisma";

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

export async function checkLoginRateLimit(ip: string): Promise<{
  success: boolean;
  remaining: number;
  minutesLeft: number;
}> {
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);

  // Считаем попытки за последние 15 минут
  const attempts = await prisma.loginAttempt.count({
    where: {
      ip,
      createdAt: { gte: windowStart },
    },
  });

  if (attempts >= MAX_ATTEMPTS) {
    // Находим когда истечёт блокировка
    const oldest = await prisma.loginAttempt.findFirst({
      where: { ip, createdAt: { gte: windowStart } },
      orderBy: { createdAt: "asc" },
    });

    const resetAt = new Date(
      oldest!.createdAt.getTime() + WINDOW_MINUTES * 60 * 1000,
    );
    const minutesLeft = Math.ceil((resetAt.getTime() - Date.now()) / 1000 / 60);

    return { success: false, remaining: 0, minutesLeft };
  }

  // Записываем попытку
  await prisma.loginAttempt.create({ data: { ip } });

  return {
    success: true,
    remaining: MAX_ATTEMPTS - attempts - 1,
    minutesLeft: 0,
  };
}

// Очистка старых записей (вызывай периодически)
export async function cleanOldAttempts() {
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);
  await prisma.loginAttempt.deleteMany({
    where: { createdAt: { lt: windowStart } },
  });
}
