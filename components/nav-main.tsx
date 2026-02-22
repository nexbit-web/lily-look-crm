import { LucideIcon } from "lucide-react";
import { Collapsible } from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const activeUrl = usePathname();
  const ACTIVE_PATTERNS: Record<string, (activeUrl: string) => boolean> = {
    "/dashboard/warehouse": (url) =>
      url === "/dashboard/warehouse" ||
      /^\/dashboard\/warehouse\/[^/]+\/edit$/.test(url),
  };

  const getIsActive = (itemUrl: string, activeUrl: string): boolean =>
    ACTIVE_PATTERNS[itemUrl]?.(activeUrl) ?? activeUrl === itemUrl;
  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map(({ title, url, icon: Icon, isActive }) => (
          <Collapsible key={title} asChild defaultOpen={isActive}>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip={title}
                style={
                  getIsActive(url, activeUrl)
                    ? {
                        backgroundColor: "var(--primary)",
                        color: "var(--background)",
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
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
