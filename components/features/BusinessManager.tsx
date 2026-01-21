import React, { useState } from 'react';
import { useAdContext } from '../../store/AdContext';
import { AppStep, Business } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import {
    Plus,
    Folder,
    Zap,
    Image as ImageIcon,
    Trash2,
    LayoutGrid,
    ArrowRight,
    Sparkles,
    Database,
    AlertTriangle
} from 'lucide-react';
import { Modal } from '../ui/Modal';

export const BusinessManager: React.FC = () => {
    const { businesses, selectBusiness, startNewBusiness, deleteBusiness, user } = useAdContext();
    const [newBusinessName, setNewBusinessName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Quick Stats Calculation
    const totalProjects = businesses.length;
    const totalImages = businesses.reduce((acc, b) => acc + (b.generatedImages?.length || 0), 0);
    const approvedImages = businesses.reduce((acc, b) => acc + (b.generatedImages?.filter(i => i.approved)?.length || 0), 0);

    const handleCreate = async () => {
        if (!newBusinessName.trim()) return;
        await startNewBusiness(newBusinessName);
        setNewBusinessName('');
        setIsCreating(false);
    };

    const handleOpen = (business: Business) => {
        selectBusiness(business.id);
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (deleteId) {
            deleteBusiness(deleteId);
            setDeleteId(null);
        }
    };

    return (
        <div className="space-y-10 pb-10">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-white/5 p-8 md:p-12 shadow-2xl">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

                <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium backdrop-blur-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            Sistema Operativo
                        </div>

                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
                                Hola, <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-orange-400">{user?.name?.split(' ')[0] || 'Creador'}</span> 👋
                            </h1>
                            <p className="text-text-secondary text-lg max-w-lg leading-relaxed">
                                Tu suite creativa está lista. Genera conceptos, ángulos y creativos de alta conversión en segundos.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-4 pt-2">
                            {isCreating ? (
                                <div className="flex gap-2 w-full max-w-sm animate-fade-in bg-bg-primary/50 p-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
                                    <Input
                                        placeholder="Nombre del proyecto..."
                                        value={newBusinessName}
                                        onChange={(e) => setNewBusinessName(e.target.value)}
                                        autoFocus
                                        className="bg-transparent border-none focus:ring-0 h-10"
                                    />
                                    <Button onClick={handleCreate} size="sm" className="shrink-0">Crear</Button>
                                    <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)} className="shrink-0">Cancel</Button>
                                </div>
                            ) : (
                                <Button
                                    size="lg"
                                    onClick={() => setIsCreating(true)}
                                    className="shadow-glow-orange h-14 px-8 text-base bg-gradient-to-r from-accent-primary to-orange-600 hover:scale-105 transition-transform"
                                >
                                    <Plus className="mr-2" size={20} /> Nuevo Proyecto
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-bg-secondary backdrop-blur-md border border-white/10 p-6 rounded-2xl hover:bg-bg-tertiary transition-colors">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                                <Database size={20} />
                            </div>
                            <div className="text-3xl font-bold text-white mb-1">{totalProjects}</div>
                            <div className="text-sm text-text-muted font-medium">Proyectos Activos</div>
                        </div>
                        <div className="bg-bg-secondary backdrop-blur-md border border-white/10 p-6 rounded-2xl hover:bg-bg-tertiary transition-colors">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                                <ImageIcon size={20} />
                            </div>
                            <div className="text-3xl font-bold text-white mb-1">{totalImages}</div>
                            <div className="text-sm text-text-muted font-medium">Creativos Generados</div>
                        </div>
                        <div className="col-span-2 bg-gradient-to-r from-accent-primary/10 to-transparent border border-accent-primary/20 p-6 rounded-2xl flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold text-accent-primary">{approvedImages}</div>
                                <div className="text-sm text-accent-primary/80 font-medium">Aprobados para Publicar</div>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary">
                                <Sparkles size={24} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div>
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Zap size={18} className="text-accent-primary" /> Acciones Rápidas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <button
                        onClick={() => setIsCreating(true)}
                        className="group flex items-center gap-5 p-5 rounded-2xl bg-bg-secondary border border-white/5 hover:border-accent-primary/30 hover:bg-bg-tertiary transition-all text-left"
                    >
                        <div className="p-4 rounded-xl bg-accent-primary/10 text-accent-primary group-hover:scale-110 transition-transform duration-300">
                            <Plus size={24} />
                        </div>
                        <div>
                            <h4 className="font-semibold text-white group-hover:text-accent-primary transition-colors">Nuevo Proyecto</h4>
                            <p className="text-xs text-text-secondary mt-1">Inicia una nueva campaña desde cero</p>
                        </div>
                    </button>

                    <button className="group flex items-center gap-5 p-5 rounded-2xl bg-bg-secondary border border-white/5 hover:border-blue-500/30 hover:bg-bg-tertiary transition-all text-left">
                        <div className="p-4 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform duration-300">
                            <Zap size={24} />
                        </div>
                        <div>
                            <h4 className="font-semibold text-white group-hover:text-blue-400 transition-colors">Generar Ángulos</h4>
                            <p className="text-xs text-text-secondary mt-1">Explora nuevas ideas de marketing</p>
                        </div>
                    </button>

                    <button className="group flex items-center gap-5 p-5 rounded-2xl bg-bg-secondary border border-white/5 hover:border-purple-500/30 hover:bg-bg-tertiary transition-all text-left">
                        <div className="p-4 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform duration-300">
                            <ImageIcon size={24} />
                        </div>
                        <div>
                            <h4 className="font-semibold text-white group-hover:text-purple-400 transition-colors">Galería Global</h4>
                            <p className="text-xs text-text-secondary mt-1">Ver todos tus creativos guardados</p>
                        </div>
                    </button>
                </div>
            </div>

            {/* Projects Grid */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <LayoutGrid size={18} className="text-text-muted" /> Mis Proyectos
                    </h3>
                    <Button variant="ghost" size="sm" className="text-text-muted hover:text-white">Ver Todos <ArrowRight size={14} className="ml-1" /></Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {businesses.length === 0 ? (
                        <div className="col-span-full py-16 text-center bg-bg-secondary/30 rounded-[2rem] border border-dashed border-white/10 flex flex-col items-center justify-center">
                            <div className="w-20 h-20 bg-bg-tertiary rounded-full flex items-center justify-center mb-6 text-text-muted shadow-inner">
                                <Folder size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">No tienes proyectos aún</h3>
                            <p className="text-text-muted text-sm mb-8 max-w-xs">Comienza creando tu primer proyecto para generar contenido impulsado por IA.</p>
                            <Button onClick={() => setIsCreating(true)} size="lg" className="shadow-lg">Crear Primer Proyecto</Button>
                        </div>
                    ) : (
                        businesses.map((biz) => (
                            <Card
                                key={biz.id}
                                variant="interactive"
                                noPadding
                                className="group flex flex-col h-full bg-bg-secondary hover:bg-bg-tertiary border-white/5 hover:border-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                                onClick={() => handleOpen(biz)}
                            >
                                {/* Thumbnail */}
                                <div className="aspect-[16/9] bg-gradient-to-br from-bg-tertiary to-bg-elevated relative overflow-hidden border-b border-white/5 group-hover:opacity-90 transition-opacity">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        {/* Dynamic Initials/Icon based on Name */}
                                        <span className="text-4xl font-bold text-white/10 select-none group-hover:scale-110 transition-transform duration-500">
                                            {biz.name.substring(0, 2).toUpperCase()}
                                        </span>
                                    </div>

                                    {/* Status Badge */}
                                    <div className="absolute top-3 right-3">
                                        <Badge variant="default" className="bg-black/60 backdrop-blur-md border-white/10 text-white text-[10px] font-bold tracking-wider uppercase">
                                            {biz.step || AppStep.ONBOARDING}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="p-5 flex flex-col flex-1">
                                    <div className="mb-4">
                                        <h4 className="font-bold text-lg text-white mb-1 group-hover:text-accent-primary transition-colors line-clamp-1">
                                            {biz.name}
                                        </h4>
                                        <p className="text-xs text-text-muted line-clamp-2 min-h-[2.5em]">
                                            {biz.knowledgeBase?.structuredAnalysis?.productName || 'Sin descripción del producto...'}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                                        <div className="flex gap-4 text-xs font-medium text-text-secondary">
                                            <span className="flex items-center gap-1"><Zap size={12} className="text-yellow-500/70" /> {biz.generatedAngles?.length || 0}</span>
                                            <span className="flex items-center gap-1"><ImageIcon size={12} className="text-purple-500/70" /> {biz.generatedImages?.length || 0}</span>
                                        </div>
                                        <button
                                            className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors text-text-muted opacity-0 group-hover:opacity-100 focus:opacity-100"
                                            onClick={(e) => handleDelete(e, biz.id)}
                                            title="Eliminar proyecto"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </div>
            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                title="Eliminar Proyecto"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancelar</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Eliminar Definitivamente</Button>
                    </>
                }
            >
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 bg-red-500/10 rounded-full text-red-500">
                        <AlertTriangle size={32} />
                    </div>
                    <div>
                        <p className="text-lg font-medium text-white mb-2">¿Estás seguro de eliminar este proyecto?</p>
                        <p className="text-sm text-text-muted">
                            Esta acción no se puede deshacer. Se perderán todos los ángulos e imágenes generadas.
                        </p>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
