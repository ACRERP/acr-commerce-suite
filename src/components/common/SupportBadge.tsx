import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SupportBadge() {
    const [expanded, setExpanded] = useState(false);

    const openWhatsApp = () => {
        window.open('https://wa.me/5511988425669?text=Olá! Preciso de suporte no ACR ERP', '_blank');
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="absolute bottom-16 right-0 bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl p-6 w-80 backdrop-blur-xl"
                    >
                        <button
                            onClick={() => setExpanded(false)}
                            className="absolute top-3 right-3 text-white/40 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-white mb-0.5 tracking-tight">
                                        ACR Suporte Elite
                                    </h3>
                                    <p className="text-[10px] font-bold text-primary/70 uppercase tracking-widest">
                                        Atendimento VIP
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Button
                                    onClick={openWhatsApp}
                                    className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white font-bold h-12 rounded-xl group"
                                >
                                    <MessageCircle className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                                    WhatsApp Oficial
                                </Button>

                                <Button
                                    onClick={() => window.location.href = 'mailto:acrerptech@gmail.com?subject=Suporte ACR ERP Elite'}
                                    variant="outline"
                                    className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-white h-12 rounded-xl"
                                >
                                    📧 acrerptech@gmail.com
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setExpanded(!expanded)}
                className="w-14 h-14 rounded-full bg-gradient-to-br from-[#A4FF00] to-[#1A5F1F] text-white shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
                style={{
                    boxShadow: '0 4px 20px rgba(164, 255, 0, 0.3)',
                }}
            >
                <MessageCircle className="w-6 h-6" />
            </motion.button>
        </div>
    );
}
