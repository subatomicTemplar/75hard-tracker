import { createContext, useContext, useRef, useCallback, type ReactNode } from 'react';

type RefreshFn = () => Promise<void>;

interface RefreshContextType {
  registerRefresh: (fn: RefreshFn) => void;
  triggerRefresh: () => Promise<void>;
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

export function RefreshProvider({ children }: { children: ReactNode }) {
  const refreshRef = useRef<RefreshFn | null>(null);

  const registerRefresh = useCallback((fn: RefreshFn) => {
    refreshRef.current = fn;
  }, []);

  const triggerRefresh = useCallback(async () => {
    if (refreshRef.current) {
      await refreshRef.current();
    }
  }, []);

  return (
    <RefreshContext.Provider value={{ registerRefresh, triggerRefresh }}>
      {children}
    </RefreshContext.Provider>
  );
}

export function useRefresh() {
  const context = useContext(RefreshContext);
  if (!context) {
    throw new Error('useRefresh must be used within a RefreshProvider');
  }
  return context;
}
