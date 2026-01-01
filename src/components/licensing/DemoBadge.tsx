import { useState, useEffect } from 'react';
import { LicenseService, License } from '@/lib/licensing/license-service';
import { Rocket, AlertCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export function DemoBadge() {
    const [license, setLicense] = useState<License | null>(null);
    const [daysLeft, setDaysLeft] = useState<number | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const check = () => {
            const data = LicenseService.getLocalLicense();
            if (data && data.type === 'demo') {
                setLicense(data);
                if (data.expires_at) {
                    const diff = new Date(data.expires_at).getTime() - new Date().getTime();
                    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                    setDaysLeft(days > 0 ? days : 0);
                }
            } else {
                setLicense(null);
            }
        };

        check();
        const interval = setInterval(check, 1000 * 60 * 30); // 30 min
        return () => clearInterval(interval);
    }, []);

    if (!license || daysLeft === null) return null;

    return (
        <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed top-4 right-20 z-[60] flex items-center gap-3 px-4 py-2 bg-[#0A0F1C]/80 backdrop-blur-md rounded-full border border-[#A4FF00]/20 shadow-lg shadow-[#A4FF00]/5"
        >
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#A4FF00] animate-pulse" />
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Modo DEMO</span>
            </div>

            <div className="h-4 w-[1px] bg-gray-800" />

            <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white">{daysLeft}</span>
                <span className="text-[10px] text-gray-400 uppercase">dias restantes</span>
            </div>

            <button
                onClick={() => navigate('/')}
                className="ml-2 flex items-center gap-1.5 px-3 py-1 bg-[#A4FF00] hover:bg-[#8FE600] text-black text-[10px] font-black uppercase rounded-full transition-all hover:scale-105 active:scale-95 group"
            >
                Ativar Full
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
        </motion.div>
    );
}
