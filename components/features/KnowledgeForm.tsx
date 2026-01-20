import React, { useState, useCallback } from 'react';
import { useAdContext } from '../../store/AdContext';
import { AppStep, KnowledgeBase } from '../../types';
import { useDropzone } from 'react-dropzone';
import { geminiService } from '../../services/geminiService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input, TextArea } from '../ui/Input';
import { Badge } from '../ui/Badge';

// Icons
const UploadIcon = () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const FileIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" strokeLinecap="round" strokeLinejoin="round" /><path d="M13 2v7h7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const BrainIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1010 10 9.991 9.991 0 00-9-10zm0 18a8 8 0 118-8 8.009 8.009 0 01-8 8z" className="opacity-25" /><path d="M12 12m-3 0a3 3 0 106 0a3 3 0 10-6 0" /></svg>;
const CheckCircleIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" /><path d="M22 4L12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const AlertTriangleIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" strokeLinecap="round" strokeLinejoin="round" /></svg>;

export const KnowledgeForm: React.FC = () => {
    const { currentBusiness, updateBusiness, setStep, apiKey } = useAdContext();
    const [isProcessing, setIsProcessing] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [analysis, setAnalysis] = useState<KnowledgeBase['structuredAnalysis']>(
        currentBusiness?.knowledgeBase?.structuredAnalysis || {
            productName: '',
            avatar: '',
            currentSituation: '',
            desireSituation: '',
            mechanismOfProblem: '',
            uniqueMechanism: '',
            bigPromise: '',
            offer: ''
        }
    );

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles(prev => [...prev, ...acceptedFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'text/plain': ['.txt', '.md'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png']
        }
    });

    const handleAnalyze = async () => {
        if (!apiKey) {
            alert('Por favor configura tu API Key primero');
            return;
        }

        setIsProcessing(true);
        try {
            // Mock analysis for UI demo, in real app this calls geminiService using the files
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Just saving mock data or keeping what user typed
            const newAnalysis = { ...analysis };
            if (!newAnalysis.productName) newAnalysis.productName = "Producto Detectado (Demo)";

            setAnalysis(newAnalysis);
            updateBusiness(currentBusiness!.id, {
                knowledgeBase: {
                    files: files.map(f => f.name), // In real app, upload result
                    structuredAnalysis: newAnalysis
                }
            });
        } catch (error) {
            console.error(error);
            alert('Error al analizar archivos');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSave = () => {
        updateBusiness(currentBusiness!.id, {
            knowledgeBase: {
                ...currentBusiness!.knowledgeBase,
                structuredAnalysis: analysis
            }
        });
        setStep(AppStep.BRANDING);
    };

    const handleChange = (field: keyof KnowledgeBase['structuredAnalysis'], value: string) => {
        setAnalysis(prev => ({ ...prev!, [field]: value }));
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold mb-2">Base de Conocimiento</h2>
                <p className="text-text-secondary">
                    Sube documentos, landing pages o notas. La IA extraerá la estrategia ganadora.
                </p>
            </div>

            {/* Upload Zone */}
            <div
                {...getRootProps()}
                className={`
                    border-2 border-dashed rounded-3xl p-10 text-center transition-all cursor-pointer group
                    ${isDragActive
                        ? 'border-accent-primary bg-accent-primary/5 scale-[1.01]'
                        : 'border-border-default bg-bg-secondary hover:border-text-muted hover:bg-bg-elevated'
                    }
                `}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-4">
                    <div className={`p-4 rounded-full bg-bg-tertiary text-text-muted group-hover:text-accent-primary group-hover:bg-accent-primary/10 transition-colors`}>
                        <UploadIcon />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium mb-1">
                            {isDragActive ? 'Suelta los archivos aquí' : 'Arrastra archivos aquí'}
                        </h3>
                        <p className="text-sm text-text-muted">
                            Soporta PDF, TXT, MD, JPG, PNG
                        </p>
                    </div>
                    <Button variant="secondary" size="sm" className="mt-2">
                        Seleccionar Archivos
                    </Button>
                </div>
            </div>

            {/* File List */}
            {files.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {files.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-bg-secondary border border-border-default rounded-xl">
                            <FileIcon />
                            <span className="text-sm truncate flex-1">{file.name}</span>
                            <span className="text-xs text-text-muted">{(file.size / 1024).toFixed(1)} KB</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Analysis & Form */}
            <div className="flex justify-center">
                {files.length > 0 && (
                    <Button
                        onClick={handleAnalyze}
                        loading={isProcessing}
                        size="lg"
                        className="min-w-[200px]"
                    >
                        {isProcessing ? 'Analizando con IA...' : 'Analizar Documentos'}
                    </Button>
                )}
            </div>

            <Card className="border-t-4 border-t-accent-primary">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent-primary/10 rounded-lg text-accent-primary">
                            <BrainIcon />
                        </div>
                        <div>
                            <CardTitle>Análisis Estratégico</CardTitle>
                            <CardDescription>Edita la información extraída si es necesario</CardDescription>
                        </div>
                        <Badge variant="accent" className="ml-auto">Editable</Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-full">
                            <Input
                                label="Producto / Servicio"
                                value={analysis?.productName}
                                onChange={(e) => handleChange('productName', e.target.value)}
                                placeholder="Ej: Curso de Facebook Ads"
                            />
                        </div>

                        <div className="col-span-full">
                            <TextArea
                                label="Avatar (Voz del Cliente)"
                                value={analysis?.avatar}
                                onChange={(e) => handleChange('avatar', e.target.value)}
                                placeholder="Descripción detallada del cliente ideal..."
                                rows={3}
                            />
                        </div>

                        {/* MUP Field - Red tinted */}
                        <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                            <div className="flex items-center gap-2 mb-2 text-red-400">
                                <AlertTriangleIcon />
                                <span className="text-xs font-bold uppercase tracking-wider">MUP (Problema Raíz)</span>
                            </div>
                            <TextArea
                                value={analysis?.mechanismOfProblem}
                                onChange={(e) => handleChange('mechanismOfProblem', e.target.value)}
                                className="bg-bg-primary border-red-500/20 focus:border-red-500"
                                placeholder="¿Por qué han fallado otros métodos?"
                                rows={3}
                            />
                        </div>

                        {/* UMS Field - Green tinted */}
                        <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10">
                            <div className="flex items-center gap-2 mb-2 text-green-400">
                                <CheckCircleIcon />
                                <span className="text-xs font-bold uppercase tracking-wider">UMS (Solución Única)</span>
                            </div>
                            <TextArea
                                value={analysis?.uniqueMechanism}
                                onChange={(e) => handleChange('uniqueMechanism', e.target.value)}
                                className="bg-bg-primary border-green-500/20 focus:border-green-500"
                                placeholder="¿Cuál es tu mecanismo único?"
                                rows={3}
                            />
                        </div>

                        <div className="col-span-full">
                            <TextArea
                                label="Gran Promesa"
                                value={analysis?.bigPromise}
                                onChange={(e) => handleChange('bigPromise', e.target.value)}
                                rows={2}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Footer Actions */}
            <div className="flex justify-end pt-4">
                <Button onClick={handleSave} size="lg" disabled={!analysis?.productName}>
                    Confirmar y Continuar →
                </Button>
            </div>
        </div>
    );
};
