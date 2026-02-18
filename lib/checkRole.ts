import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

type Role = "OWNER" | "ADMIN" | "MANAGER" | "EMPLOYEE" | "INTERN";

type SessionUser = {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  avatarUrl?: string | null;
  role: Role;
};

export async function checkRole(allowedRoles: Role[]): Promise<SessionUser> {
  const session = await auth.api.getSession({ headers: await headers() });

  // Нет сессии — на логин
  if (!session) {
    redirect("/login");
  }

  const user = session.user as unknown as SessionUser;

  // Нет доступа — на forbidden
  if (!allowedRoles.includes(user.role)) {
    redirect("/forbidden");
  }

  return user;
}
