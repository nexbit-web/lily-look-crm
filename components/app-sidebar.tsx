"use client";

import * as React from "react";
import {
  ShoppingCart,
  PlusCircle,
  Package,
  PackagePlus,
  UsersRound,
  UserRoundPlus,
  ShieldUser,
  LifeBuoy,
  Send,
  Command,
  LucideIcon,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { Role } from "@/hooks/use-role";

// ─── Типи ─────────────────────────────────────────────────────────────────────

type AppSidebarUser = {
  name: string;
  email: string;
  image?: string | null;
  role: Role;
};

type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  roles: Role[];
};

// ─── Конфіг навігації ─────────────────────────────────────────────────────────
// Константа поза компонентом — створюється один раз при завантаженні модуля

const NAV_ITEMS: NavItem[] = [
  // Замовлення
  {
    title: "Всі замовлення",
    url: "/dashboard/orders",
    icon: ShoppingCart,
    roles: ["OWNER", "MANAGER", "ADMIN", "EMPLOYEE", "INTERN"],
  },
  {
    title: "Нове замовлення",
    url: "/dashboard/orders/add",
    icon: PlusCircle,
    roles: ["OWNER", "MANAGER", "ADMIN", "EMPLOYEE", "INTERN"],
  },
  // Склад
  {
    title: "Товари",
    url: "/dashboard/warehouse",
    icon: Package,
    roles: ["OWNER", "MANAGER", "ADMIN", "EMPLOYEE", "INTERN"],
  },
  {
    title: "Додати товар",
    url: "/dashboard/warehouse/add",
    icon: PackagePlus,
    roles: ["OWNER", "MANAGER", "ADMIN"],
  },
  // Клієнти
  {
    title: "Всі клієнти",
    url: "/dashboard/customers",
    icon: UsersRound,
    roles: ["OWNER", "MANAGER", "ADMIN", "EMPLOYEE", "INTERN"],
  },
  {
    title: "Додати клієнта",
    url: "/dashboard/customers/add",
    icon: UserRoundPlus,
    roles: ["OWNER", "MANAGER", "ADMIN", "EMPLOYEE", "INTERN"],
  },
  // Система
  {
    title: "Адмін панель",
    url: "/dashboard/admin",
    icon: ShieldUser,
    roles: ["OWNER", "ADMIN"],
  },
];

const NAV_SECONDARY = [
  { title: "Підтримка", url: "#", icon: LifeBuoy },
  { title: "Telegram група", url: "#", icon: Send },
];

// ─── Компонент ────────────────────────────────────────────────────────────────

export function AppSidebar({
  user,
  ...props
}: { user: AppSidebarUser } & React.ComponentProps<typeof Sidebar>) {
  // Один useMemo, один прохід масиву — швидше не буває
  const visibleItems = React.useMemo(
    () => NAV_ITEMS.filter((item) => item.roles.includes(user.role)),
    [user.role],
  );

  return (
    <Sidebar variant="inset" {...props}>
      {/* ── Шапка ── */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard">
                <Command className="!size-5" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ── Навігація ── */}
      <SidebarContent>
        <NavMain items={visibleItems} />
        <NavSecondary items={NAV_SECONDARY} className="mt-auto" />
      </SidebarContent>

      {/* ── Користувач ── */}
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
