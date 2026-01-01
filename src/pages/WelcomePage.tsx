import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate } from 'framer-motion';
import { Rocket, Key, CheckCircle, Heart, Sparkles } from 'lucide-react';
import logoAsas from '@/assets/logo-asas.png';
import { signInAnonymously } from '@/lib/supabaseClient';
import { LicenseService } from '@/lib/licensing/license-service';

function ParallaxLogo() {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top, width, height } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left - width / 2);
        mouseY.set(clientY - top - height / 2);
    }

    return (
        <motion.div
            className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center perspective-1000"
            onMouseMove={handleMouseMove}
            style={{ perspective: 1000 }}
            onMouseLeave={() => {
                mouseX.set(0);
                mouseY.set(0);
            }}
        >
            <motion.div
                style={{
                    rotateX: useTransform(mouseY, [-200, 200], [15, -15]),
                    rotateY: useTransform(mouseX, [-200, 200], [-15, 15]),
                }}
                className="relative w-full h-full flex items-center justify-center transition-transform duration-200 ease-out preserve-3d"
            >
                {/* Glow Effect behind logo */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#A4FF00] to-[#1A5F1F] rounded-full blur-[60px] opacity-30 animate-pulse" />

                <motion.img
                    src={logoAsas}
                    alt="ACR Logo Wings"
                    className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(164,255,0,0.5)]"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                        duration: 1.5
                    }}
                />
            </motion.div>
        </motion.div>
    );
}

export default function WelcomePage() {
    const navigate = useNavigate();
    const [mode, setMode] = useState<'select' | 'demo' | 'license'>('select');
    const [licenseKey, setLicenseKey] = useState('');

    const handleDemoMode = async () => {
        try {
            // 1. Login anônimo (background)
            const { data, error } = await signInAnonymously();
            if (error) throw error;
            if (!data.user) throw new Error('Falha ao criar usuário anônimo');

            // 2. Criar licença DEMO
            const license = await LicenseService.createDemoLicense(data.user.id);
            if (!license) throw new Error('Falha ao criar licença DEMO');

            // 3. Redirecionar para onboarding simplificado (seleção de nicho)
            navigate('/start?demo=true');
        } catch (error) {
            console.error('Erro ao iniciar modo DEMO:', error);
            alert('Não foi possível iniciar o modo DEMO. Tente novamente mais tarde.');
        }
    };

    const handleLicenseActivation = () => {
        navigate('/dashboard');
    };

    if (mode === 'select') {
        return (
            <div className="min-h-screen relative overflow-hidden bg-[#0A0F1C] text-white selection:bg-[#A4FF00] selection:text-[#0A0F1C]">
                {/* Interactive Background Particles (CSS based for performance) */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#A4FF00] rounded-full mix-blend-screen blur-[120px] opacity-[0.1] animate-float-slow" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#1A5F1F] rounded-full mix-blend-screen blur-[120px] opacity-[0.2] animate-float-slow animation-delay-2000" />
                    <div className="absolute top-[20%] right-[20%] w-[20%] h-[20%] bg-[#FFD700] rounded-full mix-blend-screen blur-[100px] opacity-[0.05] animate-pulse" />
                </div>

                <div className="relative z-10 container mx-auto px-4 h-screen flex flex-col items-center justify-center py-4 overflow-hidden">

                    {/* 1. Hero Section with Parallax 3D */}
                    <div className="mb-6 flex flex-col items-center">
                        <ParallaxLogo />

                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                            className="mt-4 text-3xl md:text-5xl font-bold text-center tracking-tight"
                        >
                            <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                                ACR Commerce Suite
                            </span>
                        </motion.h1>

                    </div>

                    {/* 2. Glassmorphism Cards */}
                    <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl px-4">

                        {/* DEMO Card */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.5, duration: 0.6, type: "spring" }}
                        >
                            <Card
                                className="group relative h-[480px] overflow-hidden border-0 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-500 cursor-pointer rounded-3xl shadow-2xl"
                                onClick={() => setMode('demo')}
                            >
                                {/* Border Gradient Animation */}
                                <div className="absolute inset-0 p-[1px] rounded-3xl bg-gradient-to-br from-white/10 to-transparent group-hover:from-[#A4FF00] group-hover:to-[#1A5F1F] transition-colors duration-500">
                                    <div className="h-full w-full bg-[#0F1422] rounded-3xl opacity-90 group-hover:opacity-80 transition-opacity" />
                                </div>

                                <div className="relative p-8 h-full flex flex-col z-10">
                                    <div className="mb-6 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#A4FF00] to-[#1A5F1F] flex items-center justify-center shadow-[0_0_20px_rgba(164,255,0,0.3)] group-hover:scale-110 transition-transform duration-300">
                                        <Rocket className="w-8 h-8 text-white" />
                                    </div>

                                    <h3 className="text-3xl font-bold text-white mb-2">Modo DEMO</h3>
                                    <p className="text-gray-400 mb-8 leading-relaxed">
                                        Experimente o futuro da gestão.<br />
                                        <span className="text-[#A4FF00]">14 dias gratuitos</span> para transformar seu negócio.
                                    </p>

                                    <div className="space-y-4 mb-8 flex-grow">
                                        {['Acesso imediato', 'Até 50 produtos', 'Até 20 vendas', 'Sem cartão de crédito'].map((item, i) => (
                                            <div key={i} className="flex items-center gap-3 text-gray-300">
                                                <CheckCircle className="w-5 h-5 text-[#A4FF00]" />
                                                <span>{item}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <Button className="w-full bg-gradient-to-r from-[#A4FF00] to-[#1A5F1F] hover:opacity-90 text-white font-bold py-6 text-lg rounded-xl shadow-lg hover:shadow-[#A4FF00]/20 transition-all">
                                        Começar Gratuitamente
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>

                        {/* License Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.7, duration: 0.6, type: "spring" }}
                        >
                            <Card
                                className="group relative h-[480px] overflow-hidden border-0 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-500 cursor-pointer rounded-3xl shadow-2xl"
                                onClick={() => setMode('license')}
                            >
                                <div className="absolute inset-0 p-[1px] rounded-3xl bg-gradient-to-br from-white/10 to-transparent group-hover:from-indigo-500 group-hover:to-purple-600 transition-colors duration-500">
                                    <div className="h-full w-full bg-[#0F1422] rounded-3xl opacity-90 group-hover:opacity-80 transition-opacity" />
                                </div>

                                <div className="relative p-8 h-full flex flex-col z-10">
                                    <div className="mb-6 w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)] group-hover:scale-110 transition-transform duration-300">
                                        <Key className="w-8 h-8 text-white" />
                                    </div>

                                    <h3 className="text-3xl font-bold text-white mb-2">Tenho Licença</h3>
                                    <p className="text-gray-400 mb-8 leading-relaxed">
                                        Potencialize sua empresa.<br />
                                        Acesso <span className="text-indigo-400">ilimitado e vitalício</span> aos recursos.
                                    </p>

                                    <div className="space-y-4 mb-8 flex-grow">
                                        {['Produtos ilimitados', 'Vendas ilimitadas', 'Todos os módulos', 'Suporte VIP'].map((item, i) => (
                                            <div key={i} className="flex items-center gap-3 text-gray-300">
                                                <CheckCircle className="w-5 h-5 text-indigo-400" />
                                                <span>{item}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 text-white font-bold py-6 text-lg rounded-xl shadow-lg hover:shadow-indigo-500/20 transition-all">
                                        Ativar Agora
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5, duration: 0.8 }}
                        className="mt-4 text-gray-500 text-xs flex flex-wrap items-center justify-center gap-3"
                    >
                        <p>Mais de <span className="text-white font-bold">1000+</span> empresas confiam</p>
                        <div className="h-1 w-1 bg-gray-700 rounded-full" />
                        <a href="https://wa.me/5511988425669" target="_blank" rel="noopener noreferrer" className="hover:text-[#A4FF00] transition-colors">WhatsApp: (11) 98842-5669</a>
                        <div className="h-1 w-1 bg-gray-700 rounded-full" />
                        <a href="mailto:acrerptech@gmail.com" className="hover:text-[#A4FF00] transition-colors">acrerptech@gmail.com</a>
                    </motion.div>
                </div>

                <style>{`
          .preserve-3d { transform-style: preserve-3d; }
          .perspective-1000 { perspective: 1000px; }
          @keyframes float-slow {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-20px) scale(1.05); }
          }
          .animate-float-slow { animation: float-slow 10s ease-in-out infinite; }
          .animation-delay-2000 { animation-delay: 2s; }
        `}</style>
            </div>
        );
    }

    // Reuse previous inner pages for consistent logic
    if (mode === 'demo') {
        return (
            <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center p-4">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                    <Card className="max-w-md w-full p-8 bg-[#0F1422] border-[#A4FF00]/20 text-white">
                        <div className="text-center">
                            <Rocket className="w-16 h-16 mx-auto mb-4 text-[#A4FF00]" />
                            <h2 className="text-2xl font-bold mb-4">Iniciando Modo DEMO</h2>
                            <p className="text-gray-400 mb-6">
                                Você terá acesso por 14 dias. Aproveite para testar todas as funcionalidades.
                            </p>
                            <Button onClick={handleDemoMode} className="w-full bg-[#A4FF00] hover:bg-[#8FE600] text-black font-bold py-6">
                                Iniciar Agora
                            </Button>
                            <Button onClick={() => setMode('select')} variant="ghost" className="w-full mt-4 text-gray-400 hover:text-white">
                                Voltar
                            </Button>
                        </div>
                    </Card>
                </motion.div>
            </div>
        );
    }

    if (mode === 'license') {
        return (
            <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center p-4">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                    <Card className="max-w-md w-full p-8 bg-[#0F1422] border-indigo-500/20 text-white">
                        <div className="text-center mb-6">
                            <Key className="w-16 h-16 mx-auto mb-4 text-indigo-500" />
                            <h2 className="text-2xl font-bold mb-2">Ativar Licença</h2>
                            <p className="text-gray-400">Digite sua chave de acesso</p>
                        </div>

                        <div className="space-y-4">
                            <Input
                                type="text"
                                placeholder="XXXX-XXXX-XXXX-XXXX"
                                value={licenseKey}
                                onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                                className="text-center text-lg font-mono tracking-wider bg-black/20 border-gray-700 text-white h-12"
                                maxLength={19}
                            />
                            <Button
                                onClick={handleLicenseActivation}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-6"
                                disabled={!licenseKey}
                            >
                                Validar e Ativar
                            </Button>
                            <Button onClick={() => setMode('select')} variant="ghost" className="w-full text-gray-400 hover:text-white">
                                Voltar
                            </Button>
                        </div>
                    </Card>
                </motion.div>
            </div>
        );
    }

    return null;
}
