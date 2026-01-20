
import React, { useState } from 'react';
import { useAdContext } from '../../store/AdContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { AppStep } from '../../types';
import { GoogleGenAI } from '@google/genai';

export const ApiSetup: React.FC = () => {
  const { setGoogleApiKey, setStep } = useAdContext();
  const [keyInput, setKeyInput] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleValidate = async () => {
      setIsValidating(true);
      setErrorMsg("");
      
      try {
          // Validate the key by making a lightweight call
          const ai = new GoogleGenAI({ apiKey: keyInput });
          await ai.models.generateContent({
             model: 'gemini-2.0-flash', 
             contents: 'ping',
          });

          // Success
          setGoogleApiKey(keyInput);
          setStep(AppStep.BUSINESS);
      } catch (e: any) {
          console.error(e);
          setErrorMsg("API Key inválida o sin acceso a Gemini Flash 2.0. Verifica en aistudio.google.com");
      } finally {
          setIsValidating(false);
      }
  };

  const handleSkip = () => {
      // Allow skip if user wants to rely on ENV variable (if configured)
      // or if they just want to look around (though calls will fail)
      if (process.env.API_KEY) {
          setStep(AppStep.BUSINESS);
      } else {
          setErrorMsg("No hay API Key configurada en el servidor. Debes ingresar una.");
      }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
        {/* Background */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
             <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
        </div>

        <Card className="max-w-md w-full relative z-10 !p-8 border-white/10 space-y-6">
            <div className="text-center">
                <div className="w-12 h-12 bg-surfaceHighlight rounded-full flex items-center justify-center mx-auto mb-4 border border-borderColor shadow-glow">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-primary">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Configuración Inicial</h1>
                <p className="text-sm text-textMuted">
                    Para usar la IA, necesitas tu propia API Key de Google Gemini.
                </p>
            </div>

            <div className="space-y-4">
                <Input 
                    placeholder="Pegar API Key (AIza...)" 
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    type="password"
                />
                
                {errorMsg && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-lg flex items-center gap-2">
                        <span>⚠️</span> {errorMsg}
                    </div>
                )}

                <Button 
                    fullWidth 
                    onClick={handleValidate} 
                    isLoading={isValidating}
                    disabled={!keyInput}
                >
                    Validar y Guardar
                </Button>

                <div className="text-center">
                    <button 
                        onClick={handleSkip} 
                        className="text-xs text-textMuted hover:text-white underline"
                    >
                        {process.env.API_KEY ? 'Usar API Key del Sistema (Default)' : '¿Dónde consigo una?'}
                    </button>
                    {!process.env.API_KEY && (
                         <p className="text-[10px] text-textMuted mt-2">
                             Ve a <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-primary hover:underline">Google AI Studio</a> para crear una gratis.
                         </p>
                    )}
                </div>
            </div>
            
            <div className="pt-4 border-t border-white/5 text-[10px] text-textMuted text-center">
                Tu llave se guarda localmente en tu navegador. Nunca se comparte con terceros.
            </div>
        </Card>
    </div>
  );
};
