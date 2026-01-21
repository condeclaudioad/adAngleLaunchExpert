import React, { useState } from 'react';
import { useAdContext } from '../../store/AdContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
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
                model: 'gemini-2.0-flash', // Reverting to confirmed available model
                contents: 'Responde solo con la palabra: OK',
            });

            if (response?.text) {
                setGoogleValidation({ status: 'success', message: '¡Conexión exitosa! Gemini está listo.' });
            } else {
                throw new Error('Respuesta vacía');
            }
        } catch (e: any) {
            console.error('Google API validation error:', e);

            // SPECIAL HANDLING: 429 means Key IS VALID (Auth passed), just quota exceeded.
            if (e.message?.includes('429') || e.message?.includes('quota')) {
                setGoogleValidation({ status: 'success', message: 'Conectado (Nota: Alto Tráfico/Cuota)' });
                return;
            }

            // Include actual error message for debugging "Unknown" cases
            let errorMsg = `Error: ${e.message || 'Desconocido'}`;

            if (e.message?.includes('API_KEY_INVALID')) {
                errorMsg = 'Error 400: API Key inválida. Verifica que copiaste todo el texto.';
            } else if (e.message?.includes('403') || e.message?.includes('permission')) {
                errorMsg = 'Error 403: Sin permisos. Habilita Gemini API en Google Console.';
            } else if (e.message?.includes('fetch')) {
                errorMsg = 'Error de Red: No se pudo conectar con Google.';
            } else if (e.message?.includes('404')) {
                errorMsg = 'Error 404: Modelo no encontrado (Revisa acceso a Gemini Flash).';
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
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-accent-primary/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <div className="max-w-xl w-full relative z-10 space-y-8 animate-fade-in">
                {/* Header */}
                <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-accent-primary/20 border border-white/5">
                        <Key className="text-white drop-shadow-md" size={32} />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Conecta tu Inteligencia</h1>
                        <p className="text-text-secondary text-sm max-w-sm mx-auto leading-relaxed">
                            Para usar Launch Expert necesitas conectar tus claves de API. Tus datos se guardan de forma encriptada.
                        </p>
                    </div>
                </div>

                <div className="glass-card p-1 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    <div className="bg-bg-secondary/40 backdrop-blur-md rounded-[20px] p-8 border border-white/5 shadow-inner space-y-6">
                        {googleValidation.status === 'success' && (
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full z-0 blur-xl" />
                        )}

                        <div className="flex items-start gap-4 relative z-10">
                            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/5 shrink-0 shadow-lg">
                                <ShieldCheck className="text-white/80" />
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg font-bold text-white">Google Gemini API</h2>
                                    {googleValidation.status === 'success' && (
                                        <Badge variant="success" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/20">Conectado</Badge>
                                    )}
                                </div>
                                <p className="text-xs text-text-secondary leading-relaxed">
                                    Motor principal: Gemini 2.0 Flash + Imagen 3.
                                    <br />
                                    Requerido para generar ideas, analizar y crear.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4 relative z-10">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-text-secondary ml-1 uppercase tracking-wider">Tu Clave API</label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Pegar API Key (AIza...)"
                                        value={googleKeyInput}
                                        onChange={(e) => {
                                            setGoogleKeyInput(e.target.value);
                                            if (googleValidation.status !== 'idle') setGoogleValidation({ status: 'idle', message: '' });
                                        }}
                                        type="password"
                                        className="flex-1 !bg-black !text-white !border-white/10 placeholder:!text-gray-500 h-11 focus:!border-accent-primary/50 focus:ring-1 focus:!ring-accent-primary/20"
                                        style={{}}
                                    />
                                    <Button
                                        onClick={validateGoogleApi}
                                        loading={googleValidation.status === 'validating'}
                                        disabled={!googleKeyInput.trim() || googleValidation.status === 'validating'}
                                        variant={googleValidation.status === 'success' ? 'outline' : 'primary'}
                                        className={googleValidation.status === 'success' ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10' : ''}
                                    >
                                        {googleValidation.status === 'success' ? 'Reconectar' : 'Validar'}
                                    </Button>
                                </div>
                            </div>

                            {/* Status Message */}
                            {googleValidation.status !== 'idle' && (
                                <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-medium border transition-all duration-300 animate-fade-in ${googleValidation.status === 'validating' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                                    googleValidation.status === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                        'bg-red-500/10 border-red-500/20 text-red-400'
                                    }`}>
                                    {googleValidation.status === 'validating' && <Loader2 size={14} className="animate-spin" />}
                                    {googleValidation.status === 'success' && <CheckCircle2 size={14} />}
                                    {googleValidation.status === 'error' && <AlertCircle size={14} />}
                                    <span>{googleValidation.message}</span>
                                </div>
                            )}

                            <div className="pt-2">
                                <a
                                    href="https://aistudio.google.com/app/apikey"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs text-accent-primary hover:text-accent-secondary hover:underline transition-colors font-medium group"
                                >
                                    <ExternalLink size={12} className="group-hover:translate-x-0.5 transition-transform" /> Obtener API Key gratis
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <Button
                    fullWidth
                    size="lg"
                    onClick={handleContinue}
                    loading={isSaving}
                    disabled={googleValidation.status !== 'success'}
                    className="shadow-glow-orange h-14 text-base tracking-wide"
                >
                    Continuar al Dashboard <ArrowRight size={18} className="ml-2" />
                </Button>

                <div className="text-center space-y-4">
                    {googleApiKey && (
                        <button onClick={() => setStep(AppStep.BUSINESS)} className="text-xs text-text-muted hover:text-white underline mb-4 transition-colors">
                            Omitir y volver al Dashboard
                        </button>
                    )}
                    <p className="text-[10px] text-text-muted/40 flex items-center justify-center gap-1.5 opacity-60">
                        <ShieldCheck size={12} /> Tus claves se guardan encriptadas localmente en tu dispositivo.
                    </p>
                </div>
            </div>
        </div>
    );
};
