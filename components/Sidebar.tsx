import React from 'react';
import { useAdContext } from '../store/AdContext';
import { AppStep } from '../types';
import {
    LayoutGrid, BookOpen, Palette, ScanEye, Zap, Image as ImageIcon, Cloud,
    LogOut, Rocket, Moon, Sun, ChevronRight
} from 'lucide-react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

export const Sidebar: React.FC<{ mobile?: boolean; onClose?: () => void }> = ({ mobile, onClose }) => {
    const { step, setStep, currentBusiness, logout, theme, toggleTheme } = useAdContext();

    const handleNav = (target: AppStep) => {
        setStep(target);
        if (onClose) onClose();
    };

    const menuItems = [
        { label: 'Dashboard', icon: <LayoutGrid size={20} />, target: AppStep.BUSINESS },
        { label: 'Conocimiento', icon: <BookOpen size={20} />, target: AppStep.ONBOARDING },
        { label: 'Branding', icon: <Palette size={20} />, target: AppStep.BRANDING },
        { label: 'Análisis Visual', icon: <ScanEye size={20} />, target: AppStep.ANALYSIS },
        { label: 'Ángulos', icon: <Zap size={20} />, target: AppStep.ANGLES },
        { label: 'Fábrica Creativa', icon: <ImageIcon size={20} />, target: AppStep.GENERATION },
        { label: 'Exportar', icon: <Cloud size={20} />, target: AppStep.EXPORT },
    ];

    return (
        <div className={`h-full flex flex-col bg-bg-elevated/90 backdrop-blur-xl border-r border-border-default ${mobile ? 'w-full' : 'w-[280px]'}`}>
            {/* Header */}
            <div className="p-6 pb-2">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-primary to-orange-600 flex items-center justify-center text-white shadow-glow-orange">
                        <Rocket size={24} fill="white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-xl tracking-tight text-accent-primary leading-none">LaunchExpert</h1>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-bold">ACADEMIA</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
                {/* Active Project Card */}
                {currentBusiness && (
                    <div className="bg-bg-secondary border border-border-default rounded-xl p-4 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Rocket size={48} />
                        </div>
                        <Badge size="sm" variant="accent" className="mb-2">Proyecto Activo</Badge>
                        <h4 className="font-bold text-text-primary truncate">{currentBusiness.name}</h4>
                        <p className="text-xs text-text-muted mt-1">En progreso</p>
                    </div>
                )}

                {/* Navigation */}
                <nav className="space-y-1">
                    {menuItems.map((item) => {
                        const isActive = step === item.target;
                        return (
                            <button
                                key={item.label}
                                onClick={() => handleNav(item.target)}
                                className={`
                            w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
                            ${isActive
                                        ? 'bg-gradient-to-r from-accent-primary/10 to-transparent text-accent-primary border-l-2 border-accent-primary'
                                        : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary border-l-2 border-transparent'}
                        `}
                            >
                                <span className={`${isActive ? 'text-accent-primary' : 'text-text-muted group-hover:text-text-primary'}`}>
                                    {item.icon}
                                </span>
                                {item.label}
                                {isActive && <ChevronRight size={14} className="ml-auto opacity-50" />}
                            </button>
                        )
                    })}
                </nav>


            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border-default space-y-2">
                <div className="flex items-center justify-between">
                    <button onClick={toggleTheme} className="p-2 text-text-muted hover:text-text-primary transition-colors">
                        {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                    </button>
                    <button onClick={logout} className="p-2 text-text-muted hover:text-red-400 transition-colors flex items-center gap-2 text-xs font-medium">
                        <LogOut size={16} /> Salir
                    </button>
                </div>
            </div>
        </div>
    );
};
