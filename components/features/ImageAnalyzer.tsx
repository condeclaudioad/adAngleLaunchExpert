import React, { useState } from 'react';
import { useAdContext } from '../../store/AdContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { AppStep, ImageAnalysis } from '../../types';
import { analyzeImage } from '../../services/geminiService';
import { UploadCloud, Eye, ArrowRight, Loader2, ImageIcon, ScanLine, X, Trash2 } from 'lucide-react';

export const ImageAnalyzer: React.FC = () => {
  const { addImageAnalysis, imageAnalysis, setStep, deleteVisualAnalysis } = useAdContext();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);

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
    const files: File[] = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsAnalyzing(true);
    setProcessedCount(0);
    setTotalToProcess(files.length);

    const processFile = async (file: File) => {
      try {
        const base64Data = await readFileAsBase64(file);
        const result = await analyzeImage(base64Data, 'image/jpeg');
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
      <Card key={idx} className="bg-bg-elevated/50 border-border-default hover:border-accent-primary/30 transition-all">
        <div className="flex justify-between items-start mb-4">
          <Badge variant="accent" className="flex items-center gap-1">
            <ScanLine size={12} /> DETECTADO
          </Badge>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted font-mono bg-bg-tertiary px-2 py-1 rounded">#{idx + 1}</span>
            <button
              onClick={() => {
                if (confirm('¿Eliminar este análisis?')) deleteVisualAnalysis(analysis.id);
              }}
              className="text-text-muted hover:text-red-400 transition-colors p-1"
              title="Eliminar Análisis"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <h4 className="font-bold text-white text-lg mb-3 leading-snug">
          {analysis.angleDetected || 'Ángulo detectado'}
        </h4>

        <div className="space-y-4 mb-4">
          <div className="bg-bg-tertiary p-3 rounded-xl border border-border-default/50">
            <p className="text-xs text-text-muted uppercase font-bold mb-1">Composición</p>
            <p className="text-sm text-text-secondary">{analysis.composition || 'N/A'}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-border-default/50">
          {Array.isArray(analysis.emotions) && analysis.emotions.map((e, i) => (
            <Badge key={i} variant="outline" size="sm" className="bg-black/20 text-text-muted border-white/10">
              {e}
            </Badge>
          ))}
          {Array.isArray(analysis.colors) && analysis.colors.map((c, i) => (
            <span key={`c-${i}`} className="flex items-center justify-center w-5 h-5 rounded-full border border-white/10 ring-1 ring-black/20" style={{ backgroundColor: c }} title={c} />
          ))}
        </div>
      </Card>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-border-default pb-6">
        <div>
          <Badge variant="accent" className="mb-2">Paso 2: Análisis</Badge>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <Eye className="text-accent-primary" /> Análisis Visual
          </h2>
          <p className="text-text-secondary mt-2 max-w-2xl">
            Sube anuncios exitosos (múltiples permitidos). Gemini extraerá el "ADN" de lo que funciona.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setStep(AppStep.ANGLES)}
            disabled={isAnalyzing}
            className="gap-2 shadow-glow-orange"
          >
            Continuar <ArrowRight size={18} />
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-8">
        {/* Upload Section */}
        <div className="md:col-span-4 space-y-4">
          <Card className={`h-64 border-dashed border-2 transition-all relative overflow-hidden group flex items-center justify-center cursor-pointer ${isAnalyzing ? 'border-accent-primary/50 bg-accent-primary/5' : 'border-border-default hover:border-accent-primary/50 bg-bg-elevated/30 hover:bg-bg-elevated/50'}`}>
            <input
              type="file"
              className="absolute inset-0 opacity-0 z-10 cursor-pointer disabled:cursor-not-allowed"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              disabled={isAnalyzing}
            />
            <div className="flex flex-col items-center justify-center px-4 text-center pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-bg-tertiary group-hover:bg-accent-primary/10 flex items-center justify-center mb-4 transition-colors">
                {isAnalyzing ? (
                  <Loader2 size={32} className="text-accent-primary animate-spin" />
                ) : (
                  <UploadCloud size={32} className="text-text-muted group-hover:text-accent-primary transition-colors" />
                )}
              </div>
              <h3 className="font-bold text-lg text-white mb-1">
                {isAnalyzing ? `Analizando ${processedCount}/${totalToProcess}...` : 'Sube tus Creativos'}
              </h3>
              <p className="text-sm text-text-muted">
                {isAnalyzing ? 'Extrayendo patrones visuales...' : 'Arrastra o haz clic para subir imágenes (PNG, JPG)'}
              </p>
            </div>
          </Card>

          {/* Instructions */}
          <Card className="bg-blue-500/5 border-blue-500/20">
            <h4 className="font-bold text-blue-400 text-sm mb-2 flex items-center gap-2">
              <ImageIcon size={14} /> ¿Qué subir?
            </h4>
            <ul className="text-xs text-text-secondary space-y-2 list-disc list-inside">
              <li>Anuncios que han tenido buenas ventas.</li>
              <li>Imágenes de competidores exitosos.</li>
              <li>Fotos de tu producto en uso.</li>
            </ul>
          </Card>
        </div>

        {/* Results Grid */}
        <div className="md:col-span-8">
          <div className="grid grid-cols-1 gap-4">
            {imageAnalysis.length > 0 ? (
              imageAnalysis.map((analysis, idx) => renderAnalysis(analysis, idx))
            ) : (
              <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-border-default rounded-2xl text-text-muted bg-bg-tertiary/20">
                <ScanLine size={48} className="opacity-20 mb-4" />
                <p>Sube imágenes para ver el análisis de IA aquí.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
