
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getConfig, upsertConfig } from '@/lib/config-service';
import { useUISettings, PageBackground } from "@/contexts/UISettingsContext";
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    Palette,
    Layout,
    Monitor,
    Type,
    Save,
    Loader2,
    ImagePlus,
    Check,
    Zap,
    Sparkles,
    Users,
    TrendingUp,
    Moon,
    Sun,
    Upload,
    Cloud,
    Shield,
    Coffee,
    GripVertical,
    Eye,
    BellRing,
    Music,
    Volume2,
    Speaker,
    Plus
} from "lucide-react";
import { extractDominantColor, extractPalette } from '@/lib/color-utils';
import { resizeImage } from '@/lib/utils';
import { getBrandTraits, BrandTraits } from '@/lib/ai/branding-service';
import { useBusinessProfile } from '@/contexts/BusinessProfileContext';

export function AppearanceConfig() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const {
        setSidebarTheme, sidebarTheme,
        setPrimaryColor, primaryColor,
        pageBackground, setPageBackground,
        customBackgroundUrl, setCustomBackgroundUrl,
        fontFamily, setFontFamily,
        loginStyle, loginBillboard, setLoginPreferences,
        setLogoUrl: setGlobalLogoUrl,
        setThemeTokens
    } = useUISettings();
    const [darkMode, setDarkMode] = useState(false);
    const [selectedColor, setSelectedColor] = useState(primaryColor || 'blue');
    const [selectedBackground, setSelectedBackground] = useState<PageBackground>(pageBackground || 'standard');
    const [selectedFont, setSelectedFont] = useState(fontFamily || 'inter');
    const [logoUrl, setLogoUrl] = useState('');
    const [extractedPalette, setExtractedPalette] = useState<string[]>([]);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [aiThemes, setAiThemes] = useState<any[]>([]);
    const [isExtractingColor, setIsExtractingColor] = useState(false);
    const [isUploadingBg, setIsUploadingBg] = useState(false);
    const [previewMode, setPreviewMode] = useState<'dashboard' | 'login'>('dashboard');
    const { activeProfile } = useBusinessProfile();
    const [brandTraits, setBrandTraits] = useState<BrandTraits | null>(null);
    const [aiThinkingSteps, setAiThinkingSteps] = useState<string[]>([]);

    // Fetch Config
    const { data: appearanceConfig, isLoading } = useQuery({
        queryKey: ['config', 'appearance'],
        queryFn: () => getConfig('appearance')
    });

    // Sync State
    useEffect(() => {
        if (appearanceConfig) {
            setDarkMode(appearanceConfig.dark_mode || false);
            if (appearanceConfig.primary_color) {
                setSelectedColor(appearanceConfig.primary_color);
            }
            if (appearanceConfig.page_background) {
                setSelectedBackground(appearanceConfig.page_background);
                setPageBackground(appearanceConfig.page_background);
            }
            if (appearanceConfig.font_family) {
                setSelectedFont(appearanceConfig.font_family);
                setFontFamily(appearanceConfig.font_family);
            }
            if (appearanceConfig.logo_url) {
                setLogoUrl(appearanceConfig.logo_url);
                setGlobalLogoUrl(appearanceConfig.logo_url);
            }
            if (appearanceConfig.login_style || appearanceConfig.login_billboard) {
                setLoginPreferences(appearanceConfig.login_style || 'glass', appearanceConfig.login_billboard || '');
            }
        }
    }, [appearanceConfig]);

    // Debug: Log when palette changes
    useEffect(() => {
        console.log('🔄 extractedPalette state changed:', extractedPalette);
    }, [extractedPalette]);

    // Save Mutation
    const updateAppearanceMutation = useMutation({
        mutationFn: (data: any) => upsertConfig('appearance', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['config', 'appearance'] });
            toast({ title: 'Sucesso!', description: 'Aparência atualizada.' });
        },
        onError: () => {
            toast({ title: 'Erro!', description: 'Falha ao salvar.', variant: 'destructive' });
        }
    });

    const handleSaveAppearance = () => {
        const data = {
            dark_mode: darkMode,
            primary_color: selectedColor,
            sidebar_theme: sidebarTheme,
            logo_url: logoUrl,
            login_style: loginStyle,
            login_billboard: loginBillboard,
            page_background: selectedBackground,
            custom_background_url: customBackgroundUrl,
            font_family: selectedFont
        };

        updateAppearanceMutation.mutate(data);
    };

    const handleExtractColor = async () => {
        if (!logoUrl) return;
        setIsExtractingColor(true);
        try {
            const palette = await extractPalette(logoUrl, 8);
            if (palette && palette.length > 0) {
                setExtractedPalette(palette);
                setSelectedColor(palette[0]);
                setPrimaryColor(palette[0] as any);
                toast({ title: 'Paleta Extraída!', description: `Identificamos ${palette.length} cores principais no seu logo. Gerando temas IA...` });
                handleGenerateAIThemes(palette);
            }
        } catch (error) {
            console.error('Extraction error:', error);
            toast({ title: 'Erro na Extração', description: 'Não foi possível extrair a paleta.', variant: 'destructive' });
        } finally {
            setIsExtractingColor(false);
        }
    };

    const applyTechPreset = () => {
        setDarkMode(true);
        setSelectedColor('#39ff14'); // Neon Green
        setPrimaryColor('#39ff14');
        setSidebarTheme('cyberpunk');
        setPageBackground('midnight');
        setSelectedBackground('midnight');
        setSelectedFont('mono');
        setFontFamily('mono');
        setLoginPreferences('modern', '');
        toast({ title: 'Preset Aplicado!', description: 'Modo Tech Moderno ativado.' });
    };

    const applyLuxuryPreset = () => {
        setDarkMode(true);
        setSelectedColor('#eab308'); // Gold
        setPrimaryColor('#eab308');
        setSidebarTheme('glass-vibrant');
        setPageBackground('aura-dark');
        setSelectedBackground('aura-dark');
        setSelectedFont('lexend');
        setFontFamily('lexend');
        setLoginPreferences('glass-v2', '');
        toast({ title: 'Cyber Luxury', description: 'O ápice da elegância e modernidade.' });
    };

    const applyNordicPreset = () => {
        setDarkMode(false);
        setSelectedColor('#64748b'); // Slate
        setPrimaryColor('#64748b');
        setSidebarTheme('minimal-border');
        setPageBackground('noise-texture');
        setSelectedBackground('noise-texture');
        setSelectedFont('outfit');
        setFontFamily('outfit');
        setLoginPreferences('minimal', '');
        toast({ title: 'Nordic Clean', description: 'Minimalismo escandinavo funcional.' });
    };

    const applyOceanPreset = () => {
        setDarkMode(true);
        setSelectedColor('#06b6d4'); // Cyan
        setPrimaryColor('#06b6d4');
        setSidebarTheme('ocean');
        setPageBackground('mesh-gradient');
        setSelectedBackground('mesh-gradient');
        setSelectedFont('poppins');
        setFontFamily('poppins');
        setLoginPreferences('dynamic-mesh', '');
        toast({ title: 'Deep Ocean', description: 'Imersão total em tons oceânicos.' });
    };

    const handleGenerateAIThemes = async (palette: string[]) => {
        if (!palette || palette.length < 3) return;
        setIsGeneratingAI(true);
        setAiThinkingSteps(["Analisando logo...", "Extraindo paleta emocional...", "Definindo arquétipo de marca...", "Calculando contrastes de acessibilidade..."]);

        try {
            // Wait for "AI thinking" animation effect
            await new Promise(resolve => setTimeout(resolve, 2000));

            const traits = getBrandTraits(palette, activeProfile?.systemCategory || 'corporate');
            setBrandTraits(traits);

            const primary = palette[0];
            const secondary = palette[1] || palette[0];
            const accent = palette[2] || palette[0];
            const dark = palette[4] || '#0f172a';
            const light = palette[5] || '#f8fafc';

            const themes = [
                {
                    name: 'Corporativo Clean',
                    mode: 'light',
                    style: 'clean',
                    description: 'Profissional, limpo e focado em clareza.',
                    icon: Monitor,
                    tokens: {
                        darkMode: false,
                        primaryColor: primary,
                        secondaryColor: secondary,
                        accentColor: accent,
                        cardBackground: '#ffffff',
                        textColor: '#1a1a1a',
                        borderRadius: 'sm',
                        borderStyle: 'soft',
                        shadowStyle: 'light',
                        sidebarTheme: 'light',
                        pageBackground: 'standard',
                        fontFamily: 'inter',
                        titleWeight: '700',
                        textWeight: '400'
                    }
                },
                {
                    name: 'Executivo Premium',
                    mode: 'dark',
                    style: 'executive',
                    description: 'Autoridade e sofisticação em alto contraste.',
                    icon: Shield,
                    tokens: {
                        darkMode: true,
                        primaryColor: primary,
                        secondaryColor: secondary,
                        accentColor: accent,
                        cardBackground: '#111827',
                        textColor: '#f9fafb',
                        borderRadius: 'md',
                        borderStyle: 'marked',
                        shadowStyle: 'medium',
                        sidebarTheme: 'onyx',
                        pageBackground: 'midnight',
                        fontFamily: 'montserrat',
                        titleWeight: '800',
                        textWeight: '400'
                    }
                },
                {
                    name: 'Tech Moderno',
                    mode: 'dark',
                    style: 'tech',
                    description: 'Visual SaaS futurista com gradientes.',
                    icon: Zap,
                    tokens: {
                        darkMode: true,
                        primaryColor: accent,
                        secondaryColor: primary,
                        accentColor: secondary,
                        cardBackground: '#020617',
                        textColor: '#e5e7eb',
                        borderRadius: 'lg',
                        borderStyle: 'none',
                        shadowStyle: 'heavy',
                        sidebarTheme: 'cyberpunk',
                        pageBackground: 'mesh-gradient',
                        fontFamily: 'outfit',
                        titleWeight: '700',
                        textWeight: '300'
                    }
                }
            ];

            setAiThemes(themes);
        } catch (error) {
            console.error('Error generating AI themes:', error);
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const applyAITheme = (theme: any) => {
        setThemeTokens(theme.tokens);
        setDarkMode(theme.tokens.darkMode);
        setSelectedColor(theme.tokens.primaryColor);
        setPrimaryColor(theme.tokens.primaryColor);
        setSelectedBackground(theme.tokens.pageBackground);
        setPageBackground(theme.tokens.pageBackground);
        setSelectedFont(theme.tokens.fontFamily);
        setFontFamily(theme.tokens.fontFamily);
        setSidebarTheme(theme.tokens.sidebarTheme);
        toast({
            title: `Tema ${theme.name} Aplicado`,
            description: 'Sua interface foi totalmente reconfigurada via IA.',
            variant: 'default'
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const resizedBase64 = await resizeImage(file, 200);
                setLogoUrl(resizedBase64);
                setGlobalLogoUrl(resizedBase64);

                // Extract palette after resizing
                const palette = await extractPalette(resizedBase64, 10);
                if (palette && palette.length > 0) {
                    setExtractedPalette(palette);
                    setSelectedColor(palette[0]);
                    setPrimaryColor(palette[0]);
                    toast({ title: 'Logo Atualizada', description: `Cores extraídas: ${palette.length}. Gerando temas IA...` });

                    // Trigger AI generation
                    handleGenerateAIThemes(palette);
                }
            } catch (error) {
                console.error('❌ Error in handleFileUpload:', error);
                toast({ title: 'Erro', description: 'Falha ao processar imagem.', variant: 'destructive' });
            }
        }
    };

    const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploadingBg(true);
            try {
                // Backgrounds can be larger, up to 1200px (still manageable in base64/localStorage (~200kb))
                // Better would be a blob storage, but sticking to the current pattern
                const resizedBase64 = await resizeImage(file, 1200);
                setCustomBackgroundUrl(resizedBase64);
                setSelectedBackground('custom');
                setPageBackground('custom');
                toast({ title: 'Fundo Atualizado', description: 'Seu plano de fundo personalizado foi aplicado.' });
            } catch (error) {
                console.error('❌ Error in background upload:', error);
                toast({ title: 'Erro', description: 'Falha ao processar imagem de fundo.', variant: 'destructive' });
            } finally {
                setIsUploadingBg(false);
            }
        }
    };

    const applyPreset = (preset: 'corporate' | 'ebony' | 'paper') => {
        if (preset === 'corporate') {
            setDarkMode(false);
            setSelectedColor('#2563eb');
            setPrimaryColor('#2563eb');
            setSidebarTheme('corporate');
            setPageBackground('tech');
            setSelectedBackground('tech');
            setSelectedFont('inter');
            setFontFamily('inter');
            setLoginPreferences('corporate', '');
            toast({ title: 'Preset Corporate', description: 'Profissional e limpo.' });
        } else if (preset === 'ebony') {
            setDarkMode(true);
            setSelectedColor('#ea580c'); // Deep Orange/Gold
            setPrimaryColor('#ea580c');
            setSidebarTheme('abstract-dark');
            setPageBackground('midnight');
            setSelectedBackground('midnight');
            setSelectedFont('montserrat');
            setFontFamily('montserrat');
            setLoginPreferences('glass', '');
            toast({ title: 'Preset Executive Black', description: 'Poder e sofisticação.' });
        } else if (preset === 'paper') {
            setDarkMode(false);
            setSelectedColor('#059669'); // Emerald
            setPrimaryColor('#059669');
            setSidebarTheme('minimal');
            setPageBackground('paper');
            setSelectedBackground('paper');
            setSelectedFont('outfit');
            setFontFamily('outfit');
            setLoginPreferences('minimal', '');
            toast({ title: 'Preset Eco Clean', description: 'Leveza e sustentabilidade.' });
        }
    };

    if (isLoading) {
        return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;
    }

    const categories = [
        { id: 'identity', label: 'Identidade', icon: Palette, description: 'Logo e cores' },
        { id: 'themes', label: 'Temas IA', icon: Sparkles, description: 'Branding inteligente' },
        { id: 'style', label: 'Estilo UI', icon: Monitor, description: 'Layout e bordas' },
        { id: 'typography', label: 'Tipografia', icon: Type, description: 'Fontes do sistema' },
        { id: 'login', label: 'Login', icon: Layout, description: 'Portal de entrada' },
    ];

    return (
        <div className="flex flex-col gap-6 animate-fade-in-up">
            {/* Header / Save Bar */}
            <div className="flex items-center justify-between bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-500">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">Personalização Avançada</h2>
                        <p className="text-xs text-neutral-500">Configure a identidade visual e experiência do sistema</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => setPreviewMode(previewMode === 'dashboard' ? 'login' : 'dashboard')}
                        className="rounded-xl border border-neutral-200 dark:border-neutral-800"
                    >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver {previewMode === 'dashboard' ? 'Login' : 'Dashboard'}
                    </Button>
                    <Button onClick={handleSaveAppearance} className="btn-primary hover-lift px-8" size="lg" disabled={updateAppearanceMutation.isPending}>
                        {updateAppearanceMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Sincronizar Alterações
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="identity" className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

                {/* Sidebar Column (Left) - Span 2 */}
                <div className="xl:col-span-2 space-y-4">
                    <TabsList className="flex flex-col h-auto bg-transparent border-none p-0 gap-2">
                        {categories.map((cat) => (
                            <TabsTrigger
                                key={cat.id}
                                value={cat.id}
                                className="w-full justify-start gap-3 px-4 py-3.5 rounded-2xl border border-transparent data-[state=active]:border-primary-500/30 data-[state=active]:bg-primary-500/5 data-[state=active]:text-primary-600 transition-all hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left"
                            >
                                <cat.icon className="w-5 h-5 flex-shrink-0" />
                                <div className="flex flex-col items-start overflow-hidden">
                                    <span className="font-bold text-sm leading-tight">{cat.label}</span>
                                    <span className="text-[10px] opacity-60 font-normal truncate w-full">{cat.description}</span>
                                </div>
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-2">Preservar marca</h4>
                        <div className="flex items-center gap-2 mb-3">
                            {logoUrl && <img src={logoUrl} className="w-8 h-8 rounded object-contain" />}
                            <span className="text-xs font-medium truncate">{extractedPalette.length > 0 ? 'Paleta Ativa' : 'Sem logo'}</span>
                        </div>
                        <Button variant="outline" size="sm" className="w-full text-[10px] h-8 rounded-lg" onClick={handleExtractColor}>
                            Recalcular Cores
                        </Button>
                    </div>
                </div>

                {/* Form Column (Center) - Span 4 */}
                <div className="xl:col-span-5 flex flex-col gap-6">
                    {/* Identity Tab Content */}
                    <TabsContent value="identity" className="m-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="card-premium">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Palette className="w-5 h-5 text-blue-500" /> Logo & Cores
                            </h3>
                            <div className="space-y-6">
                                {brandTraits && (
                                    <div className="p-4 rounded-2xl bg-primary-500/5 border border-primary-500/20 mb-4 animate-in zoom-in-95">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Sparkles className="w-4 h-4 text-primary-500 animate-pulse" />
                                            <span className="text-[10px] font-bold uppercase text-primary-600 tracking-widest">Análise de IA: {brandTraits.archetype}</span>
                                        </div>
                                        <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 italic">"{brandTraits.feeling}"</p>
                                    </div>
                                )}
                                <div className="space-y-3">
                                    <Label className="text-xs font-bold uppercase text-neutral-500">Upload da Logomarca</Label>
                                    <div className="flex gap-4 items-center">
                                        <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 flex items-center justify-center p-2 bg-neutral-50 dark:bg-neutral-900 overflow-hidden relative group">
                                            {logoUrl ? (
                                                <img src={logoUrl} className="max-w-full max-h-full object-contain" />
                                            ) : (
                                                <ImagePlus className="w-8 h-8 text-neutral-300" />
                                            )}
                                            <input type="file" id="logo-input" className="hidden" onChange={handleFileUpload} />
                                            <Label htmlFor="logo-input" className="absolute inset-0 cursor-pointer opacity-0 group-hover:opacity-100 bg-black/40 flex items-center justify-center text-white text-[10px] transition-all">Alterar</Label>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <Label className="text-xs">Ou URL Direta</Label>
                                            <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." className="h-9 rounded-xl" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-xs font-bold uppercase text-neutral-500">Cores Ativas</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {extractedPalette.slice(0, 8).map((color, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => { setSelectedColor(color); setPrimaryColor(color); }}
                                                className={`w-10 h-10 rounded-xl shadow-sm border-2 transition-all hover:scale-110 ${selectedColor === color ? 'border-primary-500 ring-4 ring-primary-500/20' : 'border-white dark:border-neutral-800'}`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                        <div className="relative w-10 h-10 rounded-xl border-2 border-dashed border-neutral-300 flex items-center justify-center overflow-hidden">
                                            <input type="color" value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                            <Plus className="w-4 h-4 text-neutral-400" />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                                    <Label className="font-bold">Modo Escuro (Dark)</Label>
                                    <div className="flex p-1 bg-white dark:bg-black rounded-full border border-neutral-200 dark:border-neutral-800">
                                        <button onClick={() => setDarkMode(false)} className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${!darkMode ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-500'}`}>Claro</button>
                                        <button onClick={() => setDarkMode(true)} className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${darkMode ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}>Escuro</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Themes Tab Content */}
                    <TabsContent value="themes" className="m-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="card-premium min-h-[400px] flex flex-col">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-amber-500" /> Temas Gerados por IA
                            </h3>

                            {isGeneratingAI ? (
                                <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6 text-center">
                                    <div className="relative">
                                        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 flex items-center justify-center text-amber-500 animate-pulse">
                                            <Sparkles className="w-10 h-10" />
                                        </div>
                                        <div className="absolute inset-0 w-20 h-20 rounded-3xl border-2 border-amber-500/30 animate-ping" />
                                    </div>
                                    <div className="space-y-4 max-w-xs">
                                        <h4 className="font-bold text-neutral-900 dark:text-neutral-100 italic">O arquiteto de marca está criando...</h4>
                                        <div className="space-y-2">
                                            {aiThinkingSteps.map((step, idx) => (
                                                <div key={idx} className="flex items-center gap-2 text-[10px] font-medium text-neutral-400 animate-in slide-in-from-left-4 fade-in" style={{ animationDelay: `${idx * 0.5}s` }}>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500/40" />
                                                    {step}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {aiThemes.length > 0 ? aiThemes.map((theme, index) => (
                                        <button
                                            key={index}
                                            onClick={() => applyAITheme(theme)}
                                            className="group relative flex items-center gap-4 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 transition-all hover:border-primary-500 hover:bg-primary-500/5 text-left"
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-white dark:bg-black p-2 shadow-sm flex items-center justify-center text-primary-500 group-hover:scale-110 transition-transform">
                                                <theme.icon className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-sm truncate">{theme.name}</h4>
                                                    <Badge className="text-[8px] h-4 bg-amber-500/10 text-amber-600 border-none">Sugerido</Badge>
                                                </div>
                                                <p className="text-[10px] text-neutral-500 line-clamp-1">{theme.description}</p>
                                            </div>
                                            <div className="flex -space-x-2">
                                                <div className="w-6 h-6 rounded-full border-2 border-white dark:border-neutral-800 shadow-sm" style={{ backgroundColor: theme.tokens.primaryColor }} />
                                                <div className="w-6 h-6 rounded-full border-2 border-white dark:border-neutral-800 shadow-sm" style={{ backgroundColor: theme.tokens.secondaryColor }} />
                                                <div className="w-5 h-5 rounded-full border-2 border-white dark:border-neutral-800 mt-0.5 shadow-sm" style={{ backgroundColor: theme.tokens.accentColor }} />
                                            </div>
                                        </button>
                                    )) : (
                                        <div className="text-center py-12 border-2 border-dashed border-neutral-100 dark:border-neutral-800 rounded-3xl flex-1 flex flex-col justify-center">
                                            <Cloud className="w-12 h-12 text-neutral-200 dark:text-neutral-800 mx-auto mb-4" />
                                            <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-1">Inicie o Branding Inteligente</h4>
                                            <p className="text-xs text-neutral-400">Faça upload de uma logo na aba Identidade<br />para gerar temas únicos.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Style Tab Content */}
                    <TabsContent value="style" className="m-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="card-premium">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Monitor className="w-5 h-5 text-purple-500" /> Interface & Layout
                            </h3>
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-xs font-bold uppercase text-neutral-500">Fundo do Sistema (3 Variações)</Label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { id: 'standard', label: 'Standard', bg: 'bg-white', desc: 'Limpo' },
                                            { id: 'tech', label: 'Tech Grid', bg: 'bg-slate-50 border-indigo-100', desc: 'Moderno' },
                                            { id: 'midnight', label: 'Midnight', bg: 'bg-neutral-950', desc: 'Foco' },
                                        ].map(bg => (
                                            <button
                                                key={bg.id}
                                                onClick={() => { setSelectedBackground(bg.id as any); setPageBackground(bg.id as any); }}
                                                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${selectedBackground === bg.id ? 'border-primary-500 bg-primary-500/5' : 'border-neutral-100 dark:border-neutral-800 hover:border-neutral-200'}`}
                                            >
                                                <div className={`w-full h-12 rounded-xl border ${bg.bg}`} />
                                                <div className="text-center">
                                                    <div className="text-[10px] font-bold leading-none">{bg.label}</div>
                                                    <div className="text-[8px] text-neutral-400 mt-1">{bg.desc}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-xs font-bold uppercase text-neutral-500">Barra Lateral</Label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {[
                                            { id: 'navy', label: 'Navy Professional' },
                                            { id: 'light', label: 'Clean Light' },
                                            { id: 'glass-vibrant', label: 'Glassmorphism' }
                                        ].map(theme => (
                                            <button
                                                key={theme.id}
                                                onClick={() => setSidebarTheme(theme.id as any)}
                                                className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all text-left flex items-center justify-between ${sidebarTheme === theme.id ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-neutral-200 dark:border-neutral-800'}`}
                                            >
                                                {theme.label}
                                                {sidebarTheme === theme.id && <Check className="w-4 h-4" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Typography Tab */}
                    <TabsContent value="typography" className="m-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="card-premium">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Type className="w-5 h-5 text-orange-500" /> Tipografia do Sistema
                            </h3>
                            <div className="grid grid-cols-1 gap-2">
                                {[
                                    { id: 'inter', name: 'Inter', desc: 'Nativa UI' },
                                    { id: 'outfit', name: 'Outfit', desc: 'Premium' },
                                    { id: 'lexend', name: 'Lexend', desc: 'Leitura' },
                                    { id: 'mono', name: 'JetBrains', desc: 'Tech' },
                                ].map(font => (
                                    <button
                                        key={font.id}
                                        onClick={() => { setSelectedFont(font.id as any); setFontFamily(font.id as any); }}
                                        className={`px-4 py-3 rounded-2xl border flex items-center gap-3 transition-all ${selectedFont === font.id ? 'border-primary-500 bg-primary-50 text-primary-900 shadow-sm' : 'border-neutral-100 dark:border-neutral-800'}`}
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center font-bold">{font.name[0]}</div>
                                        <div className="flex-1 text-left">
                                            <div className="text-sm font-bold">{font.name}</div>
                                            <div className="text-[10px] text-neutral-400">{font.desc}</div>
                                        </div>
                                        {selectedFont === font.id && <Check className="w-4 h-4 text-primary-500" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Login Tab */}
                    <TabsContent value="login" className="m-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="card-premium">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Layout className="w-5 h-5 text-green-500" /> Portal de Login
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-neutral-500">Visual de Fundo (Unsplash)</Label>
                                    <Input value={loginBillboard || ''} onChange={(e) => setLoginPreferences(loginStyle, e.target.value)} placeholder="Cole o link da imagem..." className="rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-neutral-500">Estilo do Layout</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['glass', 'modern', 'minimal', 'dynamic-mesh'].map(style => (
                                            <button
                                                key={style}
                                                onClick={() => setLoginPreferences(style as any, loginBillboard || '')}
                                                className={`px-4 py-3 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all ${loginStyle === style ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm' : 'border-neutral-100 dark:border-neutral-800'}`}
                                            >
                                                {style.replace('-', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </div>

                {/* Preview Column (Right) - Span 5 */}
                <div className="xl:col-span-5 sticky top-6 space-y-4 order-1 xl:order-3">
                    <div className="flex items-center justify-between mb-2">
                        <Label className="text-xs font-bold uppercase text-neutral-400 tracking-widest flex items-center gap-2">
                            <Monitor className="w-3 h-3" /> Live Preview
                            {previewMode === 'dashboard' ? <span className="text-primary-500">• Dashboard</span> : <span className="text-emerald-500">• Login</span>}
                        </Label>
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.3)]" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                            <div className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.3)]" />
                        </div>
                    </div>

                    <div className={`relative overflow-hidden aspect-[16/11] rounded-[2.5rem] border-8 border-neutral-200 dark:border-neutral-800 shadow-2xl transition-all duration-700 ${darkMode ? 'bg-neutral-950' : 'bg-white'}`}>
                        {previewMode === 'dashboard' ? (
                            <div className="p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="flex items-center justify-between">
                                    {logoUrl ? (
                                        <img src={logoUrl} className="h-8 w-auto object-contain" alt="Logo" />
                                    ) : (
                                        <div className="h-8 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
                                    )}
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800" />
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-1/4 h-40 rounded-3xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800 p-4 space-y-3">
                                        <div className="h-4 w-full bg-primary-500/20 rounded-lg" />
                                        <div className="h-4 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
                                        <div className="h-4 w-1/2 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <div className="h-32 rounded-3xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800 p-6 flex items-end">
                                            <div className="h-10 w-full bg-primary-500 rounded-2xl shadow-lg shadow-primary-500/20" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="h-24 rounded-3xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800" />
                                            <div className="h-24 rounded-3xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full relative flex items-center justify-center p-12 overflow-hidden animate-in zoom-in-95 duration-500">
                                {loginBillboard && (
                                    <img src={loginBillboard} className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105" alt="Login BG" />
                                )}
                                <div className={`relative w-full max-w-sm p-8 rounded-3xl border shadow-2xl backdrop-blur-3xl transition-all ${loginStyle === 'glass' ? 'bg-white/40 dark:bg-black/40 border-white/30 truncate' : 'bg-white dark:bg-neutral-900 border-neutral-200'}`}>
                                    <div className="flex justify-center mb-8">
                                        {logoUrl ? <img src={logoUrl} className="h-10 w-auto object-contain" /> : <div className="h-10 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />}
                                    </div>
                                    <div className="space-y-4">
                                        <div className="h-10 rounded-2xl bg-neutral-100 dark:bg-neutral-800/50" />
                                        <div className="h-10 rounded-2xl bg-neutral-100 dark:bg-neutral-800/50" />
                                        <div className="h-10 rounded-2xl bg-primary-500 shadow-xl shadow-primary-500/20" />
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Status bar mock */}
                        <div className="absolute bottom-0 inset-x-0 h-4 bg-neutral-200/50 dark:bg-neutral-800/50 backdrop-blur flex items-center px-4 justify-between">
                            <div className="text-[6px] text-neutral-500 font-bold uppercase tracking-widest">System Engine v2.1</div>
                            <div className="flex gap-1 items-center">
                                <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                                <div className="text-[6px] text-neutral-500">CONECTADO</div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-3xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
                            <Monitor className="w-5 h-5" />
                        </div>
                        <p className="text-[10px] text-neutral-500 leading-relaxed font-normal">
                            As alterações visualizadas aqui podem variar levemente de acordo com a resolução da tela real. Pressione <b>Sincronizar</b> para aplicar as mudanças em toda a organização.
                        </p>
                    </div>
                </div>
            </Tabs>
        </div>
    );
}

