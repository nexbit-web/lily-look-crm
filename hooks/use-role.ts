import { useSession } from "@/lib/auth-client";

export type Role = "OWNER" | "ADMIN" | "MANAGER" | "EMPLOYEE" | "INTERN";

// Описания ролей для отображения в UI
export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Владелец",
  ADMIN: "Адмін",
  MANAGER: "Менеджер",
  EMPLOYEE: "Сотрудник",
  INTERN: "Стажёр",
};

type SessionUser = {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  role: Role;
};

export function useRole() {
  const { data: session, isPending } = useSession();
  const user = session?.user as unknown as SessionUser | undefined;
  const role = user?.role;

  return {
    user,
    role,
    isPending,
    isOwner: role === "OWNER",
    isAdmin: role === "OWNER" || role === "ADMIN",
    isManager: (["OWNER", "ADMIN", "MANAGER"] as Role[]).includes(role!),
    // Используй так: can(["OWNER", "ADMIN"]) — вернёт true/false
    can: (allowed: Role[]) => !!role && allowed.includes(role),
  };
}
