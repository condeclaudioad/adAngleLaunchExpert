
import React from 'react';
import { useAdContext } from '../../store/AdContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

export const BusinessManager: React.FC = () => {
  const { businesses, createNewBusiness, selectBusiness, deleteBusiness, user, generatedImages } = useAdContext();

  const totalImages = generatedImages.length;
  const approvedImages = generatedImages.filter(i => i.approvalStatus === 'approved').length;

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in pb-20">
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
              <p className="text-primary font-medium mb-1">Hola, {user?.name?.split(' ')[0]} 👋</p>
              <h2 className="text-4xl font-bold text-white mb-2">Dashboard</h2>
              <p className="text-textMuted max-w-xl">
                Gestiona tus proyectos y crea campañas de alto impacto.
              </p>
          </div>
          <Button onClick={createNewBusiness} className="shrink-0">
             + Nuevo Proyecto
          </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-surface to-surfaceHighlight border-white/5">
              <p className="text-sm text-textMuted mb-1">Proyectos Activos</p>
              <p className="text-3xl font-bold text-white">{businesses.length}</p>
          </Card>
          <Card className="bg-gradient-to-br from-surface to-surfaceHighlight border-white/5">
              <p className="text-sm text-textMuted mb-1">Creativos Generados</p>
              <p className="text-3xl font-bold text-white">{totalImages}</p>
          </Card>
          <Card className="bg-gradient-to-br from-surface to-surfaceHighlight border-white/5">
              <p className="text-sm text-textMuted mb-1">Tasa de Aprobación</p>
              <p className="text-3xl font-bold text-primary">
                  {totalImages > 0 ? Math.round((approvedImages / totalImages) * 100) : 0}%
              </p>
          </Card>
      </div>

      {/* Projects Grid */}
      <div>
        <h3 className="text-xl font-bold text-white mb-6">Mis Proyectos</h3>
        
        {businesses.length === 0 ? (
            <Card className="border-dashed border-2 border-borderColor bg-transparent flex flex-col items-center justify-center py-16 cursor-pointer hover:border-primary/50 hover:bg-surfaceHighlight/50" onClick={createNewBusiness}>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-primary">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                     </svg>
                </div>
                <h4 className="text-lg font-bold text-white">Crear Primer Proyecto</h4>
                <p className="text-textMuted mt-1">Empieza configurando el branding</p>
            </Card>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {businesses.map((biz) => (
                    <Card key={biz.id} variant="interactive" onClick={() => selectBusiness(biz.id)} className="group flex flex-col h-full relative overflow-hidden">
                         {/* Card Header */}
                         <div className="flex items-start justify-between mb-4 relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-surfaceHighlight border border-borderColor flex items-center justify-center overflow-hidden">
                                {biz.branding.logo ? (
                                    <img src={biz.branding.logo} className="w-full h-full object-contain p-2" />
                                ) : (
                                    <span className="text-xs font-bold text-textMuted">LOGO</span>
                                )}
                            </div>
                            <Badge variant="default">{new Date(biz.createdAt).toLocaleDateString()}</Badge>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 relative z-10">
                            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors">{biz.name}</h3>
                            <p className="text-sm text-textMuted line-clamp-2">
                                {biz.knowledgeBase.structuredAnalysis?.productName || "Sin descripción definida..."}
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center relative z-10">
                            <div className="flex gap-2">
                                {biz.knowledgeBase.structuredAnalysis && <Badge variant="success">Estrategia</Badge>}
                                {biz.branding.colors.primary !== '#000000' && <Badge variant="accent">Brand</Badge>}
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); deleteBusiness(biz.id); }}
                                className="text-textMuted hover:text-red-500 transition-colors p-1"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                            </button>
                        </div>

                        {/* Hover Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </Card>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};
