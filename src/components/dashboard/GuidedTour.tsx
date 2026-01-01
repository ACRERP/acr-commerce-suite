import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2,
    Circle,
    PlayCircle,
    Store,
    ShoppingCart,
    Package,
    ChevronRight,
    X,
    Sparkles,
    ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LicenseService } from '@/lib/licensing/license-service';
import { cn } from '@/lib/utils';
import { useBusinessProfile } from '@/contexts/BusinessProfileContext';

interface TourStep {
    id: string;
    title: string;
    description: string;
    icon: any;
    path: string;
    actionLabel: string;
}

const TOUR_STEPS: TourStep[] = [
    {
        id: 'caixa',
        title: 'Abrir o Caixa',
        description: 'Todo dia de vendas começa aqui. Defina o valor inicial para começar a operar.',
        icon: Store,
        path: '/caixa',
        actionLabel: 'Ir para o Caixa'
    },
    {
        id: 'pdv',
        title: 'Realizar Venda',
        description: 'Use o PDV para passar produtos. Teste o leitor de código de barras ou use a busca.',
        icon: ShoppingCart,
        path: '/pdv',
        actionLabel: 'Abrir Frente de Caixa'
    },
    {
        id: 'estoque',
        title: 'Conferir Estoque',
        description: 'Veja como o estoque baixou automaticamente após a sua venda de teste.',
        icon: Package,
        path: '/produtos',
        actionLabel: 'Ver Meus Produtos'
    }
];

export function GuidedTour() {
    const navigate = useNavigate();
    const { activeProfile } = useBusinessProfile();
    const [isOpen, setIsOpen] = useState(false);
    const [completedSteps, setCompletedSteps] = useState<string[]>([]);
    const [isDemo, setIsDemo] = useState(false);

    useEffect(() => {
        const license = LicenseService.getLocalLicense();
        const demo = license?.type === 'demo';
        setIsDemo(demo);

        // Auto open for demo users who haven't finished
        const tourFinished = localStorage.getItem('acr_tour_finished') === 'true';
        if (demo && !tourFinished) {
            setIsOpen(true);
        }

        const savedSteps = localStorage.getItem('acr_tour_steps');
        if (savedSteps) {
            setCompletedSteps(JSON.parse(savedSteps));
        }
    }, []);

    const toggleStep = (id: string) => {
        const newSteps = completedSteps.includes(id)
            ? completedSteps.filter(s => s !== id)
            : [...completedSteps, id];

        setCompletedSteps(newSteps);
        localStorage.setItem('acr_tour_steps', JSON.stringify(newSteps));

        if (newSteps.length === TOUR_STEPS.length) {
            // Optional: Show celebration
        }
    };

    const handleAction = (step: TourStep) => {
        toggleStep(step.id);
        navigate(step.path);
        setIsOpen(false);
    };

    const finishTour = () => {
        localStorage.setItem('acr_tour_finished', 'true');
        setIsOpen(false);
    };

    if (!isDemo) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[60]">
            <AnimatePresence>
                {isOpen ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: 20, scale: 0.9, filter: 'blur(10px)' }}
                        className="w-[350px] mb-4"
                    >
                        <Card className="overflow-hidden border-0 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] ring-1 ring-white/20">
                            {/* Header AAA */}
                            <div className="p-6 bg-gradient-to-br from-neutral-900 via-neutral-800 to-black text-white relative overflow-hidden">
                                <div className="relative z-10 flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Sparkles className="w-4 h-4 text-[#A4FF00]" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Modo Experiência</span>
                                        </div>
                                        <h3 className="text-xl font-black tracking-tight">Primeiros Passos</h3>
                                    </div>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                                    >
                                        <X className="w-5 h-5 opacity-60" />
                                    </button>
                                </div>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#A4FF00] opacity-10 blur-3xl rounded-full" />
                            </div>

                            {/* Steps List */}
                            <div className="p-4 space-y-3">
                                {TOUR_STEPS.map((step, index) => {
                                    const isDone = completedSteps.includes(step.id);
                                    const Icon = step.icon;

                                    return (
                                        <div
                                            key={step.id}
                                            className={cn(
                                                "p-4 rounded-2xl border transition-all duration-300 group cursor-pointer",
                                                isDone
                                                    ? "bg-neutral-50 dark:bg-neutral-800/50 border-neutral-100 dark:border-neutral-800 opacity-60"
                                                    : "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:border-[#A4FF00]/50 hover:shadow-lg"
                                            )}
                                            onClick={() => !isDone && handleAction(step)}
                                        >
                                            <div className="flex gap-4">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-sm",
                                                    isDone ? "bg-green-100 dark:bg-green-950 text-green-600" : "bg-neutral-100 dark:bg-neutral-700 text-neutral-600 group-hover:bg-[#A4FF00] group-hover:text-black"
                                                )}>
                                                    {isDone ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-bold text-sm">{step.title}</h4>
                                                        {!isDone && <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition-opacity" />}
                                                    </div>
                                                    <p className="text-xs text-neutral-500 line-clamp-2 mt-0.5 leading-relaxed">
                                                        {step.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Footer */}
                            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/80 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                                <div className="text-[10px] font-bold text-neutral-400">
                                    {completedSteps.length} de {TOUR_STEPS.length} CONCLUÍDOS
                                </div>
                                <Button
                                    variant="link"
                                    className="text-xs font-bold text-neutral-500 hover:text-neutral-900"
                                    onClick={finishTour}
                                >
                                    Pular Tour
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                ) : (
                    <motion.button
                        layoutId="tour-button"
                        onClick={() => setIsOpen(true)}
                        className="bg-neutral-900 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 hover:scale-105 transition-transform ring-4 ring-[#A4FF00]/20"
                    >
                        <div className="bg-[#A4FF00] p-1.5 rounded-lg">
                            <PlayCircle className="w-5 h-5 text-black" />
                        </div>
                        <div className="text-left pr-2">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-50 leading-none mb-1">Guia Rápido</p>
                            <p className="font-bold text-sm leading-none">Como testar as asas?</p>
                        </div>
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}
