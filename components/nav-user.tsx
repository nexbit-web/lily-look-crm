"use client";

import {
  BadgeCheck,
  EllipsisVertical,
  LogOut,
  Download,
  CheckCircle2,
  Smartphone,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useMemo, useCallback, useEffect } from "react";
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

// ─── Types ────────────────────────────────────────────────────────────────────

type NavUserProps = {
  name: string;
  email: string;
  image?: string | null;
  role: Role;
};

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// ─── UserAvatar ───────────────────────────────────────────────────────────────

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

// ─── usePWAInstall ────────────────────────────────────────────────────────────

function usePWAInstall() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Вже запущено як PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    setIsIOS(
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
        !(window as any).MSStream,
    );

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setPrompt(null);
    });
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = useCallback(async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      setPrompt(null);
      toast.success("Додаток встановлено!");
    }
  }, [prompt]);

  return { prompt, installed, isIOS, install };
}

// ─── NavUser ──────────────────────────────────────────────────────────────────

export function NavUser({ user }: { user: NavUserProps }) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const { prompt, installed, isIOS, install } = usePWAInstall();

  const initials = useMemo(
    () =>
      user.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) ?? "?",
    [user.name],
  );

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
            {/* ── Заголовок ── */}
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

            {/* ── Встановити додаток ── */}
            {installed && (
              <DropdownMenuItem
                disabled
                className="text-green-600 dark:text-green-400"
              >
                <CheckCircle2 className="mr-2 size-4" />
                Додаток встановлено
              </DropdownMenuItem>
            )}

            {!installed && prompt && (
              <DropdownMenuItem onClick={install} className="cursor-pointer">
                <Download className="mr-2 size-4" />
                Встановити додаток
              </DropdownMenuItem>
            )}

            {!installed && isIOS && (
              <>
                <DropdownMenuItem
                  onClick={() => setShowIOSHint((v) => !v)}
                  className="cursor-pointer"
                >
                  <Smartphone className="mr-2 size-4" />
                  Встановити на iPhone
                </DropdownMenuItem>
                {showIOSHint && (
                  <div className="px-3 py-2 mx-1 mb-1 rounded-lg bg-gray-50 dark:bg-zinc-800 text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
                    Натисніть{" "}
                    <span className="font-semibold text-gray-700 dark:text-zinc-200">
                      Поділитись ↑
                    </span>{" "}
                    у Safari →{" "}
                    <span className="font-semibold text-gray-700 dark:text-zinc-200">
                      «На екран «Домів»
                    </span>
                  </div>
                )}
              </>
            )}

            {!installed && (prompt || isIOS) && <DropdownMenuSeparator />}

            {/* ── Вийти ── */}
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
