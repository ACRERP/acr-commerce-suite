
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Sparkles, Box } from 'lucide-react';
import { BusinessProfile } from '@/config/business-profiles';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from '@/lib/utils';

interface ProfileShowcaseProps {
    profiles: BusinessProfile[];
    onSelect: (profileId: string) => void;
    onActiveProfileChange?: (profileId: string) => void;
    className?: string; // Standardize prop for custom styling
}

export function ProfileShowcase({ profiles, onSelect, onActiveProfileChange, className }: ProfileShowcaseProps) {
    const [index, setIndex] = useState(0);
    const activeProfile = profiles[index];

    useEffect(() => {
        onActiveProfileChange?.(activeProfile.id);
    }, [index, activeProfile.id, onActiveProfileChange, profiles]);

    const next = () => setIndex((prev) => (prev + 1) % profiles.length);
    const prev = () => setIndex((prev) => (prev - 1 + profiles.length) % profiles.length);

    return (
        <div className={cn("relative w-full flex flex-col items-center gap-6", className)}>
            {/* Carousel Container */}
            <div className="w-full relative overflow-hidden px-4 py-8">
                <motion.div
                    className="flex cursor-grab active:cursor-grabbing"
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={(_, info) => {
                        if (info.offset.x < -100) next();
                        if (info.offset.x > 100) prev();
                    }}
                    animate={{ x: `-${index * 100}%` }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                    {profiles.map((profile, i) => (
                        <div key={profile.id} className="min-w-full px-4 py-4">
                            <motion.div
                                animate={{
                                    scale: index === i ? 1 : 0.95,
                                    opacity: index === i ? 1 : 0.5,
                                }}
                                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                className={cn(
                                    "rounded-[2rem] overflow-hidden transition-all duration-700",
                                    index === i ? "border-beam-active" : ""
                                )}
                                style={{
                                    '--beam-color': profile.theme.variants.vibrant.primary,
                                    boxShadow: index === i
                                        ? `0 30px 60px -15px ${profile.theme.variants.vibrant.primary}40`
                                        : 'none'
                                } as any}
                            >
                                <Card
                                    className="rounded-[2rem] glass-sandblasted border-white/20 overflow-hidden group transition-all duration-1000"
                                >
                                    <div className="flex flex-col lg:flex-row min-h-[500px]">
                                        {/* Visual Section */}
                                        <div className="relative w-full lg:w-1/2 overflow-hidden h-60 lg:h-auto">
                                            <motion.div
                                                className="absolute inset-0 bg-cover bg-center"
                                                style={{
                                                    backgroundImage: `url(${profile.imageUrl || 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=1200'})`
                                                }}
                                                whileHover={{ scale: 1.05 }}
                                                transition={{ duration: 1.5 }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-white/10" />

                                            <div className="absolute bottom-8 left-8 right-8">
                                                <div
                                                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-2xl backdrop-blur-md border border-white/30"
                                                    style={{ backgroundColor: `${profile.theme.variants.vibrant.primary}aa` }}
                                                >
                                                    {React.createElement(profile.icon, { className: "w-8 h-8" })}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content Section */}
                                        <CardContent className="w-full lg:w-1/2 p-6 md:p-8 flex flex-col justify-between bg-black/20 backdrop-blur-md">
                                            <div>
                                                <div className="mb-4">
                                                    <p
                                                        className="text-[9px] font-black uppercase tracking-[0.4em] mb-1.5"
                                                        style={{ color: profile.theme.variants.vibrant.primary }}
                                                    >
                                                        Ecossistema Especializado
                                                    </p>
                                                    <h3 className="text-3xl font-black text-white tracking-tighter leading-none mb-3">
                                                        {profile.label}
                                                    </h3>
                                                    <p className="text-white/60 font-bold leading-relaxed text-xs">
                                                        {profile.description}
                                                    </p>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 mb-6">
                                                    {profile.modules.slice(0, 4).map((mod) => (
                                                        <div
                                                            key={mod}
                                                            className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10 shadow-sm backdrop-blur-md group/mod hover:bg-white/10 transition-all"
                                                        >
                                                            <div className="p-1.5 rounded-lg bg-black/20 text-white group-hover/mod:bg-black/40 transition-colors">
                                                                <Box className="w-3.5 h-3.5" />
                                                            </div>
                                                            <span className="text-[10px] font-black uppercase text-white/50 tracking-tight">{mod}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="space-y-2.5">
                                                    {profile.features.slice(0, 3).map((feature) => (
                                                        <div key={feature} className="flex items-center gap-3 text-white/80">
                                                            <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 shadow-sm">
                                                                <Check className="w-3 h-3" />
                                                            </div>
                                                            <span className="text-[9px] font-black uppercase tracking-widest opacity-60">
                                                                {feature.replace(/_/g, ' ')}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Specialized Teaser */}
                                                <div className="mt-6 p-4 rounded-2xl bg-black/40 text-white relative overflow-hidden group/teaser border border-white/5">
                                                    <div className="relative z-10">
                                                        <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em] mb-1.5">Perfil Especializado</p>
                                                        <p className="text-[10px] leading-relaxed font-bold">
                                                            Ambiente otimizado para <span className="text-white underline underline-offset-4 decoration-2">{profile.label}</span> com fluxos de alta performance.
                                                        </p>
                                                    </div>
                                                    <Sparkles className="absolute top-2 right-2 w-8 h-8 text-white/5 group-hover/teaser:text-white/10 transition-colors" />
                                                </div>
                                            </div>

                                            <div className="mt-6">
                                                <Button
                                                    onClick={() => onSelect(profile.id)}
                                                    className="w-full h-12 text-lg font-black rounded-xl shadow-2xl transition-all active:scale-95 group overflow-hidden relative"
                                                    style={{
                                                        backgroundColor: profile.theme.variants.vibrant.primary,
                                                        boxShadow: `0 15px 30px -10px ${profile.theme.variants.vibrant.primary}80`
                                                    }}
                                                >
                                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                                        ATIVAR ESTE PERFIL
                                                        <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                                    </span>
                                                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </div>
                                </Card>
                            </motion.div>
                        </div>
                    ))}
                </motion.div>

                {/* Navigation Arrows (Responsive) */}
                <div className="block">
                    <button
                        onClick={prev}
                        className="absolute left-2 lg:-left-4 top-1/2 -translate-y-1/2 p-3 lg:p-4 rounded-full glass-sandblasted border border-white/40 text-white hover:bg-black/20 shadow-2xl transition-all z-20 active:scale-90 hover:scale-110"
                    >
                        <ChevronLeft className="w-6 h-6 lg:w-8 lg:h-8" />
                    </button>
                    <button
                        onClick={next}
                        className="absolute right-2 lg:-right-4 top-1/2 -translate-y-1/2 p-3 lg:p-4 rounded-full glass-sandblasted border border-white/40 text-white hover:bg-black/20 shadow-2xl transition-all z-20 active:scale-90 hover:scale-110"
                    >
                        <ChevronRight className="w-6 h-6 lg:w-8 lg:h-8" />
                    </button>
                </div>
            </div>

            {/* Pagination Indicators (Dots) */}
            <div className="flex justify-center gap-4 pb-8">
                {profiles.map((p, i) => (
                    <button
                        key={i}
                        onClick={() => setIndex(i)}
                        className={cn(
                            "h-3 rounded-full transition-all duration-500 relative",
                            i === index
                                ? "w-12 shadow-2xl scale-110"
                                : "w-3 bg-white/20 hover:bg-white/40"
                        )}
                        style={{
                            backgroundColor: i === index ? p.theme.variants.vibrant.primary : undefined,
                            boxShadow: i === index ? `0 0 15px ${p.theme.variants.vibrant.primary}` : 'none'
                        }}
                        aria-label={`Go to slide ${i + 1}`}
                    >
                        {i === index && (
                            <motion.div
                                layoutId="activeDot"
                                className="absolute inset-0 rounded-full bg-white/20 animate-pulse"
                            />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
