import React, { useState } from 'react';
import { useAdContext } from '../../store/AdContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { AppStep } from '../../types';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Rocket, Download, Share2, Facebook, Instagram, CheckCircle2, ArrowRight, LayoutGrid } from 'lucide-react';
import confetti from 'canvas-confetti';

export const ExportPage: React.FC = () => {
    const { generatedImages, angles, knowledgeBase, branding, setStep } = useAdContext();
    const approvedImages = generatedImages.filter(img => img.approvalStatus === 'approved');
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownloadAll = async () => {
        setIsDownloading(true);
        try {
            const zip = new JSZip();
            const dateStr = new Date().toISOString().split('T')[0];
            const folderName = `LaunchExpert_Campaign_${dateStr}`;
            const root = zip.folder(folderName);

            if (!root) return;

            // 1. Text Assets
            let copyText = `# Campaign Assets - ${dateStr}\n\n`;
            copyText += `## Product: ${knowledgeBase.structuredAnalysis?.productName}\n`;
            copyText += `## Big Promise: ${knowledgeBase.structuredAnalysis?.bigPromise}\n\n`;

            copyText += `## Selected Angles\n`;
            angles.filter(a => a.selected).forEach((a, i) => {
                copyText += `\n### Angle ${i + 1}: ${a.name}\n`;
                copyText += `Hook: "${a.hook}"\n`;
                copyText += `Description: ${a.description}\n`;
            });

            root.file("Campaign_Brief.txt", copyText);

            // 2. Images
            const imgFolder = root.folder("Creatives");
            if (imgFolder) {
                for (let i = 0; i < approvedImages.length; i++) {
                    const img = approvedImages[i];
                    const blob = await (await fetch(img.url)).blob();
                    const name = `Creative_${img.type}_${img.id.slice(-6)}.png`;
                    imgFolder.file(name, blob);
                }
            }

            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `${folderName}.zip`);

            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });

        } catch (e) {
            console.error("Export failed", e);
            alert("Error creando el ZIP.");
        } finally {
            setIsDownloading(false);
        }
    };

    const AssetSummaryCard = ({ icon: Icon, label, value, color }: any) => (
        <Card className="flex items-center gap-4 bg-bg-elevated/50 border-border-default">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-text-muted uppercase tracking-wider">{label}</p>
            </div>
        </Card>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-10 animate-fade-in pb-20">
            {/* Header */}
            <div className="text-center space-y-4 pt-10">
                <Badge variant="vip" size="lg" className="mb-4">Listo para Despegar</Badge>
                <h2 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent-primary to-orange-400">
                    Launchpad de Campaña
                </h2>
                <p className="text-text-secondary text-lg max-w-2xl mx-auto">
                    Tu campaña está lista. Tienes todos los activos necesarios para lanzar anuncios de alta conversión.
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AssetSummaryCard
                    icon={CheckCircle2}
                    label="Ángulos Seleccionados"
                    value={angles.filter(a => a.selected).length}
                    color="bg-blue-500/20 text-blue-500"
                />
                <AssetSummaryCard
                    icon={LayoutGrid}
                    label="Creativos Aprobados"
                    value={approvedImages.length}
                    color="bg-green-500/20 text-green-500"
                />
                <AssetSummaryCard
                    icon={Share2}
                    label="Variaciones Listas"
                    value={approvedImages.filter(i => i.type === 'variation').length}
                    color="bg-purple-500/20 text-purple-500"
                />
            </div>

            {/* Main Action Area */}
            <div className="grid md:grid-cols-2 gap-8">
                {/* Download */}
                <Card className="p-8 border-2 border-accent-primary/20 bg-gradient-to-br from-bg-secondary to-bg-elevated space-y-6 flex flex-col justify-center items-center text-center">
                    <div className="w-20 h-20 bg-accent-primary/10 rounded-full flex items-center justify-center text-accent-primary mb-2 shadow-glow-orange">
                        <Download size={40} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">Descargar Pack Completo</h3>
                        <p className="text-sm text-text-muted">Incluye Brief en TXT y todas las imágenes en alta calidad.</p>
                    </div>
                    <Button
                        size="lg"
                        onClick={handleDownloadAll}
                        isLoading={isDownloading}
                        className="w-full max-w-xs shadow-glow-orange text-lg py-6"
                    >
                        {isDownloading ? 'Comprimiendo...' : 'Descargar ZIP'}
                    </Button>
                </Card>

                {/* Integration (Mock) */}
                <Card className="p-8 border border-border-default space-y-6">
                    <h3 className="text-xl font-bold text-white mb-4">Exportar Directo (Próximamente)</h3>
                    <div className="space-y-3">
                        <Button variant="secondary" className="w-full justify-between group h-14" disabled>
                            <span className="flex items-center gap-3">
                                <Facebook className="text-blue-500" /> Facebook Ads Manager
                            </span>
                            <Badge variant="default" size="sm">Pro</Badge>
                        </Button>
                        <Button variant="secondary" className="w-full justify-between group h-14" disabled>
                            <span className="flex items-center gap-3">
                                <Instagram className="text-pink-500" /> Instagram Ads
                            </span>
                            <Badge variant="default" size="sm">Pro</Badge>
                        </Button>
                    </div>
                    <p className="text-xs text-text-muted text-center pt-2">
                        La integración directa API estará disponible en la versión v2.0
                    </p>
                </Card>
            </div>

            {/* Footer Navigation */}
            <div className="flex justify-center pt-10 border-t border-border-default">
                <Button
                    variant="ghost"
                    onClick={() => {
                        if (confirm("¿Iniciar nuevo proyecto? Se guardará el actual.")) {
                            setStep(AppStep.BUSINESS);
                        }
                    }}
                    className="text-text-muted hover:text-white"
                >
                    <Rocket className="mr-2" size={18} /> Iniciar Nuevo Proyecto
                </Button>
            </div>
        </div>
    );
};
