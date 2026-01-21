
import React, { useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
    id: string;
    type: ToastType;
    title?: string;
    message: string;
    duration?: number;
}

interface ToastProps {
    toast: ToastMessage | null;
    onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => {
                onDismiss();
            }, toast.duration || 5000);
            return () => clearTimeout(timer);
        }
    }, [toast, onDismiss]);

    if (!toast) return null;

    const bgColors = {
        success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        error: 'bg-red-500/10 border-red-500/20 text-red-400',
        warning: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
        info: 'bg-blue-500/10 border-blue-500/20 text-blue-400'
    };

    const icons = {
        success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
        error: <XCircle className="w-5 h-5 text-red-500" />,
        warning: <AlertTriangle className="w-5 h-5 text-orange-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />
    };

    return (
        <div className="fixed bottom-6 right-6 z-[60] animate-fade-in-up max-w-md w-full px-4 md:px-0">
            <div className={`p-4 rounded-xl shadow-2xl backdrop-blur-md border border-l-4 flex items-start gap-4 ${bgColors[toast.type]}`}>
                <div className="shrink-0 mt-0.5">
                    {icons[toast.type]}
                </div>
                <div className="flex-1">
                    {toast.title && <h4 className="font-bold text-sm text-white mb-1">{toast.title}</h4>}
                    <p className="text-sm opacity-90 text-white/90 leading-relaxed font-medium">
                        {toast.message}
                    </p>
                </div>
                <button
                    onClick={onDismiss}
                    className="shrink-0 text-white/40 hover:text-white transition-colors"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    );
};
