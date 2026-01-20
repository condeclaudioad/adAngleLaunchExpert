import React, { useState, useRef, useEffect } from 'react';
import { useAdContext } from '../../store/AdContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Input, TextArea } from '../ui/Input';
import { generateImageService, editGeneratedImage } from '../../services/imageGenService';
import { AppStep, GeneratedImage, Angle } from '../../types';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Download, Edit2, Check, X, Wand2, Play, AlertTriangle, ZoomIn, Loader2, Sparkles, Image as ImageIcon, Trash2, Info } from 'lucide-react';

const VARIATION_TYPES = [
    "Close-up shot with intense emotion",
    "Wide angle shot showing environment",
    "Minimalist composition, focus on text",
    "Dynamic angle, cinematic lighting",
    "Split screen layout",
    "Product-focused composition",
    "Lifestyle action shot",
    "High contrast studio lighting",
    "Soft, approachable lighting"
];

export const ImageFactory: React.FC = () => {
    const {
        angles, branding, knowledgeBase, imageAnalysis, generatedImages,
        addGeneratedImage, updateImageStatus, updateImageType, setStep, setApprovalStatus,
        deleteImage, googleApiKey
    } = useAdContext();

    const [isProcessing, setIsProcessing] = useState(false);
    const [aspectRatio, setAspectRatio] = useState<string>("3:4");
    const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
    const [variationCounts, setVariationCounts] = useState<Record<string, number>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [imageToEdit, setImageToEdit] = useState<GeneratedImage | null>(null);
    const [editInstruction, setEditInstruction] = useState("");

    const stopSignal = useRef(false);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; stopSignal.current = true; };
    }, []);

    // Watchdog
    useEffect(() => {
        const watchdog = setInterval(() => {
            const now = Date.now();
            const stuckImages = generatedImages.filter(img => {
                if (img.status !== 'generating') return false;
                const parts = img.id.split('-');
                if (parts.length >= 2) {
                    const timestamp = parseInt(parts[1]);
                    if (!isNaN(timestamp)) {
                        return (now - timestamp) > 180000;
                    }
                }
                return false;
            });

            if (stuckImages.length > 0) {
                console.warn("Watchdog found stuck images:", stuckImages.map(i => i.id));
                stuckImages.forEach(img => updateImageStatus(img.id, 'failed'));
                setIsProcessing(false);
            }
        }, 5000);
        return () => clearInterval(watchdog);
    }, [generatedImages, updateImageStatus]);

    const handleExportSet = async (master: GeneratedImage) => {
        const variations = generatedImages.filter(img => img.parentId === master.id && img.status === 'completed');
        const setImages = [master, ...variations];
        if (setImages.length === 0) return;

        const zip = new JSZip();
        const folderName = `Set_${master.angleId.slice(-4)}`;
        const folder = zip.folder(folderName);
        if (!folder) return;

        // Add Master
        const masterBlob = await (await fetch(master.url)).blob();
        folder.file(`Master_${master.id.slice(-4)}.png`, masterBlob);

        // Add Variations
        for (let i = 0; i < variations.length; i++) {
            const v = variations[i];
            const vBlob = await (await fetch(v.url)).blob();
            folder.file(`Variation_${i + 1}_${v.id.slice(-4)}.png`, vBlob);
        }

        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `Creative_Set_${master.angleId}_${Date.now()}.zip`);
    };

    const handleStop = () => {
        stopSignal.current = true;
        setIsProcessing(false);
        generatedImages.forEach(img => {
            if (img.status === 'generating') {
                updateImageStatus(img.id, 'failed');
            }
        });
    };

    const processQueue = async (queue: (() => Promise<void>)[]) => {
        for (const task of queue) {
            if (stopSignal.current || !isMounted.current) break;
            await task();
            await new Promise(r => setTimeout(r, 1000));
        }
        setIsProcessing(false);
    };

    const generateMains = async () => {
        stopSignal.current = false;
        setIsProcessing(true);
        const keys = { google: googleApiKey || undefined };
        const selectedAngles = angles.filter(a => a.selected);
        const tasks: (() => Promise<void>)[] = [];

        for (const angle of selectedAngles) {
            const existing = generatedImages.find(img => img.angleId === angle.id && img.type === 'master' && img.approvalStatus !== 'rejected');
            if (!existing || existing.status === 'failed') {
                tasks.push(async () => {
                    if (stopSignal.current) return;
                    const timestamp = Date.now();
                    const imgId = existing?.id || `img-${timestamp}-${angle.id}`;
                    if (!existing) {
                        await addGeneratedImage({
                            id: imgId, angleId: angle.id, url: '', prompt: `Gemini 3: ${angle.hook}`,
                            type: 'master', status: 'generating', approvalStatus: 'waiting', modelUsed: 'gemini-3-pro-image'
                        });
                    } else { updateImageStatus(imgId, 'generating'); }

                    try {
                        const url = await generateImageService(
                            `GEMINI 3 PRO: VISUAL: ${angle.visuals}. HOOK: ${angle.hook}.`,
                            aspectRatio, keys, branding, knowledgeBase, imageAnalysis
                        );
                        if (isMounted.current && !stopSignal.current) updateImageStatus(imgId, 'completed', url);
                    } catch (e: any) {
                        console.error("GENERATION ERROR:", e);
                        const errorMsg = e.message || "Error desconocido";
                        if (isMounted.current) updateImageStatus(imgId, 'failed', undefined, errorMsg);
                    }
                });
            } else if (existing && existing.status === 'failed') {
                // RETRY LOGIC for explicitly failed masters
                tasks.push(async () => {
                    if (stopSignal.current) return;
                    const keys = { google: googleApiKey || undefined };
                    const imgId = existing.id;
                    updateImageStatus(imgId, 'generating');
                    try {
                        const url = await generateImageService(
                            `GEMINI 3 PRO: VISUAL: ${angle.visuals}. HOOK: ${angle.hook}.`,
                            aspectRatio, keys, branding, knowledgeBase, imageAnalysis
                        );
                        if (isMounted.current && !stopSignal.current) updateImageStatus(imgId, 'completed', url);
                    } catch (e: any) {
                        console.error("GENERATION ERROR:", e);
                        const errorMsg = e.message || "Error desconocido";
                        if (isMounted.current) updateImageStatus(imgId, 'failed', undefined, errorMsg);
                    }
                });
            }
        }
        tasks.length > 0 ? processQueue(tasks) : setIsProcessing(false);
    };

    const handleBatchVariations = async (e: React.MouseEvent, parentImg: GeneratedImage, count: number) => {
        e.stopPropagation();
        stopSignal.current = false;
        setIsProcessing(true);

        const keys = { google: googleApiKey || undefined };
        const tasks: (() => Promise<void>)[] = [];
        const angle = angles.find(a => a.id === parentImg.angleId);
        if (!angle) return;

        const limit = Math.min(Math.max(count, 2), 9);
        const variationPrompts = VARIATION_TYPES.slice(0, limit);

        variationPrompts.forEach((variationPrompt, index) => {
            tasks.push(async () => {
                if (stopSignal.current) return;
                const timestamp = Date.now();
                const newId = `var-${timestamp}-${index}-${angle.id}`;
                await addGeneratedImage({
                    id: newId, angleId: angle.id, url: '', prompt: `VARIATION: ${variationPrompt}`,
                    type: 'variation', parentId: parentImg.id, status: 'generating', approvalStatus: 'waiting', modelUsed: 'gemini-3-pro-image-var'
                });

                try {
                    const url = await generateImageService(
                        `VISUAL: ${angle.visuals}. HOOK: ${angle.hook}.`,
                        aspectRatio, keys, branding, knowledgeBase, imageAnalysis, variationPrompt
                    );
                    if (isMounted.current && !stopSignal.current) updateImageStatus(newId, 'completed', url);
                } catch (e: any) {
                    console.error("VARIATION ERROR:", e);
                    const errorMsg = e.message || "Error desconocido";
                    if (isMounted.current) updateImageStatus(newId, 'failed', undefined, errorMsg);
                }
            });
        });
        processQueue(tasks);
    };

    const openEditModal = (e: React.MouseEvent, img: GeneratedImage) => {
        e.stopPropagation();
        setImageToEdit(img);
        const cleanPrompt = img.prompt.replace(/Gemini 3:|EDIT:|VARIATION:/g, '').trim();
        setEditInstruction(`Corrige el texto a: "${cleanPrompt}"`);
        setIsEditing(true);
    };

    const submitEdit = async () => {
        if (!imageToEdit || !editInstruction.trim()) return;
        setIsProcessing(true);
        try {
            const editedUrl = await editGeneratedImage(imageToEdit.url, editInstruction, googleApiKey || '', aspectRatio);
            const newId = `edit-${Date.now()}`;
            await addGeneratedImage({
                id: newId, angleId: imageToEdit.angleId, url: editedUrl, prompt: `Editado: ${editInstruction}`,
                type: 'variation', parentId: imageToEdit.parentId || imageToEdit.id, status: 'completed', approvalStatus: 'waiting', modelUsed: 'gemini-edit'
            });
            setIsEditing(false); setEditInstruction(""); setImageToEdit(null);
        } catch (e) { console.error(e); } finally { setIsProcessing(false); }
    };

    const ImageCard = ({ img, minimal = false }: { img: GeneratedImage, minimal?: boolean }) => {
        return (
            <div className={`relative group flex flex-col rounded-xl overflow-hidden bg-bg-tertiary border transition-all duration-300 ${img.approvalStatus === 'approved' ? 'border-green-500/50 ring-1 ring-green-500/20' : 'border-border-default hover:border-border-hover'} ${minimal ? 'w-full' : ''}`}>
                <div className="relative aspect-[3/4] bg-bg-elevated overflow-hidden" onClick={() => setSelectedImageId(img.id)}>
                    {img.status === 'generating' ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-tertiary animate-pulse">
                            <Loader2 size={24} className="text-accent-primary animate-spin mb-2" />
                            <span className="text-[10px] text-text-muted font-medium">Generando...</span>
                        </div>
                    ) : img.status === 'failed' ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/10 text-red-400 text-xs text-center p-2 backdrop-blur-[2px]">
                            <AlertTriangle size={24} className="mb-2" />
                            <span className="mb-2 font-bold block">Fallo en Generación</span>
                            <span className="text-[10px] mb-3 opacity-80 line-clamp-2">{img.errorMessage}</span>
                            <div className="flex gap-2">
                                <Button variant="secondary" size="sm" className="!text-[10px] !py-0.5 border-red-500/30 text-red-400 hover:bg-red-500/20" onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('¿Eliminar imagen fallida?')) deleteImage(img.id);
                                }}>
                                    <X size={12} className="mr-1" /> Borrar
                                </Button>
                                {/* Retry logic is handled by parent re-triggering generate for masters, or manual re-try for variations not implemented yet simply */}
                            </div>
                        </div>
                    ) : (
                        <>
                            <img src={img.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 cursor-zoom-in" alt="Generado" />
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => openEditModal(e, img)} className="p-2 bg-black/60 hover:bg-black/80 backdrop-blur rounded-lg text-white transition-colors" title="Editar">
                                    <Edit2 size={14} />
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {!minimal && img.status === 'completed' && (
                    <div className="p-3 bg-bg-tertiary border-t border-border-default flex justify-between gap-2">
                        {img.approvalStatus === 'approved' ? (
                            <div className="flex-1 flex items-center justify-center gap-2 text-green-500 text-xs font-bold py-1 bg-green-500/10 rounded-lg">
                                <Check size={14} /> Aprobado
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setApprovalStatus(img.id, 'approved'); }}
                                    className="flex-1 flex items-center justify-center gap-1 bg-green-600/10 hover:bg-green-600 text-green-500 hover:text-white text-xs font-bold py-1.5 rounded-lg transition-all"
                                >
                                    <Check size={14} /> Aprobar
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm("¿Estás seguro de eliminar esta imagen permanentemente?")) {
                                            deleteImage(img.id);
                                        }
                                    }}
                                    className="px-3 flex items-center justify-center bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white text-xs font-bold py-1.5 rounded-lg transition-all"
                                    title="Eliminar Imagen"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const MasterSection = ({ angle }: { angle: Angle }) => {
        const masterImg = generatedImages.find(i => i.angleId === angle.id && i.type === 'master');
        const variations = generatedImages.filter(i => i.parentId === masterImg?.id || (i.angleId === angle.id && i.type === 'variation'));
        const [count, setCount] = useState(2);

        if (!masterImg && !isProcessing) return (
            <div className="p-8 border-2 border-dashed border-border-default rounded-2xl text-center hover:bg-bg-elevated transition-colors bg-bg-secondary/30">
                <div className="w-12 h-12 bg-bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
                    <ImageIcon size={24} className="text-text-muted" />
                </div>
                <p className="text-sm font-bold text-text-primary mb-1 uppercase tracking-wide">{angle.name}</p>
                <p className="text-xs text-text-muted mb-4 max-w-sm mx-auto">{angle.hook}</p>
                <Button onClick={generateMains} size="sm" variant="secondary">Generar Maestro</Button>
            </div>
        );

        if (!masterImg) return null;

        return (
            <div className="bg-bg-elevated/50 border border-border-default rounded-3xl p-6 flex flex-col lg:flex-row gap-8 animate-fade-in relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-accent-primary/5 rounded-full blur-[100px] pointer-events-none" />

                {/* LEFT: MASTER IMAGE */}
                <div className="w-full lg:w-1/3 flex flex-col gap-4 relative z-10">
                    <div className="flex justify-between items-center mb-2">
                        <Badge variant="accent" className="text-[10px]">MASTER</Badge>
                        <p className="text-xs font-bold text-text-secondary truncate max-w-[150px]">{angle.name}</p>
                    </div>
                    <div className="w-full max-w-[320px] mx-auto lg:max-w-none shadow-2xl rounded-xl">
                        <ImageCard img={masterImg} />
                    </div>

                    {masterImg.status === 'completed' && masterImg.approvalStatus === 'approved' && (
                        <div className="space-y-3 p-4 bg-bg-secondary rounded-xl border border-border-default mt-2">
                            <p className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2">Acciones</p>
                            <div className="flex gap-2 items-center">
                                <Input
                                    type="number" min={2} max={9}
                                    value={count}
                                    onChange={(e) => setCount(parseInt(e.target.value))}
                                    className="!w-16 !text-center !p-2 !text-sm font-bold"
                                />
                                <Button
                                    onClick={(e) => handleBatchVariations(e, masterImg, count)}
                                    className="flex-1 !text-xs !py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 border-none shadow-lg shadow-blue-900/20"
                                >
                                    <Sparkles size={14} className="mr-1" /> Generar Variaciones
                                </Button>
                            </div>
                            <Button
                                variant="secondary"
                                className="w-full !py-2.5 !text-xs border-orange-500/20 text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
                                onClick={() => handleExportSet(masterImg)}
                            >
                                <Download size={14} className="mr-1" /> Exportar Set (ZIP)
                            </Button>
                        </div>
                    )}
                </div>

                {/* RIGHT: VARIATIONS GRID */}
                <div className="w-full lg:w-2/3 lg:border-l border-border-default lg:pl-8 space-y-5 relative z-10">
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-[10px] w-6 h-6 flex items-center justify-center p-0">{variations.length}</Badge>
                        <h4 className="text-sm font-bold text-text-primary">Variaciones Generadas</h4>
                    </div>

                    {variations.length === 0 ? (
                        <div className="h-full min-h-[250px] flex flex-col items-center justify-center border-2 border-dashed border-border-default rounded-2xl bg-bg-secondary/30 text-text-muted gap-4">
                            <div className="w-16 h-16 bg-bg-tertiary rounded-full flex items-center justify-center">
                                <ImageIcon className="text-text-muted opacity-50" />
                            </div>
                            <p className="text-xs">Sin variaciones. Usa el panel izquierdo para crear.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {variations.map((v, i) => (
                                <div key={v.id} className="relative group">
                                    <ImageCard img={v} minimal />
                                    <div className="absolute top-2 left-2 bg-black/70 text-[10px] text-white px-2 py-0.5 rounded backdrop-blur font-mono border border-white/10">
                                        V-{i + 1}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto pb-20 space-y-8 animate-fade-in relative px-4 md:px-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-border-default pb-6">
                <div>
                    <Badge variant="accent" className="mb-2">Paso 4: Producción</Badge>
                    <h2 className="text-3xl font-bold text-text-primary flex items-center gap-2">
                        <ImageIcon className="text-accent-primary" /> Fábrica Creativa
                    </h2>
                    <p className="text-text-secondary mt-2">
                        Gestiona tus assets visuales. Crea masters y variaciones ilimitadas.
                    </p>
                </div>
                <div className="flex gap-2">
                    {isProcessing && <Button variant="danger" onClick={handleStop} icon={<X size={16} />}>Detener</Button>}
                </div>
            </div>

            {/* Content */}
            <div className="space-y-12">
                {angles.filter(a => a.selected).map(angle => (
                    <div key={angle.id}>
                        <MasterSection angle={angle} />
                    </div>
                ))}

                {angles.filter(a => a.selected).length === 0 && (
                    <div className="text-center py-24 bg-bg-elevated/30 rounded-3xl border border-dashed border-border-default">
                        <div className="w-20 h-20 bg-bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={32} className="text-text-muted" />
                        </div>
                        <h3 className="text-xl font-bold text-text-primary mb-2">No hay ángulos seleccionados</h3>
                        <p className="text-text-muted mb-6">Regresa al paso anterior para seleccionar tus mejores ángulos.</p>
                        <Button onClick={() => setStep(AppStep.ANGLES)} variant="secondary">
                            Ir a Ángulos
                        </Button>
                    </div>
                )}
            </div>

            {/* Initial CTA */}
            {generatedImages.length === 0 && angles.filter(a => a.selected).length > 0 && (
                <div className="flex justify-center pt-8">
                    <Button onClick={generateMains} size="lg" className="px-10 py-5 text-lg shadow-glow-orange animate-pulse">
                        <Play size={24} className="mr-2 fill-current" /> Iniciar Producción
                    </Button>
                </div>
            )}

            {/* Lightbox */}
            {selectedImageId && (
                <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4" onClick={() => setSelectedImageId(null)}>
                    <div className="relative max-w-5xl max-h-screen">
                        <img src={generatedImages.find(i => i.id === selectedImageId)?.url} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" />
                        <button className="absolute -top-12 right-0 text-white p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditing && imageToEdit && (
                <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsEditing(false)}>
                    <Card className="w-full max-w-lg bg-bg-elevated border-border-default space-y-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center border-b border-border-default pb-4">
                            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                                <Edit2 size={18} /> Editar Imagen
                            </h3>
                            <button onClick={() => setIsEditing(false)}><X size={18} className="text-text-muted" /></button>
                        </div>
                        <div className="bg-bg-tertiary p-3 rounded-xl border border-border-default">
                            <p className="text-xs text-text-muted mb-1 uppercase font-bold">Instrucción Actual:</p>
                            <p className="text-sm text-text-secondary italic">"{imageToEdit.prompt}"</p>
                        </div>
                        <TextArea
                            label="Instrucción de corrección"
                            value={editInstruction}
                            onChange={e => setEditInstruction(e.target.value)}
                            className="h-32 font-mono text-sm"
                            placeholder="Ej: Quita el texto del fondo, haz la luz más cálida..."
                        />
                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancelar</Button>
                            <Button onClick={submitEdit} icon={<Wand2 size={16} />}>Aplicar Cambios</Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};
