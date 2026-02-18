import { checkRole } from "@/lib/checkRole";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Оголошення | CRM Lady Look",
  description: "Оголошення для співробітників",
};

export default async function AnnouncementsPage() {
  await checkRole(["OWNER", "ADMIN", "MANAGER", "EMPLOYEE"]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <h1 className="text-2xl font-semibold">Оголошення</h1>
      <p className="text-sm text-muted-foreground">
        Тут будуть оголошення для співробітників
      </p>
    </div>
  );
}
