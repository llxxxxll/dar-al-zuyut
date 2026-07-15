const APP_SW_PATH = "/sw.js";

function isUnsafeContext(): boolean {
  if (typeof window === "undefined") return true;
  if (!("serviceWorker" in navigator)) return true;
  if (!import.meta.env.PROD) return true;
  try { if (window.top !== window.self) return true; } catch { return true; }
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  return false;
}

async function unregisterAppSW() {
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      regs
        .filter((r) => {
          const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || "";
          return url.endsWith(APP_SW_PATH);
        })
        .map((r) => r.unregister())
    );
    if (typeof caches !== "undefined") {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith("dar-")).map((k) => caches.delete(k)));
    }
  } catch {}
}

export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (isUnsafeContext()) {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      void unregisterAppSW();
    }
    return;
  }
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(APP_SW_PATH, { scope: "/" }).catch(() => {});
  });
}
