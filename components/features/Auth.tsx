import React, { useState } from 'react';
import { useAdContext } from '../../store/AdContext';
import { AppStep } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';

// Rocket/Launch Icon
const LogoIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-accent-primary">
        <path d="M12 2.5C12 2.5 5.5 8 5.5 14.5C5.5 18.0899 8.41015 21 12 21C15.5899 21 18.5 18.0899 18.5 14.5C18.5 8 12 2.5 12 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 14.5V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9.5 17.5H14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 11.5L12 14.5L8 11.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const Login: React.FC = () => {
    const { login } = useAdContext();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await login(email, password);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error al iniciar sesión. Verifica tus credenciales.');
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
                <Card variant="glass" className="w-full backdrop-blur-2xl border-white/5">
                    <CardContent className="flex flex-col items-center pt-8 pb-8 space-y-6">
                        {/* Logo & Branding */}
                        <div className="flex flex-col items-center gap-4 text-center">
                            <div className="p-4 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 shadow-[0_0_20px_rgba(255,107,53,0.3)]">
                                <LogoIcon />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
                                    Launch Expert
                                </h1>
                                <Badge variant="vip" className="mt-2 text-xs">Access Portal</Badge>
                            </div>
                        </div>

                        {/* Title Section */}
                        <div className="text-center space-y-2">
                            <h2 className="text-xl font-medium text-text-primary">Bienvenido</h2>
                            <p className="text-sm text-text-secondary">
                                Ingresa tus credenciales para acceder
                            </p>
                        </div>

                        {/* Login Form */}
                        <form onSubmit={handleLogin} className="w-full space-y-4 pt-2">
                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-text-muted ml-1">Email</label>
                                    <Input
                                        type="email"
                                        placeholder="correo@ejemplo.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="bg-bg-tertiary/50 border-white/10 focus:border-accent-primary/50"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-text-muted ml-1">Contraseña</label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="bg-bg-tertiary/50 border-white/10 focus:border-accent-primary/50"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                fullWidth
                                size="lg"
                                disabled={loading}
                                className="mt-2"
                            >
                                {loading ? 'Autenticando...' : 'Iniciar Sesión'}
                            </Button>

                        </form>
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
        // Simple hardcoded check
        if (password === 'admin123') {
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
