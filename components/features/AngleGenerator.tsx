import React, { useState } from 'react';
import { useAdContext } from '../../store/AdContext';
import { AppStep, Angle } from '../../types';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { generateAngles } from '../../services/geminiService';

// Icons
const RefreshIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6M1 20v-6h6" strokeLinecap="round" strokeLinejoin="round" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const CheckIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>;

export const AngleGenerator: React.FC = () => {
  /* Destructure needed data from context */
  const { currentBusiness, updateBusiness, setStep, googleApiKey: apiKey, knowledgeBase, imageAnalysis, angles: storedAngles } = useAdContext();
  const [isGenerating, setIsGenerating] = useState(false);
  const [angles, setAngles] = useState<Angle[]>(currentBusiness?.generatedAngles || []);

  const handleGenerate = async () => {
    if (!apiKey) {
      alert("Falta la API Key. Ve a Ajustes.");
      return;
    }

    setIsGenerating(true);
    try {
      // Call Gemini Service
      const newAngles = await generateAngles(
        currentBusiness?.knowledgeBase || knowledgeBase,
        currentBusiness?.imageAnalysis || imageAnalysis,
        angles,
        apiKey
      );

      if (!newAngles || newAngles.length === 0) {
        throw new Error("No se generaron ángulos. Intenta de nuevo.");
      }

      const updatedAngles = [...angles, ...newAngles];
      setAngles(updatedAngles);

      // Update Context & DB
      updateBusiness(currentBusiness!.id, { generatedAngles: updatedAngles });

    } catch (error: any) {
      console.error(error);
      alert(`Error generando ángulos: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };


  const toggleAngle = (id: string) => {
    const updated = angles.map(a => a.id === id ? { ...a, selected: !a.selected } : a);
    setAngles(updated);
    updateBusiness(currentBusiness!.id, { generatedAngles: updated });
  };

  const toggleAll = () => {
    const allSelected = angles.every(a => a.selected);
    const updated = angles.map(a => ({ ...a, selected: !allSelected }));
    setAngles(updated);
    updateBusiness(currentBusiness!.id, { generatedAngles: updated });
  };

  const handleNext = () => {
    setStep(AppStep.GENERATION);
  };

  const getEmotionVariant = (emotion: string) => {
    const map: Record<string, 'danger' | 'warning' | 'success' | 'accent' | 'vip'> = {
      'Miedo': 'danger',
      'Urgencia': 'warning',
      'Codicia': 'success',
      'Curiosidad': 'accent',
      'Confianza': 'vip'
    };
    return map[emotion] || 'default';
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold mb-2">Ángulos de Venta</h2>
          <p className="text-text-secondary">
            Selecciona los ángulos que mejor resuenen con tu estrategia.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleGenerate} loading={isGenerating} icon={<RefreshIcon />}>
            {angles.length > 0 ? 'Regenerar' : 'Generar Ángulos'}
          </Button>
        </div>
      </div>

      {/* Content */}
      {angles.length > 0 ? (
        <>
          <div className="flex items-center justify-between">
            <div className="text-sm text-text-muted">
              <span className="text-white font-bold">{angles.filter(a => a.selected).length}</span> seleccionados
            </div>
            <Button variant="ghost" size="sm" onClick={toggleAll}>
              {angles.every(a => a.selected) ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {angles.map((angle) => (
              <Card
                key={angle.id}
                variant={angle.selected ? 'accent' : 'default'}
                className={`
                                    relative cursor-pointer transition-all duration-300
                                    ${angle.selected ? 'ring-2 ring-accent-primary shadow-glow-soft scale-[1.02]' : 'hover:border-border-hover'}
                                `}
                onClick={() => toggleAngle(angle.id)}
              >
                {/* Selection Check */}
                <div className={`
                                    absolute top-4 right-4 w-6 h-6 rounded-full border flex items-center justify-center transition-colors
                                    ${angle.selected ? 'bg-accent-primary border-accent-primary text-white' : 'border-text-muted text-transparent'}
                                `}>
                  <CheckIcon />
                </div>

                <CardContent className="pt-8">
                  <Badge variant={getEmotionVariant(angle.emotion)} className="mb-4">
                    {angle.emotion}
                  </Badge>

                  <h3 className="text-lg font-bold mb-2">{angle.name}</h3>
                  <p className="text-sm text-text-secondary mb-4 min-h-[40px]">
                    {angle.description}
                  </p>

                  {/* Hook */}
                  <div className="bg-bg-tertiary/50 border border-border-default rounded-xl p-3 mb-3">
                    <label className="text-[10px] uppercase font-bold text-accent-primary tracking-wider">Hook</label>
                    <p className="text-sm font-medium italic text-white mt-1">"{angle.hook}"</p>
                  </div>

                  {/* Visual Prompt Preview */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Visual</label>
                    <p className="text-xs text-text-muted mt-1 line-clamp-2">{angle.visuals}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end pt-8">
            <Button onClick={handleNext} disabled={!angles.some(a => a.selected)} size="lg">
              Ir a Fábrica Creativa →
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center py-20 border-2 border-dashed border-border-default rounded-3xl">
          <div className="max-w-md mx-auto">
            <h3 className="text-xl font-medium mb-2">Aún no hay ángulos</h3>
            <p className="text-text-muted mb-6">Genera una lista de ángulos basada en tu análisis de base de conocimiento.</p>
            <Button onClick={handleGenerate} loading={isGenerating} size="lg">
              Generar Ángulos Ahora
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
