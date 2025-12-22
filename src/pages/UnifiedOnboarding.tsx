import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useBusinessProfile } from '@/contexts/BusinessProfileContext';
import { supabase } from '@/lib/supabaseClient';
import { businessProfiles } from '@/config/business-profiles';
import { ArrowRight, ArrowLeft, Check, Loader2, Eye, EyeOff, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProfileShowcase } from '@/components/onboarding/ProfileShowcase';
import { cn } from '@/lib/utils';

// Quiz categories with specific profiles and cover images
const quizCategories = [
    {
        id: 'food',
        label: 'Gastronomia',
        image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600',
        bgImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=2000',
        color: '#f59e0b',
        profiles: [
            { id: 'bakery', label: 'Padaria / Confeitaria' },
            { id: 'restaurant', label: 'Restaurante / Delivery' },
        ]
    },
    {
        id: 'fashion_beauty',
        label: 'Moda & Beleza',
        image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600',
        bgImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=2000',
        color: '#db2777',
        profiles: [
            { id: 'clothing_store', label: 'Loja de Roupas' },
            { id: 'makeup_store', label: 'Loja de Maquiagem' },
            { id: 'beauty_salon', label: 'Salão / Barbearia' },
        ]
    },
    {
        id: 'automotive',
        label: 'Automotivo',
        image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=600',
        bgImage: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=2000',
        color: '#ef4444',
        profiles: [
            { id: 'mechanic', label: 'Mecânica' },
            { id: 'tire_shop', label: 'Borracharia' },
        ]
    },
    {
        id: 'tech_services',
        label: 'Tecnologia & Serviços',
        image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=600',
        bgImage: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2000',
        color: '#3b82f6',
        profiles: [
            { id: 'electronics', label: 'Eletrônicos' },
            { id: 'service_provider', label: 'Prestador de Serviço' },
        ]
    },
    {
        id: 'health_vet',
        label: 'Saúde & Veterinária',
        image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=600',
        bgImage: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=2000',
        color: '#10b981',
        profiles: [
            { id: 'pharmacy', label: 'Farmácia / Drogaria' },
            { id: 'medical_clinic', label: 'Clínica / Consultório' },
            { id: 'pet_shop', label: 'Pet Shop / Veterinária' },
        ]
    },
    {
        id: 'home_construction',
        label: 'Casa & Construção',
        image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=600',
        bgImage: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=2000',
        color: '#ea580c',
        profiles: [
            { id: 'construction', label: 'Material de Construção' },
            { id: 'real_estate', label: 'Imobiliária / Móveis' },
        ]
    },
    {
        id: 'business_edu',
        label: 'Negócios & Educação',
        image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=600',
        bgImage: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=2000',
        color: '#6366f1',
        profiles: [
            { id: 'business_generic', label: 'Negócios / Empresa' },
            { id: 'education', label: 'Escola / Cursos' },
        ]
    },
];

type Step = 'category' | 'profile' | 'signup';

export default function UnifiedOnboarding() {
    const navigate = useNavigate();
    const { setProfile } = useBusinessProfile();

    const [step, setStep] = useState<Step>('category');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [activeCategoryIndex, setActiveCategoryIndex] = useState(0); // For carousel
    const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
    const [hoveredProfileId, setHoveredProfileId] = useState<string | null>(null);

    // Signup form state
    const [formData, setFormData] = useState({
        companyName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [loadSampleData, setLoadSampleData] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Determine background image and color logic
    // Initial state: Captivating abstract/city background
    // Selected/Hovered state: Profile specific background
    // Determine background image and color logic
    // Initial state: Captivating abstract/city background
    // Selected/Hovered state: Profile specific background
    const getBackgroundImage = () => {
        if (step === 'category') {
            return quizCategories[activeCategoryIndex].bgImage; // Dynamic carousel background
        }
        const profile = businessProfiles.find(p => p.id === (hoveredProfileId || selectedProfileId)) || businessProfiles[0];
        return profile.imageUrl || 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=1200';
    };

    // Helper to get active theme color
    const getThemeColor = () => {
        if (step === 'category') return quizCategories[activeCategoryIndex].color || '#6366f1'; // Dynamic carousel color
        const profile = businessProfiles.find(p => p.id === (hoveredProfileId || selectedProfileId)) || businessProfiles[0];
        return profile.theme.variants.vibrant.primary;
    };

    const currentProfile = businessProfiles.find(p => p.id === (hoveredProfileId || selectedProfileId)) || businessProfiles[0];

    const Icon = currentProfile.icon;

    // Get current category profiles
    const currentCategoryProfiles = selectedCategory
        ? quizCategories.find(c => c.id === selectedCategory)?.profiles.map(p =>
            businessProfiles.find(bp => bp.id === p.id)!
        ) || []
        : [];

    // Handle category navigation
    const navigateCategory = (direction: 'prev' | 'next') => {
        setActiveCategoryIndex(prev => {
            if (direction === 'prev') {
                return prev === 0 ? quizCategories.length - 1 : prev - 1;
            } else {
                return prev === quizCategories.length - 1 ? 0 : prev + 1;
            }
        });
    };

    // Handle category selection
    const handleCategorySelect = (categoryId: string) => {
        setSelectedCategory(categoryId);
        setStep('profile');
    };

    // Handle profile selection
    const handleProfileSelect = (profileId: string) => {
        setSelectedProfileId(profileId);
        setProfile(profileId);
        setStep('signup');
    };

    // Handle signup
    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.companyName.trim()) {
            setError('Nome da empresa é obrigatório');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Por favor, insira um email válido');
            return;
        }

        if (formData.password.length < 8) {
            setError('Senha deve ter no mínimo 8 caracteres');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        if (!agreedToTerms) {
            setError('Você deve concordar com os termos de uso');
            return;
        }

        setLoading(true);

        try {
            // Create auth user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        company_name: formData.companyName,
                        business_profile_id: selectedProfileId
                    }
                }
            });

            if (authError) {
                if (authError.message.includes('invalid')) {
                    throw new Error('Email inválido. Use um email válido (ex: seunome@gmail.com)');
                } else if (authError.message.includes('already registered')) {
                    throw new Error('Este email já está cadastrado. Tente fazer login.');
                } else {
                    throw authError;
                }
            }

            if (!authData.user) throw new Error('Falha ao criar usuário');

            // Update profile with trial info
            const trialEndsAt = new Date();
            trialEndsAt.setDate(trialEndsAt.getDate() + 15);

            await supabase
                .from('profiles')
                .update({
                    is_trial: true,
                    trial_starts_at: new Date().toISOString(),
                    trial_ends_at: trialEndsAt.toISOString(),
                    company_name: formData.companyName,
                    business_profile_id: selectedProfileId
                })
                .eq('id', authData.user.id);

            // Save state for recovery
            localStorage.setItem('acr_last_signup_email', formData.email);
            localStorage.setItem('acr_last_selected_profile', selectedProfileId);
            localStorage.setItem('acr_load_sample_data', loadSampleData ? 'true' : 'false');

            console.log('Signup successful, navigating to provisioning/dashboard');

            // Navigate to provisioning or dashboard
            if (authData.session) {
                navigate('/dashboard');
            } else {
                // If session is not established (email confirmation required), go to provisioning
                navigate('/provisioning', {
                    state: {
                        email: formData.email,
                        profileId: selectedProfileId
                    }
                });
            }

        } catch (err: any) {
            console.error('Signup error:', err);
            setError(err.message || 'Erro ao criar conta. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative h-[100dvh] w-full flex items-center justify-center overflow-hidden bg-slate-950">
            {/* BACKGROUND IMAGE LAYER */}
            <div className="absolute inset-0 z-0">
                <AnimatePresence mode="popLayout">
                    <motion.div
                        key={currentProfile.id + '_bg'}
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute inset-0"
                    >
                        {/* Main Image */}
                        <img
                            src={getBackgroundImage()}
                            alt="Background"
                            className="w-full h-full object-cover transition-opacity duration-1000"
                        />
                        {/* Heavy Overlay for Legibility */}
                        <div className="absolute inset-0 bg-gradient-to-br from-neutral-950/90 via-neutral-950/80 to-neutral-950/90 backdrop-blur-[2px]" />

                        {/* Colored Tint based on Profile Primary Color */}
                        <div
                            className="absolute inset-0 opacity-20 mix-blend-color-dodge transition-colors duration-1000"
                            style={{ backgroundColor: getThemeColor() }}
                        />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* AMBIENT GLOW EFFECTS (Reduced opacity for composition) */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <motion.div
                    key={step + '_glow1'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.2 }}
                    transition={{ duration: 1.5 }}
                    className="absolute -top-1/4 -left-1/4 w-[70vw] h-[70vw] rounded-full blur-[120px]"
                    style={{ backgroundColor: getThemeColor() }}
                />
                <motion.div
                    key={step + '_glow2'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.15 }}
                    transition={{ duration: 2 }}
                    className="absolute -bottom-1/4 -right-1/4 w-[60vw] h-[60vw] rounded-full blur-[150px]"
                    style={{ backgroundColor: getThemeColor() }}
                />
            </div>

            {/* DYNAMIC AMBIENT PARTICLES (Mega Plus) */}
            <div className="ambient-particles">
                {[...Array(15)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="particle"
                        style={{
                            '--particle-color': currentProfile.theme.variants.vibrant.primary,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            width: `${Math.random() * 4 + 2}px`,
                            height: `${Math.random() * 4 + 2}px`,
                        } as any}
                        animate={{
                            y: [0, -100 - Math.random() * 200],
                            x: [0, Math.random() * 50 - 25],
                            opacity: [0, 0.2, 0],
                        }}
                        transition={{
                            duration: 5 + Math.random() * 10,
                            repeat: Infinity,
                            delay: Math.random() * 10,
                            ease: "linear"
                        }}
                    />
                ))}
            </div>

            {/* CONTENT CONTAINER */}
            <div className="relative z-10 w-full px-6 py-6 flex flex-col items-center justify-start md:justify-center h-screen overflow-hidden">
                {/* Global Brand Header Removed - Using Step-Specific Headers */}
                <div className={cn(
                    "w-full transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1)",
                    "max-w-6xl" // Always wide to accommodate carousel and showcases
                )}>
                    <AnimatePresence mode="wait">
                        {/* Step 1: Category Selection - IMMERSIVE CAROUSEL */}
                        {step === 'category' && (
                            <div className="w-full flex flex-col items-center">
                                {/* New Grand Title */}
                                <motion.div
                                    initial={{ y: -20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="mb-6 text-center"
                                >
                                    <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tighter drop-shadow-2xl">
                                        ACR Commerce Suite
                                    </h1>
                                    <p className="text-white/80 font-bold uppercase tracking-[0.3em] text-sm md:text-base bg-black/30 backdrop-blur-sm py-2 px-6 rounded-full border border-white/10 inline-block">
                                        Sistema Multi Plataforma
                                    </p>
                                </motion.div>

                                {/* CAROUSEL CONTAINER */}
                                <div className="relative w-full md:max-w-5xl h-[50vh] min-h-[400px] flex items-center justify-center gap-4 md:gap-8 px-4">

                                    {/* Prev Button - Floating on mobile */}
                                    <button
                                        onClick={() => navigateCategory('prev')}
                                        className="absolute left-2 md:static p-3 md:p-4 rounded-full bg-black/20 hover:bg-black/30 border border-white/10 backdrop-blur-md text-white transition-all hover:scale-110 active:scale-95 group z-30 flex items-center justify-center"
                                    >
                                        <ChevronLeft className="w-8 h-8 md:w-10 md:h-10 opacity-70 group-hover:opacity-100" />
                                    </button>

                                    {/* Active Card Displayer */}
                                    <div className="flex-1 h-full flex items-center justify-center relative perspective-1000">
                                        <AnimatePresence mode="wait" initial={false}>
                                            <motion.div
                                                key={activeCategoryIndex}
                                                initial={{ opacity: 0, x: 50, scale: 0.9, rotateY: -10 }}
                                                animate={{ opacity: 1, x: 0, scale: 1, rotateY: 0 }}
                                                exit={{ opacity: 0, x: -50, scale: 0.9, rotateY: 10 }}
                                                transition={{ duration: 0.5, ease: "circOut" }}
                                                className="w-full max-w-[85vw] md:max-w-md h-full relative"
                                            >
                                                <button
                                                    onClick={() => handleCategorySelect(quizCategories[activeCategoryIndex].id)}
                                                    className="relative w-full h-full rounded-[2rem] overflow-hidden border-[3px] transition-all duration-300 group shadow-2xl shadow-black/50"
                                                    style={{ borderColor: 'rgba(255,255,255,0.2)' }}
                                                >
                                                    {/* Card Image */}
                                                    <div className="absolute inset-0">
                                                        <img
                                                            src={quizCategories[activeCategoryIndex].image}
                                                            alt={quizCategories[activeCategoryIndex].label}
                                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
                                                    </div>

                                                    {/* Card Content */}
                                                    <div className="absolute inset-0 flex flex-col items-center justify-end p-10 pb-16 text-center">
                                                        <span className="text-4xl font-black text-white tracking-tight mb-4 drop-shadow-lg leading-tight">
                                                            {quizCategories[activeCategoryIndex].label}
                                                        </span>

                                                        <div className="flex items-center gap-3 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full font-bold text-lg transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 border border-white/20 backdrop-blur-md">
                                                            Entrar no Ecossistema <ArrowRight className="w-5 h-5" />
                                                        </div>
                                                    </div>

                                                    {/* Shine Effect */}
                                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                                </button>
                                            </motion.div>
                                        </AnimatePresence>

                                        {/* Pagination Indicators */}
                                        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex gap-3">
                                            {quizCategories.map((_, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`h-1.5 rounded-full transition-all duration-300 ${idx === activeCategoryIndex ? 'w-8 bg-white' : 'w-2 bg-white/30'}`}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Next Button - Floating on mobile */}
                                    <button
                                        onClick={() => navigateCategory('next')}
                                        className="absolute right-2 md:static p-3 md:p-4 rounded-full bg-black/20 hover:bg-black/30 border border-white/10 backdrop-blur-md text-white transition-all hover:scale-110 active:scale-95 group z-30 flex items-center justify-center"
                                    >
                                        <ChevronRight className="w-8 h-8 md:w-10 md:h-10 opacity-70 group-hover:opacity-100" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Profile Selection (The Showcase) */}
                        {step === 'profile' && (
                            <motion.div
                                key="profile-selection"
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -50 }}
                                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                                className="space-y-10"
                            >
                                <div className="flex justify-center">
                                    <button
                                        onClick={() => {
                                            setStep('category');
                                            setSelectedCategory(null);
                                            setHoveredProfileId(null);
                                        }}
                                        className="flex items-center gap-3 text-white/60 hover:text-white transition-all font-black px-6 py-2 rounded-full glass-sandblasted border-white/20 hover:scale-105 active:scale-95 text-xs"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        RE-FILTRAR NEGÓCIO
                                    </button>
                                </div>

                                <ProfileShowcase
                                    profiles={currentCategoryProfiles}
                                    onSelect={handleProfileSelect}
                                    onActiveProfileChange={setHoveredProfileId}
                                />
                            </motion.div>
                        )}


                        {/* Step 3: Signup Form */}
                        {step === 'signup' && (
                            <motion.div
                                key="signup-form"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.8 }}
                                className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto"
                            >
                                {/* Profile Background Image */}
                                <div
                                    className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
                                    style={{
                                        backgroundImage: currentProfile?.imageUrl
                                            ? `url(${currentProfile.imageUrl})`
                                            : 'url(https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=1920)'
                                    }}
                                />

                                {/* Dark Overlay for Legibility */}
                                <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70" />

                                {/* Animated Accent Glow */}
                                <motion.div
                                    className="absolute inset-0 opacity-20"
                                    style={{
                                        background: `radial-gradient(circle at 50% 50%, ${currentProfile.theme.variants.vibrant.primary}40 0%, transparent 70%)`
                                    }}
                                    animate={{
                                        scale: [1, 1.1, 1],
                                        opacity: [0.15, 0.25, 0.15],
                                    }}
                                    transition={{
                                        duration: 8,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                />

                                {/* Signup Form - Glassmorphic */}
                                <motion.div
                                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                    className="relative z-10 w-full max-w-lg my-4"
                                >
                                    <div className="glass-window glass-window-compact border-beam-active !p-6 md:!p-8"
                                        style={{ '--beam-color': currentProfile.theme.variants.vibrant.primary } as any}
                                    >
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-6">
                                                <button
                                                    onClick={() => setStep('profile')}
                                                    className="flex items-center gap-2 text-white/50 hover:text-white transition-all font-black text-[10px] tracking-widest uppercase hover:scale-105 active:scale-95 bg-white/5 px-3 py-1.5 rounded-full border border-white/10"
                                                >
                                                    <ArrowLeft className="w-3.5 h-3.5" />
                                                    Trocar Ecosistema
                                                </button>
                                                <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                                                    Licença V2.0
                                                </div>
                                            </div>

                                            <div className="mb-6 p-4 rounded-[1.5rem] border border-white/10 flex items-center gap-4 bg-white/5 backdrop-blur-md shadow-inner">
                                                <div
                                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-2xl relative overflow-hidden backdrop-blur-md border border-white/20"
                                                    style={{ backgroundColor: `${currentProfile.theme.variants.vibrant.primary}aa` }}
                                                >
                                                    <Icon className="w-6 h-6 relative z-10" />
                                                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Status: Preparando</p>
                                                    <p className="text-xl font-black text-white tracking-tight leading-none">{currentProfile.label}</p>
                                                </div>
                                            </div>

                                            <div className="mb-6">
                                                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter drop-shadow-lg">Ativar sua Licença</h2>
                                                <p className="text-white/60 font-bold uppercase text-[9px] tracking-widest mt-1">Acesso Ilimitado • 15 Dias Trial Master</p>
                                            </div>

                                            <form onSubmit={handleSignup} className="space-y-4">
                                                {error && (
                                                    <motion.div
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        className="p-4 rounded-xl bg-red-500/10 border border-red-400/30 text-white text-[11px] font-black flex items-center gap-3 shadow-sm backdrop-blur-md"
                                                    >
                                                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                                                        {error}
                                                    </motion.div>
                                                )}

                                                <div className="space-y-2">
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-black text-white/60 uppercase ml-4 tracking-[3px]">Identidade Corporativa</label>
                                                        <Input
                                                            value={formData.companyName}
                                                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                                            placeholder="NOME DA SUA MARCA"
                                                            className="h-12 rounded-xl bg-black/20 border-white/10 text-white placeholder:text-white/30 focus:bg-black/40 focus:border-white/30 backdrop-blur-md transition-all font-bold text-sm px-4"
                                                            required
                                                        />
                                                    </div>

                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-black text-white/60 uppercase ml-4 tracking-[3px]">E-mail de Acesso</label>
                                                        <Input
                                                            type="email"
                                                            value={formData.email}
                                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                            placeholder="CORPORATIVO@EXEMPLO.COM"
                                                            className="h-12 rounded-xl bg-black/20 border-white/10 text-white placeholder:text-white/30 focus:bg-black/40 focus:border-white/30 backdrop-blur-md transition-all font-bold text-sm px-4"
                                                            required
                                                        />
                                                    </div>

                                                    <div className="grid lg:grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-black text-white/60 uppercase ml-4 tracking-[3px]">Segurança</label>
                                                            <div className="relative">
                                                                <Input
                                                                    type={showPassword ? 'text' : 'password'}
                                                                    value={formData.password}
                                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                                    placeholder="SENHA MESTRA"
                                                                    className="h-12 rounded-xl bg-black/20 border-white/10 text-white placeholder:text-white/30 focus:bg-black/40 focus:border-white/30 backdrop-blur-md transition-all font-bold text-sm px-4"
                                                                    required
                                                                    minLength={8}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowPassword(!showPassword)}
                                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                                                                >
                                                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-black text-white/60 uppercase ml-4 tracking-[3px]">Verificação</label>
                                                            <Input
                                                                type="password"
                                                                value={formData.confirmPassword}
                                                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                                placeholder="RE-DIGITE"
                                                                className="h-12 rounded-xl bg-black/20 border-white/10 text-white placeholder:text-white/30 focus:bg-black/40 focus:border-white/30 backdrop-blur-md transition-all font-bold text-sm px-4"
                                                                required
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="py-2 space-y-2">
                                                    <label className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer transition-all group backdrop-blur-md hover:bg-white/10">
                                                        <Checkbox
                                                            id="sample-data"
                                                            checked={loadSampleData}
                                                            onCheckedChange={(checked) => setLoadSampleData(checked as boolean)}
                                                            className="w-5 h-5 rounded-md border-white/30 data-[state=checked]:bg-white data-[state=checked]:border-white data-[state=checked]:text-neutral-900"
                                                        />
                                                        <div className="space-y-0.5">
                                                            <span className="text-sm font-black text-white leading-none">Injetar Dados de Amostra</span>
                                                            <p className="text-[9px] text-white/50 font-black uppercase tracking-[1px]">Ecossistema pronto para operação</p>
                                                        </div>
                                                    </label>

                                                    <label className="flex items-start gap-4 px-4 cursor-pointer group">
                                                        <Checkbox
                                                            id="terms"
                                                            checked={agreedToTerms}
                                                            onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                                                            required
                                                            className="mt-1 border-white/40 data-[state=checked]:bg-white data-[state=checked]:border-white data-[state=checked]:text-neutral-900"
                                                        />
                                                        <span className="text-xs text-white/70 font-bold group-hover:text-white transition-colors leading-relaxed">
                                                            Declaro ter lido e aceito INTEGRALMENTE os <span className="underline font-black text-white">Termos de Uso</span> e Políticas de Segurança de Dados da ACR.
                                                        </span>
                                                    </label>
                                                </div>

                                                <Button
                                                    type="submit"
                                                    className="w-full h-14 text-lg font-black rounded-xl shadow-2xl transition-all active:scale-95 disabled:opacity-70 group overflow-hidden relative"
                                                    disabled={loading}
                                                    style={{
                                                        backgroundColor: currentProfile.theme.variants.vibrant.primary,
                                                        boxShadow: `0 20px 40px -10px ${currentProfile.theme.variants.vibrant.primary}60`
                                                    }}
                                                >
                                                    <div className="relative z-10 flex items-center justify-center gap-3">
                                                        {loading ? (
                                                            <>
                                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                                PROVISIONANDO...
                                                            </>
                                                        ) : (
                                                            <>
                                                                ATIVAR ECOSSISTEMA
                                                                <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                                                            </>
                                                        )}
                                                    </div>
                                                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                                </Button>
                                            </form>
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Badges - Removed as per user request */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    className="mt-8 flex items-center justify-center gap-6 text-white/30 font-bold text-[10px] uppercase tracking-[0.2em]"
                >
                    <span>ACR Commerce Suite © 2025</span>
                </motion.div>
            </div>
        </div >
    );
}
