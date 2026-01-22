import React, { useState } from 'react';
import { useAdContext } from '../store/AdContext';
import { AppStep } from '../types';
import { Badge } from './ui/Badge';
import { Toast } from './ui/Toast';
import {
  LayoutDashboard,
  BookOpen,
  Palette,
  Eye,
  Zap,
  Image as ImageIcon,
  Cloud,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Search
} from 'lucide-react';

// Navigation Items with Icons mapped to steps
const NAV_ITEMS = [
  { step: AppStep.BUSINESS, label: 'Dashboard', icon: LayoutDashboard },
  { step: AppStep.ONBOARDING, label: 'Base de Conocimiento', icon: BookOpen },
  { step: AppStep.BRANDING, label: 'Branding Kit', icon: Palette },
  { step: AppStep.ANALYSIS, label: 'Análisis Visual', icon: Eye },
  { step: AppStep.ANGLES, label: 'Ángulos de Venta', icon: Zap },
  { step: AppStep.GENERATION, label: 'Fábrica Creativa', icon: ImageIcon },
  { step: AppStep.EXPORT, label: 'Export & Drive', icon: Cloud },
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { step, setStep, currentBusiness, logout, user, notification, dismissNotification } = useAdContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (newStep: AppStep) => {
    setStep(newStep);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-accent-primary/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px]" />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-bg-secondary/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center shadow-glow-orange">
            <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">Launch Expert</span>
        </div>
        <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-text-secondary hover:text-white transition-colors">
          <Menu size={24} />
        </button>
      </div>

      {/* SIDEBAR (Desktop) */}
      <aside className="hidden md:flex flex-col w-72 h-screen fixed top-0 left-0 z-40 bg-glass-bg backdrop-blur-2xl border-r border-white/5 shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
        {/* Header */}
        <div className="p-6 pb-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-bg-tertiary to-bg-secondary flex items-center justify-center border border-white/5 shadow-inner group cursor-pointer hover:shadow-glow-orange transition-all duration-300">
              <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-white leading-none">Launch Expert</h1>
              <span className="text-[10px] text-accent-primary font-medium tracking-wider uppercase opacity-80">AI Creative Suite</span>
            </div>
          </div>

          {/* Action Project Card / Search */}
          <div className="mb-6 relative group">
            <div className="absolute inset-0 bg-white/5 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative bg-bg-tertiary/40 border border-white/5 rounded-xl p-3 hover:border-white/10 transition-colors cursor-pointer">
              {currentBusiness ? (
                <div className="flex items-start justify-between">
                  <div className="overflow-hidden">
                    <div className="text-[10px] text-text-muted uppercase font-bold tracking-wider mb-1">Proyecto Activo</div>
                    <div className="font-medium text-white truncate text-sm">{currentBusiness.name}</div>
                    <div className="text-[10px] text-text-secondary mt-0.5 truncate opacity-70">
                      {currentBusiness.knowledgeBase?.structuredAnalysis?.avatar?.substring(0, 25) || 'Configurando...'}
                    </div>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-accent-primary/10 flex items-center justify-center text-accent-primary">
                    <ChevronRight size={14} />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-text-muted text-sm py-1">
                  <Search size={16} />
                  <span>Seleccionar proyecto...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto no-scrollbar">
          <div className="px-3 py-2 text-[10px] font-bold text-text-muted uppercase tracking-widest opacity-60">
            Menu Principal
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = step === item.step;
            return (
              <button
                key={item.step}
                onClick={() => handleNavClick(item.step)}
                className={`w-full group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${isActive
                  ? 'text-white font-medium'
                  : 'text-text-secondary hover:text-white hover:bg-white/5'
                  }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-accent-primary/20 to-transparent rounded-xl border border-white/5" />
                )}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-accent-primary rounded-r-full shadow-[0_0_10px_rgba(255,107,53,0.5)]" />
                )}

                <Icon size={18} className={`relative z-10 transition-colors ${isActive ? 'text-accent-primary drop-shadow-[0_0_8px_rgba(255,107,53,0.4)]' : 'group-hover:text-white'}`} />
                <span className="relative z-10 text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-black/20 backdrop-blur-sm">
          <button
            onClick={() => setStep(AppStep.API_SETUP)}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors text-text-secondary hover:text-white mb-2 group"
          >
            <Settings size={18} className="text-text-muted group-hover:text-white transition-colors" />
            <span className="text-sm font-medium">Configuración API</span>
          </button>

          <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group border border-transparent hover:border-white/5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-accent-primary to-purple-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-black group-hover:shadow-lg transition-all">
              {user?.email?.[0].toUpperCase() || 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-medium text-white truncate">{user?.email?.split('@')[0] || 'Usuario'}</div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] text-text-muted uppercase tracking-wider">Pro Plan</span>
              </div>
            </div>
            <button
              onClick={() => { logout(); setStep(AppStep.LOGIN); }}
              className="text-text-muted hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
              title="Cerrar Sesión"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-[85%] max-w-xs bg-[#0A0A0A] h-full shadow-2xl flex flex-col p-6 animate-slide-in-right border-r border-white/10">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center shadow-glow-orange">
                  <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain" />
                </div>
                <span className="font-bold text-white tracking-tight">Launch Expert</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg bg-white/5 text-text-secondary hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = step === item.step;
                return (
                  <button
                    key={item.step}
                    onClick={() => handleNavClick(item.step)}
                    className={`w-full p-3.5 rounded-xl flex items-center gap-3.5 transition-all ${isActive
                      ? 'bg-gradient-to-r from-accent-primary/20 to-transparent border border-white/5 text-white font-medium'
                      : 'text-text-secondary hover:bg-white/5 hover:text-white'
                      }`}
                  >
                    <Icon size={20} className={isActive ? 'text-accent-primary' : ''} />
                    <span className="text-sm">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-auto pt-6 border-t border-white/5">
              <button
                onClick={() => { logout(); setStep(AppStep.LOGIN); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={20} />
                <span className="font-medium">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 md:ml-72 min-h-screen relative z-10 pt-16 md:pt-0 overflow-x-hidden">
        <div className="container mx-auto p-4 md:p-8 lg:p-10 max-w-[1600px] animate-fade-in pb-20">
          {children}
        </div>
      </main>

      {/* Global Notifications */}
      <Toast toast={notification} onDismiss={dismissNotification} />
    </div>
  );
};
