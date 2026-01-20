import React, { useState } from 'react';
import { useAdContext } from '../../store/AdContext';
import { AppStep } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';

export const Login: React.FC = () => {
    const { login, register, setStep } = useAdContext();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await register(email, password, name);
                alert("Cuenta creada con éxito. Por favor inicia sesión.");
                setIsLogin(true); // Switch to login after success
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || (isLogin ? 'Error al iniciar sesión' : 'Error al registrarse'));
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
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 shadow-[0_0_20px_rgba(255,107,53,0.1)]">
                                <img src="/logo.png" alt="Launch Expert Logo" className="w-12 h-auto" />
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
                            <h2 className="text-xl font-medium text-text-primary">
                                {isLogin ? 'Bienvenido' : 'Crear Cuenta'}
                            </h2>
                            <p className="text-sm text-text-secondary">
                                {isLogin ? 'Ingresa tus credenciales para acceder' : 'Únete a Launch Expert'}
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="w-full space-y-4 pt-2">
                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                {!isLogin && (
                                    <div className="space-y-1 animate-fade-in">
                                        <label className="text-xs text-text-muted ml-1">Nombre</label>
                                        <Input
                                            type="text"
                                            placeholder="Tu nombre"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required={!isLogin}
                                            className="bg-bg-tertiary/50 border-white/10 focus:border-accent-primary/50"
                                        />
                                    </div>
                                )}
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
                                {loading ? 'Procesando...' : (isLogin ? 'Iniciar Sesión' : 'Registrarse')}
                            </Button>

                            <div className="pt-2 text-center">
                                <button
                                    type="button"
                                    onClick={() => { setIsLogin(!isLogin); setError(null); }}
                                    className="text-sm text-text-muted hover:text-accent-primary transition-colors underline decoration-dotted"
                                >
                                    {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión'}
                                </button>
                            </div>

                        </form>
                    </CardContent>
                </Card>

                <p className="text-center mt-6 text-text-muted text-xs">
                    Protected by Launch Expert Security. <br />
                    <a href="#" className="hover:text-accent-primary transition-colors">Privacy Policy</a> • <a href="#" className="hover:text-accent-primary transition-colors">Terms of Service</a>
                </p>

                <div className="mt-4 text-center">
                    <button
                        onClick={() => setStep(AppStep.ADMIN)}
                        className="text-[10px] text-text-muted/30 hover:text-text-muted transition-colors uppercase tracking-widest"
                    >
                        Admin Access
                    </button>
                </div>
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
