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
        <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4 relative overflow-hidden">
            {/* Ambient Background - Premium Glow */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-accent-primary/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-[40%] left-[50%] translate-x-[-50%] w-[400px] h-[400px] bg-accent-secondary/5 rounded-full blur-[80px]" />
            </div>

            <div className="max-w-md w-full relative z-10 space-y-8 animate-fade-in">
                {/* Header Section */}
                <div className="text-center space-y-6">
                    <div className="relative inline-block group">
                        <div className="absolute inset-0 bg-accent-primary blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-full" />
                        <div className="w-20 h-20 bg-gradient-to-br from-bg-tertiary to-bg-secondary rounded-2xl flex items-center justify-center mx-auto shadow-2xl border border-white/5 relative z-10">
                            <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold text-white tracking-tight">
                            Launch Expert
                        </h1>
                        <p className="text-text-secondary text-sm font-medium tracking-wide uppercase opacity-80">
                            Suite Creativa con IA
                        </p>
                    </div>
                </div>

                {/* Main Card */}
                <div className="glass-card p-1 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    <div className="bg-bg-secondary/40 backdrop-blur-md rounded-[20px] p-8 border border-white/5 shadow-inner">
                        <h2 className="text-xl font-semibold text-white mb-6 text-center">
                            {isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-medium">
                                    {error}
                                </div>
                            )}

                            {!isLogin && (
                                <div className="space-y-1.5 animate-fade-in">
                                    <label className="text-xs font-medium text-text-secondary ml-1 uppercase tracking-wider">Nombre</label>
                                    <Input
                                        type="text"
                                        placeholder="Tu nombre completo"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required={!isLogin}
                                        className="bg-bg-tertiary/50 border-white/5 focus:border-accent-primary/50 text-white placeholder:text-white/20 h-11"
                                    />
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-text-secondary ml-1 uppercase tracking-wider">Email</label>
                                <Input
                                    type="email"
                                    placeholder="nombre@empresa.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-bg-tertiary/50 border-white/5 focus:border-accent-primary/50 text-white placeholder:text-white/20 h-11"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Contraseña</label>
                                </div>
                                <Input
                                    type="password"
                                    placeholder="••••••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="bg-bg-tertiary/50 border-white/5 focus:border-accent-primary/50 text-white placeholder:text-white/20 h-11"
                                />
                            </div>

                            <Button
                                fullWidth
                                type="submit"
                                loading={loading}
                                size="lg"
                                className="mt-4 bg-gradient-to-r from-accent-primary to-accent-gradient-end hover:shadow-glow-orange transition-all duration-300 transform hover:-translate-y-0.5"
                            >
                                {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
                            </Button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-white/5 text-center flex flex-col gap-4">
                            <button
                                onClick={() => { setIsLogin(!isLogin); setError(null); }}
                                className="text-sm text-text-secondary hover:text-white transition-colors group"
                            >
                                {isLogin ? (
                                    <>
                                        ¿No tienes cuenta? <span className="text-accent-primary group-hover:underline underline-offset-4">Regístrate gratis</span>
                                    </>
                                ) : (
                                    <>
                                        ¿Ya tienes cuenta? <span className="text-accent-primary group-hover:underline underline-offset-4">Inicia sesión</span>
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => setStep(AppStep.ADMIN)}
                                className="text-[10px] text-text-muted/30 hover:text-text-muted transition-colors uppercase tracking-widest"
                            >
                                Admin Access
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer simple */}
                <p className="text-center text-[10px] text-text-muted/40">
                    &copy; {new Date().getFullYear()} Launch Expert AI. Security Protected.
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
