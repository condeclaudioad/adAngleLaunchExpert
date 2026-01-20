import React from 'react';
import { useAdContext } from '../../store/AdContext';
import { Button } from '../ui/Button';

export const DriveExport: React.FC = () => {
  const { generatedImages, angles } = useAdContext();

  // --- LOCAL DOWNLOAD LOGIC ---
  const downloadSingle = (url: string, filename: string) => {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleDownloadAll = async () => {
      const completed = generatedImages.filter(img => img.status === 'completed');
      if(completed.length === 0) return;

      alert("La descarga comenzará. Si el navegador bloquea ventanas emergentes, permítelas.");
      
      for (let i = 0; i < completed.length; i++) {
          const img = completed[i];
          const angleName = angles.find(a => a.id === img.angleId)?.name || 'unknown';
          const safeName = angleName.replace(/[^a-z0-9]/gi, '_').substring(0, 15);
          
          setTimeout(() => {
              downloadSingle(img.url, `${safeName}-${img.type}.png`);
          }, i * 500); // 500ms delay between downloads
      }
  };

  const completedImages = generatedImages.filter(i => i.status === 'completed');

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in pb-20">
      
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-textMain">Descarga de Activos</h2>
        <p className="text-textMuted max-w-2xl mx-auto">
          ¡Felicidades! Has generado <span className="text-primary font-bold">{completedImages.length} creativos</span> listos para lanzar.
        </p>
      </div>

      <div className="bg-surface rounded-2xl border border-borderColor p-8 flex flex-col items-center text-center shadow-sm max-w-md mx-auto">
             <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-primary">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M12 9.75V1.5m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                </svg>
            </div>
            <h3 className="text-xl font-bold text-textMain mb-2">Descarga Local</h3>
            <p className="text-sm text-textMuted mb-6">Baja los archivos PNG a tu dispositivo directamente.</p>
            
            <Button onClick={handleDownloadAll} className="w-full">
                Descargar Todos ({completedImages.length})
            </Button>
            <p className="text-[10px] text-textMuted mt-2">Puede requerir permiso de múltiples descargas.</p>
        </div>

      {/* DETAILED LIST */}
      <div className="border-t border-borderColor pt-8">
         <h3 className="text-lg font-bold text-textMain mb-4">Lista de Archivos ({completedImages.length})</h3>
         <div className="space-y-2">
            {completedImages.map((img, idx) => {
                 const angleName = angles.find(a => a.id === img.angleId)?.name || 'Desconocido';
                 return (
                    <div key={idx} className="flex items-center justify-between p-3 bg-surface border border-borderColor rounded-lg hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded overflow-hidden bg-background border border-borderColor">
                                <img src={img.url} className="w-full h-full object-cover" alt="thumb" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-textMain">{angleName}</p>
                                <p className="text-xs text-textMuted uppercase flex items-center gap-2">
                                    {img.type === 'main' ? 'Principal' : 'Variación'} 
                                    <span className="opacity-50">•</span> 
                                    ID: {img.angleId.slice(-4)}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => downloadSingle(img.url, `${angleName.slice(0,10)}-${img.type}.png`)}
                            className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors"
                            title="Descargar uno"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M12 9.75V1.5m0 0l3 3m-3-3l-3 3" />
                            </svg>
                        </button>
                    </div>
                 );
            })}
            {completedImages.length === 0 && (
                <div className="text-center text-textMuted py-8">No hay imágenes completadas aún.</div>
            )}
         </div>
      </div>
    </div>
  );
};