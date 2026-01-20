// components/features/Auth.tsx - VERSIÓN CON SUPABASE

import React, { useEffect, useState } from 'react';
import { useAdContext } from '../../store/AdContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { AppStep } from '../../types';
import { ADMIN_PASSWORD } from '../../constants';
// Note: We use checkAdminPassword for secure verification, using constant as fallback/dev reference if needed
import {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    checkIsVip,
    getAllVipUsers,
    addVipUser,
    removeVipUser,
    checkAdminPassword
} from '../../services/supabaseClient';

export const Login: React.FC = () => {
    const { login, setStep, reportError } = useAdContext();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSignUp, setIsSignUp] = useState(false);
    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleLogin = async () => {
        try {
            await signInWithGoogle();
            // Redirect happens automatically
        } catch (e) {
            reportError(e);
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.includes('@')) {
            alert("Ingresa un email válido");
            return;
        }

        setIsLoading(true);
        try {
            if (isSignUp) {
                if (!name) {
                    alert("Ingresa tu nombre");
                    return;
                }
                await signUpWithEmail(email, password, name);
                alert("Revisa tu email para confirmar tu cuenta");
            } else {
                const user = await signInWithEmail(email, password);
                if (user) {
                    // Check VIP status
                    const isVip = await checkIsVip(user.email || '');
                    if (!isVip) {
                        alert("Tu email no está en la lista VIP");
                        return;
                    }
                    login(user.email || '');
                }
            }
        } catch (e: any) {
            alert(e.message || "Error de autenticación");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>

            <Card variant="glass" className="max-w-md w-full relative z-10 !p-8 border-white/10">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-orange-600 rounded-xl flex items-center justify-center shadow-glow mx-auto mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-white">
                            <path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 01.75.75c0 5.056-2.383 9.555-6.084 12.436h.008c.64.459 1.18.96 1.621 1.503a5.215 5.215 0 01-5.18 8.165 4.545 4.545 0 01-3.626-3.626 5.214 5.214 0 018.165-5.18c.542.44 1.044.981 1.503 1.621v.008c2.881-3.701 5.266-8.2 5.266-13.254a.75.75 0 00-.75-.75c-5.055 0-9.554 2.385-13.254 6.084V10.2a.75.75 0 01-.75.75H8.75a.75.75 0 01-.75-.75V8.25a.75.75 0 01.75-.75h2.25v-.318c-3.158 1.486-5.839 3.87-7.669 6.855a.75.75 0 01-1.285-.772A17.96 17.96 0 019.315 7.584z" clipRule="evenodd" />
                        </svg>
                    </div>

                    <Badge variant="vip" className="mb-4">VIP ACCESS</Badge>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
                        {isSignUp ? 'Crear Cuenta' : 'Bienvenido'}
                    </h1>
                    <p className="text-sm text-textMuted">
                        {isSignUp ? 'Regístrate para acceder' : 'Ingresa para acceder a tu suite creativa'}
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Google Login */}
                    <Button
                        variant="outline"
                        fullWidth
                        onClick={handleGoogleLogin}
                        className="!border-white/20"
                    >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continuar con Google
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/10"></span>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-[#151515] px-2 text-textMuted">o con email</span>
                        </div>
                    </div>

                    <form onSubmit={handleEmailAuth} className="space-y-4">
                        {isSignUp && (
                            <Input
                                placeholder="Tu nombre"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-surfaceHighlight"
                            />
                        )}
                        <Input
                            placeholder="nombre@empresa.com"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-surfaceHighlight"
                        />
                        <Input
                            placeholder="Contraseña"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-surfaceHighlight"
                        />
                        <Button
                            variant="secondary"
                            fullWidth
                            type="submit"
                            isLoading={isLoading}
                        >
                            {isSignUp ? 'Crear Cuenta' : 'Acceder'} &rarr;
                        </Button>
                    </form>

                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="w-full text-center text-xs text-textMuted hover:text-white transition-colors"
                    >
                        {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
                    </button>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 text-center">
                    <button
                        onClick={() => setStep(AppStep.ADMIN)}
                        className="text-xs text-textMuted hover:text-white transition-colors"
                    >
                        🔐 Acceso Administrador
                    </button>
                </div>
            </Card>
        </div>
    );
};

export const AdminPanel: React.FC = () => {
    const { setStep } = useAdContext();
    const [password, setPassword] = useState("");
    const [isAuth, setIsAuth] = useState(false);
    const [newEmail, setNewEmail] = useState("");
    const [vipUsers, setVipUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        setIsLoading(true);
        try {
            const isValid = await checkAdminPassword(password);
            if (isValid) {
                setIsAuth(true);
                loadVipUsers();
            } else {
                alert("Contraseña incorrecta");
            }
        } catch (error) {
            console.error(error);
            alert("Error al verificar contraseña");
        } finally {
            setIsLoading(false);
        }
    };

    const loadVipUsers = async () => {
        setIsLoading(true);
        try {
            const users = await getAllVipUsers();
            setVipUsers(users);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddUser = async () => {
        if (!newEmail.includes('@')) return;
        try {
            await addVipUser(newEmail, 'admin');
            setNewEmail("");
            loadVipUsers();
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleRemoveUser = async (email: string) => {
        if (!confirm(`¿Eliminar a ${email}?`)) return;
        try {
            await removeVipUser(email);
            loadVipUsers();
        } catch (e: any) {
            alert(e.message);
        }
    };

    if (!isAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
                <Card className="max-w-sm w-full relative z-10 text-center space-y-6 !p-8">
                    <h2 className="text-xl font-bold text-white">Área Restringida</h2>
                    <Input
                        type="password"
                        placeholder="Contraseña Maestra"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="text-center tracking-widest"
                    />
                    <div className="flex gap-3 pt-2">
                        <Button variant="ghost" onClick={() => setStep(AppStep.LOGIN)} className="flex-1">
                            Volver
                        </Button>
                        <Button onClick={handleLogin} className="flex-1">
                            Entrar
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Administrar Accesos VIP</h2>
                    <Button variant="outline" onClick={() => setStep(AppStep.LOGIN)}>
                        Salir
                    </Button>
                </div>

                <Card>
                    <h3 className="font-bold text-base text-primary mb-4">➕ Agregar Usuario VIP</h3>
                    <div className="flex gap-2">
                        <Input
                            placeholder="usuario@email.com"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                        />
                        <Button onClick={handleAddUser}>Agregar</Button>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-base text-white">Lista VIP (Supabase)</h3>
                        <Badge>{vipUsers.length} Usuarios</Badge>
                    </div>

                    {isLoading ? (
                        <p className="text-textMuted">Cargando...</p>
                    ) : (
                        <div className="space-y-2 max-h-[500px] overflow-y-auto">
                            {vipUsers.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex justify-between items-center p-3 bg-surfaceHighlight rounded-lg border border-borderColor"
                                >
                                    <div>
                                        <span className="text-sm text-white">{user.email}</span>
                                        <span className="text-xs text-textMuted ml-2">
                                            (por {user.added_by})
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveUser(user.email)}
                                        className="text-red-500 text-xs hover:text-red-400"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};
