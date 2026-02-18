import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { registerToastBannerFunction, type ToastBannerType } from '@/lib/toastShim';

interface ToastBannerState {
  id: string;
  title: string;
  subtitle?: string;
  type: ToastBannerType;
  navigateTo?: string;
  /** Auto-dismiss timeout (default 3000ms). */
  durationMs?: number;
  /** Internal: used to play roll-down animation before removal. */
  closing?: boolean;
}

interface ToastBannerContextType {
  toast: ToastBannerState | null;
  showToast: (config: Omit<ToastBannerState, 'id' | 'closing'>) => void;
  hideToast: () => void;
}

const ToastBannerContext = createContext<ToastBannerContextType | undefined>(undefined);

export function ToastBannerProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastBannerState | null>(null);
  const [queue, setQueue] = useState<ToastBannerState[]>([]);

  const autoDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastRef = useRef<ToastBannerState | null>(null);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const clearTimers = useCallback(() => {
    if (autoDismissRef.current) {
      clearTimeout(autoDismissRef.current);
      autoDismissRef.current = null;
    }
    if (closeRef.current) {
      clearTimeout(closeRef.current);
      closeRef.current = null;
    }
  }, []);

  const scheduleAutoDismiss = useCallback((next: ToastBannerState) => {
    const duration = typeof next.durationMs === 'number' ? next.durationMs : 3000;
    autoDismissRef.current = setTimeout(() => {
      hideToast();
    }, duration);
  }, []); // hideToast defined below; stable closure is fine in runtime

  const hideToast = useCallback(() => {
    clearTimers();

    const current = toastRef.current;
    if (!current) {
      // If something is queued but nothing is showing, display the next one.
      setQueue((prev) => {
        if (prev.length > 0) {
          const [next, ...rest] = prev;
          const nextToast = { ...next, closing: false };
          toastRef.current = nextToast;
          setToast(nextToast);
          scheduleAutoDismiss(next);
          return rest;
        }
        return prev;
      });
      return;
    }

    if (current.closing) return;

    const closingToast = { ...current, closing: true };
    toastRef.current = closingToast;
    setToast(closingToast);

    closeRef.current = setTimeout(() => {
      setQueue((prev) => {
        if (prev.length > 0) {
          const [next, ...rest] = prev;
          const nextToast = { ...next, closing: false };
          toastRef.current = nextToast;
          setToast(nextToast);
          scheduleAutoDismiss(next);
          return rest;
        }
        toastRef.current = null;
        setToast(null);
        return prev;
      });
    }, 250);
  }, [clearTimers, scheduleAutoDismiss]);

  const showToast = useCallback((config: Omit<ToastBannerState, 'id' | 'closing'>) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 9);
    const next: ToastBannerState = { ...config, id, closing: false };

    // If a toast is already visible (or in the middle of closing), queue this one.
    if (toastRef.current) {
      setQueue((prev) => [...prev, next]);
      return;
    }

    toastRef.current = next;
    setToast(next);
    scheduleAutoDismiss(next);
  }, [scheduleAutoDismiss]);

  // Register shim so all toast() calls route through the ToastBanner system
  useEffect(() => {
    registerToastBannerFunction(showToast);
    return () => registerToastBannerFunction(null);
  }, [showToast]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  return (
    <ToastBannerContext.Provider value={{ toast, showToast, hideToast }}>
      {children}
    </ToastBannerContext.Provider>
  );
}

export function useToastBanner(): ToastBannerContextType {
  const context = useContext(ToastBannerContext);
  if (context === undefined) {
    throw new Error('useToastBanner must be used within a ToastBannerProvider');
  }
  return context;
}

