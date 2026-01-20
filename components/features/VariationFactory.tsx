// components/features/VariationFactory.tsx - NUEVO ARCHIVO

import React, { useState, useEffect, useRef } from 'react';
import { useAdContext } from '../../store/AdContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { AppStep, GeneratedImage, MasterCreative } from '../../types';
import {
    generateVariationsForMaster,
    processBatchVariations,
    convertToMasterCreative,
    generateCustomVariation
} from '../../services/grokService';

export const VariationFactory: React.FC = () => {
    const {
        generatedImages,
        addGeneratedImage,
        updateImageStatus,
        branding,
        setStep,
        googleApiKey,
        grokApiKey,
        setGrokApiKey
    } = useAdContext();

    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [selectedMasters, setSelectedMasters] = useState<Set<string>>(new Set());
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');

    const stopSignal = useRef(false);

    // Get only approved MASTER images
    const masterImages = generatedImages.filter(
        img => img.type === 'master' &&
            img.status === 'completed' &&
            img.approvalStatus === 'approved'
    );

    // Get variations
    const variationImages = generatedImages.filter(img => img.type === 'variation');

    const toggleMasterSelection = (id: string) => {
        setSelectedMasters(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const selectAllMasters = () => {
        setSelectedMasters(new Set(masterImages.map(m => m.id)));
    };

    const handleTestGrokApi = async () => {
        if (!grokApiKey) {
            alert("Ingresa tu Grok API Key");
            return;
        }

        setTestStatus('testing');
        try {
            // Simple test call
            const response = await fetch('https://api.x.ai/v1/models', {
                headers: { 'Authorization': `Bearer ${grokApiKey}` }
            });

            if (response.ok) {
                setTestStatus('success');
            } else {
                setTestStatus('failed');
            }
        } catch {
            setTestStatus('failed');
        }
    };

    const handleGenerateVariations = async () => {
        if (selectedMasters.size === 0) {
            alert("Selecciona al menos un MASTER");
            return;
        }

        if (!grokApiKey) {
            alert("Configura tu Grok API Key");
            return;
        }

        stopSignal.current = false;
        setIsProcessing(true);

        const totalVariations = selectedMasters.size * 9;
        setProgress({ current: 0, total: totalVariations });

        try {
            // Convert selected images to MasterCreative format
            const masters: MasterCreative[] = Array.from(selectedMasters)
                .map(id => masterImages.find(m => m.id === id))
                .filter((m): m is GeneratedImage => m !== undefined)
                .map(img => convertToMasterCreative(img, {
                    logo: branding.logo,
                    personalPhoto: branding.personalPhoto,
                    productMockup: branding.productMockup
                }));

            // Process all masters
            const results = await processBatchVariations(
                masters,
                grokApiKey,
                // Master progress callback
                (masterId, completed, total) => {
                    console.log(`Master ${masterId}: ${completed}/${total}`);
                },
                // Variation progress callback
                async (variationId, status, url) => {
                    if (stopSignal.current) return;

                    const [masterId, varNum] = variationId.split('-V');
                    const parentImage = masterImages.find(m => m.id === masterId);

                    if (status === 'completed' && url && parentImage) {
                        // Add to generated images
                        const category = parseInt(varNum) <= 3 ? 'safe'
                            : parseInt(varNum) <= 6 ? 'medium'
                                : 'aggressive';

                        await addGeneratedImage({
                            id: variationId,
                            angleId: parentImage.angleId,
                            url: url,
                            prompt: `Grok variation ${varNum} of ${masterId}`,
                            type: 'variation',
                            parentId: masterId,
                            status: 'completed',
                            approvalStatus: 'waiting',
                            provider: 'grok',
                            variationIndex: parseInt(varNum),
                            variationCategory: category,
                            modelUsed: 'grok-2-image'
                        });

                        setProgress(prev => ({ ...prev, current: prev.current + 1 }));
                    }
                }
            );

            console.log('Batch complete:', results);

        } catch (error) {
            console.error('Variation generation failed:', error);
            alert('Error generando variaciones. Revisa la consola.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleStop = () => {
        stopSignal.current = true;
        setIsProcessing(false);
    };

    return (
        <div className="max-w-7xl mx-auto pb-20 space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white">Fábrica de Variaciones</h2>
                    <p className="text-textMuted text-sm">
                        Pipeline: 10 Masters (Gemini) → 90 Variaciones (Grok)
                    </p>
                </div>
                <div className="flex gap-2">
                    {isProcessing && (
                        <Button variant="danger" onClick={handleStop}>
                            ⛔ Detener
                        </Button>
                    )}
                    <Button onClick={() => setStep(AppStep.EXPORT)}>
                        Exportar &rarr;
                    </Button>
                </div>
            </div>

            {/* Grok API Config */}
            <Card className="!p-4 bg-surface/50">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 space-y-2">
                        <label className="text-xs font-bold text-textMuted uppercase">
                            Grok API Key (xAI)
                        </label>
                        <div className="flex gap-2">
                            <Input
                                value={grokApiKey}
                                onChange={(e) => setGrokApiKey(e.target.value)}
                                type="password"
                                placeholder="xai-..."
                                className="!bg-black"
                            />
                            <Button variant="outline" onClick={handleTestGrokApi}>
                                {testStatus === 'success' ? '✅ OK' :
                                    testStatus === 'failed' ? '❌ Error' : 'Probar'}
                            </Button>
                        </div>
                    </div>

                    <div className="text-right">
                        <a
                            href="https://console.x.ai"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                        >
                            Obtener API Key en x.ai &rarr;
                        </a>
                    </div>
                </div>
            </Card>

            {/* Progress Bar */}
            {isProcessing && (
                <Card className="!p-4">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-textMuted">Generando variaciones...</span>
                        <span className="text-primary font-bold">
                            {progress.current} / {progress.total}
                        </span>
                    </div>
                    <div className="w-full bg-surfaceHighlight rounded-full h-2">
                        <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(progress.current / progress.total) * 100}%` }}
                        />
                    </div>
                </Card>
            )}

            {/* Masters Selection */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">
                        Masters Aprobados ({masterImages.length})
                    </h3>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={selectAllMasters}>
                            Seleccionar Todos
                        </Button>
                        <Button
                            onClick={handleGenerateVariations}
                            disabled={selectedMasters.size === 0 || isProcessing || !grokApiKey}
                            isLoading={isProcessing}
                        >
                            Generar {selectedMasters.size * 9} Variaciones
                        </Button>
                    </div>
                </div>

                {masterImages.length === 0 ? (
                    <Card className="text-center py-12 border-dashed">
                        <p className="text-textMuted">
                            No hay Masters aprobados. Vuelve a la Fábrica Creativa y aprueba algunas imágenes.
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => setStep(AppStep.GENERATION)}
                            className="mt-4"
                        >
                            Ir a Fábrica Creativa
                        </Button>
                    </Card>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {masterImages.map(img => (
                            <div
                                key={img.id}
                                onClick={() => toggleMasterSelection(img.id)}
                                className={`relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${selectedMasters.has(img.id)
                                        ? 'border-primary shadow-glow'
                                        : 'border-transparent hover:border-white/20'
                                    }`}
                            >
                                <img
                                    src={img.url}
                                    alt={img.id}
                                    className="w-full aspect-[3/4] object-cover"
                                />

                                {/* Selection Checkbox */}
                                <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedMasters.has(img.id)
                                        ? 'bg-primary border-primary'
                                        : 'bg-black/50 border-white/50'
                                    }`}>
                                    {selectedMasters.has(img.id) && (
                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>

                                {/* Variation Count Badge */}
                                {variationImages.filter(v => v.parentId === img.id).length > 0 && (
                                    <Badge className="absolute bottom-2 left-2">
                                        {variationImages.filter(v => v.parentId === img.id).length} vars
                                    </Badge>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Variations Grid */}
            {variationImages.length > 0 && (
                <div className="space-y-4 mt-8">
                    <h3 className="text-lg font-bold text-white">
                        Variaciones Generadas ({variationImages.length})
                    </h3>

                    <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-9 gap-2">
                        {variationImages.map(img => (
                            <div
                                key={img.id}
                                className="relative rounded-lg overflow-hidden group"
                            >
                                <img
                                    src={img.url}
                                    alt={img.id}
                                    className="w-full aspect-[3/4] object-cover"
                                />

                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Badge variant={
                                        img.variationCategory === 'safe' ? 'default' :
                                            img.variationCategory === 'medium' ? 'accent' : 'vip'
                                    }>
                                        {img.variationCategory}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
