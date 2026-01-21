import React, { useState } from 'react';
import { useAdContext } from '../../store/AdContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { AppStep } from '../../types';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import {
    Rocket,
    Download,
    Share2,
    Facebook,
    Instagram,
    CheckCircle2,
    ArrowRight,
    LayoutGrid,
    Box,
    FileText,
    Sparkles,
    ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const ExportPage: React.FC = () => {
    const { generatedImages, angles, knowledgeBase, branding, setStep } = useAdContext();
    const approvedImages = generatedImages.filter(img => img.approved);
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
            copyText += `## Product: ${knowledgeBase.structuredAnalysis?.productName || 'N/A'}\n`;
            copyText += `## Big Promise: ${knowledgeBase.structuredAnalysis?.bigPromise || 'N/A'}\n\n`;

            copyText += `## Selected Angles\n`;
            angles.filter(a => a.selected).forEach((a, i) => {
                copyText += `\n### Angle ${i + 1}: ${a.name}\n`;
                copyText += `Hook: "${a.hook}"\n`;
                copyText += `Evidence/Logic: ${a.description}\n`;
                copyText += `\n--- AD COPY (PRIMARY TEXT) ---\n${a.adCopy || '(No copy generated)'}\n\n`;
            });

            root.file("Campaign_Brief.txt", copyText);

            // 2. Images
            const imgFolder = root.folder("Creatives");
            if (imgFolder) {
                // Use Promise.all for parallel processing if possible, but sequential is safer for blob fetching issues
                for (let i = 0; i < approvedImages.length; i++) {
                    const img = approvedImages[i];
                    try {
                        const response = await fetch(img.url);
                        const blob = await response.blob();
                        const angleName = angles.find(a => a.id === img.angleId)?.name || 'Variation';
                        const safeName = angleName.replace(/[^a-z0-9]/gi, '_').substring(0, 20);
                        // Using a more unique name to prevent overwrites
                        const name = `Creative_${safeName}_${img.id.slice(-4)}.png`;
                        imgFolder.file(name, blob);
                    } catch (err) {
                        console.error("Failed to fetch image", img.url, err);
                    }
                }
            }

            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `${folderName}.zip`);

            confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.6 },
                colors: ['#FF5722', '#F59E0B', '#FFFFFF']
            });

        } catch (e) {
            console.error("Export failed", e);
            alert("Error creando el ZIP. Revisa la consola.");
        } finally {
            setIsDownloading(false);
        }
    };

    const AssetSummaryCard = ({ icon: Icon, label, value, color, delay }: any) => (
        <div className="animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
            <Card className="flex items-center gap-5 p-6 bg-bg-secondary/50 backdrop-blur-md border-white/5 hover:border-accent-primary/20 transition-all hover:-translate-y-1">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${color}`}>
                    <Icon size={28} strokeWidth={1.5} />
                </div>
                <div>
                    <p className="text-3xl font-bold text-white leading-none mb-1">{value}</p>
                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{label}</p>
                </div>
            </Card>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-12 animate-fade-in pb-24">
            {/* Header */}
            <div className="text-center space-y-6 pt-10 pb-6 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-accent-primary/5 blur-[100px] -z-10 rounded-full" />

                <Badge variant="vip" size="lg" className="mb-6 mx-auto px-4 py-1.5 bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-400 border-orange-500/30">
                    <Rocket className="w-4 h-4 mr-2" /> Misión Cumplida
                </Badge>

                <h2 className="text-6xl font-bold text-white tracking-tight">
                    Launchpad de <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-orange-400">Campaña</span>
                </h2>

                <p className="text-text-secondary text-xl max-w-2xl mx-auto leading-relaxed">
                    Todo listo. Has desbloqueado una campaña de alto rendimiento.<br />
                    Descarga tus activos y prepárate para escalar.
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 md:px-0">
                <AssetSummaryCard
                    icon={CheckCircle2}
                    label="Ángulos Ganadores"
                    value={angles.filter(a => a.selected).length}
                    color="bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20"
                    delay={100}
                />
                <AssetSummaryCard
                    icon={LayoutGrid}
                    label="Creativos Listos"
                    value={approvedImages.length}
                    color="bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20"
                    delay={200}
                />
                <AssetSummaryCard
                    icon={Rocket}
                    label="Potencial de ROAS"
                    value="Alta"
                    color="bg-purple-500/10 text-purple-500 ring-1 ring-purple-500/20"
                    delay={300}
                />
            </div>

            {/* Main Action Area */}
            <div className="grid md:grid-cols-12 gap-8">
                {/* Download Card */}
                <div className="md:col-span-7 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                    <Card className="h-full p-8 md:p-10 border-2 border-accent-primary/20 bg-gradient-to-br from-bg-secondary to-bg-elevated relative overflow-hidden group">

                        <div className="absolute inset-0 bg-accent-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="relative z-10 flex flex-col justify-center items-center text-center space-y-8 h-full">
                            <div className="relative">
                                <div className="absolute inset-0 bg-accent-primary blur-3xl opacity-20 animate-pulse" />
                                <div className="w-24 h-24 bg-gradient-to-br from-accent-primary to-orange-600 rounded-2xl flex items-center justify-center text-white mb-2 shadow-2xl shadow-orange-900/50 transform group-hover:scale-110 transition-transform duration-500">
                                    <Download size={48} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-3xl font-bold text-white">Descargar Pack Completo</h3>
                                <p className="text-text-muted text-sm max-w-sm mx-auto">
                                    Incluye <span className="text-white font-medium">Brief Estratégico (.txt)</span> y todas las <span className="text-white font-medium">Imágenes en alta resolución</span>.
                                </p>
                            </div>

                            <Button
                                size="lg"
                                onClick={handleDownloadAll}
                                loading={isDownloading}
                                className="w-full max-w-sm shadow-glow-orange text-lg py-7 rounded-xl bg-accent-primary text-white hover:bg-accent-secondary hover:scale-105 transition-all font-bold"
                            >
                                {isDownloading ? 'Comprimiendo Activos...' : 'Descargar ZIP Ahora'}
                            </Button>

                            <div className="flex items-center gap-4 text-[10px] text-text-muted uppercase font-bold tracking-widest opacity-60">
                                <span className="flex items-center gap-1"><ShieldCheck size={12} /> Secure 256-bit</span>
                                <span className="flex items-center gap-1"><Box size={12} /> .ZIP Format</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Integration Info */}
                <div className="md:col-span-5 space-y-6 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                    <Card className="p-8 border border-white/5 bg-bg-secondary/30 backdrop-blur-md h-full flex flex-col">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                <Share2 size={20} className="text-blue-400" /> Integraciones
                            </h3>
                            <p className="text-sm text-text-secondary">Exportación directa a plataformas (Próximamente v2.0)</p>
                        </div>

                        <div className="space-y-4 flex-1">
                            <div className="group p-4 rounded-xl bg-bg-elevated border border-white/5 flex items-center justify-between opacity-50 hover:opacity-100 transition-opacity cursor-not-allowed">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[#1877F2]/20 text-[#1877F2] rounded-lg">
                                        <Facebook size={20} />
                                    </div>
                                    <span className="font-medium text-white">Facebook Ads</span>
                                </div>
                                <Badge variant="secondary" size="sm">Pro</Badge>
                            </div>

                            <div className="group p-4 rounded-xl bg-bg-elevated border border-white/5 flex items-center justify-between opacity-50 hover:opacity-100 transition-opacity cursor-not-allowed">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[#E4405F]/20 text-[#E4405F] rounded-lg">
                                        <Instagram size={20} />
                                    </div>
                                    <span className="font-medium text-white">Instagram Ads</span>
                                </div>
                                <Badge variant="secondary" size="sm">Pro</Badge>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/5 text-center">
                            <p className="text-xs text-text-muted mb-4">
                                ¿Quieres escalar más rápido con agenciamiento manual?
                            </p>
                            <Button variant="ghost" className="w-full text-text-secondary hover:text-white border border-white/5 hover:bg-white/5">
                                Contactar Soporte VIP <ArrowRight size={14} className="ml-2" />
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Footer Navigation */}
            <div className="flex justify-center pt-12 border-t border-white/5">
                <Button
                    variant="ghost"
                    onClick={() => {
                        if (confirm("¿Iniciar nuevo proyecto? Se guardará el actual.")) {
                            setStep(AppStep.BUSINESS);
                        }
                    }}
                    className="text-text-muted hover:text-white px-6 py-4 h-auto group text-base"
                >
                    <Rocket className="mr-2 group-hover:-translate-y-1 transition-transform" size={20} /> Iniciar Nuevo Proyecto
                </Button>
            </div>
        </div>
    );
};
