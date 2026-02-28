import { checkRole } from "@/lib/checkRole";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 🔒 Разрешённые роли
  await checkRole(["OWNER", "ADMIN", "MANAGER"]);

  // Если роль не подходит — произойдёт redirect
  return <>{children}</>;
}
