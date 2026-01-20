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

// Pre-defined variations to ensure diversity
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
        deleteImage, googleApiKey, grokApiKey
    } = useAdContext();

    const [isProcessing, setIsProcessing] = useState(false);
    const [aspectRatio, setAspectRatio] = useState<string>("3:4");
    const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

    // Custom Variation Count State
    const [variationCounts, setVariationCounts] = useState<Record<string, number>>({});

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [imageToEdit, setImageToEdit] = useState<GeneratedImage | null>(null);
    const [editInstruction, setEditInstruction] = useState("");

    const stopSignal = useRef(false);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; stopSignal.current = true; };
    }, []);

    // --- ZOMBIE KILLER / WATCHDOG ---
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

    // --- EXPORT SET LOGIC ---
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

    // --- STOP LOGIC ---
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
        const keys = { google: googleApiKey || undefined, grok: grokApiKey || undefined };
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
                            aspectRatio,
                            keys,
                            branding,
                            knowledgeBase,
                            imageAnalysis
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

        const keys = { google: googleApiKey || undefined, grok: grokApiKey || undefined };
        const tasks: (() => Promise<void>)[] = [];
        const angle = angles.find(a => a.id === parentImg.angleId);
        if (!angle) return;

        const limit = Math.min(Math.max(count, 2), 9); // Force between 2 and 9
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

    // --- EDIT LOGIC (Simplified for brevity) ---
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

    // --- COMPONENTS ---
    const ImageCard = ({ img, minimal = false }: { img: GeneratedImage, minimal?: boolean }) => {
        return (
            <div className={`relative group flex flex-col rounded-xl overflow-hidden bg-surface border transition-all duration-300 ${img.approvalStatus === 'approved' ? 'border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.1)]' : 'border-borderColor'} ${minimal ? 'w-full' : ''}`}>
                <div className="relative aspect-[3/4] bg-black/50 overflow-hidden cursor-zoom-in" onClick={() => setSelectedImageId(img.id)}>
                    {img.status === 'generating' ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surfaceHighlight">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-[10px] text-primary mt-2">Generando...</span>
                        </div>
                    ) : img.status === 'failed' ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/20 text-red-500 text-xs text-center p-2">
                            Error
                            <Button variant="danger" className="mt-2 !text-[10px] !py-0.5 !px-2" onClick={(e) => { e.stopPropagation(); deleteImage(img.id); }}>X</Button>
                        </div>
                    ) : (
                        <>
                            <img src={img.url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="Generado" />
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => openEditModal(e, img)} className="p-1.5 bg-primary rounded-lg text-white" title="Editar">✏️</button>
                            </div>
                        </>
                    )}
                </div>
                {!minimal && img.status === 'completed' && (
                    <div className="p-2 bg-surfaceHighlight/50 border-t border-white/5 flex justify-between gap-1">
                        {img.approvalStatus === 'approved' ? (
                            <span className="text-[10px] text-green-500 font-bold flex items-center gap-1">✅ Aprobado</span>
                        ) : (
                            <>
                                <button onClick={(e) => { e.stopPropagation(); setApprovalStatus(img.id, 'approved'); }} className="flex-1 bg-green-600 hover:bg-green-500 text-white text-[10px] font-bold py-1 rounded">SI</button>
                                <button onClick={(e) => { e.stopPropagation(); deleteImage(img.id); }} className="px-2 bg-white/10 hover:bg-red-500 hover:text-white text-textMuted text-[10px] py-1 rounded">NO</button>
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

        // Local state for this master's input
        const [count, setCount] = useState(2);

        if (!masterImg && !isProcessing) return (
            <div className="p-4 border border-dashed border-borderColor rounded-xl text-center">
                <p className="text-xs text-textMuted uppercase mb-2">{angle.name}</p>
                <Button onClick={generateMains} className="text-xs">Generar Maestro</Button>
            </div>
        );

        if (!masterImg) return null; // Should not happen if generating

        return (
            <div className="bg-surface/30 border border-white/5 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row gap-6 animate-fade-in">
                {/* LEFT: MASTER IMAGE */}
                <div className="w-full md:w-1/3 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <Badge variant="default" className="text-[10px]">MASTER</Badge>
                        <p className="text-xs font-bold text-textMuted truncate max-w-[150px]">{angle.name}</p>
                    </div>
                    <div className="w-full max-w-[280px] mx-auto md:max-w-none">
                        <ImageCard img={masterImg} />
                    </div>

                    {/* Export & Generate Controls */}
                    {masterImg.status === 'completed' && masterImg.approvalStatus === 'approved' && (
                        <div className="space-y-3 p-3 bg-surfaceHighlight/30 rounded-xl border border-white/5">
                            <div className="flex gap-2 items-center">
                                <Input
                                    type="number" min={2} max={9}
                                    value={count}
                                    onChange={(e) => setCount(parseInt(e.target.value))}
                                    className="!w-16 !text-center !p-1 !text-sm"
                                />
                                <Button
                                    onClick={(e) => handleBatchVariations(e, masterImg, count)}
                                    className="flex-1 !text-xs !py-2 bg-gradient-to-r from-blue-600 to-indigo-600 border-none"
                                >
                                    ⚡ Generar Variaciones
                                </Button>
                            </div>
                            <Button
                                variant="secondary"
                                className="w-full !py-2 !text-xs bg-orange-500/10 text-orange-400 hover:bg-orange-500 hover:text-white border-orange-500/50"
                                onClick={() => handleExportSet(masterImg)}
                            >
                                📦 Exportar Set (ZIP)
                            </Button>
                        </div>
                    )}
                </div>

                {/* RIGHT: VARIATIONS GRID */}
                <div className="w-full md:w-2/3 border-l border-white/5 md:pl-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">Variaciones Generadas</h4>
                        <Badge variant="outline" className="text-[10px]">{variations.length}</Badge>
                    </div>

                    {variations.length === 0 ? (
                        <div className="h-full min-h-[200px] flex items-center justify-center border border-dashed border-borderColor rounded-xl bg-black/20 text-textMuted text-xs">
                            Sin variaciones aún. Usa el panel izquierdo para crear.
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 lg:grid-cols-4 gap-3">
                            {variations.map(v => (
                                <div key={v.id} className="relative group">
                                    <ImageCard img={v} minimal />
                                    <div className="absolute top-1 left-1 bg-black/60 text-[8px] text-white px-1 rounded backdrop-blur">
                                        {v.id.split('-')[2]} {/* Index/ID hint */}
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
        <div className="max-w-7xl mx-auto pb-20 space-y-8 animate-fade-in relative">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white">Fábrica Creativa Pro</h2>
                    <p className="text-textMuted text-sm">Design System: Master (Izq) vs Variaciones (Der)</p>
                </div>
                <div className="flex gap-2">
                    {isProcessing && <Button variant="danger" onClick={handleStop}>⛔ Detener Todo</Button>}
                </div>
            </div>

            {/* List of Creative Sets (Angle -> Master -> Variations) */}
            <div className="space-y-12">
                {angles.filter(a => a.selected).map(angle => (
                    <MasterSection key={angle.id} angle={angle} />
                ))}
                {angles.filter(a => a.selected).length === 0 && (
                    <div className="text-center py-20 text-textMuted">No hay ángulos seleccionados. Ve a "Ángulos" y selecciona algunos.</div>
                )}
            </div>

            {/* Global Generate Button if no images exist */}
            {generatedImages.length === 0 && angles.filter(a => a.selected).length > 0 && (
                <div className="flex justify-center pt-8">
                    <Button onClick={generateMains} className="px-8 py-4 text-lg shadow-glow animate-pulse">
                        🚀 Iniciar Generación de Masters
                    </Button>
                </div>
            )}

            {/* Modals & Overlays */}
            {selectedImageId && (
                <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setSelectedImageId(null)}>
                    <img src={generatedImages.find(i => i.id === selectedImageId)?.url} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
                </div>
            )}
            {isEditing && imageToEdit && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsEditing(false)}>
                    <Card className="w-full max-w-lg bg-surface space-y-4" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold">Editar Master</h3>
                        <TextArea value={editInstruction} onChange={e => setEditInstruction(e.target.value)} className="h-32" />
                        <div className="flex justify-end gap-2"><Button onClick={submitEdit}>Guardar</Button></div>
                    </Card>
                </div>
            )}
        </div>
    );
};
