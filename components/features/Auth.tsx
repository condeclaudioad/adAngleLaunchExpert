import React, { useState } from 'react';
import { useAdContext } from '../../store/AdContext';
import { AppStep } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';

// Icons
const LogoIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-accent-primary">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
        <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26s.01-.19.01-.58z"
        />
        <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
    </svg>
);

export const Login: React.FC = () => {
    const { login } = useAdContext();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            await login();
        } catch (err: any) {
            setError(err.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-bg-primary">
            {/* Background Effects */}
            <div className="absolute inset-0 login-glow-effect bottom-0 h-[60%] pointer-events-none" />
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-md px-4">
                <Card variant="glass" className="w-full backdrop-blur-2xl">
                    <CardContent className="flex flex-col items-center pt-8 pb-8 space-y-6">
                        {/* Logo & Branding */}
                        <div className="flex flex-col items-center gap-4 text-center">
                            <div className="p-3 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 shadow-glow-soft">
                                <LogoIcon />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
                                    Launch Expert
                                </h1>
                                <Badge variant="vip" className="mt-2">VIP Access</Badge>
                            </div>
                        </div>

                        {/* Title Section */}
                        <div className="text-center space-y-2">
                            <h2 className="text-xl font-medium text-text-primary">Bienvenido de vuelta</h2>
                            <p className="text-sm text-text-secondary">
                                Ingresa para acceder a tu suite creativa de IA
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="w-full space-y-4 pt-2">
                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <Button
                                variant="outline"
                                fullWidth
                                size="lg"
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className="bg-white/5 hover:bg-white/10 border-white/10 text-white"
                            >
                                <GoogleIcon />
                                {loading ? 'Conectando...' : 'Continuar con Google'}
                            </Button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-border-default" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-bg-secondary px-2 text-text-muted">o continúa con email</span>
                                </div>
                            </div>

                            {/* Disabled inputs for aesthetics/expansion */}
                            <Input placeholder="nombre@empresa.com" disabled />
                            <Button variant="primary" fullWidth size="lg" disabled>
                                Ingresar (Próximamente)
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <p className="text-center mt-6 text-text-muted text-xs">
                    Protected by Launch Expert Security. <br />
                    <a href="#" className="hover:text-accent-primary transition-colors">Privacy Policy</a> • <a href="#" className="hover:text-accent-primary transition-colors">Terms of Service</a>
                </p>
            </div>
        </div>
    );
};

export const AdminPanel: React.FC = () => {
    const { setStep } = useAdContext();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simple hardcoded check for demo purposes, or use real auth
        if (password === 'admin123') {
            // Logic to add user to whitelist mock would go here
            alert('Acceso concedido (Simulado)');
            setStep(AppStep.LOGIN);
        } else {
            setError('Credenciales inválidas');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4">
            <Card variant="glass" className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>Panel Admin</CardTitle>
                    <CardDescription>Gestión de Whitelist</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            type="password"
                            label="Contraseña Maestra"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            error={error}
                        />
                        <div className="flex gap-2 pt-2">
                            <Button type="button" variant="ghost" fullWidth onClick={() => setStep(AppStep.LOGIN)}>
                                Volver
                            </Button>
                            <Button type="submit" variant="primary" fullWidth>
                                Acceder
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};
