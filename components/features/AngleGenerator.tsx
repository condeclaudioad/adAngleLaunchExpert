
import React, { useState, useEffect, useRef } from 'react';
import { useAdContext } from '../../store/AdContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { AppStep } from '../../types';
import { generateAngles } from '../../services/geminiService';

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
      if(confirm("¿Borrar todos los ángulos?")) setAngles([]);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white">Matriz de Ángulos</h2>
          <p className="text-textMuted mt-1">
             15+ ángulos de alta conversión basados en psicología de ventas.
          </p>
        </div>
        <div className="flex gap-3">
          {angles.length > 0 && (
             <>
                <Button variant="ghost" onClick={clearAll} className="text-red-400 hover:text-red-300">
                    Limpiar
                </Button>
                <Button onClick={() => setStep(AppStep.GENERATION)}>
                    Generar Creativos ({angles.filter(a => a.selected).length}) &rarr;
                </Button>
             </>
          )}
        </div>
      </div>

      {angles.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-24 border-dashed border-2 border-borderColor bg-transparent">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-glow">
             <span className="text-4xl">⚡</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">¿Listo para la lluvia de ideas?</h3>
          <p className="text-textMuted mb-8 max-w-md text-center">
            Analizaremos tu producto y generaremos ganchos irresistibles.
          </p>
          <Button onClick={handleGenerate} isLoading={loading}>
            Generar Ángulos
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Refresh Action Card - Always First */}
          <Card 
            variant="interactive" 
            onClick={handleGenerate}
            className="flex flex-col items-center justify-center border-dashed border-primary/30 bg-primary/5 group min-h-[300px]"
          >
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {loading ? (
                       <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                  ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-primary">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                  )}
              </div>
              <p className="font-bold text-primary text-lg">{loading ? 'Pensando...' : 'Generar Más'}</p>
              <p className="text-xs text-textMuted mt-2 text-center px-4">
                  Crear variaciones nuevas basadas en lo que ya tienes.
              </p>
          </Card>

          {angles.map((angle) => (
            <Card 
              key={angle.id} 
              variant="interactive"
              onClick={() => toggleAngle(angle.id)}
              className={`flex flex-col h-full relative group transition-all duration-300 min-h-[300px] ${
                angle.selected ? 'ring-1 ring-primary bg-primary/5 shadow-glow' : 'opacity-80 hover:opacity-100'
              }`}
            >
              <div className="absolute top-4 right-4">
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${angle.selected ? 'bg-primary border-primary' : 'border-textMuted'}`}>
                  {angle.selected && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
              </div>

              <div className="mb-4">
                  <Badge>{angle.emotion}</Badge>
              </div>

              <h3 className="text-lg font-bold text-white mb-2 pr-8 leading-tight">{angle.name}</h3>
              <p className="text-sm text-textMuted mb-6 flex-grow">{angle.description}</p>
              
              <div className="space-y-3 mt-auto">
                <div className="bg-surfaceHighlight p-3 rounded-xl border border-white/5">
                  <span className="text-[10px] text-primary font-bold uppercase block mb-1">Hook</span>
                  <p className="text-sm font-bold text-white">"{angle.hook}"</p>
                </div>
                <div>
                   <span className="text-[10px] text-textMuted font-bold uppercase">Visual Prompt</span>
                   <p className="text-[10px] text-textMuted mt-1 line-clamp-2 italic">{angle.visuals}</p>
                </div>
              </div>
            </Card>
          ))}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
};
