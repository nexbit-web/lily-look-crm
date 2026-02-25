"use client";

import { BadgeCheck, EllipsisVertical, LogOut } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useMemo, useCallback } from "react";
import toast from "react-hot-toast";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { signOut } from "@/lib/auth-client";
import { ROLE_LABELS } from "@/hooks/use-role";
import type { Role } from "@/hooks/use-role";

// ─── Типи ─────────────────────────────────────────────────────────────────────

type NavUserProps = {
  name: string;
  email: string;
  image?: string | null;
  role: Role;
};

// ─── Підкомпоненти ────────────────────────────────────────────────────────────

/**
 * Стабільний аватар через next/image — не мигає при навігації,
 * оскільки Next.js кешує та оптимізує зображення через /_next/image.
 */
function UserAvatar({
  src,
  alt,
  fallback,
  size = 32,
}: {
  src?: string | null;
  alt: string;
  fallback: string;
  size?: number;
}) {
  return (
    <Avatar className="h-8 w-8 rounded-lg">
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={size}
          height={size}
          className="rounded-lg object-cover"
          // priority вимикає lazy-loading — зображення не перезавантажується при навігації
          priority
        />
      ) : (
        <AvatarFallback className="rounded-lg select-none">
          {fallback}
        </AvatarFallback>
      )}
    </Avatar>
  );
}

// ─── Компонент ────────────────────────────────────────────────────────────────

export function NavUser({ user }: { user: NavUserProps }) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Мемоізуємо ініціали — не перераховуються при кожному рендері
  const initials = useMemo(
    () =>
      user.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) ?? "?",
    [user.name]
  );

  // useCallback — функція не створюється заново при кожному рендері.
  // Також виправлено баг оригіналу: signOut() більше не викликається двічі.
  const handleSignOut = useCallback(async () => {
    setLoading(true);

    try {
      await toast.promise(signOut(), {
        loading: "Вихід...",
        success: "Ви успішно вийшли",
        error: "Не вдалося вийти",
      });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Помилка виходу:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="cursor-pointer data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <UserAvatar
                src={user.image}
                alt={user.name}
                fallback={initials}
              />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
              <EllipsisVertical className="ml-auto size-4 shrink-0" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            {/* ── Заголовок з даними користувача ── */}
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <UserAvatar
                  src={user.image}
                  alt={user.name}
                  fallback={initials}
                />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
                {/* Роль користувача */}
                <span className="shrink-0 text-xs font-medium text-primary">
                  {ROLE_LABELS[user.role]}
                </span>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {/* ── Акаунт ── */}
            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer">
                <BadgeCheck className="mr-2 size-4" />
                Акаунт
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            {/* ── Вихід ── */}
            <DropdownMenuItem
              onClick={handleSignOut}
              disabled={loading}
              className="cursor-pointer font-medium text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30"
            >
              <LogOut className="mr-2 size-4 text-red-600" />
              {loading ? "Виходимо..." : "Вийти"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}