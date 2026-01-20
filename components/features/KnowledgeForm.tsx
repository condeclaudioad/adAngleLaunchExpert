
import React, { useState, useEffect } from 'react';
import { useAdContext } from '../../store/AdContext';
import { Button } from '../ui/Button';
import { Input, TextArea } from '../ui/Input';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { AppStep, StructuredContext } from '../../types';
import { extractTextFromFile, refineContext } from '../../services/geminiService';

export const KnowledgeForm: React.FC = () => {
    const {
        knowledgeBase, setKnowledgeBase, setStep,
        currentBusiness, updateBusinessPartial, saveCurrentBusiness
    } = useAdContext();

    const [isProcessing, setIsProcessing] = useState(false);
    const [fileStatus, setFileStatus] = useState<string[]>([]);

    useEffect(() => {
        if (currentBusiness && currentBusiness.knowledgeBase && (!knowledgeBase.structuredAnalysis)) {
            setKnowledgeBase(currentBusiness.knowledgeBase);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentBusiness?.id]);

    const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []) as File[];
        if (files.length === 0) return;

        setIsProcessing(true);
        setFileStatus([]);

        let newTextAccumulator = "";

        // Process files in parallel for speed
        const filePromises = files.map(async (file) => {
            try {
                setFileStatus(prev => [...prev, `⏳ Leyendo: ${file.name}...`]);

                // Fast convert to base64
                const base64Data = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const res = reader.result as string;
                        resolve(res.split(',')[1]);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });

                // Extract text only - NO Analysis
                const text = await extractTextFromFile(base64Data, file.type);

                if (text.trim()) {
                    setFileStatus(prev => prev.map(s => s.includes(file.name) ? `✅ ${file.name}: Listo` : s));
                    return `\n--- ARCHIVO: ${file.name} ---\n${text}\n`;
                } else {
                    throw new Error("No text found");
                }
            } catch (error) {
                console.error(error);
                setFileStatus(prev => prev.map(s => s.includes(file.name) ? `❌ Error: ${file.name}` : s));
                return "";
            }
        });

        const results = await Promise.all(filePromises);
        newTextAccumulator = results.join("");

        // IMMEDIATE STATE UPDATE - No Refinement Call
        const finalContext = (knowledgeBase.generalContext || "") + newTextAccumulator;

        setKnowledgeBase(prev => ({
            ...prev,
            generalContext: finalContext,
            // Ensure structuredAnalysis exists so UI doesn't break, but keep it generic
            structuredAnalysis: prev.structuredAnalysis || {
                productName: "Producto (Detectar Automáticamente)",
                avatar: "Cliente Ideal (Detectar Automáticamente)",
                mechanismOfProblem: "Problema (Detectar Automáticamente)",
                uniqueMechanism: "Solución (Detectar Automáticamente)",
                bigPromise: "Promesa (Detectar Automáticamente)"
            }
        }));

        setIsProcessing(false);
        e.target.value = '';
    };

    const manualRefine = async () => {
        if (!knowledgeBase.generalContext) return;
        setIsProcessing(true);
        try {
            const refinedData = await refineContext(knowledgeBase.generalContext);
            setKnowledgeBase(prev => ({ ...prev, structuredAnalysis: refinedData }));
            setFileStatus(prev => [...prev, "🧠 Estrategia completada manualmente"]);
        } catch (e) {
            alert("Error analizando contexto.");
        } finally {
            setIsProcessing(false);
        }
    };

    const updateField = (field: keyof StructuredContext, value: string) => {
        if (!knowledgeBase.structuredAnalysis) return;
        setKnowledgeBase(prev => ({
            ...prev,
            structuredAnalysis: {
                ...prev.structuredAnalysis!,
                [field]: value
            }
        }));
    };

    const handleNext = async () => {
        // Use generic name if not set
        const name = knowledgeBase.structuredAnalysis?.productName?.includes("Detectar")
            ? `Proyecto ${new Date().toLocaleDateString()}`
            : knowledgeBase.structuredAnalysis?.productName || "Nuevo Proyecto";

        if (currentBusiness) {
            await updateBusinessPartial({ knowledgeBase: knowledgeBase });
        } else {
            await saveCurrentBusiness(name);
        }
        setStep(AppStep.BRANDING);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-white">Base de Conocimiento (Modo Rápido ⚡)</h2>
                    <p className="text-textMuted mt-2">
                        Sube tus archivos. La IA los leerá y los usará directamente para crear ángulos.
                    </p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Left Column: Upload */}
                <div className="md:col-span-1 space-y-4">
                    <Card
                        className={`border-dashed border-2 flex flex-col items-center justify-center text-center py-12 relative overflow-hidden transition-all
                    ${isProcessing ? 'border-primary bg-primary/5' : 'border-borderColor hover:border-primary/50'}`}
                    >
                        <input
                            type="file"
                            multiple
                            className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-wait"
                            onChange={handleFiles}
                            disabled={isProcessing}
                            accept=".pdf,.txt,.md,.docx,.csv"
                        />

                        <div className="w-12 h-12 bg-surfaceHighlight rounded-full flex items-center justify-center mb-4">
                            {isProcessing ? (
                                <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-textMuted">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                </svg>
                            )}
                        </div>

                        <h3 className="text-sm font-bold text-white mb-1">
                            {isProcessing ? 'Leyendo...' : 'Subir Archivos'}
                        </h3>
                        <p className="text-xs text-textMuted px-4">
                            PDFs, Textos, CSVs. Lectura inmediata.
                        </p>
                    </Card>

                    {/* Log */}
                    {fileStatus.length > 0 && (
                        <Card className="bg-black/50 !p-3 max-h-40 overflow-y-auto">
                            <p className="text-xs font-bold text-textMuted mb-2 uppercase">Historial de Lectura</p>
                            {fileStatus.map((s, i) => (
                                <div key={i} className="text-[10px] font-mono text-textMuted border-b border-white/5 pb-1 mb-1 last:border-0">{s}</div>
                            ))}
                        </Card>
                    )}
                </div>

                {/* Right Column: Form */}
                <div className="md:col-span-2">
                    {knowledgeBase.structuredAnalysis && (
                        <Card className="space-y-6">
                            <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-lg text-white">
                                        🧠 Estructura (Opcional)
                                    </h3>
                                    <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded">
                                        {knowledgeBase.generalContext.length > 0 ? `${Math.round(knowledgeBase.generalContext.length / 1024)} KB Contexto` : 'Vacío'}
                                    </span>
                                </div>

                                {/* Manual Trigger for Analysis */}
                                <Button
                                    variant="secondary"
                                    className="!py-1 !px-3 text-xs"
                                    onClick={manualRefine}
                                    disabled={isProcessing || !knowledgeBase.generalContext}
                                >
                                    {isProcessing ? 'Analizando...' : '⚡ Auto-completar con IA'}
                                </Button>
                            </div>

                            <p className="text-xs text-textMuted italic">
                                Nota: Puedes dejar esto en blanco. La IA usará el contenido de tus archivos directamente para generar los ángulos.
                            </p>

                            <div className="space-y-6 opacity-80 hover:opacity-100 transition-opacity">
                                <Input
                                    label="Producto / Servicio"
                                    value={knowledgeBase.structuredAnalysis.productName}
                                    onChange={(e) => updateField('productName', e.target.value)}
                                />
                                <div className="grid md:grid-cols-2 gap-4">
                                    <TextArea
                                        label="Avatar (Cliente Ideal)"
                                        value={knowledgeBase.structuredAnalysis.avatar}
                                        onChange={(e) => updateField('avatar', e.target.value)}
                                        className="h-24"
                                    />
                                    <TextArea
                                        label="Gran Promesa"
                                        value={knowledgeBase.structuredAnalysis.bigPromise}
                                        onChange={(e) => updateField('bigPromise', e.target.value)}
                                        className="h-24"
                                    />
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button
                    onClick={handleNext}
                    disabled={isProcessing}
                    className="w-full md:w-auto shadow-glow"
                >
                    Confirmar y Continuar &rarr;
                </Button>
            </div>
        </div>
    );
};
