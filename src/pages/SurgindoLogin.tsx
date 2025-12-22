import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessProfile } from '@/contexts/BusinessProfileContext';
import { businessProfiles } from '@/config/business-profiles';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Eye, EyeOff, Loader2, Check, Sparkles,
    ArrowRight, ArrowLeft, Lock, Mail, Zap, Shield
} from 'lucide-react';

export default function SurgindoLogin() {
    const navigate = useNavigate();
    const location = useLocation();
    const { signIn, signInWithSocial } = useAuth();
    const { profiles, setProfile, activeProfile } = useBusinessProfile();

    // Get pre-filled data from navigation state or localStorage (fallback)
    const preFilledEmail = location.state?.email || localStorage.getItem('acr_last_signup_email') || '';
    const successMessage = location.state?.message || '';
    const initialVariant = location.state?.variant || (localStorage.getItem('active_business_variant') as any) || 'vibrant';

    // Auto-select profile if it was passed or stored
    const storedProfileId = location.state?.profileId || localStorage.getItem('acr_last_selected_profile');

    // Step control - Skip profile selection if coming from onboarding or if profile is already active
    const [step, setStep] = useState<'profile' | 'auth'>(
        (location.state?.step === 'auth' || activeProfile || storedProfileId) ? 'auth' : 'profile'
    );

    // Profile selection state
    const [hoveredProfile, setHoveredProfile] = useState<string | null>(activeProfile?.id || storedProfileId || null);
    const [selectedProfile, setSelectedProfile] = useState<string | null>(activeProfile?.id || storedProfileId || null);

    // Auth state
    const [email, setEmail] = useState(preFilledEmail);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [variant, setVariantState] = useState<'vibrant' | 'clean' | 'dark'>(initialVariant);

    // Get current background color based on hover or selection
    const currentProfile = profiles.find(
        p => p.id === (hoveredProfile || selectedProfile)
    );

    const backgroundColor = currentProfile?.theme.variants[variant].secondary || '#f8fafc';
    const accentColor = currentProfile?.theme.variants[variant].primary || '#6366F1';

    // Handle profile selection
    const handleProfileSelect = (profileId: string) => {
        setSelectedProfile(profileId);
        setProfile(profileId);

        // Smooth transition to auth step
        setTimeout(() => {
            setStep('auth');
        }, 600);
    };

    // Handle skip (for returning users with saved profile)
    const handleSkipToAuth = () => {
        if (activeProfile) {
            setSelectedProfile(activeProfile.id);
            setStep('auth');
        }
    };

    // Handle authentication
    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let normalizedEmail = email.trim();
            if (!normalizedEmail.includes('@')) {
                normalizedEmail = `${normalizedEmail}@acr.com`;
            }
            normalizedEmail = normalizedEmail.toLowerCase();

            const { error } = await signIn(normalizedEmail, password);

            if (error) {
                setError('Email ou senha incorretos. Tente novamente.');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError('Ocorreu um erro inesperado.');
        } finally {
            setLoading(false);
        }
    };

    // Social Auth Handlers
    const handleSocialAuth = async (provider: 'google' | 'apple' | 'azure') => {
        setLoading(true);
        setError('');
        try {
            const { error } = await signInWithSocial(provider);
            if (error) setError(`Erro ao entrar com ${provider}: ${error.message}`);
        } catch (err) {
            setError('Ocorreu um erro inesperado.');
        } finally {
            setLoading(false);
        }
    };

    const handleMagicLink = async () => {
        if (!email.includes('@')) {
            setError('Digite um e-mail válido para receber o link.');
            return;
        }
        setLoading(true);
        setError('');

        // Simulating magic link for demonstration as requested in the task
        // In a real scenario, this would call supabase.auth.signInWithOtp
        setTimeout(() => {
            setError('Link mágico enviado para seu e-mail (simulado)!');
            setLoading(false);
        }, 1500);
    };

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 transition-all duration-700 ease-in-out relative overflow-hidden"
            style={{ backgroundColor }}
        >
            {/* Animated background gradient blobs */}
            <motion.div
                className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] opacity-30"
                style={{ backgroundColor: accentColor }}
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.4, 0.3],
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            <motion.div
                className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-20"
                style={{ backgroundColor: accentColor }}
                animate={{
                    scale: [1.2, 1, 1.2],
                    opacity: [0.2, 0.3, 0.2],
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            <div className="max-w-7xl w-full z-10">
                <AnimatePresence mode="wait">
                    {step === 'profile' ? (
                        <motion.div
                            key="profile-step"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="flex h-screen w-screen fixed inset-0"
                        >
                            {/* LEFT SIDE - Dynamic Branding */}
                            <motion.div
                                className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative overflow-hidden"
                                style={{
                                    backgroundColor: currentProfile?.theme.variants.vibrant.primary || '#6366F1',
                                    transition: 'background-color 0.7s ease'
                                }}
                            >
                                {/* Animated background blobs */}
                                <motion.div
                                    className="absolute top-[-20%] right-[-20%] w-[600px] h-[600px] rounded-full blur-[150px] opacity-30"
                                    style={{ backgroundColor: currentProfile?.theme.accent || '#10B981' }}
                                    animate={{
                                        scale: [1, 1.3, 1],
                                        opacity: [0.3, 0.5, 0.3],
                                    }}
                                    transition={{
                                        duration: 10,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                />

                                <motion.div
                                    className="absolute bottom-[-20%] left-[-20%] w-[700px] h-[700px] rounded-full blur-[150px] opacity-20"
                                    style={{ backgroundColor: currentProfile?.theme.variants.vibrant.primary || '#10B981' }}
                                    animate={{
                                        scale: [1.3, 1, 1.3],
                                        opacity: [0.2, 0.4, 0.2],
                                    }}
                                    transition={{
                                        duration: 12,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                />

                                {/* Content */}
                                <div className="relative z-10 max-w-xl text-white">
                                    {/* Logo/Brand */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="mb-12"
                                    >
                                        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-black/20 backdrop-blur-md border border-white/30 shadow-2xl">
                                            <Sparkles className="w-6 h-6" />
                                            <span className="text-xl font-bold">ACR Commerce Suite</span>
                                        </div>
                                    </motion.div>

                                    {/* Dynamic Phrase */}
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={currentProfile?.id || 'default'}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.5 }}
                                        >
                                            <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
                                                {currentProfile ? (
                                                    <>
                                                        Sistema feito para
                                                        <br />
                                                        <span className="text-white/90 underline decoration-white/40 decoration-4 underline-offset-8">
                                                            {currentProfile.label}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        Escolha seu
                                                        <br />
                                                        <span className="text-white/90">Perfil de Negócio</span>
                                                    </>
                                                )}
                                            </h1>

                                            <p className="text-xl text-white/80 leading-relaxed mb-8">
                                                {currentProfile?.description || 'O sistema se adaptará automaticamente às necessidades do seu negócio.'}
                                            </p>

                                            {/* Profile Features Preview */}
                                            {currentProfile && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 0.3 }}
                                                    className="space-y-3"
                                                >
                                                    <div className="flex items-center gap-3 text-white/90">
                                                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                                            <Check className="w-5 h-5" />
                                                        </div>
                                                        <span className="font-medium">Módulos otimizados para seu setor</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-white/90">
                                                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                                            <Check className="w-5 h-5" />
                                                        </div>
                                                        <span className="font-medium">Interface adaptada automaticamente</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-white/90">
                                                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                                            <Check className="w-5 h-5" />
                                                        </div>
                                                        <span className="font-medium">Pronto para usar em segundos</span>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    </AnimatePresence>

                                    {/* Decorative Element */}
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.6 }}
                                        className="mt-16 flex items-center gap-4"
                                    >
                                        <div className="h-1 w-20 bg-white/40 rounded-full" />
                                        <span className="text-sm text-white/60 uppercase tracking-wider font-semibold">
                                            Sistema Inteligente
                                        </span>
                                    </motion.div>
                                </div>
                            </motion.div>

                            {/* RIGHT SIDE - Profile Selector */}
                            <div className="w-full lg:w-1/2 flex flex-col bg-neutral-50 overflow-y-auto">
                                {/* Header */}
                                <div className="p-8 md:p-12">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 }}
                                    >
                                        <h2 className="text-3xl md:text-4xl font-black text-neutral-900 mb-3">
                                            Qual é o seu negócio?
                                        </h2>
                                        <p className="text-neutral-600 text-lg">
                                            Selecione o perfil que melhor representa sua empresa
                                        </p>
                                    </motion.div>
                                </div>

                                {/* Profile Grid */}
                                <div className="flex-1 px-8 md:px-12 pb-12">
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                        className="grid grid-cols-2 md:grid-cols-3 gap-4"
                                    >
                                        {profiles.map((profile, index) => {
                                            const Icon = profile.icon;
                                            const isHovered = hoveredProfile === profile.id;
                                            const isSelected = selectedProfile === profile.id;

                                            return (
                                                <motion.button
                                                    key={profile.id}
                                                    onClick={() => handleProfileSelect(profile.id)}
                                                    onMouseEnter={() => setHoveredProfile(profile.id)}
                                                    onMouseLeave={() => setHoveredProfile(null)}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.3 + index * 0.02 }}
                                                    whileHover={{ scale: 1.03, y: -2 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    className={cn(
                                                        "relative group flex flex-col items-center p-6 rounded-2xl border transition-all duration-300 text-center glass-sandblasted",
                                                        isSelected
                                                            ? "ring-2 ring-offset-2 ring-white/20 shadow-2xl"
                                                            : "hover:shadow-xl border-white/10"
                                                    )}
                                                    style={{
                                                        backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
                                                    }}
                                                >
                                                    {/* Selection checkmark */}
                                                    <AnimatePresence>
                                                        {isSelected && (
                                                            <motion.div
                                                                initial={{ scale: 0, opacity: 0 }}
                                                                animate={{ scale: 1, opacity: 1 }}
                                                                exit={{ scale: 0, opacity: 0 }}
                                                                className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg z-10"
                                                            >
                                                                <Check className="w-5 h-5" />
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>

                                                    {/* Icon */}
                                                    <motion.div
                                                        className={cn(
                                                            "w-16 h-16 rounded-xl flex items-center justify-center mb-4 transition-all duration-300",
                                                            isHovered || isSelected ? "text-white shadow-lg" : "text-neutral-400 bg-neutral-100"
                                                        )}
                                                        style={{
                                                            backgroundColor: isHovered || isSelected ? profile.theme.variants.vibrant.primary : undefined,
                                                        }}
                                                        animate={isHovered ? { rotate: [0, -5, 5, 0] } : {}}
                                                        transition={{ duration: 0.5 }}
                                                    >
                                                        <Icon className="w-8 h-8" />
                                                    </motion.div>

                                                    {/* Label */}
                                                    <h3 className="font-bold text-neutral-900 text-sm mb-1 leading-tight">
                                                        {profile.label}
                                                    </h3>

                                                    {/* Description (shows on hover) */}
                                                    <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                        {profile.description}
                                                    </p>
                                                </motion.button>
                                            );
                                        })}
                                    </motion.div>

                                    {/* Skip button for returning users */}
                                    {activeProfile && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.8 }}
                                            className="text-center mt-8"
                                        >
                                            <Button
                                                variant="ghost"
                                                onClick={handleSkipToAuth}
                                                className="text-neutral-600 hover:text-neutral-900"
                                            >
                                                <ArrowRight className="w-4 h-4 mr-2" />
                                                Continuar com perfil atual ({activeProfile.label})
                                            </Button>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="auth-step"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.8 }}
                            className="fixed inset-0 flex items-center justify-center p-4"
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
                                    background: `radial-gradient(circle at 50% 50%, ${accentColor}40 0%, transparent 70%)`
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

                            {/* Auth Card - Glassmorphic */}
                            <motion.div
                                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                className="relative z-10 w-full max-w-md"
                            >
                                <div className="glass-window">
                                    {/* Accent bar */}
                                    <div
                                        className="h-2 w-full"
                                        style={{ backgroundColor: accentColor }}
                                    />

                                    <div className="p-8 md:p-10">
                                        {/* Back button */}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setStep('profile')}
                                            className="mb-6 -ml-2 text-white/80 hover:text-white hover:bg-white/10"
                                        >
                                            <ArrowLeft className="w-4 h-4 mr-2" />
                                            Voltar
                                        </Button>

                                        {/* Header */}
                                        <div className="text-center mb-8">
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: "spring", delay: 0.2 }}
                                                className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg backdrop-blur-md border border-white/30"
                                                style={{ backgroundColor: `${accentColor}dd` }}
                                            >
                                                <Lock className="w-9 h-9 text-white" />
                                            </motion.div>

                                            <h2 className="text-3xl font-black text-white mb-2 drop-shadow-lg">
                                                Bem-vindo!
                                            </h2>
                                            <p className="text-white/80 font-medium">
                                                Autentique-se para acessar o sistema
                                            </p>

                                            {/* Selected profile badge */}
                                            {currentProfile && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-black/20 backdrop-blur-md border border-white/30"
                                                >
                                                    {currentProfile.icon && <currentProfile.icon className="w-4 h-4 text-white" />}
                                                    <span className="text-sm font-black text-white uppercase tracking-wide">
                                                        {currentProfile.label}
                                                    </span>
                                                </motion.div>
                                            )}
                                        </div>

                                        {/* Auth Form */}
                                        <form onSubmit={handleAuth} className="space-y-5">
                                            {error && (
                                                <Alert variant="destructive" className="bg-red-500/20 border-red-400/50 text-white backdrop-blur-md">
                                                    <AlertDescription className="font-medium">{error}</AlertDescription>
                                                </Alert>
                                            )}

                                            <div className="space-y-2">
                                                <Label htmlFor="email" className="text-white/90 font-bold text-sm">
                                                    Email ou Usuário
                                                </Label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-3.5 h-4 w-4 text-white/60" />
                                                    <Input
                                                        id="email"
                                                        type="text"
                                                        placeholder="Ex: ACRERP ou nome@empresa.com"
                                                        className="pl-10 h-12 bg-black/20 border-white/30 text-white placeholder:text-white/40 focus:border-white/50 backdrop-blur-md"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        required
                                                        autoFocus
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="password" className="text-white/90 font-bold text-sm">
                                                        Senha de Acesso
                                                    </Label>
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate('/recovery')}
                                                        className="text-xs hover:underline text-white/70 hover:text-white font-medium"
                                                    >
                                                        Esqueceu a senha?
                                                    </button>
                                                </div>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-3.5 h-4 w-4 text-white/60" />
                                                    <Input
                                                        id="password"
                                                        type="password"
                                                        placeholder="••••••••"
                                                        className="pl-10 h-12 bg-black/20 border-white/30 text-white placeholder:text-white/40 focus:border-white/50 backdrop-blur-md"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <Button
                                                type="submit"
                                                className="w-full h-12 text-sm font-black uppercase tracking-wider shadow-2xl hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
                                                style={{
                                                    backgroundColor: accentColor,
                                                    color: 'white'
                                                }}
                                                disabled={loading}
                                            >
                                                <span className="relative z-10 flex items-center justify-center gap-2">
                                                    {loading ? (
                                                        <>
                                                            <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                            Autenticando...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Zap className="w-4 h-4" />
                                                            Acessar Sistema
                                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                        </>
                                                    )}
                                                </span>
                                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                            </Button>

                                            {/* Alternative Access Methods */}
                                            <div className="relative py-4">
                                                <div className="absolute inset-0 flex items-center px-2">
                                                    <div className="w-full border-t border-white/10" />
                                                </div>
                                                <div className="relative flex justify-center text-xs uppercase">
                                                    <span className="bg-black/20 backdrop-blur-md px-4 py-1 rounded-full text-white/40 font-bold border border-white/5">
                                                        Outros meios de acesso
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSocialAuth('google')}
                                                    className="flex items-center justify-center p-3 rounded-2xl bg-black/20 border border-white/10 hover:bg-black/40 hover:border-white/30 transition-all group"
                                                    title="Entrar com Google"
                                                >
                                                    <svg className="w-5 h-5 opacity-70 group-hover:opacity-100" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                                    </svg>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleSocialAuth('apple')}
                                                    className="flex items-center justify-center p-3 rounded-2xl bg-black/20 border border-white/10 hover:bg-black/40 hover:border-white/30 transition-all group"
                                                    title="Entrar com Apple"
                                                >
                                                    <svg className="w-5 h-5 text-white opacity-70 group-hover:opacity-100" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C4.1 16.5 3.3 11.5 5.5 8.5c1.1-1.48 2.62-2.3 4.1-2.3 1.5 0 2.5 1 3.45 1 .95 0 2.25-1.15 3.75-1.02 1.5.15 2.65.75 3.35 1.7-3.05 1.8-2.55 6.05.5 7.4-.7 1.85-1.65 3.65-3.55 5.1zM12.03 5.95c-.15-2.1 1.6-3.85 3.5-3.95.2 2.2-2.2 4.15-3.5 3.95z" />
                                                    </svg>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleSocialAuth('azure')}
                                                    className="flex items-center justify-center p-3 rounded-2xl bg-black/20 border border-white/10 hover:bg-black/40 hover:border-white/30 transition-all group"
                                                    title="Entrar com Microsoft"
                                                >
                                                    <svg className="w-5 h-5 opacity-70 group-hover:opacity-100" viewBox="0 0 23 23">
                                                        <path fill="#f3f3f3" d="M0 0h11v11H0z" />
                                                        <path fill="#f3f3f3" d="M12 0h11v11H12z" />
                                                        <path fill="#f3f3f3" d="M0 12h11v11H0z" />
                                                        <path fill="#f3f3f3" d="M12 12h11v11H12z" />
                                                    </svg>
                                                </button>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={handleMagicLink}
                                                className="w-full mt-4 p-3 rounded-2xl bg-black/20 border border-white/10 hover:bg-black/40 hover:border-white/30 transition-all flex items-center justify-center gap-2 text-xs font-bold text-white/70 hover:text-white"
                                            >
                                                <Mail className="w-4 h-4" />
                                                RECEBER LINK MÁGICO POR E-MAIL
                                            </button>
                                        </form>

                                        {/* Footer */}
                                        <div className="mt-8 pt-6 border-t border-white/20">
                                            <p className="text-xs text-white/60 flex items-center justify-center gap-2 font-medium">
                                                <Shield className="w-3 h-3" />
                                                Ambiente Protegido • ACR Commerce Suite
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
