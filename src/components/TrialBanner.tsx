import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Sparkles, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

export function TrialBanner() {
    const { profile: user } = useAuth();
    const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
    const [isVisible, setIsVisible] = useState(true);
    const [isTrial, setIsTrial] = useState(false);

    useEffect(() => {
        if (!user?.id) return;

        const checkTrialStatus = async () => {
            try {
                // Get profile data
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('is_trial, trial_ends_at, trial_converted')
                    .eq('id', user.id)
                    .single();

                if (!profile || !profile.is_trial || profile.trial_converted) {
                    setIsTrial(false);
                    return;
                }

                setIsTrial(true);

                // Calculate days remaining
                const endsAt = new Date(profile.trial_ends_at);
                const now = new Date();
                const diffTime = endsAt.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                setDaysRemaining(diffDays);
            } catch (error) {
                console.error('Error checking trial status:', error);
            }
        };

        checkTrialStatus();

        // Refresh every hour
        const interval = setInterval(checkTrialStatus, 1000 * 60 * 60);
        return () => clearInterval(interval);
    }, [user?.id]);

    if (!isTrial || daysRemaining === null || !isVisible) {
        return null;
    }

    // Determine banner style based on days remaining
    const getBannerStyle = () => {
        if (daysRemaining <= 0) {
            return {
                bg: 'bg-red-500',
                text: 'text-white',
                icon: '🚨',
                message: 'Seu trial expirou',
                cta: 'Assine Agora'
            };
        } else if (daysRemaining <= 2) {
            return {
                bg: 'bg-orange-500',
                text: 'text-white',
                icon: '⚠️',
                message: `Trial expira em ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'}`,
                cta: 'Assine Agora'
            };
        } else if (daysRemaining <= 5) {
            return {
                bg: 'bg-yellow-400',
                text: 'text-neutral-900',
                icon: '⏰',
                message: `${daysRemaining} dias restantes no trial`,
                cta: 'Ver Planos'
            };
        } else {
            return {
                bg: 'bg-indigo-500',
                text: 'text-white',
                icon: '✨',
                message: `Trial: ${daysRemaining} dias restantes`,
                cta: 'Ver Planos'
            };
        }
    };

    const style = getBannerStyle();

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                className={`fixed top-0 left-0 right-0 z-50 ${style.bg} ${style.text} shadow-lg`}
            >
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                        {/* Message */}
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{style.icon}</span>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold">
                                    {style.message}
                                </span>
                                {daysRemaining > 0 && (
                                    <span className="text-sm opacity-90">
                                        • Aproveite todos os recursos!
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant={daysRemaining <= 2 ? 'default' : 'secondary'}
                                className="whitespace-nowrap"
                                onClick={() => {
                                    // TODO: Open pricing modal
                                    console.log('Open pricing modal');
                                }}
                            >
                                <CreditCard className="w-4 h-4 mr-2" />
                                {style.cta}
                            </Button>

                            {daysRemaining > 5 && (
                                <button
                                    onClick={() => setIsVisible(false)}
                                    className="p-1 hover:bg-white/20 rounded transition-colors"
                                    title="Fechar"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
