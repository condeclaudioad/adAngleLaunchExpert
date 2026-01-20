import React, { useState, useEffect, useRef } from 'react';
import { useAdContext } from '../../store/AdContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { AppStep } from '../../types';
import { generateAngles } from '../../services/geminiService';
import { Zap, Sparkles, Check, Trash2, ArrowRight } from 'lucide-react';

export const AngleGenerator: React.FC = () => {
  const { knowledgeBase, imageAnalysis, angles, setAngles, setStep } = useAdContext();
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new angles are added
  useEffect(() => {
    if (angles.length > 0 && !loading) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [angles.length, loading]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // Pass 'angles' as history to avoid duplicates
      const newAngles = await generateAngles(knowledgeBase, imageAnalysis, angles);

      if (!newAngles || newAngles.length === 0) {
        throw new Error("No se generaron ángulos. Intenta de nuevo.");
      }

      // APPEND new angles instead of replacing
      setAngles([...angles, ...newAngles]);
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Error generando ángulos. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const toggleAngle = (id: string) => {
    setAngles(angles.map(a => a.id === id ? { ...a, selected: !a.selected } : a));
  };

  const clearAll = () => {
    if (confirm("¿Borrar todos los ángulos?")) setAngles([]);
  };

  const getEmotionVariant = (emotion: string) => {
    const e = emotion.toLowerCase();
    if (e.includes('miedo') || e.includes('temor') || e.includes('dolor')) return 'fear';
    if (e.includes('codicia') || e.includes('ganancia') || e.includes('ambic')) return 'greed';
    if (e.includes('urgencia') || e.includes('escasez')) return 'urgency';
    if (e.includes('curiosidad') || e.includes('secreto') || e.includes('descubr')) return 'curiosity';
    if (e.includes('esperanza') || e.includes('sueño') || e.includes('logr')) return 'hope';
    if (e.includes('exclusiv') || e.includes('vip') || e.includes('status')) return 'vip';
    return 'accent';
  };

  const selectedCount = angles.filter(a => a.selected).length;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-border-default pb-6">
        <div>
          <Badge variant="accent" className="mb-2">Paso 3: Ángulos</Badge>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <Zap className="text-accent-primary" /> Matriz de Ángulos
          </h2>
          <p className="text-text-secondary mt-2 max-w-2xl">
            Selecciona los ángulos que resuenen con tu audiencia.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {angles.length > 0 && (
            <>
              <Button variant="ghost" onClick={clearAll} className="text-red-400 hover:text-red-300 gap-2">
                <Trash2 size={16} /> Limpiar
              </Button>
              <Button
                onClick={() => setStep(AppStep.GENERATION)}
                disabled={selectedCount === 0}
                className="shadow-glow-orange gap-2"
              >
                Generar {selectedCount} Creativos <ArrowRight size={18} />
              </Button>
            </>
          )}
        </div>
      </div>

      {angles.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-24 border-dashed border-2 border-border-default bg-bg-elevated/20">
          <div className="w-24 h-24 bg-accent-primary/10 rounded-full flex items-center justify-center mb-6 shadow-glow-orange">
            <Sparkles size={48} className="text-accent-primary" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Lluvia de Ideas IA</h3>
          <p className="text-text-muted mb-8 max-w-md text-center">
            Analizaremos la psicología de tu cliente y generaremos ganchos irresistibles.
          </p>
          <Button onClick={handleGenerate} isLoading={loading} size="lg" className="px-8">
            <Zap className="mr-2" size={20} /> Generar Ángulos
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Refresh/Add More Card */}
          <Card
            className="flex flex-col items-center justify-center border-dashed border-2 border-accent-primary/30 bg-accent-primary/5 hover:bg-accent-primary/10 transition-colors cursor-pointer group min-h-[350px]"
            onClick={handleGenerate}
          >
            <div className="w-16 h-16 bg-accent-primary/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              {loading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary" />
              ) : (
                <Sparkles size={32} className="text-accent-primary" />
              )}
            </div>
            <p className="font-bold text-accent-primary text-lg">{loading ? 'Cocinando...' : 'Generar Más'}</p>
            <p className="text-xs text-text-muted mt-2 text-center px-6">
              Explorar nuevos enfoques psicológicos.
            </p>
          </Card>

          {angles.map((angle) => {
            const emotionVariant = getEmotionVariant(angle.emotion);
            return (
              <Card
                key={angle.id}
                // @ts-ignore
                variant={angle.selected ? 'accent' : 'interactive'}
                onClick={() => toggleAngle(angle.id)}
                className={`flex flex-col h-full relative group transition-all duration-300 min-h-[350px] !p-5
                    ${angle.selected ? 'ring-2 ring-accent-primary bg-accent-primary/10 shadow-glow-soft' : 'opacity-90 hover:opacity-100'}
                  `}
              >
                <div className="absolute top-4 right-4 z-20">
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-300 ${angle.selected ? 'bg-accent-primary border-accent-primary scale-110' : 'border-text-muted bg-transparent'}`}>
                    {angle.selected && <Check size={14} className="text-white" />}
                  </div>
                </div>

                <div className="mb-4">
                  {/* @ts-ignore */}
                  <Badge variant={emotionVariant}>{angle.emotion}</Badge>
                </div>

                <h3 className="text-lg font-bold text-white mb-3 pr-8 leading-tight">{angle.name}</h3>
                <p className="text-sm text-text-secondary mb-6 flex-grow leading-relaxed">{angle.description}</p>

                <div className="space-y-3 mt-auto relative z-10">
                  <div className={`p-4 rounded-xl border transition-colors ${angle.selected ? 'bg-accent-primary/20 border-accent-primary/20' : 'bg-bg-tertiary border-border-default'}`}>
                    <span className="text-[10px] text-accent-primary font-bold uppercase block mb-1 tracking-wider">Hook</span>
                    <p className="text-sm font-bold text-white italic">"{angle.hook}"</p>
                  </div>
                </div>
              </Card>
            );
          })}
          <div ref={bottomRef} className="w-full h-1" />
        </div>
      )}
    </div>
  );
};
