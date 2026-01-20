import React, { useState, useEffect } from 'react';
import { useAdContext } from '../../store/AdContext';
import { AppStep, SavedBusiness } from '../../types';
import { storageService } from '../../services/storageService';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';

// Icons
const PlusIcon = () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>;
const FolderIcon = () => <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>;
const ZapIcon = () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
const ImageIcon = () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const TrashIcon = () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

export const BusinessManager: React.FC = () => {
    const { businesses, loadBusiness, startNewBusiness, deleteBusiness, user } = useAdContext();
    const [newBusinessName, setNewBusinessName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Quick Stats Calculation
    const totalProjects = businesses.length;
    // Mock data for demo - in real app, aggregated from business data
    const totalImages = businesses.reduce((acc, b) => acc + (b.generatedImages?.length || 0), 0);
    const approvedImages = businesses.reduce((acc, b) => acc + (b.generatedImages?.filter(i => i.approved)?.length || 0), 0);

    const handleCreate = async () => {
        if (!newBusinessName.trim()) return;
        await startNewBusiness(newBusinessName);
        setNewBusinessName('');
        setIsCreating(false);
    };

    const handleOpen = (business: SavedBusiness) => {
        loadBusiness(business);
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('¿Estás seguro de eliminar este proyecto?')) {
            deleteBusiness(id);
        }
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-bg-secondary border border-border-default p-8 md:p-12">
                <div className="absolute top-0 right-0 w-96 h-96 bg-accent-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-xs font-medium mb-4">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-primary"></span>
                            </span>
                            Sistema Listo
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold mb-3">
                            Hola, {user?.name || 'Creador'} 👋
                        </h1>
                        <p className="text-text-secondary text-lg max-w-lg mb-6">
                            ¿Qué vamos a crear hoy? Genera creativos de alta conversión para tus campañas de Facebook Ads.
                        </p>

                        <div className="flex flex-wrap gap-4">
                            {isCreating ? (
                                <div className="flex gap-2 w-full max-w-sm">
                                    <Input
                                        placeholder="Nombre del proyecto..."
                                        value={newBusinessName}
                                        onChange={(e) => setNewBusinessName(e.target.value)}
                                        autoFocus
                                    />
                                    <Button onClick={handleCreate}>Crear</Button>
                                    <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancelar</Button>
                                </div>
                            ) : (
                                <Button size="lg" icon={<PlusIcon />} onClick={() => setIsCreating(true)}>
                                    Nuevo Proyecto
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-bg-tertiary/50 border border-border-default p-4 rounded-2xl text-center">
                            <div className="text-2xl font-bold text-white">{totalProjects}</div>
                            <div className="text-xs text-text-muted mt-1">Proyectos</div>
                        </div>
                        <div className="bg-bg-tertiary/50 border border-border-default p-4 rounded-2xl text-center">
                            <div className="text-2xl font-bold text-white">{totalImages}</div>
                            <div className="text-xs text-text-muted mt-1">Creativos</div>
                        </div>
                        <div className="bg-bg-tertiary/50 border border-border-default p-4 rounded-2xl text-center">
                            <div className="text-2xl font-bold text-accent-primary">{approvedImages}</div>
                            <div className="text-xs text-text-muted mt-1">Aprobados</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <h3 className="section-title">Acciones Rápidas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card variant="interactive" className="group" onClick={() => setIsCreating(true)}>
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-accent-primary/10 text-accent-primary group-hover:bg-accent-primary group-hover:text-white transition-colors">
                            <PlusIcon />
                        </div>
                        <div>
                            <h4 className="font-medium">Nuevo Proyecto</h4>
                            <p className="text-xs text-text-muted">Inicia una nueva campaña</p>
                        </div>
                    </div>
                </Card>
                <Card variant="interactive" className="group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                            <ZapIcon />
                        </div>
                        <div>
                            <h4 className="font-medium">Generar Ángulos</h4>
                            <p className="text-xs text-text-muted">Explora nuevas ideas</p>
                        </div>
                    </div>
                </Card>
                <Card variant="interactive" className="group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                            <ImageIcon />
                        </div>
                        <div>
                            <h4 className="font-medium">Galería</h4>
                            <p className="text-xs text-text-muted">Ver creativos guardados</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Projects Grid */}
            <div className="flex items-center justify-between">
                <h3 className="section-title">Mis Proyectos Recientes</h3>
                <Button variant="ghost" size="sm">Ver Todos</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {businesses.length === 0 ? (
                    <div className="col-span-full py-12 text-center bg-bg-secondary rounded-2xl border border-dashed border-border-default">
                        <div className="w-16 h-16 mx-auto bg-bg-tertiary rounded-full flex items-center justify-center mb-4 text-text-muted">
                            <FolderIcon />
                        </div>
                        <h3 className="text-lg font-medium">No tienes proyectos aún</h3>
                        <p className="text-text-muted text-sm mt-2 mb-6">Crea tu primer proyecto para comenzar a generar.</p>
                        <Button onClick={() => setIsCreating(true)}>Crear Proyecto</Button>
                    </div>
                ) : (
                    businesses.map((biz) => (
                        <Card
                            key={biz.id}
                            variant="interactive"
                            noPadding
                            className="group flex flex-col h-full"
                            onClick={() => handleOpen(biz)}
                        >
                            {/* Thumbnail */}
                            <div className="aspect-video bg-gradient-to-br from-bg-tertiary to-bg-secondary relative overflow-hidden border-b border-border-default group-hover:opacity-90 transition-opacity">
                                {/* Placeholder for project preview */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-4xl opacity-20">🚀</span>
                                </div>
                                <div className="absolute top-3 right-3">
                                    <Badge variant="default" className="bg-black/50 backdrop-blur-md border-white/10 text-white">
                                        {biz.step || AppStep.ONBOARDING}
                                    </Badge>
                                </div>
                            </div>

                            <div className="p-5 flex flex-col flex-1">
                                <h4 className="font-bold text-lg text-white mb-1 group-hover:text-accent-primary transition-colors">
                                    {biz.name}
                                </h4>
                                <p className="text-xs text-text-muted line-clamp-2 mb-4 flex-1">
                                    {biz.knowledgeBase?.structuredAnalysis?.productName || 'Sin descripción del producto'}
                                </p>

                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-border-subtle">
                                    <div className="flex gap-3 text-xs text-text-muted">
                                        <span>{biz.generatedAngles?.length || 0} ángulos</span>
                                        <span>{biz.generatedImages?.length || 0} imgs</span>
                                    </div>
                                    <button
                                        className="p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors text-text-muted"
                                        onClick={(e) => handleDelete(e, biz.id)}
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};
