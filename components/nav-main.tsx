import { LucideIcon } from "lucide-react";
import { Collapsible } from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  isActive?: boolean;
  items?: { title: string; url: string }[];
};

// ─── Active patterns ──────────────────────────────────────────────────────────
// Оголошені ПОЗА компонентом — створюються один раз, не на кожен рендер.
// Ключ — url пункту, значення — функція перевірки поточного pathname.

const ACTIVE_PATTERNS: Record<string, (pathname: string) => boolean> = {
  // Активний на /warehouse/[id] та /warehouse/[id]/edit, але НЕ на /add
  "/dashboard/warehouse": (p) =>
    /^\/dashboard\/warehouse(\/(?!add$)[^/]+(\/edit)?)?$/.test(p),

  // Активний на /customers/[id] та /customers/[id]/edit, але НЕ на /add
  "/dashboard/customers": (p) =>
    /^\/dashboard\/customers(\/(?!add$)[^/]+(\/edit)?)?$/.test(p),

  // Активний на /orders/[id], але НЕ на /add
  "/dashboard/orders": (p) =>
    /^\/dashboard\/orders(\/(?!add$)[^/]+(\/edit)?)?$/.test(p),
};

// Якщо є спеціальний паттерн — використовуємо його, інакше точне співпадіння
const getIsActive = (itemUrl: string, pathname: string): boolean =>
  ACTIVE_PATTERNS[itemUrl]?.(pathname) ?? pathname === itemUrl;

// ─── Component ────────────────────────────────────────────────────────────────

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map(({ title, url, icon: Icon, isActive }) => {
          const active = getIsActive(url, pathname);
          return (
            <Collapsible key={url} asChild defaultOpen={isActive}>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip={title}
                  style={
                    active
                      ? {
                          backgroundColor: "var(--primary)",
                          color: "var(--sidebar-primary-foreground)",
                        }
                      : undefined
                  }
                >
                  <a href={url}>
                    <Icon />
                    <span>{title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
