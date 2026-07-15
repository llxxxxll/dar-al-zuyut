import { useEffect, useState, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa_install_dismissed";
const INSTALLED_KEY = "pwa_installed";

export function usePwaInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS Safari
      window.navigator.standalone === true;
    setIsStandalone(standalone);

    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua) && !/crios|fxios|edgios/.test(ua) === false
      ? /iphone|ipad|ipod/.test(ua)
      : /iphone|ipad|ipod/.test(ua);
    setIsIOS(ios);

    if (standalone || localStorage.getItem(INSTALLED_KEY) === "1") {
      setInstalled(true);
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      localStorage.setItem(INSTALLED_KEY, "1");
      setInstalled(true);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismissed =
    typeof window !== "undefined" && localStorage.getItem(DISMISS_KEY) === "1";

  const promptInstall = useCallback(async () => {
    if (!deferred) return "unavailable" as const;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    if (choice.outcome === "accepted") {
      localStorage.setItem(INSTALLED_KEY, "1");
      setInstalled(true);
      return "accepted" as const;
    }
    return "dismissed" as const;
  }, [deferred]);

  const dismiss = useCallback(() => {
    if (typeof window !== "undefined") localStorage.setItem(DISMISS_KEY, "1");
  }, []);

  const isMobile =
    typeof window !== "undefined" &&
    (/iphone|ipad|ipod|android/i.test(window.navigator.userAgent) ||
      window.matchMedia?.("(max-width: 768px)").matches);
  const inIframe =
    typeof window !== "undefined" && (() => { try { return window.top !== window.self; } catch { return true; } })();

  const canInstall = !installed && !isStandalone && isMobile && !inIframe && (Boolean(deferred) || isIOS);
  const shouldShow = canInstall && !dismissed;

  return { canInstall, shouldShow, installed, isStandalone, isIOS, promptInstall, dismiss, hasNativePrompt: Boolean(deferred) };
}