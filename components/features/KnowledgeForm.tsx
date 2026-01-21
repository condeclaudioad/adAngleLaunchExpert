import React, { useState, useCallback } from 'react';
import { useAdContext } from '../../store/AdContext';
import { AppStep, KnowledgeBase } from '../../types';
import { useDropzone, DropzoneOptions } from 'react-dropzone';
import { extractTextFromFile, refineContext } from '../../services/geminiService';
import { Card, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input, TextArea } from '../ui/Input';
import { Badge } from '../ui/Badge';
import {
    UploadCloud,
    FileText,
    BrainCircuit,
    CheckCircle2,
    AlertTriangle,
    ArrowRight,
    Sparkles,
    Loader2,
    Trash2
} from 'lucide-react';

// Helper to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // Remove data:mime/type;base64, prefix
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
};

export const KnowledgeForm: React.FC = () => {
    const { currentBusiness, updateBusinessPartial: updateBusiness, setStep, googleApiKey: apiKey, knowledgeBase } = useAdContext();
    const [isProcessing, setIsProcessing] = useState(false);
    const [files, setFiles] = useState<File[]>([]);

    // Initialize with whatever is available, but sync later
    const [analysis, setAnalysis] = useState<KnowledgeBase['structuredAnalysis']>(
        knowledgeBase?.structuredAnalysis || {
            productName: '',
            avatar: '',
            mechanismOfProblem: '',
            uniqueMechanism: '',
            bigPromise: '',
        }
    );

    // Hydrate form when context loads
    React.useEffect(() => {
        if (knowledgeBase?.structuredAnalysis) {
            setAnalysis(knowledgeBase.structuredAnalysis);
        }
    }, [knowledgeBase]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles(prev => [...prev, ...acceptedFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'text/plain': ['.txt', '.md'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
        },
        multiple: true
    } as unknown as DropzoneOptions);

    const handleAnalyze = async () => {
        if (!apiKey) {
            alert('Por favor configura tu API Key primero');
            return;
        }

        if (files.length === 0) {
            alert('Sube al menos un archivo para analizar.');
            return;
        }

        setIsProcessing(true);
        try {
            // 1. Extract text from all files
            let combinedText = "";
            for (const file of files) {
                const base64 = await fileToBase64(file);
                // Pass apiKey explicitly
                const text = await extractTextFromFile(base64, file.type, apiKey || undefined);
                combinedText += `\n--- FILE: ${file.name} ---\n${text}`;
            }

            if (!combinedText.trim()) {
                throw new Error("No se pudo extraer texto de los archivos.");
            }

            // 2. Analyze with Gemini
            // Pass apiKey explicitly
            const result = await refineContext(combinedText, apiKey || undefined);

            // 3. Update State
            setAnalysis(prev => ({
                ...prev,
                ...result
            }));

            // 4. Save to Business
            if (currentBusiness?.id) {
                updateBusiness(currentBusiness.id, {
                    knowledgeBase: {
                        generalContext: combinedText, // Save raw context too
                        files: files.map(f => f.name),
                        structuredAnalysis: result
                    }
                });
            } else {
                console.error("No active business to save analysis");
                alert("Atención: No hay un negocio activo seleccionado. Se mostrarán los resultados pero no se guardarán.");
            }

        } catch (error: any) {
            console.error(error);
            alert(`Error al analizar archivos: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSave = () => {
        if (!currentBusiness?.id) {
            alert("Error: No se encontró el negocio para guardar. Intenta recargar la página.");
            return;
        }
        updateBusiness(currentBusiness.id, {
            knowledgeBase: {
                ...currentBusiness.knowledgeBase,
                structuredAnalysis: analysis
            }
        });
        setStep(AppStep.BRANDING);
    };

    const handleChange = (field: keyof KnowledgeBase['structuredAnalysis'], value: string) => {
        setAnalysis(prev => prev ? ({ ...prev, [field]: value }) : {
            productName: '', avatar: '', mechanismOfProblem: '', uniqueMechanism: '', bigPromise: '',
            [field]: value // Override with new value
        });
    };

    const handleReset = () => {
        if (confirm('¿Estás seguro de borrar toda la base de conocimiento? Tendrás que subir los archivos de nuevo.')) {
            if (currentBusiness?.id) {
                updateBusiness(currentBusiness.id, {
                    knowledgeBase: {
                        generalContext: '',
                        files: [],
                        structuredAnalysis: undefined
                    }
                });
            }
            setFiles([]);
            setAnalysis({
                productName: '',
                avatar: '',
                mechanismOfProblem: '',
                uniqueMechanism: '',
                bigPromise: ''
            });
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-20">
            {/* Header Section */}
            <div className="text-center space-y-4 relative">
                <Badge variant="outline" className="mb-2 border-accent-primary/20 text-accent-primary bg-accent-primary/5">
                    <BrainCircuit className="w-3 h-3 mr-1" /> Fase 1: Extracción de Conocimiento
                </Badge>
                <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/60 tracking-tight">
                    Alimenta tu <span className="text-accent-primary">Cerebro de IA</span>
                </h1>
                <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
                    Sube documentos legales, landing pages o notas de producto. Nuestra IA extraerá los
                    <span className="text-white font-medium"> mecanismos únicos</span> y la <span className="text-white font-medium">psicología del avatar</span>.
                </p>

                {analysis?.productName && (
                    <div className="absolute top-0 right-0">
                        <Button variant="ghost" onClick={handleReset} className="text-red-400 hover:bg-red-500/10 hover:text-red-300">
                            <Trash2 size={16} className="mr-2" /> Borrar Conocimiento
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid lg:grid-cols-2 gap-8 items-start">

                {/* Left Column: Upload */}
                <div className="space-y-6">
                    <Card className="h-full border-white/5 bg-bg-secondary/50 backdrop-blur-sm overflow-hidden relative group">
                        <div className="absolute inset-0 bg-gradient-to-b from-accent-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                        <div
                            {...getRootProps()}
                            className={`
                                relative z-10 h-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-2xl transition-all duration-300
                                ${isDragActive
                                    ? 'border-accent-primary bg-accent-primary/5 scale-[0.98]'
                                    : 'border-white/10 hover:border-accent-primary/40 hover:bg-bg-tertiary/50'
                                }
                            `}
                        >
                            <input {...getInputProps()} />

                            <div className={`
                                w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-500
                                ${isDragActive ? 'bg-accent-primary text-white scale-110 shadow-glow-orange' : 'bg-bg-tertiary text-text-muted group-hover:text-accent-primary group-hover:scale-110'}
                            `}>
                                <UploadCloud size={40} strokeWidth={1.5} />
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2">
                                {isDragActive ? '¡Suéltalos ahora!' : 'Arrastra tus archivos aquí'}
                            </h3>
                            <p className="text-text-secondary mb-8 max-w-xs mx-auto">
                                Soporta PDF, DOCX, TXT e Imágenes. <br />
                                <span className="text-xs opacity-70">Máximo 10MB por archivo.</span>
                            </p>

                            <Button variant="secondary" className="group-hover:border-accent-primary/30 group-hover:text-white">
                                <FileText className="mr-2 w-4 h-4" /> Seleccionar Archivos
                            </Button>
                        </div>
                    </Card>

                    {/* File List */}
                    {files.length > 0 && (
                        <div className="animate-fade-in space-y-3">
                            <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-wider pl-1">Archivos Listos para Análisis</h4>
                            <div className="grid gap-3">
                                {files.map((file, idx) => (
                                    <div key={idx} className="flex items-center gap-4 p-4 bg-bg-secondary border border-white/5 rounded-xl hover:border-white/10 transition-colors group">
                                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                                            <FileText size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0 max-w-[200px] sm:max-w-xs">
                                            <p className="font-medium text-white truncate">{file.name}</p>
                                            <p className="text-xs text-text-muted">{(file.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-glow-emerald" />
                                    </div>
                                ))}
                            </div>

                            <Button
                                onClick={handleAnalyze}
                                disabled={isProcessing}
                                size="lg"
                                className="w-full shadow-glow-orange bg-gradient-to-r from-accent-primary to-orange-600 hover:scale-[1.02] transition-transform h-14 text-lg"
                            >
                                {isProcessing ? (
                                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analizando Estrategia...</>
                                ) : (
                                    <><Sparkles className="mr-2 h-5 w-5" /> Analizar Documentos</>
                                )}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Right Column: Analysis Results */}
                <div className="relative">
                    {/* Connection Line decoration (desktop only) */}
                    <div className="hidden lg:block absolute top-[20%] -left-8 w-8 border-t-2 border-dashed border-white/10" />

                    <Card className={`border-l-4 ${analysis?.productName ? 'border-l-emerald-500' : 'border-l-border-default'} transition-colors duration-500 bg-bg-secondary/80 backdrop-blur-md`}>
                        <div className="p-6 md:p-8 space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-400">
                                        <BrainCircuit size={24} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl">ADN del Producto</CardTitle>
                                        <CardDescription>Información estratégica extraída</CardDescription>
                                    </div>
                                </div>
                                <Badge variant={analysis?.productName ? "success" : "outline"} className="capitalize">
                                    {analysis?.productName ? 'Completado' : 'Pendiente'}
                                </Badge>
                            </div>

                            <div className="space-y-6">
                                <Input
                                    label="Producto / Servicio"
                                    value={analysis?.productName}
                                    onChange={(e) => handleChange('productName', e.target.value)}
                                    placeholder="Ej: Masterclass de E-commerce"
                                    className="!bg-black text-text-primary border-white/5 focus:border-purple-500/50"
                                />

                                <TextArea
                                    label="Avatar (Analisis Psicográfico)"
                                    value={analysis?.avatar}
                                    onChange={(e) => handleChange('avatar', e.target.value)}
                                    placeholder="Descripción detallada de miedos y deseos..."
                                    rows={4}
                                    className="!bg-black text-text-primary border-white/5 focus:border-purple-500/50 text-sm leading-relaxed"
                                />

                                {/* MUP Section */}
                                <div className="p-5 rounded-2xl bg-gradient-to-br from-red-500/5 to-red-500/0 border border-red-500/10 relative group hover:border-red-500/20 transition-colors">
                                    <div className="flex items-center gap-2 mb-3 text-red-400">
                                        <AlertTriangle size={18} />
                                        <span className="text-xs font-bold uppercase tracking-wider">MUP (Problema Raíz)</span>
                                    </div>
                                    <TextArea
                                        value={analysis?.mechanismOfProblem}
                                        onChange={(e) => handleChange('mechanismOfProblem', e.target.value)}
                                        className="!bg-black text-text-primary border-white/5 focus:border-red-500/30 text-sm"
                                        placeholder="¿Por qué han fallado otros métodos?"
                                        rows={3}
                                    />
                                </div>

                                {/* UMS Section */}
                                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-emerald-500/0 border border-emerald-500/10 relative group hover:border-emerald-500/20 transition-colors">
                                    <div className="flex items-center gap-2 mb-3 text-emerald-400">
                                        <CheckCircle2 size={18} />
                                        <span className="text-xs font-bold uppercase tracking-wider">UMS (Mecanismo Único)</span>
                                    </div>
                                    <TextArea
                                        value={analysis?.uniqueMechanism}
                                        onChange={(e) => handleChange('uniqueMechanism', e.target.value)}
                                        className="!bg-black text-text-primary border-white/5 focus:border-emerald-500/30 text-sm"
                                        placeholder="¿Cuál es tu ventaja injusta?"
                                        rows={3}
                                    />
                                </div>

                                <TextArea
                                    label="Gran Promesa"
                                    value={analysis?.bigPromise}
                                    onChange={(e) => handleChange('bigPromise', e.target.value)}
                                    rows={2}
                                    className="!bg-black text-text-primary border-white/5 focus:border-accent-primary/50 font-medium"
                                />
                            </div>

                            <div className="pt-4 border-t border-white/5 flex justify-end">
                                <Button
                                    onClick={handleSave}
                                    size="lg"
                                    disabled={!analysis?.productName}
                                /* className="bg-white text-black hover:bg-gray-200 font-bold" */ // Using primary button style instead
                                >
                                    Confirmar Estrategia <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
