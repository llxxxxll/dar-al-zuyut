import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

interface UseLocalDraftOptions<TDraft> {
  storageKey: string;
  value: TDraft;
  onRestore: (draft: TDraft) => void;
  enabled?: boolean;
  ready?: boolean;
  debounceMs?: number;
  shouldSave: (draft: TDraft) => boolean;
}

export function useLocalDraft<TDraft>({
  storageKey,
  value,
  onRestore,
  enabled = true,
  ready = true,
  debounceMs = 800,
  shouldSave,
}: UseLocalDraftOptions<TDraft>) {
  const { user } = useAuth();
  const [hasDraft, setHasDraft] = useState(false);
  const [restored, setRestored] = useState(false);
  const restoreKeyRef = useRef<string | null>(null);
  const restoreHandlerRef = useRef(onRestore);
  const shouldSaveRef = useRef(shouldSave);

  useEffect(() => {
    restoreHandlerRef.current = onRestore;
    shouldSaveRef.current = shouldSave;
  }, [onRestore, shouldSave]);

  const scopedStorageKey = useMemo(
    () => `${storageKey}:${user?.id ?? "guest"}`,
    [storageKey, user?.id],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!enabled || !ready) {
      if (!enabled) {
        restoreKeyRef.current = null;
        setRestored(false);
      }
      return;
    }
    if (restoreKeyRef.current === scopedStorageKey) return;
    restoreKeyRef.current = scopedStorageKey;

    try {
      const raw = window.localStorage.getItem(scopedStorageKey);
      setHasDraft(Boolean(raw));
      if (!raw) return;
      restoreHandlerRef.current(JSON.parse(raw) as TDraft);
      setRestored(true);
    } catch {
      window.localStorage.removeItem(scopedStorageKey);
      setHasDraft(false);
      setRestored(false);
    }
  }, [enabled, ready, scopedStorageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!enabled || !ready || restoreKeyRef.current !== scopedStorageKey) return;

    const timer = window.setTimeout(() => {
      if (!shouldSaveRef.current(value)) {
        window.localStorage.removeItem(scopedStorageKey);
        setHasDraft(false);
        return;
      }
      window.localStorage.setItem(scopedStorageKey, JSON.stringify(value));
      setHasDraft(true);
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [value, enabled, ready, debounceMs, scopedStorageKey]);

  const clearDraft = useCallback(() => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(scopedStorageKey);
    setHasDraft(false);
    setRestored(false);
  }, [scopedStorageKey]);

  return {
    clearDraft,
    hasDraft,
    restored,
    scopedStorageKey,
  };
}
