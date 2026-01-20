import React, { useState, useEffect } from 'react';
import { useAdContext } from '../../store/AdContext';
import { AppStep, GeneratedImage } from '../../types';
import { generateImageService } from '../../services/imageGenService';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { Badge } from '../ui/Badge';

// Icons
const PlayIcon = () => <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>;
const CheckIcon = () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const XIcon = () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const RefreshIcon = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const DownloadIcon = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" /></svg>;

export const ImageFactory: React.FC = () => {
    const { currentBusiness, updateBusiness, setStep, apiKey, setApiKey } = useAdContext();
    const [isProcessing, setIsProcessing] = useState(false);
    const [activeTab, setActiveTab] = useState<'approvals' | 'variations'>('approvals');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [localKey, setLocalKey] = useState(apiKey || '');

    const selectedAngles = currentBusiness?.generatedAngles?.filter(a => a.selected) || [];
    const images = currentBusiness?.generatedImages || [];
    const approvedImages = images.filter(img => img.approved);

    // Sync local key
    useEffect(() => {
        if (apiKey && !localKey) setLocalKey(apiKey);
    }, [apiKey]);

    const handleApiKeySave = () => {
        setApiKey(localKey);
    };

    const getImageForAngle = (angleId: string) => {
        return images.find(img => img.angleId === angleId && !img.isVariation);
    };

    const generateSingleImage = async (angleId: string) => {
        if (!apiKey) return alert('Configura tu API Key');

        setIsProcessing(true);
        try {
            const angle = selectedAngles.find(a => a.id === angleId);
            if (!angle) return;

            // Prepare prompt from angle data since we don't have the raw prompt
            const prompt = `Visual: ${angle.visuals}. HOOK: "${angle.hook}". Emotion: ${angle.emotion}`;

            let resultUrl = '';

            if (currentBusiness?.branding && currentBusiness?.knowledgeBase) {
                resultUrl = await generateImageService(
                    prompt,
                    aspectRatio,
                    { google: apiKey },
                    currentBusiness.branding,
                    currentBusiness.knowledgeBase,
                    currentBusiness.imageAnalysis || []
                );
            } else {
                // Fallback / Mock if data missing (shouldn't happen in flow)
                console.warn("Missing branding/kb, using mock");
                await new Promise(r => setTimeout(r, 2000));
                resultUrl = "https://via.placeholder.com/1024?text=Generated+Image";
            }

            if (resultUrl) {
                const newImage: GeneratedImage = {
                    id: Date.now().toString(),
                    url: resultUrl,
                    angleId: angle.id,
                    prompt: prompt,
                    approved: false,
                    timestamp: Date.now()
                };

                // Replace existing if any for this angle (re-roll)
                const otherImages = images.filter(img => img.angleId !== angleId || img.isVariation);
                updateBusiness(currentBusiness!.id, { generatedImages: [...otherImages, newImage] });
            }

        } catch (e: any) {
            console.error(e);
            alert('Error generating image: ' + e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleApprove = (imgId: string, approved: boolean) => {
        const updated = images.map(img => img.id === imgId ? { ...img, approved } : img);
        updateBusiness(currentBusiness!.id, { generatedImages: updated });
    };

    const handleGenerateAll = async () => {
        for (const angle of selectedAngles) {
            if (!getImageForAngle(angle.id)) {
                await generateSingleImage(angle.id);
            }
        }
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold mb-1">Fábrica Creativa</h2>
                    <div className="flex gap-2 items-center">
                        <Badge variant="pro">Gemini 3 Pro Image</Badge>
                        <span className="text-xs text-text-muted">Motor: Imagen 3</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="danger" disabled={!isProcessing}>Stop</Button>
                    <Button variant="primary" onClick={() => setStep(AppStep.EXPORT)} icon={<DownloadIcon />}>
                        Ir a Exportar
                    </Button>
                </div>
            </div>

            {/* Settings Bar */}
            <Card className="bg-bg-secondary p-4 flex flex-col md:flex-row gap-4 items-end md:items-center">
                <div className="flex-1 w-full flex gap-4 items-end">
                    <Input
                        label="API Key (Google AI Studio)"
                        type="password"
                        value={localKey}
                        onChange={(e) => setLocalKey(e.target.value)}
                        placeholder="Paste key..."
                        className="bg-bg-primary"
                    />
                    <Button variant="secondary" onClick={handleApiKeySave}>V</Button>
                </div>

                <div className="w-full md:w-48">
                    <Select
                        label="Aspect Ratio"
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(e.target.value)}
                        options={[
                            { value: '1:1', label: '1:1 (Cuadrado)' },
                            { value: '9:16', label: '9:16 (Story/Reel)' },
                            { value: '16:9', label: '16:9 (Video)' },
                            { value: '4:5', label: '4:5 (Portrait)' },
                        ]}
                    />
                </div>

                <Button
                    variant="primary"
                    className="w-full md:w-auto mb-[2px]"
                    icon={<PlayIcon />}
                    onClick={handleGenerateAll}
                    disabled={isProcessing}
                >
                    {isProcessing ? 'Generando...' : 'Generar Todo'}
                </Button>
            </Card>

            {/* Tabs */}
            <div className="border-b border-border-default flex gap-8">
                <button
                    onClick={() => setActiveTab('approvals')}
                    className={`pb-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'approvals' ? 'border-accent-primary text-white' : 'border-transparent text-text-muted hover:text-text-primary'}`}
                >
                    Generación Inicial ({selectedAngles.length})
                </button>
                <button
                    onClick={() => setActiveTab('variations')}
                    className={`pb-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'variations' ? 'border-accent-primary text-white' : 'border-transparent text-text-muted hover:text-text-primary'}`}
                >
                    Variaciones ({approvedImages.length})
                </button>
            </div>

            {/* Content Container */}
            <div className="min-h-[400px]">
                {activeTab === 'approvals' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {selectedAngles.map(angle => {
                            const image = getImageForAngle(angle.id);

                            return (
                                <div key={angle.id} className="space-y-3">
                                    <div className="flex items-center justify-between px-1">
                                        <span className="text-xs font-medium truncate max-w-[150px]">{angle.name}</span>
                                        <Badge variant="default" size="sm">{angle.emotion}</Badge>
                                    </div>

                                    {image ? (
                                        // Completed State
                                        <div className="aspect-square relative group rounded-2xl overflow-hidden border border-border-default bg-bg-secondary">
                                            <img src={image.url} alt={angle.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />

                                            {/* Overlays */}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleApprove(image.id, true)}
                                                        className={`p-3 rounded-full transition-transform hover:scale-110 ${image.approved ? 'bg-green-500 text-white' : 'bg-white/10 text-white hover:bg-green-500'}`}
                                                    >
                                                        <CheckIcon />
                                                    </button>
                                                    <button
                                                        onClick={() => generateSingleImage(angle.id)}
                                                        className="p-3 bg-white/10 text-white rounded-full hover:bg-accent-primary hover:scale-110 transition-all"
                                                    >
                                                        <RefreshIcon />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            {image.approved && (
                                                <div className="absolute top-2 right-2">
                                                    <Badge variant="success">Aprobado</Badge>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        // Empty/Pending State
                                        <div className="aspect-square border-2 border-dashed border-border-default rounded-2xl flex flex-col items-center justify-center bg-bg-secondary/30 gap-3 hover:bg-bg-secondary transition-colors group">
                                            <div className="p-4 rounded-full bg-bg-tertiary text-text-muted group-hover:text-accent-primary transition-colors">
                                                <PlayIcon />
                                            </div>
                                            <Button variant="secondary" size="sm" onClick={() => generateSingleImage(angle.id)}>
                                                Generar
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {activeTab === 'variations' && (
                    <div className="text-center py-12">
                        <p className="text-text-muted">Selecciona "Generar Variaciones" en las imágenes aprobadas para ver resultados aquí.</p>
                        {/* Variation logic would go here similar to approvals grid */}
                    </div>
                )}
            </div>
        </div>
    );
};
