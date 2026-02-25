"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { SidebarTrigger } from "./ui/sidebar";
import { Separator } from "@radix-ui/react-separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbLink,
} from "./ui/breadcrumb";
import { ModeToggle } from "./ModeToggle";

// ─── Типи ─────────────────────────────────────────────────────────────────────

interface Props {
  className?: string;
}

// ─── Словник маршрутів ────────────────────────────────────────────────────────
// O(1) пошук — максимально швидко, без циклів і регулярних виразів.
// Динамічні сегменти (:id) обробляються окремо нижче.

const STATIC_ROUTES: Record<string, { label: string; parent?: string }> = {
  "/dashboard": { label: "Головна" },
  "/dashboard/orders": { label: "Всі замовлення", parent: "Замовлення" },
  "/dashboard/orders/add": { label: "Нове замовлення", parent: "Замовлення" },
  "/dashboard/warehouse": { label: "Товари", parent: "Склад" },
  "/dashboard/warehouse/add": { label: "Додати товар", parent: "Склад" },
  "/dashboard/customers": { label: "Всі клієнти", parent: "Клієнти" },
  "/dashboard/customers/add": { label: "Додати клієнта", parent: "Клієнти" },
  "/dashboard/admin": { label: "Адмін панель", parent: "Система" },
  "/dashboard/categories": { label: "Категорії", parent: "Система" },
  "/dashboard/settings": { label: "Налаштування", parent: "Система" },
};

// Динамічні маршрути (/dashboard/orders/123, /dashboard/warehouse/abc/edit тощо)
function resolveDynamicRoute(pathname: string): {
  label: string;
  parent?: string;
} {
  if (pathname.startsWith("/dashboard/orders/"))
    return { label: "Замовлення", parent: "Замовлення" };
  if (pathname.startsWith("/dashboard/warehouse/"))
    return pathname.endsWith("/edit")
      ? { label: "Редагувати товар", parent: "Склад" }
      : { label: "Інформація про товар", parent: "Склад" };
  if (pathname.startsWith("/dashboard/customers/"))
    return pathname.endsWith("/edit")
      ? { label: "Редагувати клієнта", parent: "Клієнти" }
      : { label: "Інформація про клієнта", parent: "Клієнти" };

  return { label: "Dashboard" };
}

// ─── Компонент ────────────────────────────────────────────────────────────────

export const Header: React.FC<Props> = ({ className }) => {
  const pathname = usePathname();

  // Спочатку шукаємо в словнику (O(1)), потім — динамічний fallback
  const route = STATIC_ROUTES[pathname] ?? resolveDynamicRoute(pathname);

  return (
    <div className={className}>
      <header className="flex justify-between h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1 cursor-pointer" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />

          {/* ── Breadcrumb ── */}
          <Breadcrumb>
            <BreadcrumbList>
              {route.parent && (
                <>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink
                      href="/dashboard"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {route.parent}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                </>
              )}
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold">
                  {route.label}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="mr-4">
          <ModeToggle />
        </div>
      </header>
    </div>
  );
};
