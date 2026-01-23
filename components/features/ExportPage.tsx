import React from 'react';
import { useAdContext } from '../../store/AdContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { AppStep } from '../../types';
import {
    Rocket,
    Share2,
    Facebook,
    Instagram,
    Youtube,
    LayoutGrid,
    Zap,
    Target,
    BarChart3,
    ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const ExportPage: React.FC = () => {
    const { setStep } = useAdContext();

    // Trigger celebration on mount
    React.useEffect(() => {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    const FeatureCard = ({ icon: Icon, title, description, color, delay }: any) => (
        <Card className="p-6 bg-bg-secondary/30 border-white/5 backdrop-blur-sm relative overflow-hidden group hover:bg-bg-secondary/50 transition-all animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
            <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
                <Icon size={80} />
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color} bg-white/5`}>
                <Icon size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-sm text-text-secondary mb-4">{description}</p>
            <Badge variant="outline" className="text-[10px] py-0 border-white/10 text-text-muted">Próximamente en V2.0</Badge>
        </Card>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-12 animate-fade-in pb-24">
            {/* Header */}
            <div className="text-center space-y-6 pt-10 pb-6 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-accent-primary/10 blur-[100px] -z-10 rounded-full" />

                <Badge variant="vip" size="lg" className="mb-6 mx-auto px-4 py-1.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border-blue-500/30">
                    <Rocket className="w-4 h-4 mr-2" /> Misión Cumplida
                </Badge>

                <h2 className="text-6xl font-bold text-white tracking-tight">
                    Launchpad <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">(V2.0)</span>
                </h2>

                <p className="text-text-secondary text-xl max-w-2xl mx-auto leading-relaxed">
                    Has completado la generación de activos. <br />
                    Esta sección se transformará en tu centro de comando para lanzar campañas reales.
                </p>
            </div>

            {/* Coming Soon Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FeatureCard
                    icon={Target}
                    title="Meta Ads Integration"
                    description="Conecta tu cuenta publicitaria y lanza tus ganadores directamente a Facebook e Instagram en un clic."
                    color="text-blue-500"
                    delay={100}
                />

                <FeatureCard
                    icon={BarChart3}
                    title="Predictive Analytics"
                    description="AI que predice el CTR y ROAS de tus creativos antes de gastar un solo centavo en publicidad."
                    color="text-emerald-500"
                    delay={300}
                />
                <FeatureCard
                    icon={Zap}
                    title="Instant A/B Testing"
                    description="Genera automáticamente estructuras de campaña para testear ángulos y hooks masivamente."
                    color="text-yellow-500"
                    delay={400}
                />
                <FeatureCard
                    icon={LayoutGrid}
                    title="Creative Refresh"
                    description="Detecta fatiga de anuncios y genera nuevas variaciones visuales automáticamente."
                    color="text-pink-500"
                    delay={500}
                />
                <FeatureCard
                    icon={Share2}
                    title="Team Collaboration"
                    description="Comparte links de revisión con tu equipo o clientes sin necesidad de descargar archivos."
                    color="text-orange-500"
                    delay={600}
                />
            </div>

            {/* CTA Box */}


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

