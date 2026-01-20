
import React, { useState, useEffect } from 'react';
import { useAdContext } from '../../store/AdContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { AppStep } from '../../types';
import { GoogleGenAI } from '@google/genai';
import { saveApiKeys } from '../../services/supabaseClient';

// ═══════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════

const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6">
        <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z" />
        <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z" />
        <path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z" />
        <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z" />
    </svg>
);



const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
);

const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const KeyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
    </svg>
);

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

type ValidationStatus = 'idle' | 'validating' | 'success' | 'error';

interface ApiValidation {
    status: ValidationStatus;
    message: string;
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export const ApiSetup: React.FC = () => {
    const { setGoogleApiKey, googleApiKey, setStep, user } = useAdContext();

    // Input states
    const [googleKeyInput, setGoogleKeyInput] = useState(googleApiKey || '');

    // Validation states
    const [googleValidation, setGoogleValidation] = useState<ApiValidation>({
        status: googleApiKey ? 'success' : 'idle',
        message: googleApiKey ? 'API conectada anteriormente' : ''
    });

    const [isSaving, setIsSaving] = useState(false);

    // ═══════════════════════════════════════════════════════════
    // VALIDATION FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    const validateGoogleApi = async () => {
        if (!googleKeyInput.trim()) {
            setGoogleValidation({ status: 'error', message: 'Ingresa una API Key' });
            return;
        }

        setGoogleValidation({ status: 'validating', message: 'Validando conexión...' });

        try {
            const ai = new GoogleGenAI({ apiKey: googleKeyInput.trim() });
            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: 'Responde solo con la palabra: OK',
            });

            if (response?.text) {
                setGoogleValidation({ status: 'success', message: '¡Conexión exitosa! Gemini está listo.' });
                // Key will be saved when user clicks Continue
            } else {
                throw new Error('Respuesta vacía');
            }
        } catch (e: any) {
            console.error('Google API validation error:', e);
            let errorMsg = 'API Key inválida o sin permisos.';

            if (e.message?.includes('API_KEY_INVALID')) {
                errorMsg = 'La API Key es inválida. Verifica que la copiaste completa.';
            } else if (e.message?.includes('quota')) {
                errorMsg = 'Cuota de API excedida. Intenta más tarde.';
            } else if (e.message?.includes('permission')) {
                errorMsg = 'Sin permisos para Gemini. Activa la API en Google Cloud.';
            }

            setGoogleValidation({ status: 'error', message: errorMsg });
        }
    };



    // ═══════════════════════════════════════════════════════════
    // SAVE & CONTINUE
    // ═══════════════════════════════════════════════════════════

    const handleContinue = async () => {
        // At minimum, Google API is required
        if (googleValidation.status !== 'success') {
            setGoogleValidation({ status: 'error', message: 'Debes validar la API de Google primero' });
            return;
        }

        setIsSaving(true);

        try {
            // Save to local context first (for immediate use)
            setGoogleApiKey(googleKeyInput.trim());

            // Save to Supabase user metadata (for persistence across devices)
            await saveApiKeys({
                google: googleKeyInput.trim()
            });

            // Navigate to main app
            setStep(AppStep.BUSINESS);
        } catch (e) {
            console.error('Error saving API keys:', e);
            // Still continue - keys are saved locally
            setStep(AppStep.BUSINESS);
        } finally {
            setIsSaving(false);
        }
    };

    // ═══════════════════════════════════════════════════════════
    // STATUS BADGE COMPONENT
    // ═══════════════════════════════════════════════════════════

    const StatusBadge: React.FC<{ validation: ApiValidation }> = ({ validation }) => {
        if (validation.status === 'idle') return null;

        const styles = {
            validating: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
            success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
            error: 'bg-red-500/10 border-red-500/20 text-red-400'
        };

        return (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${styles[validation.status]}`}>
                {validation.status === 'validating' && (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                )}
                {validation.status === 'success' && <CheckIcon />}
                {validation.status === 'error' && <XIcon />}
                <span>{validation.message}</span>
            </div>
        );
    };

    // ═══════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════



    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <div className="max-w-xl w-full relative z-10 space-y-6">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-orange-600 rounded-2xl flex items-center justify-center mx-auto shadow-glow">
                        <KeyIcon />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Conecta tus APIs</h1>
                        <p className="text-textMuted">
                            Para usar Launch Expert necesitas conectar tus claves de API.
                            Tus claves se guardan de forma segura y nunca se comparten.
                        </p>
                    </div>
                </div>

                {/* Google AI Card */}
                <Card className="!p-6 space-y-4 border-white/10 relative overflow-hidden">
                    {googleValidation.status === 'success' && (
                        <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-bl-full" />
                    )}

                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                            <GoogleIcon />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-lg font-semibold text-white">Google AI Studio</h2>
                            <p className="text-xs text-textMuted">Para Gemini 2.0 Flash (análisis + generación de imágenes)</p>
                        </div>
                        {googleValidation.status === 'success' && (
                            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                                <CheckIcon />
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Pegar API Key (AIza...)"
                                value={googleKeyInput}
                                onChange={(e) => {
                                    setGoogleKeyInput(e.target.value);
                                    if (googleValidation.status !== 'idle') {
                                        setGoogleValidation({ status: 'idle', message: '' });
                                    }
                                }}
                                type="password"
                                className="flex-1"
                            />
                            <Button
                                onClick={validateGoogleApi}
                                isLoading={googleValidation.status === 'validating'}
                                disabled={!googleKeyInput.trim() || googleValidation.status === 'validating'}
                                variant={googleValidation.status === 'success' ? 'outline' : 'primary'}
                            >
                                {googleValidation.status === 'success' ? 'Reconectar' : 'Validar'}
                            </Button>
                        </div>

                        <StatusBadge validation={googleValidation} />

                        <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                            <span>Obtener API Key gratis →</span>
                        </a>
                    </div>
                </Card>

                {/* Continue Button */}
                <div className="space-y-4">
                    <Button
                        fullWidth
                        onClick={handleContinue}
                        isLoading={isSaving}
                        disabled={googleValidation.status !== 'success'}
                        className="!py-4 text-base"
                    >
                        🚀 Comenzar a Crear Anuncios
                    </Button>
                </div>

                {/* Footer */}
                <div className="text-center space-y-3">
                    {/* Back to Dashboard button - only show if user already has API configured */}
                    {googleApiKey && (
                        <button
                            onClick={() => setStep(AppStep.BUSINESS)}
                            className="text-sm text-textMuted hover:text-white underline transition-colors"
                        >
                            ← Volver al Dashboard
                        </button>
                    )}

                    <p className="text-[11px] text-textMuted">
                        🔒 Tus claves se guardan encriptadas en tu cuenta. Nunca las compartimos con terceros.
                    </p>
                    {user && (
                        <p className="text-[10px] text-textMuted/50">
                            Conectado como: {user.email}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
