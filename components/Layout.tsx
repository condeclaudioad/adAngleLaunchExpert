import React, { useState } from 'react';
import { useAdContext } from '../store/AdContext';
import { Sidebar } from './Sidebar';
import { Menu, X } from 'lucide-react';
import { ErrorToast } from './ui/ErrorToast';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { lastError, dismissError } = useAdContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-bg-primary text-text-primary selection:bg-accent-primary/30 relative overflow-x-hidden transition-colors duration-300 font-sans">

      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-accent-primary/10 rounded-full blur-[100px] animate-pulse opacity-50" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px] opacity-30" />
      </div>

      <ErrorToast error={lastError} onDismiss={dismissError} />

      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed inset-y-0 left-0 z-50 h-full">
        <Sidebar />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full z-40 bg-bg-elevated/80 backdrop-blur-lg border-b border-border-default px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent-primary flex items-center justify-center text-white font-bold shadow-glow-orange">
            LE
          </div>
          <h1 className="font-bold text-lg text-white">Launch Expert</h1>
        </div>
        <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-text-primary hover:bg-bg-tertiary rounded-lg">
          <Menu />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute top-0 right-0 h-full w-[85%] max-w-[320px] shadow-2xl animate-fade-in transition-transform">
            <div className="absolute top-4 right-4 z-50">
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <Sidebar mobile onClose={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-[280px] min-h-screen relative z-10 p-4 md:p-8 pt-20 md:pt-8 transition-all duration-300">
        <div className="max-w-[1400px] mx-auto animate-fade-in">
          {children}
        </div>
      </main>

    </div>
  );
};
