import React, { useState } from 'react';
import { useAdContext } from '../../store/AdContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { AppStep } from '../../types';
import {
  Palette,
  UploadCloud,
  User,
  Image as ImageIcon,
  Box,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Check,
  Briefcase
} from 'lucide-react';

export const BrandingForm: React.FC = () => {
  const { branding, setBranding, setStep, saveCurrentBusiness, currentBusiness, updateBusinessPartial } = useAdContext();
  const [bizName, setBizName] = useState(currentBusiness?.name || '');
  const [isSaving, setIsSaving] = useState(false);

  /* Helper to resize image */
  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const MAX_SIZE = 800; // Reduced to improve DB save speed
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
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7)); // Moderate compression
        } else {
          resolve('');
        }
      };
    });
  };

  const handleImageUpload = async (field: 'logo' | 'personalPhoto' | 'productMockup', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Resize before saving to State/DB to avoid massive payloads
      const resized = await resizeImage(file);
      // Use updateBusinessPartial to persist upload immediately if business exists? 
      // Actually user requested "Sync deletions", uploads usually require confirmation. 
      // But for consistency let's stick to setBranding for uploads (unsaved changes) 
      // unless user wants uploads to auto-save too. 
      // The user specifically asked "cuando yo elimino algo... eliminarlo en BD".
      // I will keep uploads as draft until "Save" but implement auto-delete.

      setBranding({ ...branding, [field]: resized });
    }
  };

  const handleSaveAndNext = async () => {
    setIsSaving(true);
    try {
      let nameToSave = bizName;
      if (!nameToSave) {
        nameToSave = prompt("Dale un nombre a este negocio para guardarlo:") || "";
        if (!nameToSave) {
          setIsSaving(false);
          return;
        }
        setBizName(nameToSave);
      }

      await saveCurrentBusiness(nameToSave);
      setStep(AppStep.ANALYSIS);
    } catch (error) {
      console.error("Error saving branding:", error);
      alert("Hubo un error al guardar. Intenta de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  const UploadCard = ({ title, subtitle, icon: Icon, field, value }: { title: string, subtitle: string, icon: any, field: 'logo' | 'personalPhoto' | 'productMockup', value: string | null | undefined }) => (
    <div className="relative group h-full">
      <div className={`
                absolute inset-0 bg-gradient-to-br from-accent-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl blur-xl
            `} />

      <Card className="h-full flex flex-col items-center text-center p-6 bg-bg-secondary/80 backdrop-blur-md border-white/5 hover:border-accent-primary/50 transition-all duration-300 relative overflow-hidden group-hover:-translate-y-1 group-hover:shadow-2xl">
        {value ? (
          <div className="w-full aspect-square rounded-xl overflow-hidden relative border border-white/10 bg-bg-tertiary mb-4 group/image">
            <img src={value} alt={title} className="w-full h-full object-contain p-2" />
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity duration-200">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => updateBusinessPartial({ branding: { ...branding, [field]: null } })}
                className="scale-90 group-hover/image:scale-100 transition-transform"
              >
                <Trash2 size={16} className="mr-2" /> Eliminar
              </Button>
            </div>
            <div className="absolute top-2 right-2 bg-emerald-500/20 text-emerald-400 p-1 rounded-full backdrop-blur-md border border-emerald-500/30">
              <Check size={12} strokeWidth={3} />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center w-full min-h-[160px] border-2 border-dashed border-white/10 rounded-xl bg-bg-tertiary/30 mb-4 group-hover:border-accent-primary/30 group-hover:bg-accent-primary/5 transition-all">
            <div className="p-4 rounded-full bg-bg-tertiary mb-3 group-hover:text-accent-primary group-hover:scale-110 transition-all duration-300">
              <Icon size={28} strokeWidth={1.5} />
            </div>
            <p className="text-xs text-text-muted">Arrastra o Click</p>
          </div>
        )
        }

        <div className="text-left w-full">
          <h3 className="font-bold text-white mb-0.5">{title}</h3>
          <p className="text-[11px] text-text-secondary">{subtitle}</p>
        </div>

        {
          !value && (
            <label className="absolute inset-0 cursor-pointer">
              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(field, e)} />
            </label>
          )
        }
      </Card >
    </div >
  );

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 pb-8">
        <div>
          <Badge variant="outline" className="mb-3 border-purple-500/30 text-purple-400 bg-purple-500/5">
            <Palette className="w-3 h-3 mr-1" /> Fase 2: Identidad Visual
          </Badge>
          <h2 className="text-4xl font-bold !text-white tracking-tight mb-2">
            Define tu <span className="!text-orange-500">Marca</span>
          </h2>
          <p className="text-text-secondary text-lg max-w-2xl">
            Sube tus activos visuales. La IA generará creativos que respeten estrictamente tu línea gráfica.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Business Info & Colors */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-bg-secondary/50 backdrop-blur-md border-white/5">
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                  <Briefcase size={16} /> Información General
                </h3>
                <Input
                  label="Nombre del Negocio"
                  placeholder="Ej. Agencia de Viajes X"
                  value={bizName}
                  onChange={(e) => setBizName(e.target.value)}
                  className="bg-bg-tertiary/50 border-white/5 focus:border-accent-primary/50"
                />
              </div>

              <div className="h-px bg-white/5" />

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                  <Palette size={16} /> Paleta de Colores
                </h3>
                <div className="space-y-3">
                  <div className="group flex items-center gap-3 p-3 bg-bg-tertiary/50 hover:bg-bg-tertiary rounded-xl border border-white/5 transition-colors">
                    <div className="relative">
                      <input
                        type="color"
                        value={branding.colors.primary}
                        onChange={(e) => setBranding({ ...branding, colors: { ...branding.colors, primary: e.target.value } })}
                        className="w-12 h-12 rounded-lg cursor-pointer opacity-0 absolute inset-0 z-10"
                      />
                      <div
                        className="w-12 h-12 rounded-lg border-2 border-white/10 shadow-lg"
                        style={{ backgroundColor: branding.colors.primary }}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">Color Primario</p>
                      <p className="text-xs text-text-muted uppercase font-mono tracking-wider">{branding.colors.primary}</p>
                    </div>
                  </div>

                  <div className="group flex items-center gap-3 p-3 bg-bg-tertiary/50 hover:bg-bg-tertiary rounded-xl border border-white/5 transition-colors">
                    <div className="relative">
                      <input
                        type="color"
                        value={branding.colors.secondary}
                        onChange={(e) => setBranding({ ...branding, colors: { ...branding.colors, secondary: e.target.value } })}
                        className="w-12 h-12 rounded-lg cursor-pointer opacity-0 absolute inset-0 z-10"
                      />
                      <div
                        className="w-12 h-12 rounded-lg border-2 border-white/10 shadow-lg"
                        style={{ backgroundColor: branding.colors.secondary }}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">Color Secundario</p>
                      <p className="text-xs text-text-muted uppercase font-mono tracking-wider">{branding.colors.secondary}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Assets */}
        <div className="lg:col-span-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 h-full">
            <UploadCard
              title="Logo"
              subtitle="PNG/SVG con fondo transparente preferiblemente"
              icon={Box}
              field="logo"
              value={branding.logo}
            />

            <div className="flex flex-col gap-6 h-full">
              <div className="flex-1">
                <UploadCard
                  title="Experto (Face ID)"
                  subtitle="Foto clara del rostro para clonación en IA"
                  icon={User}
                  field="personalPhoto"
                  value={branding.personalPhoto}
                />
              </div>

              {branding.personalPhoto && (
                <div className="animate-fade-in p-4 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-between group cursor-pointer" onClick={() => setBranding({ ...branding, includeFace: !branding.includeFace })}>
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${branding.includeFace ? 'bg-accent-primary border-accent-primary' : 'border-text-muted'}`}>
                      {branding.includeFace && <Check size={14} className="text-white" />}
                    </div>
                    <span className="text-sm font-medium text-white">Usar rostro en anuncios</span>
                  </div>
                </div>
              )}
            </div>

            <UploadCard
              title="Producto"
              subtitle="Mockup, caja, botella o captura de pantalla"
              icon={ImageIcon}
              field="productMockup"
              value={branding.productMockup}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-8 border-t border-white/5">
        <Button variant="ghost" onClick={() => setStep(AppStep.ONBOARDING)} className="text-text-muted hover:text-white">
          <ArrowLeft size={18} className="mr-2" /> Volver a Análisis
        </Button>
        <Button
          onClick={handleSaveAndNext}
          size="lg"
          disabled={isSaving}
          className="shadow-glow-orange bg-gradient-to-r from-accent-primary to-orange-600 hover:scale-105 transition-transform"
        >
          {isSaving ? (
            <>Guardando...</>
          ) : (
            <>Guardar Marca y Continuar <ArrowRight size={18} className="ml-2" /></>
          )}
        </Button>
      </div>
    </div>
  );
};
