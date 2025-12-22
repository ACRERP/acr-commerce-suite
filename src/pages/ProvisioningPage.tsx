import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { businessProfiles } from '@/config/business-profiles';
import {
    Check, Loader2, Sparkles, Rocket,
    ShieldCheck, Database, Layout, Palette,
    Mail, ArrowRight, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const steps = [
    { id: 'core', label: 'Inicializando núcleo do sistema...', icon: Rocket, duration: 1500 },
    { id: 'profile', label: 'Configurando perfil personalizado...', icon: Palette, duration: 2000 },
    { id: 'modules', label: 'Ativando módulos e ferramentas...', icon: Layout, duration: 2000 },
    { id: 'data', label: 'Injetando dados e inteligência...', icon: Database, duration: 1500 },
    { id: 'security', label: 'Protegendo seu ambiente...', icon: ShieldCheck, duration: 1000 },
];

export default function ProvisioningPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [currentStep, setCurrentStep] = useState(0);
    const [complete, setComplete] = useState(false);
    const [progress, setProgress] = useState(0);
    const [selectedVariant, setSelectedVariant] = useState<'vibrant' | 'clean' | 'dark'>('vibrant');

    // Get data from signup with persistence fallback
    const profileId = location.state?.profileId || localStorage.getItem('acr_last_selected_profile') || 'bakery';
    const email = location.state?.email || localStorage.getItem('acr_last_signup_email') || '';
    const profile = businessProfiles.find(p => p.id === profileId) || businessProfiles[0];

    useEffect(() => {
        let progressTimer: NodeJS.Timeout;

        const runProvisioning = async () => {
            for (let i = 0; i < steps.length; i++) {
                setCurrentStep(i);
                // Animate progress for each step
                const stepDuration = steps[i].duration;
                const startProgress = (i / steps.length) * 100;
                const endProgress = ((i + 1) / steps.length) * 100;
                const increment = (endProgress - startProgress) / 20;

                for (let j = 0; j <= 20; j++) {
                    setProgress(startProgress + (increment * j));
                    await new Promise(r => setTimeout(r, stepDuration / 20));
                }
            }
            setComplete(true);
        };

        runProvisioning();

        return () => clearTimeout(progressTimer);
    }, []);

    const handleContinue = () => {
        // Persist for login page fallback
        localStorage.setItem('acr_last_signup_email', email);
        localStorage.setItem('acr_last_selected_profile', profileId);
        localStorage.setItem('active_business_variant', selectedVariant);

        navigate('/login', {
            state: {
                email,
                profileId,
                variant: selectedVariant,
                step: 'auth',
                message: 'Ambiente preparado com sucesso! Agora é só entrar.'
            }
        });
    };

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden text-white transition-colors duration-700"
            style={{ backgroundColor: profile.theme.variants[selectedVariant]?.primary || profile.theme.primary || '#000' }}
        >
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-20"
                    style={{ backgroundColor: profile.theme.variants.vibrant.accent }}
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                    transition={{ duration: 10, repeat: Infinity }}
                />
                <motion.div
                    className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-20"
                    style={{ backgroundColor: profile.theme.variants.vibrant.secondary }}
                    animate={{ scale: [1.2, 1, 1.2], rotate: [0, -90, 0] }}
                    transition={{ duration: 12, repeat: Infinity }}
                />
            </div>

            <div className="max-w-xl w-full px-8 relative z-10 text-center">
                <AnimatePresence mode="wait">
                    {!complete ? (
                        <motion.div
                            key="provisioning"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            className="space-y-12"
                        >
                            <div className="relative inline-block">
                                {/* Gauge Background */}
                                <svg className="w-48 h-48 -rotate-90">
                                    <circle
                                        cx="96"
                                        cy="96"
                                        r="88"
                                        fill="transparent"
                                        stroke="rgba(255,255,255,0.1)"
                                        strokeWidth="8"
                                    />
                                    <motion.circle
                                        cx="96"
                                        cy="96"
                                        r="88"
                                        fill="transparent"
                                        stroke="white"
                                        strokeWidth="8"
                                        strokeDasharray={553}
                                        animate={{ strokeDashoffset: 553 - (553 * progress) / 100 }}
                                        transition={{ type: "spring", damping: 20, stiffness: 50 }}
                                    />
                                </svg>

                                {/* Icon in Center */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <motion.div
                                        key={steps[currentStep].id}
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="p-6 bg-white/10 backdrop-blur-xl rounded-full"
                                    >
                                        {(() => {
                                            const Icon = steps[currentStep].icon;
                                            return <Icon className="w-12 h-12 text-white" />;
                                        })()}
                                    </motion.div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <motion.h2
                                    key={steps[currentStep].label}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-3xl font-black tracking-tight"
                                >
                                    {steps[currentStep].label}
                                </motion.h2>
                                <div className="flex gap-2 justify-center">
                                    {steps.map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-1.5 w-8 rounded-full transition-all duration-500 ${i <= currentStep ? 'bg-white' : 'bg-white/20'
                                                }`}
                                        />
                                    ))}
                                </div>
                                <p className="text-white/60 font-medium">
                                    Preparando ambiente para <span className="text-white font-bold">{profile.label}</span>
                                </p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="complete"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-window p-10 shadow-2xl text-white border-white/20"
                        >
                            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-green-500/30">
                                <Check className="w-10 h-10 text-white" />
                            </div>

                            <h2 className="text-4xl font-black mb-4 drop-shadow-md">Seu ACR está pronto!</h2>
                            <p className="text-white/80 mb-8 text-lg font-medium">
                                Instalamos com sucesso todos os recursos para <span className="font-black text-white">{profile.label}</span>.
                            </p>

                            {/* Theme Selection */}
                            <div className="mb-8 p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
                                <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-4 text-center">
                                    Identidade Visual Sugerida
                                </h3>
                                <div className="grid grid-cols-3 gap-3">
                                    {(['vibrant', 'clean', 'dark'] as const).map((v) => (
                                        <button
                                            key={v}
                                            onClick={() => setSelectedVariant(v)}
                                            className={cn(
                                                "p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 backdrop-blur-md",
                                                selectedVariant === v
                                                    ? "border-white bg-white/20"
                                                    : "border-white/10 hover:border-white/30 bg-white/5"
                                            )}
                                        >
                                            <div className="flex gap-1">
                                                <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: profile.theme.variants[v].primary }} />
                                                <div className="w-4 h-4 rounded-full opacity-50" style={{ backgroundColor: profile.theme.variants[v].secondary }} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase text-white/60">{v}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white/10 border border-white/20 rounded-3xl p-6 mb-8 text-left flex items-start gap-4 backdrop-blur-md">
                                <div className="p-2 bg-white/20 rounded-xl text-white">
                                    <Mail className="w-6 h-6 border-white" />
                                </div>
                                <div>
                                    <h3 className="font-black text-white mb-1">Passo Final</h3>
                                    <p className="text-white/70 text-sm leading-relaxed font-medium">
                                        Verifique seu e-mail <span className="font-black text-white">{email}</span> para ativar seu acesso definitivo.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Button
                                    onClick={handleContinue}
                                    className="w-full h-14 text-lg font-bold rounded-2xl flex gap-2"
                                    style={{ backgroundColor: profile.theme.variants[selectedVariant]?.primary || profile.theme.primary }}
                                >
                                    Ficou ótimo! Vamos entrar
                                    <ArrowRight className="w-5 h-5" />
                                </Button>

                                <button className="text-neutral-400 text-sm font-medium hover:text-neutral-600 flex items-center gap-2 mx-auto transition-colors">
                                    <RefreshCw className="w-4 h-4" />
                                    Reenviar e-mail de confirmação
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="absolute bottom-8 left-0 right-0 text-center opacity-40">
                <div className="flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-bold tracking-[0.2em] uppercase">ACR Chameleon Engine 1.0</span>
                </div>
            </div>
        </div>
    );
}
