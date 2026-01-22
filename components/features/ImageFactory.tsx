import React, { useState, useEffect } from 'react';
import { useAdContext } from '../../store/AdContext';
import { AppStep, GeneratedImage } from '../../types';
import { generateImageService, editGeneratedImage } from '../../services/imageGenService';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import {
    Play,
    Check,
    X,
    RefreshCw,
    Download,
    Image as ImageIcon,
    Settings,
    Maximize2,
    Wand2,
    Layers,
    Loader2,
    Sparkles,
    Edit2
} from 'lucide-react';

export const ImageFactory: React.FC = () => {
    const {
        currentBusiness,
        setStep,
        googleApiKey: apiKey,
        setGoogleApiKey: setApiKey,
        showNotification,
        generatedImages, // Global state
        addGeneratedImage,
        setApprovalStatus,
        angles // Get angles from context to access selected state
    } = useAdContext();

    const [isProcessing, setIsProcessing] = useState(false);
    const [activeTab, setActiveTab] = useState<'approvals' | 'variations'>('approvals');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [localKey, setLocalKey] = useState(apiKey || '');
    const [variationCounts, setVariationCounts] = useState<Record<string, number>>({});
    const stopRef = React.useRef(false);

    // NEW STATE
    const [zoomImage, setZoomImage] = useState<GeneratedImage | null>(null);
    const [editImage, setEditImage] = useState<GeneratedImage | null>(null);
    const [editPrompt, setEditPrompt] = useState('');

    // Get selected angles from context, fallback to localStorage for page reloads
    const contextSelected = angles.filter(a => a.selected);
    const selectedAngles = contextSelected.length > 0
        ? contextSelected
        : JSON.parse(localStorage.getItem('le_selected_angles') || '[]');

    // Filter global images by matching angle IDs
    const images = generatedImages.filter(img => selectedAngles.some((a: any) => a.id === img.angleId));
    const approvedImages = images.filter(img => img.approved || img.approvalStatus === 'approved');

    // Sync local key
    useEffect(() => {
        if (apiKey && !localKey) setLocalKey(apiKey);
    }, [apiKey]);

    const handleApiKeySave = () => {
        setApiKey(localKey);
    };

    const handleStop = () => {
        stopRef.current = true;
        setIsProcessing(false);
        showNotification('info', 'Generación detenida por el usuario', 'Detenido');
    };

    const getImageForAngle = (angleId: string) => {
        // Find latest master image
        return images
            .filter(img => img.angleId === angleId && !img.isVariation && img.type !== 'variation')
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))[0];
    };

    const generateSingleImage = async (angleId: string) => {
        if (!apiKey) {
            showNotification('error', 'Por favor configura tu API en los Ajustes.', 'Falta API Key');
            return;
        }

        setIsProcessing(true);
        try {
            const angle = selectedAngles.find((a: any) => a.id === angleId);
            if (!angle) return;

            // Prepare prompt
            const prompt = `Visual: ${angle.visuals}. HOOK: "${angle.hook}". Emotion: ${angle.emotion}`;

            if (!currentBusiness?.branding || !currentBusiness?.knowledgeBase) {
                showNotification('error', "Faltan datos del negocio.", 'Error');
                return;
            }

            if (stopRef.current) return;

            const resultUrl = await generateImageService(
                prompt,
                aspectRatio,
                { google: apiKey },
                currentBusiness.branding,
                currentBusiness.knowledgeBase,
                currentBusiness.imageAnalysis || []
            );

            if (resultUrl) {
                const newImage: GeneratedImage = {
                    id: crypto.randomUUID(),
                    url: resultUrl,
                    angleId: angle.id,
                    prompt: prompt,
                    approved: false,
                    approvalStatus: 'waiting',
                    isVariation: false,
                    type: 'master',
                    status: 'completed',
                    timestamp: Date.now()
                };

                await addGeneratedImage(newImage);
                showNotification('success', 'Imagen generada correctamente', 'Éxito');
            }

        } catch (e: any) {
            console.error(e);
            if (!stopRef.current) {
                showNotification('error', e.message || 'Error desconocido', 'Error de Generación');
            }
        } finally {
            if (!stopRef.current) setIsProcessing(false);
        }
    };

    const handleApprove = (imgId: string, approved: boolean) => {
        setApprovalStatus(imgId, approved ? 'approved' : 'rejected');
    };

    const handleGenerateAll = async () => {
        setIsProcessing(true);
        stopRef.current = false;

        for (const angle of selectedAngles) {
            if (stopRef.current) break;

            if (!getImageForAngle(angle.id)) {
                await generateSingleImage(angle.id);
            }
        }
        setIsProcessing(false);
    };


    const handleGenerateVariations = async (masterId: string) => {
        const masterImage = images.find(img => img.id === masterId);
        if (!masterImage || !apiKey) return;

        const count = variationCounts[masterId] || 3;
        setIsProcessing(true);
        stopRef.current = false;

        try {
            if (stopRef.current) return;

            const promises = Array.from({ length: count }).map(async (_, index) => {
                const variationIndex = index + 1;
                const variationPrompt = `VARIATION ${variationIndex}: Different camera angle and lighting. Maintain product identity.`;

                const resultUrl = await generateImageService(
                    masterImage.prompt,
                    aspectRatio,
                    { google: apiKey },
                    currentBusiness!.branding,
                    currentBusiness!.knowledgeBase!,
                    currentBusiness!.imageAnalysis || [],
                    variationPrompt, // Variation instruction
                    masterImage.url  // Reference image
                );

                const newImage: GeneratedImage = {
                    id: crypto.randomUUID(),
                    url: resultUrl,
                    angleId: masterImage.angleId,
                    prompt: masterImage.prompt,
                    approved: false,
                    approvalStatus: 'waiting',
                    isVariation: true,
                    type: 'variation',
                    parentId: masterId,
                    variationIndex: variationIndex,
                    status: 'completed',
                    timestamp: Date.now()
                };
                return newImage;
            });

            const newVariations = await Promise.all(promises);
            for (const img of newVariations) {
                await addGeneratedImage(img);
            }

        } catch (e: any) {
            console.error(e);
            if (!stopRef.current) showNotification('error', e.message || 'Error generando variaciones', 'Error de Variaciones');
        } finally {
            setIsProcessing(false);
        }
    };

    // NEW HANDLER: Edit Image
    const handleConfirmEdit = async () => {
        if (!editImage || !editPrompt.trim() || !apiKey) return;
        setIsProcessing(true);
        try {
            const resultUrl = await editGeneratedImage(
                editImage.url,
                editPrompt,
                apiKey,
                aspectRatio
            );

            const newImage: GeneratedImage = {
                id: crypto.randomUUID(),
                url: resultUrl,
                angleId: editImage.angleId,
                prompt: editImage.prompt + " | Edit: " + editPrompt,
                approved: false,
                approvalStatus: 'waiting',
                isVariation: false, // Treat edits as new masters or variations? Treating as master replacement
                type: 'master',
                status: 'completed',
                timestamp: Date.now()
            };

            await addGeneratedImage(newImage);
            showNotification('success', 'Imagen editada correctamente', 'Éxito');
            setEditImage(null);
            setEditPrompt('');

        } catch (e: any) {
            console.error(e);
            showNotification('error', e.message || 'Error al editar', 'Error');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 pb-8">
                <div>
                    <Badge variant="outline" className="mb-3 border-pink-500/30 text-pink-400 bg-pink-500/5">
                        <Wand2 className="w-3 h-3 mr-1" /> Fase 5: Producción
                    </Badge>
                    <h2 className="text-4xl font-bold text-white tracking-tight mb-2">
                        Fábrica <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">Creativa</span>
                    </h2>
                    <p className="text-text-secondary text-lg max-w-2xl">
                        Renderiza imágenes de alta conversión usando Imagen 3 Pro.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="danger" onClick={handleStop} disabled={!isProcessing} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20">
                        Stop
                    </Button>
                    <Button
                        onClick={() => setStep(AppStep.EXPORT)}
                        className="bg-bg-tertiary hover:bg-bg-elevated border-white/10 text-white"
                        icon={<Download size={18} />}
                    >
                        Ir a Exportar
                    </Button>
                </div>
            </div>

            {/* Settings Bar */}
            <Card className="bg-bg-secondary/50 backdrop-blur-md border-white/5 p-5">
                <div className="flex flex-col md:flex-row gap-6 items-end md:items-center">
                    {/* API Key removed as per user request */}

                    <div className="w-full md:w-56 space-y-1">
                        <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider flex items-center gap-1">
                            <Maximize2 size={10} /> Formato
                        </label>
                        <Select
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value)}
                            options={[
                                { value: '1:1', label: '1:1 (Post/Carrussel)' },
                                { value: '9:16', label: '9:16 (Story/Reel)' },
                                { value: '16:9', label: '16:9 (Youtube/Web)' },
                                { value: '4:5', label: '4:5 (Portrait)' },
                            ]}
                            className="!bg-black text-text-primary border-white/10"
                        />
                    </div>

                    <Button
                        size="lg"
                        className="w-full md:w-auto shadow-glow-purple bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-0"
                        icon={<Play size={18} fill="currentColor" />}
                        onClick={handleGenerateAll}
                        disabled={isProcessing}
                    >
                        {isProcessing ? 'Generando...' : 'Generar Todo'}
                    </Button>
                </div>
            </Card>

            {/* Tabs */}
            <div className="border-b border-white/5 flex gap-8">
                <button
                    onClick={() => setActiveTab('approvals')}
                    className={`pb-4 text-sm font-bold tracking-wide border-b-2 transition-all flex items-center gap-2 ${activeTab === 'approvals' ? 'border-pink-500 text-white' : 'border-transparent text-text-muted hover:text-text-primary'}`}
                >
                    <Layers size={14} /> Generación Inicial ({selectedAngles.length})
                </button>
                <button
                    onClick={() => setActiveTab('variations')}
                    className={`pb-4 text-sm font-bold tracking-wide border-b-2 transition-all flex items-center gap-2 ${activeTab === 'variations' ? 'border-pink-500 text-white' : 'border-transparent text-text-muted hover:text-text-primary'}`}
                >
                    <RefreshCw size={14} /> Variaciones ({approvedImages.length})
                </button>
            </div>

            {/* Content Container */}
            <div className="min-h-[400px]">
                {activeTab === 'approvals' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {selectedAngles.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-50 space-y-4">
                                <Wand2 size={48} className="text-text-muted opacity-20" />
                                <p className="text-text-secondary text-lg">No hay ángulos seleccionados. Ve a la fase anterior.</p>
                                <p className="text-[10px] font-mono text-text-muted">
                                    (Debug: Biz={currentBusiness?.id}, Total={currentBusiness?.generatedAngles?.length}, Selected={selectedAngles.length})
                                </p>
                            </div>
                        ) : selectedAngles.map((angle, idx) => {
                            const image = getImageForAngle(angle.id);

                            return (
                                <div key={angle.id} className="space-y-3 animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                                    <div className="flex items-center justify-between px-1">
                                        <span className="text-xs font-bold text-text-secondary truncate max-w-[150px]" title={angle.name}>{angle.name}</span>
                                        <Badge variant="outline" size="sm" className="text-[10px] py-0 border-white/10 text-text-muted">{angle.emotion}</Badge>
                                    </div>

                                    {image ? (
                                        // Completed State
                                        <div className="aspect-square relative group rounded-2xl overflow-hidden border border-white/10 bg-bg-secondary shadow-lg">
                                            <img src={image.url} alt={angle.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />

                                            {/* Gradient Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                            {/* Action Buttons */}
                                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-4">
                                                <div className="flex gap-2 scale-90 group-hover:scale-100 transition-transform duration-300 delay-75">
                                                    {/* Zoom Button */}
                                                    <button
                                                        onClick={() => setZoomImage(image)}
                                                        className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all shadow-lg hover:scale-110"
                                                        title="Ver en detalle"
                                                    >
                                                        <Maximize2 size={18} />
                                                    </button>

                                                    {/* Edit Button */}
                                                    <button
                                                        onClick={() => { setEditImage(image); setEditPrompt(''); }}
                                                        className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-blue-500 border border-white/20 flex items-center justify-center transition-all shadow-lg hover:scale-110"
                                                        title="Editar con prompt"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>

                                                    {/* Approve Button */}
                                                    <button
                                                        onClick={() => handleApprove(image.id, !image.approved)}
                                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110 ${image.approved ? 'bg-emerald-500 text-white shadow-emerald-500/30' : 'bg-white/10 backdrop-blur-md text-white hover:bg-emerald-500 border border-white/20'}`}
                                                        title={image.approved ? "Desaprobar" : "Aprobar"}
                                                    >
                                                        <Check size={18} strokeWidth={3} />
                                                    </button>

                                                    {/* Regenerate Button */}
                                                    <button
                                                        onClick={() => generateSingleImage(angle.id)}
                                                        className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-purple-500 border border-white/20 flex items-center justify-center transition-all shadow-lg hover:scale-110"
                                                        title="Regenerar"
                                                    >
                                                        <RefreshCw size={18} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            {image.approved && (
                                                <div className="absolute top-3 right-3 z-10 px-2 py-1 rounded bg-emerald-500/90 backdrop-blur-md border border-emerald-400/30 shadow-lg">
                                                    <Check size={12} className="text-white" strokeWidth={4} />
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        // Empty/Pending State
                                        <div
                                            onClick={() => generateSingleImage(angle.id)}
                                            className="cursor-pointer aspect-square border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center bg-bg-secondary/30 gap-4 hover:bg-bg-secondary hover:border-pink-500/30 transition-all group relative overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                            <div className="w-14 h-14 rounded-full bg-bg-tertiary text-text-muted group-hover:text-pink-400 group-hover:scale-110 transition-all duration-300 flex items-center justify-center ring-1 ring-white/5 group-hover:ring-pink-500/30 shadow-lg">
                                                <Wand2 size={24} />
                                            </div>
                                            <span className="text-xs font-bold text-text-muted group-hover:text-white transition-colors relative z-10">
                                                Generar Imagen
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {activeTab === 'variations' && (
                    <div className="space-y-12">
                        {approvedImages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
                                <ImageIcon size={48} className="text-text-muted opacity-20 mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">No hay imágenes aprobadas</h3>
                                <p className="text-text-muted max-w-sm text-center">
                                    Primero aprueba tus imágenes favoritas en la pestaña "Generación Inicial".
                                </p>
                            </div>
                        ) : approvedImages.map((masterImage) => {
                            const vars = images.filter(img => img.parentId === masterImage.id);
                            const count = variationCounts[masterImage.id] || 3;

                            return (
                                <div key={masterImage.id} className="bg-bg-secondary/30 border border-white/5 rounded-3xl p-6 md:p-8 animate-fade-in">
                                    <div className="grid lg:grid-cols-[300px_1fr] gap-8 items-start">
                                        {/* Left: Master Image */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Master</Badge>
                                                <span className="text-xs text-text-secondary truncate block flex-1 text-right font-mono opacity-50">{masterImage.angleId}</span>
                                            </div>
                                            <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl border-2 border-emerald-500/20 relative group">
                                                <img src={masterImage.url} className="w-full h-full object-cover" />
                                                {/* Zoom for Master in Variations Tab */}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button onClick={() => setZoomImage(masterImage)} className="p-3 bg-white/20 backdrop-blur rounded-full text-white hover:bg-white/30"><Maximize2 size={20} /></button>
                                                </div>
                                            </div>

                                            {/* Generator Controls */}
                                            <div className="p-4 bg-black/40 rounded-xl border border-white/10 space-y-3">
                                                <div className="flex justify-between items-center text-xs text-text-secondary uppercase font-bold tracking-wider">
                                                    <span>Variaciones</span>
                                                    <span>{count}</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="2"
                                                    max="9"
                                                    value={count}
                                                    onChange={(e) => setVariationCounts(prev => ({ ...prev, [masterImage.id]: parseInt(e.target.value) }))}
                                                    className="w-full accent-pink-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                                />
                                                <Button
                                                    onClick={() => handleGenerateVariations(masterImage.id)}
                                                    disabled={isProcessing}
                                                    className="w-full bg-white/5 hover:bg-white/10 border-white/10 text-white"
                                                    size="sm"
                                                >
                                                    {isProcessing ? <Loader2 className="animate-spin" /> : <Sparkles className="mr-2 w-4 h-4 text-pink-500" />}
                                                    Generar ({count})
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Right: Variations Grid */}
                                        <div>
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-xl font-bold text-white">Galería de Variaciones</h3>
                                                <Badge variant="outline" className="text-text-muted">{vars.length} generadas</Badge>
                                            </div>

                                            {vars.length > 0 ? (
                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                    {vars.map((v, i) => (
                                                        <div key={v.id} className="group relative aspect-square rounded-xl overflow-hidden bg-black/50 border border-white/5 hover:border-pink-500/50 transition-colors">
                                                            <img src={v.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                                                <button onClick={() => setZoomImage(v)} className="h-8 w-8 bg-black/50 backdrop-blur text-white flex items-center justify-center rounded hover:bg-black/70">
                                                                    <Maximize2 size={14} />
                                                                </button>
                                                                <a href={v.url} download={`variation-${i}.png`} className="h-8 w-8 bg-black/50 backdrop-blur text-white flex items-center justify-center rounded hover:bg-black/70" target="_blank">
                                                                    <Download size={14} />
                                                                </a>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                                                    <Layers className="text-white/10 mb-3" size={32} />
                                                    <p className="text-text-muted text-sm">Aún no hay variaciones.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ZOOM MODAL */}
            <Modal
                isOpen={!!zoomImage}
                onClose={() => setZoomImage(null)}
                title="Vista Detallada"
            >
                <div className="flex items-center justify-center bg-black/50 rounded-lg overflow-hidden">
                    {zoomImage && (
                        <img
                            src={zoomImage.url}
                            alt="Detalle"
                            className="max-h-[80vh] max-w-full object-contain"
                        />
                    )}
                </div>
                <div className="mt-4 flex justify-between items-center text-sm text-text-muted">
                    <p className="max-w-[70%] truncate">{zoomImage?.prompt}</p>
                    <a
                        href={zoomImage?.url}
                        download="image.png"
                        target="_blank"
                        className="text-pink-400 hover:text-pink-300 flex items-center gap-2"
                        rel="noreferrer"
                    >
                        <Download size={16} /> Descargar Original
                    </a>
                </div>
            </Modal>

            {/* EDIT MODAL */}
            <Modal
                isOpen={!!editImage}
                onClose={() => { setEditImage(null); setIsProcessing(false); }}
                title="Editar Imagen (Retoque AI)"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setEditImage(null)} disabled={isProcessing}>Cancelar</Button>
                        <Button onClick={handleConfirmEdit} disabled={!editPrompt.trim() || isProcessing} className="bg-blue-600 hover:bg-blue-500 text-white border-0">
                            {isProcessing ? 'Editando...' : 'Aplicar Cambios'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="flex gap-4">
                        <div className="w-24 h-24 rounded-lg overflow-hidden border border-white/10 shrink-0">
                            {editImage && <img src={editImage.url} className="w-full h-full object-cover" />}
                        </div>
                        <div className="space-y-2 flex-1">
                            <label className="text-sm font-bold text-white">Instrucción de Edición</label>
                            <Input
                                value={editPrompt}
                                onChange={(e) => setEditPrompt(e.target.value)}
                                placeholder="Ej: Hazla más brillante, cambia el fondo a azul, elimina el texto..."
                                autoFocus
                            />
                            <p className="text-xs text-text-muted">
                                Describe qué quieres cambiar. La AI intentará mantener la identidad principal de la imagen.
                            </p>
                        </div>
                    </div>
                </div>
            </Modal>

        </div >
    );
};
