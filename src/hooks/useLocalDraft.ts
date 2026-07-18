import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

interface UseLocalDraftOptions<TDraft> {
  storageKey: string;
  value: TDraft;
  defaultValue: TDraft;
  onRestore: (draft: TDraft) => void;
  isEmpty: (draft: TDraft) => boolean;
  isEqualToDefault: (draft: TDraft, defaultValue: TDraft) => boolean;
  enabled?: boolean;
  ready?: boolean;
  debounceMs?: number;
}

export function useLocalDraft<TDraft>({
  storageKey,
  value,
  defaultValue,
  onRestore,
  isEmpty,
  isEqualToDefault,
  enabled = true,
  ready = true,
  debounceMs = 800,
}: UseLocalDraftOptions<TDraft>) {
  const { user } = useAuth();
  const [hasDraft, setHasDraft] = useState(false);
  const [restored, setRestored] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const restoreKeyRef = useRef<string | null>(null);
  const restoreHandlerRef = useRef(onRestore);
  const isEmptyRef = useRef(isEmpty);
  const isEqualToDefaultRef = useRef(isEqualToDefault);
  const defaultValueRef = useRef(defaultValue);

  useEffect(() => {
    restoreHandlerRef.current = onRestore;
    isEmptyRef.current = isEmpty;
    isEqualToDefaultRef.current = isEqualToDefault;
    defaultValueRef.current = defaultValue;
  }, [onRestore, isEmpty, isEqualToDefault, defaultValue]);

  const scopedStorageKey = useMemo(
    () => `${storageKey}:${user?.id ?? "guest"}`,
    [storageKey, user?.id],
  );

  const isRealDraft = useCallback((draft: TDraft) => {
    return !isEmptyRef.current(draft) && !isEqualToDefaultRef.current(draft, defaultValueRef.current);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!enabled || !ready) {
      restoreKeyRef.current = null;
      setHasDraft(false);
      setRestored(false);
      setInitialized(false);
      return;
    }
    if (restoreKeyRef.current === scopedStorageKey) return;
    restoreKeyRef.current = scopedStorageKey;
    setRestored(false);

    try {
      const raw = window.localStorage.getItem(scopedStorageKey);
      if (!raw) {
        setHasDraft(false);
        setInitialized(true);
        return;
      }
      const parsed = JSON.parse(raw) as TDraft;
      if (!isRealDraft(parsed)) {
        window.localStorage.removeItem(scopedStorageKey);
        setHasDraft(false);
        setInitialized(true);
        return;
      }
      restoreHandlerRef.current(parsed);
      setHasDraft(true);
      setRestored(true);
      setInitialized(true);
    } catch {
      window.localStorage.removeItem(scopedStorageKey);
      setHasDraft(false);
      setRestored(false);
      setInitialized(true);
    }
  }, [enabled, ready, scopedStorageKey, isRealDraft]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!enabled || !ready || !initialized || restoreKeyRef.current !== scopedStorageKey) return;

    const timer = window.setTimeout(() => {
      if (!isRealDraft(value)) {
        window.localStorage.removeItem(scopedStorageKey);
        setHasDraft(false);
        return;
      }
      window.localStorage.setItem(scopedStorageKey, JSON.stringify(value));
      setHasDraft(true);
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [value, enabled, ready, initialized, debounceMs, scopedStorageKey, isRealDraft]);

  const clearDraft = useCallback(() => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(scopedStorageKey);
    setHasDraft(false);
    setRestored(false);
  }, [scopedStorageKey]);

  return {
    clearDraft,
    hasDraft,
    initialized,
    restored,
    scopedStorageKey,
  };
}
