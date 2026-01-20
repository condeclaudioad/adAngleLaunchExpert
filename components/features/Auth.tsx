import React, { useState, useEffect } from 'react';
import { useAdContext } from '../../store/AdContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { AppStep } from '../../types';
import { Mail, Lock, User as UserIcon, ShieldCheck, Rocket, ArrowLeft, Trash2, Plus } from 'lucide-react';
import {
    signInWithEmail,
    signUpWithEmail,
    checkIsVip,
    getAllVipUsers,
    addVipUser,
    removeVipUser,
    checkAdminPassword
} from '../../services/supabaseClient';

export const Login: React.FC = () => {
    const { login, setStep } = useAdContext();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSignUp, setIsSignUp] = useState(false);
    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

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
        <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4 relative overflow-hidden font-sans">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] login-glow-effect pointer-events-none"></div>

            <Card variant="glass" className="max-w-md w-full relative z-10 !p-8 animate-fade-in border-white/5">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-accent-primary to-orange-600 rounded-2xl flex items-center justify-center shadow-glow-orange mx-auto mb-6 transform hover:scale-105 transition-transform duration-500">
                        <Rocket size={32} className="text-white" />
                    </div>

                    <Badge variant="vip" className="mb-4 shadow-lg shadow-amber-900/20">VIP ACCESS</Badge>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
                        {isSignUp ? 'Crear Cuenta' : 'Bienvenido'}
                    </h1>
                    <p className="text-sm text-text-secondary">
                        {isSignUp ? 'Regístrate para acceder' : 'Ingresa para acceder a tu suite creativa'}
                    </p>
                </div>

                <div className="space-y-6">
                    <form onSubmit={handleEmailAuth} className="space-y-4">
                        {isSignUp && (
                            <Input
                                placeholder="Tu nombre"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                icon={<UserIcon size={18} />}
                            />
                        )}
                        <Input
                            placeholder="nombre@empresa.com"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            icon={<Mail size={18} />}
                        />
                        <Input
                            placeholder="Contraseña"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            icon={<Lock size={18} />}
                        />
                        <Button
                            variant="primary"
                            fullWidth
                            type="submit"
                            isLoading={isLoading}
                            size="lg"
                            className="bg-gradient-to-r from-accent-primary to-orange-600 hover:to-orange-500 shadow-glow-orange"
                        >
                            {isSignUp ? 'Crear Cuenta' : 'Acceder'} &rarr;
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border-subtle" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-glass-bg px-2 text-text-muted">o</span>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="w-full text-center text-sm text-text-muted hover:text-white transition-colors"
                    >
                        {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Solicitud de Acceso'}
                    </button>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 text-center">
                    <button
                        onClick={() => setStep(AppStep.ADMIN)}
                        className="text-xs text-text-muted hover:text-white transition-colors flex items-center justify-center gap-1 mx-auto"
                    >
                        <ShieldCheck size={12} /> Panel Admin
                    </button>
                </div>
            </Card>

            <p className="absolute bottom-6 text-xs text-text-muted opacity-50">
                Launch Expert Academia &copy; 2024
            </p>
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
            <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-bg-primary to-black opacity-80" />
                <Card className="max-w-sm w-full relative z-10 text-center space-y-6 !p-8 border-border-default bg-bg-elevated">
                    <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                        <Lock className="text-red-500" />
                    </div>
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
                        <Button onClick={handleLogin} className="flex-1" variant="danger">
                            Entrar
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-primary p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
                <div className="flex justify-between items-center bg-bg-elevated p-6 rounded-2xl border border-border-default">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-accent-primary/10 rounded-xl">
                            <ShieldCheck size={24} className="text-accent-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Administrar Accesos VIP</h2>
                            <p className="text-text-muted text-sm">Gestiona quién tiene acceso a la plataforma</p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={() => setStep(AppStep.LOGIN)} icon={<ArrowLeft size={16} />}>
                        Salir
                    </Button>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    <Card className="md:col-span-1 h-fit">
                        <h3 className="font-bold text-base text-text-primary mb-4 flex items-center gap-2">
                            <Plus size={16} className="text-accent-primary" /> Nuevo Usuario
                        </h3>
                        <div className="space-y-3">
                            <Input
                                placeholder="usuario@email.com"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                icon={<Mail size={16} />}
                            />
                            <Button onClick={handleAddUser} fullWidth variant="secondary">
                                Conceder Acceso
                            </Button>
                        </div>
                    </Card>

                    <Card className="md:col-span-2">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-base text-white">Usuarios Autorizados</h3>
                            <Badge variant="accent">{vipUsers.length} Activos</Badge>
                        </div>

                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary" />
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                                {vipUsers.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex justify-between items-center p-4 bg-bg-tertiary rounded-xl border border-border-default hover:border-border-hover transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                                                {user.email[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">{user.email}</p>
                                                <p className="text-[10px] text-text-muted">
                                                    Agregado por {user.added_by}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveUser(user.email)}
                                            className="p-2 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Revocar acceso"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                {vipUsers.length === 0 && (
                                    <p className="text-center text-text-muted py-8 italic">No hay usuarios VIP registrados</p>
                                )}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};
