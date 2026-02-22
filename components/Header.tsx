"use client";

import React from "react";
import { SidebarTrigger } from "./ui/sidebar";
import { Separator } from "@radix-ui/react-separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "./ui/breadcrumb";
import { ModeToggle } from "./ModeToggle";
import { usePathname } from "next/navigation";

interface Props {
  className?: string;
}

export const Header: React.FC<Props> = ({ className }) => {
  const pathname = usePathname();

  let currentPage = "Dashboard";

  // Простейшие проверки по ключевым словам в пути
  if (pathname.includes("/dashboard/warehouse/add")) {
    currentPage = "Додати товари";
  } else if (pathname.includes("/dashboard/warehouse")) {
    currentPage = "Товари";
    if (pathname.endsWith("/edit")) {
      currentPage += " (Редагувати товар)";
    } else if (/^\/dashboard\/warehouse\/[^/]+$/.test(pathname)) {
      currentPage += " (Інформація про продукт)";
    }
  } else if (pathname.includes("/dashboard/admins")) {
    currentPage = "Адміністратор";
  } else if (pathname.includes("/dashboard/admin")) {
    currentPage = "Адмін";
  } else if (pathname.includes("/dashboard/ads")) {
    currentPage = "Реклама";
  } else if (pathname.includes("/dashboard/announcements")) {
    currentPage = "Оголошення";
  }

  return (
    <div className={className}>
      <header className="flex justify-between h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1 cursor-pointer" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage className="font-bold">
                  {currentPage}
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
