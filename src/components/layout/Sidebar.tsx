import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Users,
    DollarSign,
    Calculator,
    Truck,
    Settings,
    Store,
    Wrench,
    Utensils,
    Calendar as CalendarIcon,
    Target,
    BarChart3,
    Sparkles,
    Menu,
    ChevronLeft,
    LogOut,
    Plus,
    ShoppingBag,
    ChefHat,
    Car,
    GraduationCap,
    ShieldCheck,
    Briefcase
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessProfile } from "@/contexts/BusinessProfileContext";
import { LucideIcon } from "lucide-react";
import { useUISettings, SidebarTheme } from "@/contexts/UISettingsContext";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { OrganizationSwitcher } from "./OrganizationSwitcher";

interface SidebarItem {
    id: string;
    label: string;
    icon: LucideIcon;
    path: string;
    badge?: string;
    badgeVariant?: "new" | "popular" | "hot";
    moduleId?: string; // Corresponds to Profile.modules
}

interface SidebarCategory {
    id: string;
    label: string;
    items: SidebarItem[];
}

// Menu reorganizado por categorias
const sidebarCategories: SidebarCategory[] = [
    {
        id: "vendas",
        label: "VENDAS & OPERAÇÕES",
        items: [
            { id: "pdv", label: "PDV", icon: Store, path: "/pdv", moduleId: 'pdv' },
            { id: "vendas", label: "Vendas", icon: ShoppingCart, path: "/vendas", moduleId: 'sales' },
            { id: "compras", label: "Compras", icon: ShoppingBag, path: "/compras", moduleId: 'purchases' },
            { id: "mesas", label: "Mesas/Comandas", icon: Utensils, path: "/mesas", moduleId: 'kitchen' },
            { id: "kds", label: "Cozinha (KDS)", icon: ChefHat, path: "/kds", moduleId: 'kitchen' },
            { id: "estoque", label: "Estoque", icon: Package, path: "/estoque", moduleId: 'inventory' },
            { id: "delivery", label: "Delivery", icon: Truck, path: "/delivery", moduleId: 'delivery' },
            { id: "frota", label: "Frota / Veículos", icon: Car, path: "/frota", moduleId: 'fleet' },
            { id: "producao", label: "Produção", icon: ChefHat, path: "/production", moduleId: 'production' }
        ]
    },
    {
        id: "servicos",
        label: "SERVIÇOS",
        items: [
            { id: "os", label: "Ordem de Serviço", icon: Wrench, path: "/os", moduleId: 'service_orders' },
            { id: "agenda", label: "Agenda", icon: CalendarIcon, path: "/agenda", moduleId: 'scheduling' },
            { id: "projetos", label: "Projetos", icon: Briefcase, path: "/projects", moduleId: 'projects' },
            { id: "produtos", label: "Produtos", icon: Package, path: "/produtos", moduleId: 'inventory' }
        ]
    },
    {
        id: "relacionamento",
        label: "RELACIONAMENTO",
        items: [
            { id: "clientes", label: "Clientes", icon: Users, path: "/clientes", moduleId: 'clients' },
            { id: "crm", label: "CRM", icon: Target, path: "/crm", moduleId: 'crm' },
            { id: "marketing", label: "Marketing", icon: Sparkles, path: "/marketing", moduleId: 'marketing' },
            { id: "academico", label: "Acadêmico", icon: GraduationCap, path: "/academic", moduleId: 'academic' },
            { id: "equipe", label: "Time/Profissionais", icon: Users, path: "/team", moduleId: 'team' }
        ]
    },
    {
        id: "financeiro",
        label: "FINANCEIRO",
        items: [
            { id: "financeiro", label: "Financeiro", icon: DollarSign, path: "/financeiro", moduleId: 'finance' },
            { id: "relatorios", label: "Relatórios", icon: BarChart3, path: "/relatorios", moduleId: 'reports' },
            { id: "fiscal", label: "Fiscal", icon: Calculator, path: "/fiscal", moduleId: 'fiscal' },
            { id: "compliance", label: "Compliance", icon: ShieldCheck, path: "/compliance", moduleId: 'compliance' }
        ]
    }
];

type ThemeConfig = {
    bgClass: string;
    borderClass: string;
    textClass: string;
    activeBgClass: string;
    activeTextClass: string;
    hoverBgClass: string;
    hoverTextClass: string;
    logoBgClass: string;
};

const THEME_STYLES: Record<SidebarTheme, ThemeConfig> = {
    navy: {
        bgClass: "bg-[#0f172a]",
        borderClass: "border-[#1e293b]",
        textClass: "text-slate-400",
        activeBgClass: "bg-[#1e293b]",
        activeTextClass: "text-white",
        hoverBgClass: "hover:bg-[#1e293b]/50",
        hoverTextClass: "hover:text-white",
        logoBgClass: "bg-[#020617]/50"
    },
    dark: { // Same as Navy
        bgClass: "bg-[#0f172a]",
        borderClass: "border-[#1e293b]",
        textClass: "text-slate-400",
        activeBgClass: "bg-[#1e293b]",
        activeTextClass: "text-white",
        hoverBgClass: "hover:bg-[#1e293b]/50",
        hoverTextClass: "hover:text-white",
        logoBgClass: "bg-[#020617]/50"
    },
    light: {
        bgClass: "bg-white",
        borderClass: "border-slate-200",
        textClass: "text-slate-500",
        activeBgClass: "bg-slate-100",
        activeTextClass: "text-slate-900",
        hoverBgClass: "hover:bg-slate-50",
        hoverTextClass: "hover:text-slate-900",
        logoBgClass: "bg-slate-50/50"
    },
    onyx: {
        bgClass: "bg-[#000000]",
        borderClass: "border-[#111111]",
        textClass: "text-zinc-500",
        activeBgClass: "bg-[#111111]",
        activeTextClass: "text-white",
        hoverBgClass: "hover:bg-[#111111]",
        hoverTextClass: "hover:text-white",
        logoBgClass: "bg-[#000000]"
    },
    glass: {
        bgClass: "bg-neutral-900/60 backdrop-blur-xl border-white/10",
        borderClass: "border-white/10",
        textClass: "text-white/70",
        activeBgClass: "bg-white/10 ring-1 ring-white/20",
        activeTextClass: "text-white",
        hoverBgClass: "hover:bg-white/5",
        hoverTextClass: "hover:text-white",
        logoBgClass: "bg-transparent"
    },
    'glass-vibrant': {
        bgClass: "glass-vibrant",
        borderClass: "border-white/20",
        textClass: "text-white/80",
        activeBgClass: "bg-white/30 backdrop-blur-md shadow-lg",
        activeTextClass: "text-white font-bold",
        hoverBgClass: "hover:bg-white/20",
        hoverTextClass: "hover:text-white",
        logoBgClass: "bg-white/10"
    },
    'abstract-dark': {
        bgClass: "bg-[#09090b]",
        borderClass: "border-orange-500/20",
        textClass: "text-zinc-500",
        activeBgClass: "bg-orange-500/10 border-r-2 border-orange-500",
        activeTextClass: "text-orange-500",
        hoverBgClass: "hover:bg-orange-500/5",
        hoverTextClass: "hover:text-orange-400",
        logoBgClass: "bg-transparent"
    },
    'minimal-border': {
        bgClass: "bg-white sidebar-minimal-border",
        borderClass: "border-slate-200",
        textClass: "text-slate-500",
        activeBgClass: "bg-slate-50 border-r-4 border-slate-900",
        activeTextClass: "text-slate-900 font-bold",
        hoverBgClass: "hover:bg-slate-50/50",
        hoverTextClass: "hover:text-slate-800",
        logoBgClass: "bg-transparent"
    },
    minimal: {
        bgClass: "bg-white/50 backdrop-blur-sm",
        borderClass: "border-transparent",
        textClass: "text-slate-600",
        activeBgClass: "bg-neutral-100",
        activeTextClass: "text-black font-bold",
        hoverBgClass: "hover:bg-neutral-50",
        hoverTextClass: "hover:text-black",
        logoBgClass: "bg-transparent"
    },
    brutalist: {
        bgClass: "bg-white",
        borderClass: "border-black border-r-2",
        textClass: "text-black font-mono uppercase tracking-tight font-bold",
        activeBgClass: "bg-yellow-400 border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]",
        activeTextClass: "text-black",
        hoverBgClass: "hover:bg-neutral-100 border-2 border-transparent hover:border-black",
        hoverTextClass: "hover:text-black hover:shadow-[2px_2px_0px_rgba(0,0,0,1)]",
        logoBgClass: "bg-black text-white"
    },
    // NEW THEMES
    cyberpunk: {
        bgClass: "bg-[#000033]", // Deep Navy
        borderClass: "border-[#39ff14]/20",
        textClass: "text-[#39ff14]/70", // Dim Neon
        activeBgClass: "bg-[#39ff14]/10 border-r-2 border-[#39ff14]",
        activeTextClass: "text-[#39ff14] font-bold shadow-[0_0_10px_#39ff14]",
        hoverBgClass: "hover:bg-[#39ff14]/5",
        hoverTextClass: "hover:text-[#39ff14]",
        logoBgClass: "bg-[#000022]"
    },
    forest: {
        bgClass: "bg-[#052e16]", // Dark Green
        borderClass: "border-[#064e3b]",
        textClass: "text-[#a3b899]", // Sage
        activeBgClass: "bg-[#064e3b]",
        activeTextClass: "text-[#eab308]", // Gold
        hoverBgClass: "hover:bg-[#064e3b]/50",
        hoverTextClass: "hover:text-[#eab308]",
        logoBgClass: "bg-[#022c22]"
    },
    ocean: {
        bgClass: "bg-gradient-to-b from-blue-950 to-indigo-950",
        borderClass: "border-blue-800/30",
        textClass: "text-blue-200/70",
        activeBgClass: "bg-white/10",
        activeTextClass: "text-white",
        hoverBgClass: "hover:bg-white/5",
        hoverTextClass: "hover:text-white",
        logoBgClass: "bg-blue-950/50"
    },
    corporate: {
        bgClass: "bg-slate-200",
        borderClass: "border-slate-300",
        textClass: "text-slate-600",
        activeBgClass: "bg-white border border-slate-300 shadow-sm",
        activeTextClass: "text-slate-900 font-semibold",
        hoverBgClass: "hover:bg-white/50",
        hoverTextClass: "hover:text-slate-900",
        logoBgClass: "bg-slate-300"
    }
};

export function Sidebar() {
    const location = useLocation();
    const { profile, signOut } = useAuth();
    const { activeProfile, extraModules } = useBusinessProfile();
    const { sidebarCollapsed, setSidebarCollapsed, sidebarTheme, logoUrl } = useUISettings();
    const { hasPermission } = useRolePermissions();
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

    // Filtragem dinâmica: Permissão do Usuário (Cargo) + Pacote da Empresa (Perfil + Extras)
    const filteredCategories = sidebarCategories.map(cat => ({
        ...cat,
        items: cat.items.filter(item => {
            // 1. Verifica se o usuário tem permissão para acessar (RBAC)
            const userHasPermission = hasPermission(item.moduleId);

            // 2. Verifica se a empresa tem o módulo contratado (Perfil Ativo ou Módulo Extra)
            // Se não houver moduleId definido, assume que é livre (ex: Dashboard)
            const companyHasModule = !item.moduleId ||
                activeProfile?.modules?.includes(item.moduleId) ||
                extraModules?.includes(item.moduleId);

            return userHasPermission && companyHasModule;
        })
    })).filter(cat => cat.items.length > 0);


    // Determine values based on theme
    const isDarkTheme = ['navy', 'dark', 'onyx', 'glass', 'glass-vibrant', 'abstract-dark', 'cyberpunk', 'forest', 'ocean'].includes(sidebarTheme);
    const isOnyx = sidebarTheme === 'onyx';

    // Get style config
    const themeStyle = THEME_STYLES[sidebarTheme] || THEME_STYLES.navy;
    const { bgClass, borderClass, textClass, activeBgClass, activeTextClass, hoverBgClass, hoverTextClass, logoBgClass } = themeStyle;


    const isActive = (path: string) => {
        return location.pathname === path || location.pathname.startsWith(path + "/");
    };

    const getBadgeStyles = (variant?: "new" | "popular" | "hot") => {
        switch (variant) {
            case "new": return isOnyx ? "bg-[#22c55e] text-black font-bold" : "bg-primary text-primary-foreground";
            case "popular": return "bg-orange-500 text-white";
            case "hot": return "bg-red-500 text-white";
            default: return isDarkTheme ? "bg-neutral-800 text-neutral-400" : "bg-slate-100 text-slate-500";
        }
    };

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 h-screen z-50 flex flex-col transition-all duration-300 ease-in-out border-r",
                bgClass, borderClass,
                sidebarCollapsed ? "w-20" : "w-72"
            )}
        >
            {/* Logo Section - Estilo ACR Asas Neon */}
            <div className={`h-20 flex items-center px-6 border-b ${borderClass} ${logoBgClass} relative overflow-hidden backdrop-blur-md`}>
                {/* Background Glow Effect */}
                <div className="absolute -left-10 top-0 w-32 h-full bg-primary/5 blur-[40px] rounded-full pointer-events-none"></div>

                <div className="flex items-center gap-3 overflow-hidden relative z-10 w-full">
                    <div className="relative flex-shrink-0 w-10 h-10 flex items-center justify-center group/logo">
                        {/* Neon Aura */}
                        <div className="absolute inset-0 bg-brand/30 blur-xl rounded-full animate-pulse group-hover/logo:bg-brand/50 transition-all duration-500"></div>
                        <img
                            key={logoUrl || 'acr-wings-logo'}
                            src={logoUrl || "/logo-wings.png"}
                            alt="Logo Wings"
                            className="w-10 h-10 object-contain relative z-10 drop-shadow-[0_0_8px_rgba(var(--primary),0.5)] transition-transform duration-500 group-hover/logo:scale-110"
                            onError={(e) => {
                                e.currentTarget.src = "/logo.png";
                            }}
                        />
                    </div>

                    <div className={cn(
                        "flex flex-col transition-all duration-500 transform",
                        sidebarCollapsed ? "opacity-0 -translate-x-10 w-0" : "opacity-100 translate-x-0 min-w-[150px]"
                    )}>
                        <h1 className={cn("font-extrabold tracking-tighter leading-none text-xl", isDarkTheme ? "text-white" : "text-slate-900")}>
                            ACR <span className="text-brand italic">STORE</span>
                        </h1>
                        <p className="text-[10px] font-bold text-brand/70 tracking-[0.2em] mt-1 uppercase">Sistemas Elite</p>
                    </div>
                </div>
            </div>

            {/* Collapse Toggle - Absolute */}
            <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className={`absolute -right-3 top-[3.25rem] w-6 h-6 rounded-full flex items-center justify-center transition-all shadow-lg z-50 ${bgClass} border ${borderClass} ${textClass} hover:text-white hover:bg-primary hover:border-primary`}
            >
                <ChevronLeft className={cn("w-3 h-3 transition-transform", sidebarCollapsed && "rotate-180")} />
            </button>

            {/* Quick Actions / Dashboard */}
            <div className="p-4 space-y-1">
                {/* Organization Switcher */}
                {!sidebarCollapsed && (
                    <div className="mb-4">
                        <OrganizationSwitcher />
                    </div>
                )}

                <Link to="/dashboard">
                    <div className={cn(
                        "group flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer mb-1",
                        isActive("/dashboard")
                            ? "bg-brand text-brand-foreground shadow-[0_0_20px_-5px_hsl(var(--brand-primary)/0.5)]"
                            : `${textClass} ${hoverBgClass} ${hoverTextClass}`
                    )}>
                        <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
                        {!sidebarCollapsed && <span className="font-medium text-sm">Dashboard</span>}
                    </div>
                </Link>

                {!sidebarCollapsed && (
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        {activeProfile?.modules?.includes('pdv') && (
                            <Link to="/pdv">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={`w-full border transition-all text-xs h-8 ${bgClass} ${borderClass} ${textClass} hover:bg-primary hover:text-white hover:border-primary`}
                                >
                                    <Store className="w-3 h-3 mr-2" />
                                    Abrir PDV
                                </Button>
                            </Link>
                        )}
                        {activeProfile?.modules?.includes('clients') && (
                            <Link to="/clientes/novo">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={`w-full border transition-all text-xs h-8 ${bgClass} ${borderClass} ${textClass} hover:bg-primary hover:text-white hover:border-primary`}
                                >
                                    <Users className="w-3 h-3 mr-2" />
                                    Novo Cliente
                                </Button>
                            </Link>
                        )}
                    </div>
                )}
            </div>

            {/* Scrollable Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 pb-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {filteredCategories.map((category) => (
                    <div key={category.id} className="space-y-1">
                        {!sidebarCollapsed && (
                            <h3 className={`px-3 text-[10px] font-bold uppercase tracking-widest mb-2 font-mono ${sidebarTheme === 'cyberpunk' ? 'text-[#39ff14]/40' : 'text-slate-500'}`}>
                                {category.label}
                            </h3>
                        )}

                        {category.items.map((item) => {
                            const active = isActive(item.path);
                            return (
                                <div key={item.id} className="relative group/item">
                                    <Link to={item.path}>
                                        <div className={cn(
                                            "group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 relative",
                                            active
                                                ? `${activeBgClass} ${activeTextClass}`
                                                : `${textClass} ${hoverBgClass} ${hoverTextClass}`
                                        )}>
                                            {/* Active Indicator Line */}
                                            {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-brand rounded-r-full shadow-[0_0_10px_hsl(var(--brand-primary))]"></div>}

                                            <item.icon className={cn(
                                                "w-5 h-5 flex-shrink-0 transition-colors",
                                                active ? "text-brand" : `${sidebarTheme === 'cyberpunk' ? 'text-[#39ff14]/50' : 'text-slate-500'} group-hover:text-brand`
                                            )} />

                                            {!sidebarCollapsed && (
                                                <>
                                                    <span className="flex-1 text-sm font-medium truncate">{item.label}</span>
                                                    {item.badge && (
                                                        <Badge className={cn("ml-auto text-[10px] h-5 px-1.5 border-none", getBadgeStyles(item.badgeVariant))}>
                                                            {item.badge}
                                                        </Badge>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </Link>

                                    {/* Quick Shortcut for New Client */}
                                    {item.id === "clientes" && !sidebarCollapsed && (
                                        <Link
                                            to="/clientes/novo"
                                            className={cn(
                                                "absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md transition-all opacity-0 group-hover/item:opacity-100",
                                                active ? "bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20" : "hover:bg-neutral-100 hover:text-green-600 dark:hover:bg-neutral-800"
                                            )}
                                            title="Adicionar Novo Cliente"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Plus className="w-4 h-4" />
                                        </Link>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* Footer / Settings */}
            <div className={`p-4 border-t ${borderClass} ${logoBgClass}`}>
                <Link to="/configuracoes">
                    <div className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer",
                        isActive("/configuracoes") ? `${activeBgClass} ${activeTextClass}` : `${textClass} ${hoverBgClass} ${hoverTextClass}`
                    )}>
                        <Settings className="w-5 h-5 flex-shrink-0" />
                        {!sidebarCollapsed && <span className="text-sm font-medium">Configurações</span>}
                    </div>
                </Link>

                {!sidebarCollapsed && (
                    <div className={`mt-4 pt-4 border-t ${borderClass} flex items-center gap-3`}>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-emerald-400 flex items-center justify-center text-white font-bold shadow-lg">
                            {profile?.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={cn("text-sm font-medium truncate", isOnyx || sidebarTheme === 'cyberpunk' ? "text-white" : textClass)}>{profile?.name || "Usuário"}</p>
                            <p className="text-xs text-slate-500 truncate capitalize">{profile?.role || "Operador"}</p>
                        </div>
                        <button
                            onClick={signOut}
                            className="text-slate-500 hover:text-red-400 transition-colors"
                            title="Sair"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}

export default Sidebar;
