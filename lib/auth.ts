import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 8, // сессия живёт 8 часов
    updateAge: 60 * 60, // обновляется каждый час
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // кэш куки 5 минут
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  // Говорим Better Auth что у пользователя есть поле role
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "MANAGER",
        input: true,
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
