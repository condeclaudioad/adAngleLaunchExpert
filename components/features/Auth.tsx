
import React, { useEffect, useState } from 'react';
import { useAdContext } from '../../store/AdContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { AppStep } from '../../types';
import { ADMIN_PASSWORD, GOOGLE_AUTH_CLIENT_ID, VIP_EMAILS } from '../../constants';

declare const google: any;

export const Login: React.FC = () => {
    const { login, setStep } = useAdContext();
    const [directEmail, setDirectEmail] = useState("");
    
    // Try to init Google, but fail gracefully
    useEffect(() => {
        const clientId = GOOGLE_AUTH_CLIENT_ID;
        if (!clientId || clientId.includes("TU_CLIENT_ID")) return;
        
        const initGoogle = () => {
            if (typeof google !== 'undefined' && google.accounts) {
                try {
                    const btnContainer = document.getElementById("googleBtn");
                    if (btnContainer) {
                        btnContainer.innerHTML = '';
                        google.accounts.id.initialize({
                            client_id: clientId,
                            callback: (response: any) => login(response.credential),
                            auto_select: false,
                        });
                        google.accounts.id.renderButton(
                            btnContainer,
                            { theme: "filled_black", size: "large", width: "100%", text: "continue_with", shape: "pill" }
                        );
                    }
                } catch (e) {
                    console.log("Google Auth Load Failed");
                }
            } else {
                setTimeout(initGoogle, 500);
            }
        };
        setTimeout(initGoogle, 100);
    }, []);

    const handleDirectLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!directEmail.includes('@')) {
            alert("Ingresa un email válido");
            return;
        }
        login(directEmail);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Background Effects */}
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
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Bienvenido de vuelta</h1>
                    <p className="text-sm text-textMuted">Ingresa para acceder a tu suite creativa.</p>
                </div>

                <div className="space-y-6">
                    <div className="min-h-[40px] flex items-center justify-center">
                         <div id="googleBtn" className="w-full"></div>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/10"></span>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-[#151515] px-2 text-textMuted">o continúa con email</span>
                        </div>
                    </div>

                    <form onSubmit={handleDirectLogin} className="space-y-4">
                        <Input 
                            placeholder="nombre@empresa.com" 
                            value={directEmail}
                            onChange={(e) => setDirectEmail(e.target.value)}
                            className="bg-surfaceHighlight"
                        />
                        <Button variant="secondary" fullWidth type="submit">
                            Acceder Ahora &rarr;
                        </Button>
                    </form>
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
    const { setStep, adminAddEmail, adminRemoveEmail, customAllowedEmails } = useAdContext();
    const [password, setPassword] = useState("");
    const [isAuth, setIsAuth] = useState(false);
    const [newEmail, setNewEmail] = useState("");

    const handleLogin = () => {
        if (password === ADMIN_PASSWORD) {
            setIsAuth(true);
        } else {
            alert("Contraseña incorrecta");
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
                        <Button variant="ghost" onClick={() => setStep(AppStep.LOGIN)} className="flex-1">Volver</Button>
                        <Button onClick={handleLogin} className="flex-1">Entrar</Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Administrar Accesos</h2>
                    <Button variant="outline" onClick={() => setStep(AppStep.LOGIN)}>Salir</Button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <h3 className="font-bold text-base text-primary mb-4">➕ Agregar Usuario</h3>
                        <div className="flex gap-2">
                            <Input 
                                placeholder="usuario@email.com" 
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                            />
                            <Button onClick={() => { adminAddEmail(newEmail); setNewEmail(""); }}>Agregar</Button>
                        </div>
                        
                        <div className="mt-6">
                            <h4 className="text-sm font-medium text-textMuted mb-3">Accesos Manuales</h4>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {customAllowedEmails.map((email, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 bg-surfaceHighlight rounded-lg border border-borderColor">
                                        <span className="text-sm text-white">{email}</span>
                                        <button onClick={() => adminRemoveEmail(email)} className="text-red-500 text-xs hover:text-red-400">Eliminar</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-base text-white">Lista VIP</h3>
                            <Badge>{VIP_EMAILS.length} Usuarios</Badge>
                        </div>
                        <div className="bg-surfaceHighlight rounded-xl overflow-hidden border border-borderColor">
                            <div className="max-h-[500px] overflow-y-auto p-2 space-y-1">
                                {VIP_EMAILS.map((email, idx) => (
                                    <div key={idx} className="p-2 text-xs text-textMuted hover:bg-white/5 rounded flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                        {email}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
