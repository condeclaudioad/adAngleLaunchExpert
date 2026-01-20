import React, { useState, useEffect } from 'react';
import { useAdContext } from '../../store/AdContext';
import { Button } from '../ui/Button';
import { Input, TextArea } from '../ui/Input';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { AppStep, StructuredContext } from '../../types';
import { extractTextFromFile, refineContext } from '../../services/geminiService';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Wand2, ArrowRight, BrainCircuit } from 'lucide-react';

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
                    setFileStatus(prev => {
                        const newStatus = [...prev];
                        const index = newStatus.findIndex(s => s.includes(file.name));
                        if (index !== -1) newStatus[index] = `✅ ${file.name}: Listo`;
                        return newStatus;
                    });
                    return `\n--- ARCHIVO: ${file.name} ---\n${text}\n`;
                } else {
                    throw new Error("No text found");
                }
            } catch (error) {
                console.error(error);
                setFileStatus(prev => {
                    const newStatus = [...prev];
                    const index = newStatus.findIndex(s => s.includes(file.name));
                    if (index !== -1) newStatus[index] = `❌ Error: ${file.name}`;
                    return newStatus;
                });
                return "";
            }
        });

        const results = await Promise.all(filePromises);
        newTextAccumulator = results.join("");

        const finalContext = (knowledgeBase.generalContext || "") + newTextAccumulator;

        setKnowledgeBase(prev => ({
            ...prev,
            generalContext: finalContext,
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
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-border-default pb-6">
                <div>
                    <Badge variant="accent" className="mb-2">Paso 1: Contexto</Badge>
                    <h2 className="text-3xl font-bold text-text-primary flex items-center gap-2">
                        <BrainCircuit className="text-accent-primary" /> Base de Conocimiento
                    </h2>
                    <p className="text-text-secondary mt-2 max-w-2xl">
                        Sube tus archivos para entrenar a la IA. Aceptamos PDF, TXT y CSV.
                    </p>
                </div>
            </div>

            <div className="grid md:grid-cols-12 gap-8">
                {/* Left Column: Upload */}
                <div className="md:col-span-4 space-y-4">
                    <Card className="h-64 border-dashed border-2 border-border-default hover:border-accent-primary/50 transition-colors bg-bg-elevated/50 group relative overflow-hidden cursor-pointer flex items-center justify-center">
                        <input
                            type="file"
                            multiple
                            className="absolute inset-0 opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                            onChange={handleFiles}
                            disabled={isProcessing}
                            accept=".pdf,.txt,.md,.docx,.csv"
                        />
                        <div className="flex flex-col items-center justify-center px-4 text-center">
                            <div className="w-16 h-16 rounded-full bg-bg-tertiary group-hover:bg-accent-primary/10 flex items-center justify-center mb-4 transition-colors">
                                {isProcessing ? (
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary" />
                                ) : (
                                    <UploadCloud size={32} className="text-text-muted group-hover:text-accent-primary" />
                                )}
                            </div>
                            <h3 className="font-bold text-lg text-text-primary mb-1">Sube tus archivos</h3>
                            <p className="text-sm text-text-muted">
                                Arrastra o haz clic para explorar.
                            </p>
                        </div>
                    </Card>

                    {/* Status Log */}
                    {fileStatus.length > 0 && (
                        <Card className="bg-black/40 border-border-subtle !p-0 overflow-hidden">
                            <div className="p-3 border-b border-white/5 bg-white/5 flex items-center justify-between">
                                <p className="text-xs font-bold text-text-muted uppercase flex items-center gap-2">
                                    <FileText size={12} /> Log
                                </p>
                                <Badge size="sm" variant="outline">{fileStatus.length}</Badge>
                            </div>
                            <div className="p-3 max-h-40 overflow-y-auto space-y-2">
                                {fileStatus.map((s, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                                        {s.includes('Listo')
                                            ? <CheckCircle2 size={12} className="text-green-500 shrink-0" />
                                            : s.includes('Leyendo')
                                                ? <div className="w-3 h-3 rounded-full border-2 border-text-muted border-t-transparent animate-spin shrink-0" />
                                                : <AlertCircle size={12} className="text-red-500 shrink-0" />
                                        }
                                        <span className="truncate">{s.replace(/✅|⏳|❌/, '').trim()}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>

                {/* Right Column: Structured Data */}
                <div className="md:col-span-8">
                    {knowledgeBase.structuredAnalysis ? (
                        <Card className="space-y-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-default pb-4">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-lg text-text-primary">
                                        Estructura de Ventas
                                    </h3>
                                    <span className="text-[10px] bg-accent-primary/10 text-accent-primary px-2 py-0.5 rounded font-mono">
                                        {knowledgeBase.generalContext.length > 0 ? `${(knowledgeBase.generalContext.length / 1024).toFixed(1)} KB` : '0 KB'}
                                    </span>
                                </div>

                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={manualRefine}
                                    disabled={isProcessing || !knowledgeBase.generalContext}
                                    className="gap-2"
                                >
                                    {isProcessing ? (
                                        <>
                                            <div className="animate-spin h-3 w-3 border-b-2 border-current rounded-full" />
                                            Analizando...
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 size={14} /> Auto-completar con IA
                                        </>
                                    )}
                                </Button>
                            </div>

                            <div className="space-y-5">
                                <Input
                                    label="Producto / Servicio"
                                    value={knowledgeBase.structuredAnalysis.productName}
                                    onChange={(e) => updateField('productName', e.target.value)}
                                    placeholder="Ej. Curso de Marketing..."
                                />
                                <div className="grid md:grid-cols-2 gap-5">
                                    <TextArea
                                        label="Avatar (Cliente Ideal)"
                                        value={knowledgeBase.structuredAnalysis.avatar}
                                        onChange={(e) => updateField('avatar', e.target.value)}
                                        className="h-28"
                                        placeholder="¿A quién le vendes?"
                                    />
                                    <TextArea
                                        label="Gran Promesa"
                                        value={knowledgeBase.structuredAnalysis.bigPromise}
                                        onChange={(e) => updateField('bigPromise', e.target.value)}
                                        className="h-28"
                                        placeholder="¿Qué resultado garantizas?"
                                    />
                                </div>
                                <div className="grid md:grid-cols-2 gap-5">
                                    <TextArea
                                        label="Mecanismo (Problema)"
                                        value={knowledgeBase.structuredAnalysis.mechanismOfProblem}
                                        onChange={(e) => updateField('mechanismOfProblem', e.target.value)}
                                        className="h-24"
                                    />
                                    <TextArea
                                        label="Mecanismo (Solución)"
                                        value={knowledgeBase.structuredAnalysis.uniqueMechanism}
                                        onChange={(e) => updateField('uniqueMechanism', e.target.value)}
                                        className="h-24"
                                    />
                                </div>
                            </div>
                        </Card>
                    ) : (
                        <div className="text-center py-20 text-text-muted">
                            Sube un archivo para comenzar o espera a que se inicialice...
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-border-default">
                <Button
                    onClick={handleNext}
                    disabled={isProcessing}
                    size="lg"
                    className="shadow-glow-orange gap-2"
                >
                    Confirmar y Continuar <ArrowRight size={18} />
                </Button>
            </div>
        </div>
    );
};
