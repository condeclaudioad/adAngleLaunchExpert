import React, { useState } from 'react';
import { useAdContext } from '../../store/AdContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { AppStep, ImageAnalysis } from '../../types';
import { analyzeImage } from '../../services/geminiService';
import {
  UploadCloud,
  Eye,
  ArrowRight,
  Loader2,
  ImageIcon,
  ScanLine,
  Trash2,
  Sparkles,
  Maximize2
} from 'lucide-react';

export const ImageAnalyzer: React.FC = () => {
  const { addImageAnalysis, imageAnalysis, setStep, deleteVisualAnalysis, googleApiKey: apiKey } = useAdContext();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);
  const [analysisToDelete, setAnalysisToDelete] = useState<string | null>(null);

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const MAX_SIZE = 1024;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
          } else {
            if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) { reject(new Error("Could not get canvas context")); return; }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(dataUrl.split(',')[1]);
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!apiKey) {
      alert("Configura tu API Key primero en Ajustes.");
      return;
    }

    const files: File[] = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsAnalyzing(true);
    setProcessedCount(0);
    setTotalToProcess(files.length);

    const processFile = async (file: File) => {
      try {
        const base64Data = await readFileAsBase64(file);
        const result = await analyzeImage(base64Data, 'image/jpeg', apiKey);
        if (result && result.angleDetected) {
          addImageAnalysis(result);
        }
      } catch (err) {
        console.error(`Error analyzing ${file.name}:`, err);
      } finally {
        setProcessedCount(prev => prev + 1);
      }
    };

    try {
      await Promise.all(files.map(processFile));
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => { setTotalToProcess(0); setProcessedCount(0); }, 2000);
      e.target.value = '';
    }
  };

  const renderAnalysis = (analysis: ImageAnalysis, idx: number) => {
    if (!analysis) return null;
    return (
      <div key={idx} className="relative group animate-fade-in-up" style={{ animationDelay: `${idx * 100}ms` }}>
        <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl blur-xl" />
        <Card className="h-full bg-bg-secondary/50 backdrop-blur-md border-white/5 hover:border-accent-primary/40 transition-all p-0 overflow-hidden group-hover:-translate-y-1 group-hover:shadow-xl">
          <div className="p-5 border-b border-white/5 flex justify-between items-start bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent-primary/10 flex items-center justify-center text-accent-primary ring-1 ring-accent-primary/20">
                <ScanLine size={16} />
              </div>
              <div>
                <h4 className="font-bold text-white text-base leading-tight">
                  {analysis.angleDetected || 'Patrón Detectado'}
                </h4>
                <Badge variant="outline" className="mt-1 text-[10px] h-5 border-white/10 text-text-muted">
                  Análisis #{String(idx + 1).padStart(2, '0')}
                </Badge>
              </div>
            </div>
            <button
              onClick={() => setAnalysisToDelete(analysis.id)}
              className="w-8 h-8 rounded-full hover:bg-red-500/10 hover:text-red-400 text-text-muted transition-colors flex items-center justify-center"
              title="Eliminar Análisis"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className="p-5 space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider flex items-center gap-1.5">
                <Maximize2 size={10} /> Composición
              </label>
              <p className="text-sm text-text-secondary leading-relaxed bg-bg-tertiary/50 p-3 rounded-lg border border-white/5">
                {analysis.composition || 'No se detectaron detalles de composición.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Emociones</label>
                <div className="flex flex-wrap gap-1.5">
                  {Array.isArray(analysis.emotions) && analysis.emotions.map((e, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px] py-0.5 px-2 bg-white/5 border-white/10 text-text-primary">
                      {e}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Paleta</label>
                <div className="flex flex-wrap gap-1.5">
                  {Array.isArray(analysis.colors) && analysis.colors.map((c, i) => (
                    <div
                      key={`c-${i}`}
                      className="w-6 h-6 rounded-full border border-white/10 shadow-sm ring-1 ring-black/20 hover:scale-110 transition-transform cursor-help"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fade-in pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 pb-8">
        <div>
          <Badge variant="outline" className="mb-3 border-blue-500/30 text-blue-400 bg-blue-500/5">
            <Eye className="w-3 h-3 mr-1" /> Fase 3: Espionaje Visual
          </Badge>
          <h2 className="text-4xl font-bold text-white tracking-tight mb-2">
            Decodifica el <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Éxito</span>
          </h2>
          <p className="text-text-secondary text-lg max-w-2xl">
            Sube anuncios ganadores. Gemini Vision extraerá sus patrones ocultos (ángulos, colores, emociones) para replicar su éxito.
          </p>
        </div>
        <div className="flex gap-3">
          {imageAnalysis.length > 0 && (
            <Button
              onClick={() => setStep(AppStep.ANGLES)}
              disabled={isAnalyzing}
              className="h-12 px-6 shadow-glow-blue bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium border-0"
            >
              Generar Mis Ángulos <ArrowRight size={18} className="ml-2" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Upload Section */}
        <div className="lg:col-span-4 space-y-6">
          <div className={`
                        relative h-72 rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden group
                        ${isAnalyzing
              ? 'border-blue-500/50 bg-blue-500/5'
              : 'border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 bg-white/[0.02]'
            }
                    `}>
            <input
              type="file"
              className="absolute inset-0 opacity-0 z-20 cursor-pointer disabled:cursor-not-allowed"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              disabled={isAnalyzing}
            />

            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
              <div className={`
                                w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 shadow-xl
                                ${isAnalyzing ? 'bg-blue-500/20 text-blue-400' : 'bg-bg-tertiary group-hover:bg-blue-500/20 text-text-muted group-hover:text-blue-400 group-hover:scale-110'}
                            `}>
                {isAnalyzing ? (
                  <Loader2 size={40} className="animate-spin" />
                ) : (
                  <UploadCloud size={40} strokeWidth={1.5} />
                )}
              </div>

              <h3 className="font-bold text-xl text-white mb-2">
                {isAnalyzing ? `Analizando ${processedCount}/${totalToProcess}...` : 'Sube Referencias'}
              </h3>
              <p className="text-sm text-text-secondary max-w-[200px] leading-relaxed">
                {isAnalyzing
                  ? 'Descifrando psicología visual...'
                  : 'Arrastra imágenes de tu competencia o productos virales'
                }
              </p>
            </div>
          </div>

          {/* Instructions */}
          <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/5 border-blue-500/20 backdrop-blur-sm">
            <div className="p-5">
              <h4 className="font-bold text-blue-300 text-sm mb-3 flex items-center gap-2">
                <Sparkles size={14} /> ¿Qué funciona mejor?
              </h4>
              <ul className="space-y-3">
                {[
                  'Anuncios con alto CTR de competidores',
                  'Fotos de estilo de vida de tu producto',
                  'Capturas de landings que convierten'
                ].map((item, i) => (
                  <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>

        {/* Results Grid */}
        <div className="lg:col-span-8">
          {imageAnalysis.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 max-h-[calc(100vh-300px)] overflow-y-auto pr-2 custom-scrollbar">
              {imageAnalysis.map((analysis, idx) => renderAnalysis(analysis, idx))}
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.01] text-text-muted relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
              <div className="bg-bg-tertiary/50 p-6 rounded-full mb-6 ring-1 ring-white/5">
                <ScanLine size={48} className="opacity-40" strokeWidth={1} />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Esperando Datos</h3>
              <p className="max-w-xs text-center text-sm text-text-secondary">
                La IA necesita "alimentarse" de ejemplos visuales para generar ángulos de venta precisos.
              </p>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={!!analysisToDelete}
        onClose={() => setAnalysisToDelete(null)}
        title="¿Eliminar Análisis?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAnalysisToDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (analysisToDelete) {
                  deleteVisualAnalysis(analysisToDelete);
                  setAnalysisToDelete(null);
                }
              }}
            >
              Eliminar Definitivamente
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          Esta acción eliminará permanentemente este análisis visual y no se podrá recuperar.
          <br /><br />
          ¿Estás seguro de continuar?
        </p>
      </Modal>
    </div >
  );
};
