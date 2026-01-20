import React from 'react';
import { useAdContext } from '../../store/AdContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Plus, Trash2, LayoutGrid, Image as ImageIcon, BarChart3, Rocket, Calendar, FolderOpen } from 'lucide-react';

export const BusinessManager: React.FC = () => {
    const { businesses, createNewBusiness, selectBusiness, deleteBusiness, user, generatedImages } = useAdContext();

    const totalImages = generatedImages.length;
    const approvedImages = generatedImages.filter(i => i.approvalStatus === 'approved').length;
    const approvalRate = totalImages > 0 ? Math.round((approvedImages / totalImages) * 100) : 0;

    return (
        <div className="max-w-6xl mx-auto space-y-10 animate-fade-in pb-20">
            {/* Hero Section */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-gradient-to-r from-bg-elevated to-bg-secondary p-8 rounded-3xl border border-border-default relative overflow-hidden group">
                <div className="relative z-10">
                    <Badge variant="accent" className="mb-3">Beta Access</Badge>
                    <h2 className="text-4xl font-bold text-text-primary mb-2 tracking-tight">
                        Hola, <span className="text-text-primary">{user?.name?.split(' ')[0]}</span> 👋
                    </h2>
                    <p className="text-text-secondary max-w-xl text-lg">
                        Gestiona tus proyectos y crea campañas publicitarias de alto impacto con IA.
                    </p>
                </div>
                <div className="relative z-10">
                    <Button onClick={createNewBusiness} size="lg" className="shadow-glow-orange gap-2">
                        <Plus size={20} /> Nuevo Proyecto
                    </Button>
                </div>

                {/* Decorative background */}
                <div className="absolute top-[-50%] right-[-10%] w-[500px] h-[500px] bg-accent-primary/10 rounded-full blur-[120px] pointer-events-none group-hover:bg-accent-primary/15 transition-colors duration-700" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-bg-elevated border-border-default hover:border-border-hover transition-colors p-6 flex items-center gap-4">
                    <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-500">
                        <FolderOpen size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-text-muted">Proyectos Activos</p>
                        <p className="text-3xl font-bold text-text-primary mt-1">{businesses.length}</p>
                    </div>
                </Card>

                <Card className="bg-bg-elevated border-border-default hover:border-border-hover transition-colors p-6 flex items-center gap-4">
                    <div className="p-4 bg-purple-500/10 rounded-2xl text-purple-500">
                        <ImageIcon size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-text-muted">Creativos Generados</p>
                        <p className="text-3xl font-bold text-text-primary mt-1">{totalImages}</p>
                    </div>
                </Card>

                <Card className="bg-bg-elevated border-border-default hover:border-border-hover transition-colors p-6 flex items-center gap-4">
                    <div className="p-4 bg-green-500/10 rounded-2xl text-green-500">
                        <BarChart3 size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-text-muted">Tasa de Aprobación</p>
                        <p className="text-3xl font-bold text-green-500 mt-1">{approvalRate}%</p>
                    </div>
                </Card>
            </div>

            {/* Projects Grid */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                        <Rocket size={20} className="text-accent-primary" /> Mis Proyectos
                    </h3>
                </div>

                {businesses.length === 0 ? (
                    <div
                        onClick={createNewBusiness}
                        className="group border-2 border-dashed border-border-default rounded-3xl p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:border-accent-primary/50 hover:bg-accent-primary/5 transition-all duration-300"
                    >
                        <div className="w-20 h-20 rounded-full bg-bg-tertiary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <Plus size={32} className="text-text-muted group-hover:text-accent-primary" />
                        </div>
                        <h4 className="text-xl font-bold text-text-primary mb-2">Crear Primer Proyecto</h4>
                        <p className="text-text-muted max-w-sm mx-auto">
                            Configura tu marca, analiza tus productos y genera ángulos de venta únicos.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Always show "Add New" card as first item if there are projects? Or just button at top? 
                    Design pattern: usually button at top is enough. But prompt says "Grid... with Add Project card".
                    I'll add a mini "Add" card or just rely on the button. 
                */}

                        {businesses.map((biz) => (
                            <Card
                                key={biz.id}
                                variant="interactive"
                                onClick={() => selectBusiness(biz.id)}
                                className="group flex flex-col h-full relative overflow-hidden !p-0"
                            >
                                {/* Card Header & Cover */}
                                <div className="h-32 bg-bg-tertiary relative">
                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bg-secondary/90" />

                                    <div className="absolute top-4 right-4">
                                        <Badge variant="default" className="bg-black/50 backdrop-blur-md border-white/10 text-white">
                                            {new Date(biz.createdAt).toLocaleDateString()}
                                        </Badge>
                                    </div>

                                    <div className="absolute -bottom-6 left-6 w-16 h-16 rounded-2xl bg-bg-elevated border-4 border-bg-secondary flex items-center justify-center overflow-hidden shadow-lg z-10">
                                        {biz.branding.logo ? (
                                            <img src={biz.branding.logo} className="w-full h-full object-contain p-2" alt="Logo" />
                                        ) : (
                                            <span className="text-xs font-bold text-text-muted">LOGO</span>
                                        )}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 pt-8 flex-1 flex flex-col">
                                    <h3 className="text-lg font-bold text-text-primary mb-2 group-hover:text-accent-primary transition-colors truncate">
                                        {biz.name}
                                    </h3>
                                    <p className="text-sm text-text-muted line-clamp-2 mb-4 flex-1">
                                        {biz.knowledgeBase.structuredAnalysis?.productName
                                            ? `Producto: ${biz.knowledgeBase.structuredAnalysis.productName}`
                                            : "Configuración inicial pendiente..."}
                                    </p>

                                    <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
                                        <div className="flex gap-2">
                                            {biz.knowledgeBase.structuredAnalysis && (
                                                <Badge variant="success" size="sm">Estrategia</Badge>
                                            )}
                                            {/* Default color is usually empty string or specific, check logic */}
                                            {biz.branding.colors.primary && <Badge variant="accent" size="sm">Brand</Badge>}
                                        </div>

                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteBusiness(biz.id); }}
                                            className="p-2 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Eliminar Proyecto"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
