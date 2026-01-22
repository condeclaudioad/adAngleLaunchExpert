import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content - Always centered in viewport */}
            <div className="relative w-full max-w-md bg-bg-elevated border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-5 border-b border-white/5">
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg text-text-secondary hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 text-text-secondary">
                    {children}
                </div>

                {footer && (
                    <div className="flex items-center justify-end gap-3 p-5 bg-bg-tertiary/50 border-t border-white/5">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};
