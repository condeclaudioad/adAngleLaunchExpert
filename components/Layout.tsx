
import React from 'react';
import { useAdContext } from '../store/AdContext';
import { AppStep } from '../types';
import { ErrorToast } from './ui/ErrorToast';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { step, setStep, theme, toggleTheme, resetApp, currentBusiness, lastError, dismissError, logout, user } = useAdContext();

  const steps = [
    { id: AppStep.BUSINESS, label: 'Dashboard', icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z' },
    { id: AppStep.ONBOARDING, label: 'Base de Conocimiento', icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25' },
    { id: AppStep.BRANDING, label: 'Branding', icon: 'M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42' },
    { id: AppStep.ANALYSIS, label: 'Análisis Visual', icon: 'M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: AppStep.ANGLES, label: 'Ángulos', icon: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z' },
    { id: AppStep.GENERATION, label: 'Fábrica Creativa', icon: 'M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z' },
    { id: AppStep.EXPORT, label: 'Exportar', icon: 'M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125' },
  ];

  return (
    <div className="min-h-screen flex bg-background text-textMain selection:bg-primary/30 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
          <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <ErrorToast error={lastError} onDismiss={dismissError} />
      
      {/* Sidebar */}
      <aside className="w-[280px] border-r border-borderColor bg-[#0f0f0f]/90 backdrop-blur-xl fixed h-full z-20 hidden md:flex flex-col">
        {/* Header */}
        <div className="p-6">
            <div className="flex items-center gap-3 mb-1">
                 <div className="w-8 h-8 bg-gradient-to-br from-primary to-orange-600 rounded-lg flex items-center justify-center shadow-glow">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                      <path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 01.75.75c0 5.056-2.383 9.555-6.084 12.436h.008c.64.459 1.18.96 1.621 1.503a5.215 5.215 0 01-5.18 8.165 4.545 4.545 0 01-3.626-3.626 5.214 5.214 0 018.165-5.18c.542.44 1.044.981 1.503 1.621v.008c2.881-3.701 5.266-8.2 5.266-13.254a.75.75 0 00-.75-.75c-5.055 0-9.554 2.385-13.254 6.084V10.2a.75.75 0 01-.75.75H8.75a.75.75 0 01-.75-.75V8.25a.75.75 0 01.75-.75h2.25v-.318c-3.158 1.486-5.839 3.87-7.669 6.855a.75.75 0 01-1.285-.772A17.96 17.96 0 019.315 7.584z" clipRule="evenodd" />
                    </svg>
                 </div>
                 <h1 className="text-lg font-bold tracking-tight text-white">Launch Expert</h1>
            </div>
            <p className="text-[10px] tracking-[0.2em] font-medium text-textMuted uppercase ml-11">Academia</p>
        </div>

        {/* Current Project Card */}
        {currentBusiness && (
            <div className="px-4 mb-6">
                <Card className="!p-4 bg-gradient-to-br from-surface to-surfaceHighlight border-primary/20">
                    <Badge variant="accent" className="mb-2">Proyecto Activo</Badge>
                    <p className="text-sm font-bold text-white truncate">{currentBusiness.name}</p>
                    <p className="text-xs text-textMuted mt-1">
                        {currentBusiness.knowledgeBase.structuredAnalysis ? 'Estrategia cargada' : 'Configuración pendiente'}
                    </p>
                </Card>
            </div>
        )}

        {/* Navigation */}
        <nav className="px-4 space-y-1 flex-1 overflow-y-auto">
          {steps.map((s) => {
            const isActive = step === s.id;
            const isCompleted = step > s.id;
            
            return (
                <button 
                  key={s.id}
                  onClick={() => setStep(s.id)}
                  disabled={!currentBusiness && s.id > AppStep.BUSINESS}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer text-left group
                    ${isActive 
                      ? 'bg-primary/10 text-primary border border-primary/20' 
                      : 'text-textMuted hover:bg-surfaceHighlight hover:text-white border border-transparent'
                    }
                    ${!currentBusiness && s.id > AppStep.BUSINESS ? 'opacity-40 cursor-not-allowed' : ''}
                  `}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={isActive ? 2 : 1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                  </svg>
                  <span>{s.label}</span>
                  {isCompleted && <span className="ml-auto text-primary text-xs">●</span>}
                </button>
            );
          })}
        </nav>
        
        {/* Footer */}
        <div className="p-4 border-t border-borderColor mt-auto bg-surface/50">
          <div className="flex items-center gap-3 mb-4 px-2">
             <div className="w-8 h-8 rounded-full bg-surfaceHighlight overflow-hidden">
                <img src={user?.picture || `https://ui-avatars.com/api/?name=${user?.name}`} alt="User" />
             </div>
             <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-textMuted truncate">{user?.email}</p>
             </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={resetApp}
                className="px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/20"
              >
                Reset
              </button>
              <button 
                onClick={logout}
                className="px-3 py-2 rounded-lg text-xs font-medium text-textMuted hover:text-white hover:bg-surfaceHighlight transition-colors"
              >
                Salir
              </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-[280px] p-6 md:p-10 overflow-y-auto relative z-10">
        {/* Mobile Header */}
        <header className="mb-8 md:hidden flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="font-bold text-white">LE</span>
            </div>
            <h1 className="text-xl font-bold text-white">Launch Expert</h1>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
};
