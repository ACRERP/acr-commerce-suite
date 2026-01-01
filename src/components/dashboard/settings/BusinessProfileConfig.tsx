import { useState } from 'react';
import { useBusinessProfile } from '@/contexts/BusinessProfileContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Check, RefreshCw, Store, Zap, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export function BusinessProfileConfig() {
    const { activeProfile, setProfile, profiles } = useBusinessProfile();
    const [selectedId, setSelectedId] = useState<string | null>(activeProfile?.id || null);
    const [isChanging, setIsChanging] = useState(false);
    const { toast } = useToast();

    const handleApplyProfile = async () => {
        if (!selectedId || selectedId === activeProfile?.id) return;

        setIsChanging(true);

        // Simulating a system reconfiguration
        setTimeout(() => {
            setProfile(selectedId);
            setIsChanging(false);
            toast({
                title: "Perfil Atualizado",
                description: "O sistema foi reconfigurado para o novo perfil de negócio.",
                variant: "default"
            });

            // Optional: Force reload to ensure all module guards are reset
            setTimeout(() => window.location.reload(), 1500);
        }, 1000);
    };

    return (
        <div className="space-y-6">
            <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 rounded-t-xl">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <Store className="w-5 h-5 text-primary-500" />
                    Perfil de Negócio (Arquitetura Unificada)
                </h3>
                <p className="text-sm text-neutral-500 mt-1">
                    O ACR Commerce Suite é um sistema único que se adapta ao seu negócio.
                    Altere o perfil abaixo para reconfigurar módulos, temas e funcionalidades automaticamente.
                </p>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {profiles.map((profile) => (
                        <motion.div
                            key={profile.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedId(profile.id)}
                            className={`cursor-pointer relative overflow-hidden rounded-xl border-2 transition-all duration-200 ${selectedId === profile.id
                                    ? 'border-primary-500 bg-primary-50/10 shadow-lg ring-1 ring-primary-500'
                                    : 'border-neutral-100 dark:border-neutral-800 hover:border-primary-200 dark:hover:border-primary-800 bg-white dark:bg-neutral-900'
                                }`}
                        >
                            {selectedId === profile.id && (
                                <div className="absolute top-2 right-2 z-10">
                                    <div className="h-6 w-6 bg-primary-500 rounded-full flex items-center justify-center text-white shadow-sm">
                                        <Check className="w-4 h-4" />
                                    </div>
                                </div>
                            )}

                            <div className="p-5 flex flex-col h-full">
                                <div className="mb-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white mb-3 shadow-md`} style={{ backgroundColor: profile.theme.variants.vibrant.primary }}>
                                        {/* We can use a generic icon if the profile icon is a component, or render it if it's a lucide icon passed as prop */}
                                        <Store className="w-6 h-6" />
                                    </div>
                                    <h4 className="font-bold text-lg text-neutral-900 dark:text-neutral-100 leading-tight">
                                        {profile.label}
                                    </h4>
                                    <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                                        {profile.description}
                                    </p>
                                </div>

                                <div className="mt-auto space-y-3">
                                    <div className="flex flex-wrap gap-1">
                                        {profile.modules.slice(0, 3).map(mod => (
                                            <Badge key={mod} variant="secondary" className="text-[10px] uppercase px-1.5 h-5">
                                                {mod}
                                            </Badge>
                                        ))}
                                        {profile.modules.length > 3 && (
                                            <Badge variant="outline" className="text-[10px] px-1.5 h-5">
                                                +{profile.modules.length - 3}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <div className="p-6 bg-neutral-50/50 dark:bg-neutral-900/30 flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800 rounded-b-xl">
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                    <ShieldCheck className="w-4 h-4 text-green-500" />
                    <span>Todos os módulos incluídos na licença</span>
                </div>
                <Button
                    onClick={handleApplyProfile}
                    disabled={!selectedId || selectedId === activeProfile?.id || isChanging}
                    className="btn-primary hover-lift px-8"
                >
                    {isChanging ? (
                        <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Reconfigurando Sistema...
                        </>
                    ) : (
                        <>
                            <Zap className="w-4 h-4 mr-2" />
                            Aplicar Configuração "{profiles.find(p => p.id === selectedId)?.label}"
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
