import React, { useState } from 'react';
import { useAdContext } from '../store/AdContext';
import { AppStep } from '../types';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

// Icons
const LogoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-accent-primary">
    <path d="M12 2.5C12 2.5 5.5 8 5.5 14.5C5.5 18.0899 8.41015 21 12 21C15.5899 21 18.5 18.0899 18.5 14.5C18.5 8 12 2.5 12 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 14.5V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9.5 17.5H14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 11.5L12 14.5L8 11.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Navigation Items with Icons mapped to steps
const NAV_ITEMS = [
  { step: AppStep.BUSINESS, label: 'Dashboard', icon: 'grid' },
  { step: AppStep.ONBOARDING, label: 'Base de Conocimiento', icon: 'book' },
  { step: AppStep.BRANDING, label: 'Branding', icon: 'palette' },
  { step: AppStep.ANALYSIS, label: 'Análisis Visual', icon: 'eye' },
  { step: AppStep.ANGLES, label: 'Ángulos de Venta', icon: 'zap' },
  { step: AppStep.GENERATION, label: 'Fábrica Creativa', icon: 'image' },
  { step: AppStep.EXPORT, label: 'Exportar', icon: 'cloud' },
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { step, setStep, currentBusiness } = useAdContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (newStep: AppStep) => {
    setStep(newStep);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex relative overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-accent-primary/5 rounded-full blur-[100px]" />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-bg-secondary/80 backdrop-blur-md border-b border-border-default flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <LogoIcon />
          <span className="font-bold text-lg">Launch Expert</span>
        </div>
        <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-text-primary">
          <MenuIcon />
        </button>
      </div>

      {/* SIDEBAR (Desktop) */}
      <aside className="hidden md:flex flex-col w-72 h-screen fixed top-0 left-0 z-40 bg-glass-bg backdrop-blur-xl border-r border-border-default overflow-y-auto">
        {/* Header */}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-1">
            <LogoIcon />
            <h1 className="font-bold text-xl tracking-tight text-white">Launch Expert</h1>
          </div>
          <div className="pl-9 flex items-center gap-2">
            <Badge variant="vip" size="sm">VIP Access</Badge>
          </div>
        </div>

        {/* Action Project Card */}
        {currentBusiness && (
          <div className="px-4 mb-6">
            <div className="bg-bg-tertiary/50 border border-border-default rounded-xl p-4">
              <div className="text-xs text-text-muted uppercase font-bold mb-2">Proyecto Activo</div>
              <div className="font-medium text-white truncate">{currentBusiness.name}</div>
              <div className="text-xs text-text-secondary mt-1 truncate">
                {currentBusiness.knowledgeBase?.structuredAnalysis?.productName || 'Sin producto'}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.step}
              onClick={() => handleNavClick(item.step)}
              className={`w-full text-left nav-item ${step === item.step ? 'active' : ''}`}
            >
              {/* Simple Icon Placeholders */}
              {item.icon === 'grid' && <span className="text-lg">❖</span>}
              {item.icon === 'book' && <span className="text-lg">📖</span>}
              {item.icon === 'palette' && <span className="text-lg">🎨</span>}
              {item.icon === 'eye' && <span className="text-lg">👁️</span>}
              {item.icon === 'zap' && <span className="text-lg">⚡</span>}
              {item.icon === 'image' && <span className="text-lg">🖼️</span>}
              {item.icon === 'cloud' && <span className="text-lg">☁️</span>}
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border-default mt-auto">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-bg-tertiary transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-accent-gradient flex items-center justify-center text-white font-bold text-xs">
              AD
            </div>
            <div>
              <div className="text-sm font-medium text-white">Admin User</div>
              <div className="text-xs text-text-muted">Pro Plan</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-4/5 max-w-xs bg-bg-secondary h-full shadow-2xl flex flex-col p-4 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <LogoIcon />
                <span className="font-bold">Menu</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)}><CloseIcon /></button>
            </div>

            <nav className="space-y-2">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.step}
                  onClick={() => handleNavClick(item.step)}
                  className={`w-full p-3 rounded-xl flex items-center gap-3 ${step === item.step ? 'bg-accent-primary text-white' : 'text-text-secondary hover:bg-bg-tertiary'}`}
                >
                  {/* Simple Icon Placeholders */}
                  {item.icon === 'grid' && <span>❖</span>}
                  {item.icon === 'book' && <span>📖</span>}
                  {item.icon === 'palette' && <span>🎨</span>}
                  {item.icon === 'eye' && <span>👁️</span>}
                  {item.icon === 'zap' && <span>⚡</span>}
                  {item.icon === 'image' && <span>🖼️</span>}
                  {item.icon === 'cloud' && <span>☁️</span>}
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 md:ml-72 min-h-screen relative z-10 pt-16 md:pt-0">
        <div className="container mx-auto p-4 md:p-8 lg:p-12 max-w-7xl animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};
