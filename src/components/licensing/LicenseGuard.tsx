import { useEffect, useState, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LicenseService } from '@/lib/licensing/license-service';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

interface LicenseGuardProps {
    children: ReactNode;
}

export function LicenseGuard({ children }: LicenseGuardProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, loading: authLoading } = useAuth();
    const [checking, setChecking] = useState(true);
    const [valid, setValid] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading) {
            checkLicense();
        }

        // 🛡️ Security Pulse: Re-validar a cada 5 minutos
        const pulse = setInterval(() => {
            if (!authLoading) checkLicense();
        }, 5 * 60 * 1000);

        return () => clearInterval(pulse);
    }, [authLoading, user]);

    const checkLicense = async () => {
        try {
            // 1. Tentar obter do cache local primeiro
            let license = LicenseService.getLocalLicense();

            // 2. Se não tem no cache ou mudou o usuário/hardware, buscar online
            const currentFingerprint = LicenseService.getHardwareFingerprint();

            if (!license ||
                (user && license.user_id !== user.id) ||
                (license.activated_devices && !license.activated_devices.includes(currentFingerprint))) {

                if (user) {
                    console.log('🛡️ Re-validando licença com o servidor...');
                    license = await LicenseService.getUserLicense(user.id);
                }
            }

            // 3. Validar estado completo
            if (license) {
                const validation = LicenseService.validateLicense(license);
                if (validation.valid) {
                    setValid(true);
                    setError(null);
                    LicenseService.saveLicenseLocally(license);
                } else {
                    setValid(false);
                    setError(validation.message);
                }
            } else {
                setValid(false);
                if (location.pathname !== '/') {
                    navigate('/', { replace: true });
                }
            }

            setChecking(false);
        } catch (err) {
            console.error('LicenseGuard Error:', err);
            setError('Erro de conexão com o servidor de licenças.');
            setChecking(false);
        }
    };

    if (authLoading || checking) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0F1C] text-white">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 rounded-full border-2 border-[#A4FF00]/20 animate-ping" />
                        <div className="absolute inset-2 rounded-full border border-[#A4FF00]/40 animate-pulse" />
                        <Loader2 className="w-full h-full animate-spin text-[#A4FF00] opacity-80" />
                    </div>
                    <div className="space-y-2">
                        <p className="text-white font-black tracking-widest text-sm uppercase">ACR Security Shield</p>
                        <p className="text-gray-500 text-xs font-medium animate-pulse">Verificando integridade do sistema...</p>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (error) {
        const isHardwareError = error.includes('dispositivo');

        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0F1C] p-4 text-white font-sans">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="max-w-md w-full bg-[#0F1422] rounded-[2rem] shadow-[0_0_50px_rgba(255,0,0,0.1)] p-10 text-center border border-red-500/30 backdrop-blur-xl relative overflow-hidden"
                >
                    {/* Background Glow */}
                    <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-500/10 rounded-full blur-[80px]" />
                    <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-red-500/10 rounded-full blur-[80px]" />

                    <div className="relative">
                        <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 ring-1 ring-red-500/50 shadow-inner">
                            <ShieldAlert className="w-10 h-10 text-red-500" />
                        </div>

                        <h2 className="text-3xl font-black mb-4 tracking-tight">
                            {isHardwareError ? 'Violação de Cópia' : 'Acesso Requerido'}
                        </h2>

                        <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 mb-8">
                            <p className="text-gray-400 text-sm leading-relaxed">
                                {error}
                            </p>
                            {isHardwareError && (
                                <p className="text-[10px] text-red-400/60 mt-2 uppercase font-bold tracking-widest">
                                    ID da Máquina: {LicenseService.getHardwareFingerprint()}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => navigate('/', { replace: true })}
                                className="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all active:scale-[0.98]"
                            >
                                {isHardwareError ? 'Adquirir Nova Licença' : 'Ativar Sistema'}
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full px-6 py-4 bg-white/5 text-gray-400 rounded-2xl font-bold text-sm uppercase tracking-wider hover:bg-white/10 transition-colors"
                            >
                                Tentar Reconectar
                            </button>
                        </div>

                        <p className="mt-8 text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em]">
                            ACR ERP Premium Security Monitoring
                        </p>
                    </div>
                </motion.div>
            </div>
        );
    }

    return valid ? <>{children}</> : null;
}
