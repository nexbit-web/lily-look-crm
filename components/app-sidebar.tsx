"use client";

import * as React from "react";
import {
  BanknoteArrowDown,
  ChartSpline,
  Cog,
  Command,
  House,
  IdCardLanyard,
  LifeBuoy,
  PackageOpen,
  Send,
  ShieldUser,
  ShoppingCart,
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

type AppSidebarUser = {
  name: string;
  email: string;
  image?: string | null;
  role: Role;
};

const navItems = [
  {
    title: "Головна",
    url: "/dashboard/stats",
    icon: House,
    roles: ["OWNER", "ADMIN", "MANAGER", "EMPLOYEE"],
  },
  {
    title: "Замовлення",
    url: "#",
    icon: ShoppingCart,
    roles: ["OWNER", "ADMIN", "MANAGER"],
  },
  {
    title: "Товари",
    url: "/dashboard/warehouse",
    icon: PackageOpen,
    roles: ["OWNER", "ADMIN"],
  },
  {
    title: "Працівники",
    url: "#",
    icon: IdCardLanyard,
    roles: ["OWNER", "ADMIN"],
  },
  {
    title: "Аналітика",
    url: "#",
    icon: ChartSpline,
    roles: ["OWNER", "ADMIN", "MANAGER"],
  },
  {
    title: "Витрати",
    url: "#",
    icon: BanknoteArrowDown,
    roles: ["OWNER", "ADMIN"],
  },
  {
    title: "Адмін",
    url: "/dashboard/admin",
    icon: ShieldUser,
    roles: ["ADMIN"],
  },
  {
    title: "Налаштування",
    url: "#",
    icon: Cog,
    roles: ["OWNER", "ADMIN"],
  },
];

const navSecondary = [
  {
    title: "Підтримка",
    url: "#",
    icon: LifeBuoy,
  },
  {
    title: "Telegram група",
    url: "#",
    icon: Send,
  },
];

export function AppSidebar({
  user,
  ...props
}: { user: AppSidebarUser } & React.ComponentProps<typeof Sidebar>) {
  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user.role),
  );

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <Command className="!size-5" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={filteredNavItems} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
