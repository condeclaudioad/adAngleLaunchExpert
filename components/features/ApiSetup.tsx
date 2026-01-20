import React, { useState } from 'react';
import { useAdContext } from '../../store/AdContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { AppStep } from '../../types';
import { GoogleGenAI } from '@google/genai';
import { saveApiKeys } from '../../services/supabaseClient';
import { Key, CheckCircle2, AlertCircle, ExternalLink, ShieldCheck, ArrowRight, Loader2, Info } from 'lucide-react';
import { Tooltip } from 'react-tooltip';

export const ApiSetup: React.FC = () => {
    const { setGoogleApiKey, googleApiKey, setStep, user } = useAdContext();
    const [googleKeyInput, setGoogleKeyInput] = useState(googleApiKey || '');
    const [googleValidation, setGoogleValidation] = useState<{ status: 'idle' | 'validating' | 'success' | 'error', message: string }>({
        status: googleApiKey ? 'success' : 'idle',
        message: googleApiKey ? 'API conectada anteriormente' : ''
    });
    const [isSaving, setIsSaving] = useState(false);

    const validateGoogleApi = async () => {
        if (!googleKeyInput.trim()) {
            setGoogleValidation({ status: 'error', message: 'Ingresa una API Key' });
            return;
        }

        setGoogleValidation({ status: 'validating', message: 'Validando conexión...' });

        try {
            const ai = new GoogleGenAI({ apiKey: googleKeyInput.trim() });
            const response = await ai.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: 'Responde solo con la palabra: OK',
            });

            if (response?.text) {
                setGoogleValidation({ status: 'success', message: '¡Conexión exitosa! Gemini está listo.' });
            } else {
                throw new Error('Respuesta vacía');
            }
        } catch (e: any) {
            console.error('Google API validation error:', e);
            let errorMsg = 'Error desconocido. Revisa tu conexión.';

            if (e.message?.includes('API_KEY_INVALID')) {
                errorMsg = 'Error 400: API Key inválida. Verifica que copiaste todo el texto.';
            } else if (e.message?.includes('403') || e.message?.includes('permission')) {
                errorMsg = 'Error 403: Sin permisos. Habilita Gemini API en Google Console.';
            } else if (e.message?.includes('429') || e.message?.includes('quota')) {
                errorMsg = 'Error 429: Límite de solicitudes o cuota excedida. Intenta nuevamente.';
            } else if (e.message?.includes('fetch')) {
                errorMsg = 'Error de Red: No se pudo conectar con Google.';
            }

            setGoogleValidation({ status: 'error', message: errorMsg });
        }
    };

    const handleContinue = async () => {
        if (googleValidation.status !== 'success') {
            setGoogleValidation({ status: 'error', message: 'Debes validar la API de Google primero' });
            return;
        }

        setIsSaving(true);
        try {
            setGoogleApiKey(googleKeyInput.trim());
            await saveApiKeys({ google: googleKeyInput.trim() });
            setStep(AppStep.BUSINESS);
        } catch (e) {
            console.error('Error saving API keys:', e);
            setStep(AppStep.BUSINESS);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-accent-primary/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <div className="max-w-md w-full relative z-10 space-y-8 animate-fade-in">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-accent-primary to-orange-600 rounded-2xl flex items-center justify-center mx-auto shadow-glow-orange">
                        <Key className="text-white" size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Conecta tu Inteligencia</h1>
                        <p className="text-text-secondary">
                            Para usar Launch Expert necesitas conectar tus claves de API.
                        </p>
                    </div>
                </div>

                <Card className="!p-6 space-y-5 border-white/10 relative overflow-hidden glass-card">
                    {googleValidation.status === 'success' && (
                        <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-bl-full z-0" />
                    )}

                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 shrink-0">
                            {/* Simple Google G replacement or use Shield */}
                            <ShieldCheck className="text-white" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-1">
                                <h2 className="text-lg font-bold text-white">Google Gemini API</h2>
                                <Info
                                    size={14}
                                    className="text-text-muted cursor-help"
                                    data-tooltip-id="gemini-info"
                                    data-tooltip-content="Requerido para generar ideas, analizar imágenes y crear creativos."
                                />
                                <Tooltip id="gemini-info" />
                            </div>
                            <p className="text-xs text-text-muted">Motor: Gemini 2.0 Flash + Imagen 3</p>
                        </div>
                        {googleValidation.status === 'success' && (
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20">
                                <CheckCircle2 size={14} className="text-white" />
                            </div>
                        )}
                    </div>

                    <div className="space-y-3 relative z-10">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Pegar API Key (AIza...)"
                                value={googleKeyInput}
                                onChange={(e) => {
                                    setGoogleKeyInput(e.target.value);
                                    if (googleValidation.status !== 'idle') setGoogleValidation({ status: 'idle', message: '' });
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

                        {/* Status Message */}
                        {googleValidation.status !== 'idle' && (
                            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border ${googleValidation.status === 'validating' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                                googleValidation.status === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                                    'bg-red-500/10 border-red-500/20 text-red-400'
                                }`}>
                                {googleValidation.status === 'validating' && <Loader2 size={12} className="animate-spin" />}
                                {googleValidation.status === 'success' && <CheckCircle2 size={12} />}
                                {googleValidation.status === 'error' && <AlertCircle size={12} />}
                                <span>{googleValidation.message}</span>
                            </div>
                        )}

                        <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-accent-primary hover:text-accent-secondary hover:underline transition-colors"
                        >
                            <ExternalLink size={12} /> Obtener API Key gratis
                        </a>
                    </div>
                </Card>

                <Button
                    fullWidth
                    size="lg"
                    onClick={handleContinue}
                    isLoading={isSaving}
                    disabled={googleValidation.status !== 'success'}
                    className="shadow-glow-orange"
                >
                    Continuar al Dashboard <ArrowRight size={18} className="ml-2" />
                </Button>

                <div className="text-center">
                    {googleApiKey && (
                        <button onClick={() => setStep(AppStep.BUSINESS)} className="text-xs text-text-muted hover:text-white underline mb-4">
                            Omitir y volver al Dashboard
                        </button>
                    )}
                    <p className="text-[10px] text-text-muted/50 flex items-center justify-center gap-1">
                        <ShieldCheck size={10} /> Tus claves se guardan encriptadas localmente.
                    </p>
                </div>
            </div>
        </div>
    );
};
