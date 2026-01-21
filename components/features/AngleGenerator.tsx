import React, { useState } from 'react';
import { useAdContext } from '../../store/AdContext';
import { AppStep, Angle } from '../../types';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { generateAngles } from '../../services/geminiService';
import {
  RefreshCcw,
  Check,
  Sparkles,
  ArrowRight,
  Target,
  Lightbulb,
  Palette,
  Trash2
} from 'lucide-react';
import { Modal } from '../ui/Modal';

export const AngleGenerator: React.FC = () => {
  /* Destructure needed data from context */
  const { currentBusiness, updateBusinessPartial: updateBusiness, setStep, googleApiKey: apiKey, knowledgeBase, imageAnalysis, angles: storedAngles } = useAdContext();
  const [isGenerating, setIsGenerating] = useState(false);
  const [angles, setAngles] = useState<Angle[]>(currentBusiness?.generatedAngles || []);
  const [angleToDelete, setAngleToDelete] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleNext = async () => {
    setIsSaving(true);
    try {
      if (currentBusiness && angles.length > 0) {
        // Backup to localStorage to ensure availability in next step
        try {
          localStorage.setItem('le_temp_angles', JSON.stringify(angles));
        } catch (e) {
          console.warn("Could not save temp angles to LocalStorage (Quota exceeded)", e);
          // Attempt cleanup
          try { localStorage.removeItem('le_temp_angles'); } catch { }
        }

        // Force sync local state to context/DB before navigation
        await updateBusiness(currentBusiness.id, { generatedAngles: angles });
      }
    } catch (error) {
      console.error("Save failed, proceeding anyway", error);
    } finally {
      setIsSaving(false);
      setStep(AppStep.GENERATION);
    }
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

  /* Delete Handler */
  const deleteSelectedAngle = async () => {
    if (!angleToDelete) return;
    const updated = angles.filter(a => a.id !== angleToDelete);
    setAngles(updated);
    if (currentBusiness) {
      updateBusiness(currentBusiness.id, { generatedAngles: updated });
    }
    setAngleToDelete(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fade-in pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 pb-8">
        <div>
          <Badge variant="outline" className="mb-3 border-emerald-500/30 text-emerald-400 bg-emerald-500/5">
            <Target className="w-3 h-3 mr-1" /> Fase 4: Estrategia Creativa
          </Badge>
          <h2 className="text-4xl font-bold text-white tracking-tight mb-2">
            Ángulos de <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Venta</span>
          </h2>
          <p className="text-text-secondary text-lg max-w-2xl">
            Selecciona los ángulos psicológicos que mejor resuenen. La IA generará anuncios basados en estos enfoques.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={handleGenerate}
            loading={isGenerating}
            icon={<RefreshCcw size={18} />}
            className="bg-white/5 hover:bg-white/10 border-white/10 text-white"
          >
            {angles.length > 0 ? 'Generar Nuevos' : 'Generar Ángulos'}
          </Button>
        </div>
      </div>

      {/* Content */}
      {angles.length > 0 ? (
        <>
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium text-text-secondary bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                <span className="text-white font-bold text-base mr-1">{angles.filter(a => a.selected).length}</span> seleccionados
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={toggleAll} className="text-text-muted hover:text-white">
              {angles.every(a => a.selected) ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {angles.map((angle, idx) => (
              <div key={angle.id} className="animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                <Card
                  onClick={() => toggleAngle(angle.id)}
                  className={`
                                        relative cursor-pointer transition-all duration-300 h-full group
                                        ${angle.selected
                      ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_30px_-10px_rgba(16,185,129,0.3)] hover:-translate-y-1'
                      : 'bg-bg-secondary/50 border-white/5 hover:border-white/20 hover:bg-bg-secondary hover:-translate-y-1'
                    }
                                    `}
                >
                  {/* Selection Check */}
                  <div className={`
                                        absolute top-4 right-4 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 z-10
                                        ${angle.selected
                      ? 'bg-emerald-500 border-emerald-500 text-white scale-110'
                      : 'border-white/10 text-transparent group-hover:border-white/30'
                    }
                                    `}>
                    <Check size={14} strokeWidth={3} />
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setAngleToDelete(angle.id);
                    }}
                    className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/20 text-text-muted hover:text-red-400 flex items-center justify-center transition-all z-20 opacity-0 group-hover:opacity-100"
                    title="Eliminar Ángulo"
                  >
                    <Trash2 size={14} />
                  </button>

                  <CardContent className="p-6 h-full flex flex-col">
                    <div className="mb-4 pt-4">
                      <Badge variant={getEmotionVariant(angle.emotion?.split(',')[0].trim())} className="mb-3 text-[10px] uppercase tracking-wider backdrop-blur-md">
                        {angle.emotion?.split(',')[0].trim()}
                      </Badge>
                      <h3 className={`text-xl font-bold leading-tight transition-colors ${angle.selected ? 'text-white' : 'text-text-primary group-hover:text-white'}`}>
                        {angle.name}
                      </h3>
                    </div>

                    <p className="text-sm text-text-secondary mb-6 flex-grow leading-relaxed">
                      {angle.description}
                    </p>

                    <div className="space-y-3 mt-auto">
                      {/* Hook */}
                      <div className={`
                                                p-3 rounded-xl border transition-colors
                                                ${angle.selected ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-bg-tertiary/50 border-white/5'}
                                            `}>
                        <div className="flex items-center gap-2 mb-1">
                          <Lightbulb size={12} className={angle.selected ? 'text-emerald-400' : 'text-amber-400'} />
                          <span className={`text-[10px] uppercase font-bold tracking-wider ${angle.selected ? 'text-emerald-400' : 'text-text-muted'}`}>Hook</span>
                        </div>
                        <p className="text-sm font-medium italic text-text-primary/90">"{angle.hook}"</p>
                      </div>

                      {/* Visual Prompt Preview */}
                      <div className="px-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Palette size={12} className="text-text-muted" />
                          <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Visual</span>
                        </div>
                        <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">{angle.visuals}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-8 pb-10 border-t border-white/5 sticky bottom-0 bg-gradient-to-t from-bg-primary via-bg-primary to-transparent z-20 pointer-events-none">
            <div className="pointer-events-auto">
              <Button
                onClick={handleNext}
                disabled={!angles.some(a => a.selected) || isSaving}
                loading={isSaving}
                size="lg"
                className={`
                                    shadow-glow-emerald transition-all duration-300
                                    ${!angles.some(a => a.selected) ? 'opacity-50 grayscale' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:scale-105'}
                                `}
              >
                Ir a Fábrica Creativa <ArrowRight size={18} className="ml-2" />
              </Button>
            </div>
          </div>

          <Modal
            isOpen={!!angleToDelete}
            onClose={() => setAngleToDelete(null)}
            title="¿Eliminar Ángulo?"
            footer={
              <>
                <Button variant="ghost" onClick={() => setAngleToDelete(null)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={deleteSelectedAngle}>
                  Eliminar
                </Button>
              </>
            }
          >
            <p className="text-sm text-text-secondary">
              ¿Estás seguro de que deseas eliminar este ángulo de venta? Esta acción no se puede deshacer.
            </p>
          </Modal>
        </>
      ) : (
        <div className="min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01] relative overflow-hidden group">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
          <div className="relative z-10 flex flex-col items-center max-w-md text-center p-8">
            <div className="w-20 h-20 rounded-full bg-bg-tertiary flex items-center justify-center mb-6 shadow-xl ring-1 ring-white/5 group-hover:scale-110 transition-transform duration-500">
              <Sparkles size={32} className="text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Motor de Creatividad Listo</h3>
            <p className="text-text-secondary mb-8 leading-relaxed">
              Genera ángulos de marketing basados en la psicología de tu audiencia y los análisis previos.
            </p>
            <Button
              onClick={handleGenerate}
              loading={isGenerating}
              size="lg"
              className="shadow-glow-emerald bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border-0"
            >
              <Sparkles size={18} className="mr-2" /> Generar Ángulos Ahora
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
