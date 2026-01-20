
import React, { useState } from 'react';
import { useAdContext } from '../../store/AdContext';
import { Button } from '../ui/Button';
import { AppStep } from '../../types';

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

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-in pb-20">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-textMain">Identidad de Marca</h2>
        <p className="text-textMuted">Define los elementos visuales. Sube un Mockup de tu producto para mejores resultados.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* LOGO */}
        <div className="bg-surface rounded-2xl border border-borderColor p-6 flex flex-col items-center text-center space-y-4">
          <h3 className="font-bold text-textMain">Logo</h3>
          <p className="text-[10px] text-textMuted">PNG/SVG Transparente</p>
          
          <div className="w-24 h-24 rounded-xl bg-surfaceHighlight border-2 border-dashed border-borderColor flex items-center justify-center overflow-hidden relative group">
            {branding.logo ? (
              <>
                <img src={branding.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                <button 
                  onClick={() => setBranding({...branding, logo: null})}
                  className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold"
                >
                  ✕
                </button>
              </>
            ) : (
              <span className="text-textMuted text-xs">Subir</span>
            )}
          </div>
          
          {!branding.logo && (
             <>
               <input type="file" id="logo-upload" className="hidden" accept="image/*" onChange={(e) => handleImageUpload('logo', e)} />
               <label htmlFor="logo-upload" className="w-full py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-xs font-bold cursor-pointer transition-colors">
                 Seleccionar
               </label>
             </>
          )}
        </div>

        {/* PERSONAL PHOTO */}
        <div className="bg-surface rounded-2xl border border-borderColor p-6 flex flex-col items-center text-center space-y-4">
          <h3 className="font-bold text-textMain">Experto (Face ID)</h3>
          <p className="text-[10px] text-textMuted">Foto clara del rostro</p>
          
          <div className="w-24 h-24 rounded-full bg-surfaceHighlight border-2 border-dashed border-borderColor flex items-center justify-center overflow-hidden relative group">
            {branding.personalPhoto ? (
               <>
                 <img src={branding.personalPhoto} alt="Persona" className="w-full h-full object-cover" />
                 <button 
                  onClick={() => setBranding({...branding, personalPhoto: null})}
                  className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold"
                >
                  ✕
                </button>
               </>
            ) : (
              <span className="text-textMuted text-xs">Subir</span>
            )}
          </div>

          {!branding.personalPhoto && (
             <>
               <input type="file" id="photo-upload" className="hidden" accept="image/*" onChange={(e) => handleImageUpload('personalPhoto', e)} />
               <label htmlFor="photo-upload" className="w-full py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-xs font-bold cursor-pointer transition-colors">
                 Seleccionar
               </label>
             </>
          )}

          <div className="flex items-center gap-2 mt-2">
            <input 
              type="checkbox" 
              id="includeFace" 
              checked={branding.includeFace}
              onChange={(e) => setBranding({...branding, includeFace: e.target.checked})}
              className="rounded border-borderColor text-primary focus:ring-primary"
            />
            <label htmlFor="includeFace" className="text-[10px] text-textMain">Usar en Ads</label>
          </div>
        </div>

        {/* PRODUCT MOCKUP - NEW */}
        <div className="bg-surface rounded-2xl border border-borderColor p-6 flex flex-col items-center text-center space-y-4">
          <h3 className="font-bold text-textMain">Mockup Producto</h3>
          <p className="text-[10px] text-textMuted">Caja, Botella, Interfaz</p>
          
          <div className="w-24 h-24 rounded-xl bg-surfaceHighlight border-2 border-dashed border-borderColor flex items-center justify-center overflow-hidden relative group">
            {branding.productMockup ? (
               <>
                 <img src={branding.productMockup} alt="Mockup" className="w-full h-full object-cover" />
                 <button 
                  onClick={() => setBranding({...branding, productMockup: null})}
                  className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold"
                >
                  ✕
                </button>
               </>
            ) : (
              <span className="text-textMuted text-xs">Subir</span>
            )}
          </div>

          {!branding.productMockup && (
             <>
               <input type="file" id="mockup-upload" className="hidden" accept="image/*" onChange={(e) => handleImageUpload('productMockup', e)} />
               <label htmlFor="mockup-upload" className="w-full py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-xs font-bold cursor-pointer transition-colors">
                 Seleccionar
               </label>
             </>
          )}
        </div>
      </div>

      {/* COLORS */}
      <div className="bg-surface rounded-2xl border border-borderColor p-6">
        <h3 className="font-bold text-textMain mb-4">Paleta de Colores</h3>
        <div className="flex flex-wrap gap-8">
          <div className="flex items-center gap-4">
            <input 
              type="color" 
              value={branding.colors.primary}
              onChange={(e) => setBranding({...branding, colors: { ...branding.colors, primary: e.target.value }})}
              className="w-12 h-12 rounded-lg cursor-pointer border-0 p-0"
            />
            <div>
              <p className="text-xs font-bold text-textMain">Color Primario</p>
              <p className="text-xs text-textMuted uppercase">{branding.colors.primary}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <input 
              type="color" 
              value={branding.colors.secondary}
              onChange={(e) => setBranding({...branding, colors: { ...branding.colors, secondary: e.target.value }})}
              className="w-12 h-12 rounded-lg cursor-pointer border-0 p-0"
            />
            <div>
              <p className="text-xs font-bold text-textMain">Color Secundario</p>
              <p className="text-xs text-textMuted uppercase">{branding.colors.secondary}</p>
            </div>
          </div>
        </div>
      </div>

      {/* NAME INPUT FOR BUSINESS */}
      <div className="bg-surface rounded-2xl border border-primary/20 p-6 flex flex-col gap-4">
          <h3 className="font-bold text-textMain">Nombre del Negocio</h3>
          <input 
            type="text" 
            placeholder="Ej: Agencia de Viajes X"
            value={bizName}
            onChange={(e) => setBizName(e.target.value)}
            className="w-full bg-background border border-borderColor rounded-xl px-4 py-3 text-textMain focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={() => setStep(AppStep.ONBOARDING)}>&larr; Volver</Button>
        <Button onClick={handleSaveAndNext}>
             💾 Guardar Negocio y Continuar &rarr;
        </Button>
      </div>
    </div>
  );
};
