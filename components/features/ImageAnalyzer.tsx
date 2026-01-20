
import React, { useState } from 'react';
import { useAdContext } from '../../store/AdContext';
import { Button } from '../ui/Button';
import { AppStep, ImageAnalysis } from '../../types';
import { analyzeImage } from '../../services/geminiService';

export const ImageAnalyzer: React.FC = () => {
  const { addImageAnalysis, imageAnalysis, setStep } = useAdContext();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Resize image to max 1024px to prevent memory crashes and optimize API usage
          const MAX_SIZE = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Compress to JPEG 0.8 quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          // dataUrl format is "data:image/jpeg;base64,..."
          const base64 = dataUrl.split(',')[1];
          resolve(base64);
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

    // Create a copy of the promises array to track completion
    const processFile = async (file: File) => {
      try {
        console.log(`Processing file: ${file.name}`);
        const base64Data = await readFileAsBase64(file);

        // Force jpeg mime type as our resizer converts everything to jpeg
        const result = await analyzeImage(base64Data, 'image/jpeg');

        if (result && result.angleDetected) {
          console.log(`Success processing ${file.name}`);
          addImageAnalysis(result);
        } else {
          console.warn(`Analysis returned incomplete data for ${file.name}`);
        }
      } catch (err) {
        console.error(`Error analyzing ${file.name}:`, err);
        // Non-blocking error toast could be added here
      } finally {
        setProcessedCount(prev => prev + 1);
      }
    };

    try {
      // Process sequentially to be safer with memory/API limits, or parallel with limit
      // Currently parallel is fine for small batches (Gemini has decent rate limits)
      await Promise.all(files.map(processFile));
    } catch (err) {
      console.error("Critical error in batch processing:", err);
      alert("Hubo un error al procesar las imágenes. Por favor intenta de nuevo con menos archivos.");
    } finally {
      setIsAnalyzing(false);
      // Don't reset processed counts immediately so user sees "Done" state
      setTimeout(() => {
        setTotalToProcess(0);
        setProcessedCount(0);
      }, 2000);
      e.target.value = '';
    }
  };

  // Safe render function
  const renderAnalysis = (analysis: ImageAnalysis, idx: number) => {
    if (!analysis) return null;
    return (
      <div key={idx} className="bg-surface p-5 rounded-xl border border-borderColor space-y-3 animate-fade-in">
        <div className="flex justify-between items-start">
          <span className="text-xs font-bold bg-primary/20 text-primary px-2 py-1 rounded">DETECTADO</span>
          <span className="text-xs text-textMuted">#{idx + 1}</span>
        </div>
        <h4 className="font-semibold text-textMain">{analysis.angleDetected || 'Ángulo detectado'}</h4>
        <div className="text-sm space-y-2">
          <p className="text-textMuted"><strong className="text-textMain">Composición:</strong> {analysis.composition || 'N/A'}</p>
          <p className="text-textMuted"><strong className="text-textMain">Copy:</strong> {analysis.copy || 'N/A'}</p>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          {Array.isArray(analysis.emotions) && analysis.emotions.map((e, i) => (
            <span key={i} className="text-xs bg-surfaceHighlight px-2 py-1 rounded text-textMuted">{e}</span>
          ))}
          {Array.isArray(analysis.colors) && analysis.colors.map((c, i) => (
            <span key={`c-${i}`} className="text-xs border border-borderColor px-2 py-1 rounded text-textMuted flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-current" style={{ color: c }}></span>
              {c}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-textMain">Análisis Visual</h2>
          <p className="text-textMuted mt-1">Sube anuncios exitosos (múltiples permitidos). Gemini extraerá el "ADN" de lo que funciona.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setStep(AppStep.ANGLES)}>
            Omitir / Listo
          </Button>
        </div>
      </div>

      <div className={`bg-surface border-2 border-dashed rounded-2xl p-12 text-center transition-colors relative ${isAnalyzing ? 'border-primary/50 bg-primary/5' : 'border-borderColor hover:border-primary/50'}`}>
        <input
          type="file"
          id="fileUpload"
          className="hidden"
          accept="image/*"
          multiple
          onChange={handleFileUpload}
          disabled={isAnalyzing}
        />
        <label htmlFor="fileUpload" className={`cursor-pointer flex flex-col items-center gap-4 ${isAnalyzing ? 'cursor-wait' : ''}`}>
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            {isAnalyzing ? (
              <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            )}
          </div>
          <div>
            <span className="text-primary font-semibold">
              {isAnalyzing ? `Analizando ${processedCount}/${totalToProcess}...` : 'Clic para subir imágenes'}
            </span>
            {!isAnalyzing && <span className="text-textMuted"> o arrastra y suelta (varias a la vez)</span>}
          </div>
          <p className="text-xs text-textMuted">PNG, JPG hasta 10MB</p>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {imageAnalysis.map((analysis, idx) => renderAnalysis(analysis, idx))}
      </div>
    </div>
  );
};
