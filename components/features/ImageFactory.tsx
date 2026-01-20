
import React, { useState, useRef, useEffect } from 'react';
import { useAdContext } from '../../store/AdContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Input, TextArea } from '../ui/Input';
import { generateImageService, editGeneratedImage } from '../../services/imageGenService';
import { AppStep, GeneratedImage, Angle } from '../../types';

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
    deleteImage
  } = useAdContext();
  
  const [activeTab, setActiveTab] = useState<'approvals' | 'variations'>('approvals');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<string>("3:4");
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

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
                      // 3 minutes tolerance for new robust retry logic
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

  // --- STOP LOGIC ---
  const handleStop = () => { 
      stopSignal.current = true; 
      setIsProcessing(false);
      // Force kill any generating images visually
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
          await new Promise(r => setTimeout(r, 1000)); // Small buffer between requests
      }
      setIsProcessing(false);
  };

  // --- GENERATION LOGIC ---

  const generateMains = async () => {
    stopSignal.current = false;
    setIsProcessing(true);

    const selectedAngles = angles.filter(a => a.selected);
    const tasks: (() => Promise<void>)[] = [];

    for (const angle of selectedAngles) {
        const existing = generatedImages.find(img => img.angleId === angle.id && img.type === 'main' && img.approvalStatus !== 'rejected');
        
        if (!existing || existing.status === 'failed') {
             tasks.push(async () => {
                if (stopSignal.current) return;
                const timestamp = Date.now();
                const imgId = existing?.id || `img-${timestamp}-${angle.id}`;
                if (!existing) {
                    await addGeneratedImage({
                        id: imgId, angleId: angle.id, url: '', prompt: `Nano Banana: ${angle.hook}`,
                        type: 'main', status: 'generating', approvalStatus: 'waiting', modelUsed: 'gemini-3-pro-image'
                    });
                } else { updateImageStatus(imgId, 'generating'); }

                try {
                    const url = await generateImageService(
                        'gemini-3-pro-image', 
                        `VISUAL: ${angle.visuals}. HOOK: ${angle.hook}.`, 
                        aspectRatio, 
                        branding, 
                        knowledgeBase, 
                        imageAnalysis
                    );
                    if (isMounted.current && !stopSignal.current) updateImageStatus(imgId, 'completed', url);
                } catch (e) { 
                    console.error("GENERATION ERROR:", e);
                    if (isMounted.current) updateImageStatus(imgId, 'failed'); 
                }
             });
        }
    }
    tasks.length > 0 ? processQueue(tasks) : setIsProcessing(false);
  };

  // --- BATCH VARIATIONS LOGIC (Dynamic Count) ---
  const handleBatchVariations = async (e: React.MouseEvent, parentImg: GeneratedImage, count: number) => {
      e.stopPropagation();
      setActiveTab('variations');
      stopSignal.current = false;
      setIsProcessing(true);

      const tasks: (() => Promise<void>)[] = [];
      const angle = angles.find(a => a.id === parentImg.angleId);
      if (!angle) return;

      // Slice the prompt list based on count
      const variationPrompts = VARIATION_TYPES.slice(0, count);

      variationPrompts.forEach((variationPrompt, index) => {
          tasks.push(async () => {
              if (stopSignal.current) return;
              const timestamp = Date.now();
              const newId = `var-${timestamp}-${index}-${angle.id}`;
              
              await addGeneratedImage({
                  id: newId,
                  angleId: angle.id,
                  url: '',
                  prompt: `VARIATION: ${variationPrompt}`,
                  type: 'variation',
                  parentId: parentImg.id,
                  status: 'generating',
                  approvalStatus: 'waiting',
                  modelUsed: 'gemini-3-pro-image-var'
              });

              try {
                  const url = await generateImageService(
                      'gemini-3-pro-image',
                      `VISUAL: ${angle.visuals}. HOOK: ${angle.hook}.`,
                      aspectRatio,
                      branding,
                      knowledgeBase,
                      imageAnalysis,
                      variationPrompt
                  );
                  if (isMounted.current && !stopSignal.current) updateImageStatus(newId, 'completed', url);
              } catch (e) {
                  console.error("VARIATION ERROR:", e);
                  if (isMounted.current) updateImageStatus(newId, 'failed');
              }
          });
      });

      processQueue(tasks);
  };

  // --- EDIT LOGIC ---
  const openEditModal = (e: React.MouseEvent, img: GeneratedImage) => {
      e.stopPropagation();
      setImageToEdit(img);
      const cleanPrompt = img.prompt.replace(/Nano Banana:|EDIT:|VARIATION:/g, '').trim();
      setEditInstruction(`Corrige el texto a: "${cleanPrompt}"`);
      setIsEditing(true);
  };

  const submitEdit = async () => {
    if (!imageToEdit || !editInstruction.trim()) return;
    
    setIsProcessing(true);
    
    try {
        const editedUrl = await editGeneratedImage(
            imageToEdit.url,
            editInstruction,
            aspectRatio
        );
        
        // Crear nueva variación con la imagen editada
        const newId = `edit-${Date.now()}`;
        await addGeneratedImage({
            id: newId,
            angleId: imageToEdit.angleId,
            url: editedUrl,
            prompt: `Editado: ${editInstruction}`,
            type: 'variation',
            parentId: imageToEdit.id,
            status: 'completed',
            approvalStatus: 'waiting',
            modelUsed: 'gemini-edit'
        });
        
        setIsEditing(false);
        setEditInstruction("");
        setImageToEdit(null);
        setActiveTab('variations');
    } catch (e) {
        console.error("Edit Error:", e);
        alert("Error al editar imagen");
    } finally {
        setIsProcessing(false);
    }
  };

  // --- Components ---
  const ImageCard = ({ img }: { img: GeneratedImage }) => {
    const isApproved = img.approvalStatus === 'approved';
    const isVariation = img.type === 'variation';
    
    return (
        <div className={`relative group flex flex-col rounded-xl overflow-hidden bg-surface border transition-all duration-300 ${isApproved ? 'border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'border-borderColor hover:border-primary/50 shadow-card hover:shadow-glow'}`}>
            
            {/* Image Area */}
            <div className="relative aspect-[3/4] bg-black/50 overflow-hidden">
                {img.status === 'generating' ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-surfaceHighlight z-10">
                        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                        <span className="text-xs text-primary font-bold animate-pulse text-center px-2">
                            {img.prompt.includes('EDIT:') ? 'Editando...' : img.prompt.includes('VARIATION') ? 'Variando...' : 'Creando...'}
                        </span>
                    </div>
                ) : img.status === 'failed' ? (
                     <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/10 z-10">
                        <span className="text-red-500 text-xs font-bold mb-2">Error al generar</span>
                        <Button variant="danger" className="!py-1 !px-2 !text-[10px]" onClick={(e) => { e.stopPropagation(); deleteImage(img.id); }}>
                            Eliminar
                        </Button>
                    </div>
                ) : (
                    // Completed Image
                    <div className="w-full h-full relative cursor-zoom-in" onClick={() => setSelectedImageId(img.id)}>
                        <img src={img.url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="Generado" />
                        
                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-60 group-hover:opacity-40 transition-opacity"></div>

                        {/* Top Right Tools */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-[-10px] group-hover:translate-y-0 duration-200">
                             <button 
                                onClick={(e) => { e.stopPropagation(); setSelectedImageId(img.id); }}
                                className="p-2 bg-black/60 hover:bg-black/90 text-white rounded-lg backdrop-blur-sm transition-colors border border-white/10"
                                title="Zoom"
                             >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                                </svg>
                             </button>
                             <button 
                                onClick={(e) => openEditModal(e, img)}
                                className="p-2 bg-primary hover:bg-primaryHover text-white rounded-lg shadow-lg transition-colors"
                                title="Editar con IA"
                             >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                </svg>
                             </button>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Bottom Actions Bar */}
            {img.status === 'completed' && (
                <div className="p-3 bg-surfaceHighlight/50 border-t border-white/5 backdrop-blur-md flex flex-col gap-2">
                    {/* Primary Action Button Logic */}
                    {isApproved && !isVariation ? (
                        <div className="grid grid-cols-2 gap-2">
                             <Button 
                                variant="secondary" 
                                className="!py-1.5 !px-1 !text-[10px] !w-full bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-600/30"
                                onClick={(e) => handleBatchVariations(e, img, 2)}
                                title="Generar 2 Variaciones Rápidas"
                             >
                                 ⚡ 2 Var
                             </Button>
                             <Button 
                                variant="secondary" 
                                className="!py-1.5 !px-1 !text-[10px] !w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white border-none shadow-glow"
                                onClick={(e) => handleBatchVariations(e, img, 9)}
                                title="Generar 9 Variaciones (Pro)"
                             >
                                 ⚡⚡ 9 Var
                             </Button>
                        </div>
                    ) : null}

                    {isApproved ? (
                        <div className="flex justify-between items-center animate-fade-in pt-1">
                            <span className="text-[10px] font-bold text-green-500 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                LISTO
                            </span>
                             <button 
                                onClick={(e) => { e.stopPropagation(); deleteImage(img.id); }}
                                className="text-[10px] text-textMuted hover:text-red-500 underline"
                            >
                                Borrar
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setApprovalStatus(img.id, 'approved'); }}
                                className="flex-1 bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-2 rounded-lg transition-all shadow-lg shadow-green-900/20 active:scale-95 flex items-center justify-center gap-1"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                </svg>
                                SI
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); deleteImage(img.id); }}
                                className="px-3 bg-white/5 hover:bg-red-500/10 hover:text-red-500 border border-white/10 text-textMuted text-xs font-bold rounded-lg transition-colors active:scale-95"
                            >
                                NO
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-8 animate-fade-in relative">
        {/* Header */}
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-white">Fábrica Creativa</h2>
                <p className="text-textMuted text-sm">Hiper-realismo + Identity Injection</p>
            </div>
            <div className="flex gap-2">
                 {isProcessing && <Button variant="danger" onClick={handleStop}>⛔ Detener Todo</Button>}
                 <Button onClick={() => setStep(AppStep.EXPORT)} disabled={generatedImages.length === 0}>Exportar &rarr;</Button>
            </div>
        </div>

        {/* Settings Bar */}
        <Card className="flex flex-col md:flex-row gap-6 justify-between items-end !p-4 bg-surface/50">
             <div className="flex-1 w-full space-y-2">
                 {/* Removed API Key Input as it's handled by process.env */}
                 <div className="text-xs text-textMuted bg-surfaceHighlight/50 p-2 rounded">
                    Using secure environment key
                 </div>
             </div>
             <div className="w-48 space-y-2">
                 <label className="text-xs font-bold text-textMuted uppercase">Formato</label>
                 <select 
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="w-full bg-surfaceHighlight border border-borderColor rounded-xl px-3 py-3 text-sm focus:border-primary outline-none"
                 >
                     <option value="3:4">Portrait (3:4)</option>
                     <option value="1:1">Square (1:1)</option>
                     <option value="16:9">Landscape (16:9)</option>
                 </select>
             </div>
        </Card>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-white/5">
            <button 
                onClick={() => setActiveTab('approvals')}
                className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'approvals' ? 'border-primary text-primary' : 'border-transparent text-textMuted hover:text-white'}`}
            >
                Generación Inicial
            </button>
            <button 
                onClick={() => setActiveTab('variations')}
                className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'variations' ? 'border-primary text-primary' : 'border-transparent text-textMuted hover:text-white'}`}
            >
                Variaciones ({generatedImages.filter(i => i.type === 'variation').length})
            </button>
        </div>

        {/* Content */}
        {activeTab === 'approvals' && (
            <div className="space-y-8 animate-fade-in">
                <div className="flex justify-end">
                    <Button onClick={generateMains} isLoading={isProcessing} className="shadow-glow">
                        Generar Todos ({angles.filter(a => a.selected).length})
                    </Button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {angles.filter(a => a.selected).map(angle => {
                        const img = generatedImages.find(i => i.angleId === angle.id && i.type === 'main' && i.approvalStatus !== 'rejected');
                        
                        return (
                            <div key={angle.id} className="space-y-2">
                                <p className="text-[10px] font-bold text-textMuted uppercase truncate">{angle.name}</p>
                                {img ? (
                                    <ImageCard img={img} />
                                ) : (
                                    <div className="aspect-[3/4] border border-dashed border-borderColor rounded-xl flex items-center justify-center bg-surface/30">
                                        <span className="text-xs text-textMuted">Pendiente</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {/* Variations Tab */}
        {activeTab === 'variations' && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 animate-fade-in">
                {generatedImages.filter(i => i.type === 'variation').map(img => (
                    <div key={img.id} className="space-y-2">
                        <p className="text-[10px] font-bold text-textMuted uppercase truncate">
                            {angles.find(a => a.id === img.angleId)?.name || 'Variación'}
                        </p>
                        <ImageCard img={img} />
                    </div>
                ))}
                {generatedImages.filter(i => i.type === 'variation').length === 0 && (
                    <div className="col-span-full py-12 text-center text-textMuted">
                        Aprueba una imagen principal y usa los botones de "⚡ Variaciones" para escalar tus creativos.
                    </div>
                )}
            </div>
        )}

        {/* Lightbox */}
        {selectedImageId && (
            <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setSelectedImageId(null)}>
                <img 
                    src={generatedImages.find(i => i.id === selectedImageId)?.url} 
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                />
            </div>
        )}

        {/* EDIT MODAL */}
        {isEditing && imageToEdit && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsEditing(false)}>
                <Card className="w-full max-w-lg bg-surface border border-primary/20 shadow-2xl space-y-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-start">
                        <h3 className="text-xl font-bold text-white">Editar con IA</h3>
                        <button onClick={() => setIsEditing(false)} className="text-textMuted hover:text-white">✕</button>
                    </div>
                    
                    <div className="flex gap-4">
                        <img src={imageToEdit.url} className="w-24 h-32 object-cover rounded-lg border border-borderColor" />
                        <div className="flex-1 space-y-2">
                            <p className="text-xs text-textMuted">Instrucciones para Nano Banana:</p>
                            <TextArea 
                                value={editInstruction}
                                onChange={(e) => setEditInstruction(e.target.value)}
                                placeholder="Ej: Corregir texto a 'OFERTA'. Cambiar fondo a azul..."
                                className="h-32 text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancelar</Button>
                        <Button onClick={submitEdit}>Generar Corrección</Button>
                    </div>
                </Card>
            </div>
        )}
    </div>
  );
};
