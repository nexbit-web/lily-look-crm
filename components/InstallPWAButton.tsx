"use client";

import { useEffect, useState } from "react";
import { Download, CheckCircle2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// ─── Service Worker registration ──────────────────────────────────────────────

function registerSW() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch((err) => console.error("SW registration failed:", err));
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InstallPWAButton() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    // Реєструємо SW
    registerSW();

    // Перевіряємо чи вже встановлено
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    // iOS detection
    const ios =
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !(window as any).MSStream;
    setIsIOS(ios);

    // Слухаємо prompt для Android/Desktop
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Слухаємо успішну установку
    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setPrompt(null);
      toast.success("Додаток встановлено!");
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Вже встановлено — показуємо статус
  if (installed) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-sm font-medium">
        <CheckCircle2 size={15} />
        Додаток встановлено
      </div>
    );
  }

  // iOS — показуємо підказку
  if (isIOS) {
    return (
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          className="rounded-xl gap-2 cursor-pointer"
          onClick={() => setShowIOSHint((v) => !v)}
        >
          <Smartphone size={15} />
          Встановити на iPhone
        </Button>
        {showIOSHint && (
          <div className="text-xs text-gray-500 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-800 rounded-xl p-3 leading-relaxed">
            Натисніть{" "}
            <span className="font-semibold text-gray-700 dark:text-zinc-200">
              Поділитись
            </span>{" "}
            (іконка ↑) у Safari, потім{" "}
            <span className="font-semibold text-gray-700 dark:text-zinc-200">
              «На екран «Домів»
            </span>
          </div>
        )}
      </div>
    );
  }

  // Android / Desktop Chrome — нативний prompt
  if (!prompt) return null;

  const handleInstall = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      setPrompt(null);
    }
  };

  return (
    <Button onClick={handleInstall} className="rounded-xl gap-2 cursor-pointer">
      <Download size={15} />
      Встановити додаток
    </Button>
  );
}
