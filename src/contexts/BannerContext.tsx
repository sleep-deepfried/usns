import React, { createContext, useContext, useState, useCallback } from 'react';

interface BannerMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
}

interface BannerContextValue {
  banners: BannerMessage[];
  showBanner: (title: string, message: string, type?: 'info' | 'success' | 'warning') => void;
  dismissBanner: (id: string) => void;
}

const BannerContext = createContext<BannerContextValue | undefined>(undefined);

export function BannerProvider({ children }: { children: React.ReactNode }) {
  const [banners, setBanners] = useState<BannerMessage[]>([]);

  const showBanner = useCallback((title: string, message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = Date.now().toString();
    setBanners((prev) => [...prev, { id, title, message, type }]);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      dismissBanner(id);
    }, 5000);
  }, []);

  const dismissBanner = useCallback((id: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
  }, []);

  return (
    <BannerContext.Provider value={{ banners, showBanner, dismissBanner }}>
      {children}
    </BannerContext.Provider>
  );
}

export function useBanner() {
  const context = useContext(BannerContext);
  if (!context) throw new Error('useBanner must be used within BannerProvider');
  return context;
}
