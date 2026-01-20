import React, { useState } from 'react';
import { useAdContext } from '../../store/AdContext';
import { AppStep, Angle } from '../../types';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { geminiService } from '../../services/geminiService';

// Icons
const RefreshIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6M1 20v-6h6" strokeLinecap="round" strokeLinejoin="round" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const CheckIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>;

export const AngleGenerator: React.FC = () => {
  const { currentBusiness, updateBusiness, setStep } = useAdContext();
  const [isGenerating, setIsGenerating] = useState(false);
  const [angles, setAngles] = useState<Angle[]>(currentBusiness?.generatedAngles || []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Mock generation for UI demo
      await new Promise(resolve => setTimeout(resolve, 2000));
      const mockAngles: Angle[] = [
        { id: '1', name: 'El Villano Oculto', hook: "Lo que tu agencia no te dice...", description: "Enfocado en la desconfianza del mercado.", emotion: "Miedo", visuals: "Una persona rompiendo un contrato, fondo oscuro.", selected: false },
        { id: '2', name: 'La Nueva Oportunidad', hook: "La nueva era del e-commerce ha llegado.", description: "Presentar el producto como una novedad absoluta.", emotion: "Curiosidad", visuals: "Un cohete despegando, colores vibrantes.", selected: false },
        { id: '3', name: 'Prueba Social', hook: "Más de 10,000 estudiantes no pueden estar equivocados.", description: "Basado en la autoridad de la masa.", emotion: "Confianza", visuals: "Collage de testimonios sonrientes.", selected: false },
        { id: '4', name: 'Urgencia Escasa', hook: "Solo quedan 24h para cerrar el acceso.", description: "Miedo a perderse la oportunidad (FOMO).", emotion: "Urgencia", visuals: "Un reloj de arena casi vacío.", selected: false },
        { id: '5', name: 'Beneficio Directo', hook: "Duplica tus ventas en 30 días.", description: "Promesa clara y directa.", emotion: "Codicia", visuals: "Gráfico de ventas subiendo exponencialmente.", selected: false },
        { id: '6', name: 'Historia de Origen', hook: "Estaba arruinado hasta que descubrí esto...", description: "Storytelling personal y vulnerable.", emotion: "Empatía", visuals: "Foto personal en blanco y negro vs color.", selected: false },
      ];

      setAngles(mockAngles);
      updateBusiness(currentBusiness!.id, { generatedAngles: mockAngles });
    } catch (error) {
      console.error(error);
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
