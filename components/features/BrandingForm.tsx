import React, { useState } from 'react';
import { useAdContext } from '../../store/AdContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { AppStep } from '../../types';
import { Palette, Upload, User, Image as ImageIcon, Box, ArrowRight, ArrowLeft, Trash2 } from 'lucide-react';

export const BrandingForm: React.FC = () => {
  const { branding, setBranding, setStep, saveCurrentBusiness, currentBusiness } = useAdContext();
  const [bizName, setBizName] = useState(currentBusiness?.name || '');

  const handleImageUpload = (field: 'logo' | 'personalPhoto' | 'productMockup', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBranding({ ...branding, [field]: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAndNext = async () => {
    let nameToSave = bizName;
    if (!nameToSave) {
      nameToSave = prompt("Dale un nombre a este negocio para guardarlo:") || "";
      if (!nameToSave) return;
      setBizName(nameToSave);
    }

    await saveCurrentBusiness(nameToSave);
    setStep(AppStep.ANALYSIS);
  };

  const UploadCard = ({ title, subtitle, icon: Icon, field, value }: { title: string, subtitle: string, icon: any, field: 'logo' | 'personalPhoto' | 'productMockup', value: string | null | undefined }) => (
    <Card className="flex flex-col items-center text-center p-6 bg-bg-elevated/30 hover:bg-bg-elevated/50 transition-colors border-dashed border-2 border-border-default hover:border-accent-primary/50 group h-full relative overflow-hidden">
      <div className={`p-4 rounded-full bg-bg-tertiary mb-3 transition-colors ${value ? 'text-green-500' : 'text-text-muted group-hover:text-accent-primary'}`}>
        <Icon size={24} />
      </div>
      <h3 className="font-bold text-text-primary mb-1">{title}</h3>
      <p className="text-[10px] text-text-muted mb-4">{subtitle}</p>

      {value ? (
        <div className="w-full aspect-square rounded-xl overflow-hidden relative border border-border-default bg-black/50 mb-4 group/image">
          <img src={value} alt={title} className="w-full h-full object-contain" />
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity">
            <Button
              variant="danger"
              size="sm"
              className="!p-2"
              onClick={() => setBranding({ ...branding, [field]: null })}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-auto w-full">
          <label className="w-full block">
            <div className="w-full py-2 bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-2">
              <Upload size={14} /> Subir
            </div>
            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(field, e)} />
          </label>
        </div>
      )}
    </Card>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-border-default pb-6">
        <div>
          <Badge variant="accent" className="mb-2">Configuración</Badge>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <Palette className="text-accent-primary" /> Identidad de Marca
          </h2>
          <p className="text-text-secondary mt-2 max-w-2xl">
            Define los elementos visuales clave. Esto guiará a la IA para mantener tu estilo.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-8">
        {/* Left Column: Business Info & Colors */}
        <div className="md:col-span-4 space-y-6">
          <Card className="space-y-4">
            <h3 className="font-bold text-text-primary flex items-center gap-2">
              Generales
            </h3>
            <Input
              label="Nombre del Negocio"
              placeholder="Ej. Agencia de Viajes X"
              value={bizName}
              onChange={(e) => setBizName(e.target.value)}
            />
          </Card>

          <Card className="space-y-4">
            <h3 className="font-bold text-text-primary flex items-center gap-2">
              <Palette size={18} className="text-accent-primary" /> Paleta de Colores
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-2 bg-bg-tertiary rounded-xl border border-border-default">
                <input
                  type="color"
                  value={branding.colors.primary}
                  onChange={(e) => setBranding({ ...branding, colors: { ...branding.colors, primary: e.target.value } })}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                />
                <div className="flex-1">
                  <p className="text-xs font-bold text-text-primary">Primario</p>
                  <p className="text-[10px] text-text-muted uppercase font-mono">{branding.colors.primary}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 bg-bg-tertiary rounded-xl border border-border-default">
                <input
                  type="color"
                  value={branding.colors.secondary}
                  onChange={(e) => setBranding({ ...branding, colors: { ...branding.colors, secondary: e.target.value } })}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                />
                <div className="flex-1">
                  <p className="text-xs font-bold text-text-primary">Secundario</p>
                  <p className="text-[10px] text-text-muted uppercase font-mono">{branding.colors.secondary}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Assets */}
        <div className="md:col-span-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 h-full">
            <div className="h-full">
              <UploadCard
                title="Logo"
                subtitle="PNG/SVG Transparente"
                icon={Box}
                field="logo"
                value={branding.logo}
              />
            </div>
            <div className="h-full flex flex-col gap-4">
              <UploadCard
                title="Experto (Face ID)"
                subtitle="Foto clara del rostro"
                icon={User}
                field="personalPhoto"
                value={branding.personalPhoto}
              />
              {branding.personalPhoto && (
                <div className="flex items-center justify-center gap-2 bg-bg-elevated/30 p-2 rounded-lg border border-border-default">
                  <input
                    type="checkbox"
                    id="includeFace"
                    checked={branding.includeFace}
                    onChange={(e) => setBranding({ ...branding, includeFace: e.target.checked })}
                    className="rounded border-border-default text-accent-primary focus:ring-accent-primary bg-bg-tertiary"
                  />
                  <label htmlFor="includeFace" className="text-xs text-text-secondary cursor-pointer select-none">Usar en Ads</label>
                </div>
              )}
            </div>
            <div className="h-full">
              <UploadCard
                title="Mockup Producto"
                subtitle="Caja, Botella, App..."
                icon={ImageIcon}
                field="productMockup"
                value={branding.productMockup}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t border-border-default">
        <Button variant="ghost" onClick={() => setStep(AppStep.ONBOARDING)}>
          <ArrowLeft size={18} className="mr-2" /> Volver
        </Button>
        <Button onClick={handleSaveAndNext} className="shadow-glow-orange gap-2">
          Guardar y Continuar <ArrowRight size={18} />
        </Button>
      </div>
    </div>
  );
};
