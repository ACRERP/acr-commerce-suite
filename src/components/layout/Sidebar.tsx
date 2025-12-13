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
    Target,
    BarChart3,
    Sparkles,
    Menu,
    ChevronLeft,
    LogOut,
    Plus
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { LucideIcon } from "lucide-react";
import { useUISettings } from "@/contexts/UISettingsContext";

interface SidebarItem {
    id: string;
    label: string;
    icon: LucideIcon;
    path: string;
    badge?: string;
    badgeVariant?: "new" | "popular" | "hot";
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
            { id: "pdv", label: "PDV", icon: Store, path: "/pdv" },
            { id: "vendas", label: "Vendas", icon: ShoppingCart, path: "/vendas" },
            { id: "estoque", label: "Estoque", icon: Package, path: "/estoque" },
            { id: "delivery", label: "Delivery", icon: Truck, path: "/delivery", badge: "Novo", badgeVariant: "new" }
        ]
    },
    {
        id: "servicos",
        label: "SERVIÇOS",
        items: [
            { id: "os", label: "Ordem de Serviço", icon: Wrench, path: "/os" },
            { id: "produtos", label: "Produtos", icon: Package, path: "/produtos" }
        ]
    },
    {
        id: "relacionamento",
        label: "RELACIONAMENTO",
        items: [
            { id: "clientes", label: "Clientes", icon: Users, path: "/clientes" },
            { id: "crm", label: "CRM", icon: Target, path: "/crm", badge: "Novo", badgeVariant: "new" }
        ]
    },
    {
        id: "financeiro",
        label: "FINANCEIRO",
        items: [
            { id: "financeiro", label: "Financeiro", icon: DollarSign, path: "/financeiro" },
            { id: "relatorios", label: "Relatórios", icon: BarChart3, path: "/relatorios" },
            { id: "fiscal", label: "Fiscal", icon: Calculator, path: "/fiscal" }
        ]
    }
];

export function Sidebar() {
    const location = useLocation();
    const { profile, signOut } = useAuth();
    const { sidebarCollapsed, setSidebarCollapsed, sidebarTheme } = useUISettings();
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

    // Determine values based on theme
    const isDarkTheme = sidebarTheme === 'navy' || sidebarTheme === 'dark' || sidebarTheme === 'onyx';
    const isOnyx = sidebarTheme === 'onyx';

    // Theme configs
    let bgClass, borderClass, textClass, activeBgClass, activeTextClass, hoverBgClass, hoverTextClass, logoBgClass;

    if (isOnyx) {
        bgClass = "bg-[#000000]"; // Pure Black (Onyx)
        borderClass = "border-[#111111]";
        textClass = "text-zinc-500";
        activeBgClass = "bg-[#111111]";
        activeTextClass = "text-white";
        hoverBgClass = "hover:bg-[#111111]";
        hoverTextClass = "hover:text-white";
        logoBgClass = "bg-[#000000]";
    } else if (isDarkTheme) { // Navy
        bgClass = "bg-[#0f172a]";
        borderClass = "border-[#1e293b]";
        textClass = "text-slate-400";
        activeBgClass = "bg-[#1e293b]";
        activeTextClass = "text-white";
        hoverBgClass = "hover:bg-[#1e293b]/50";
        hoverTextClass = "hover:text-white";
        logoBgClass = "bg-[#020617]/50";
    } else { // Light
        bgClass = "bg-white";
        borderClass = "border-slate-200";
        textClass = "text-slate-500";
        activeBgClass = "bg-slate-100";
        activeTextClass = "text-slate-900";
        hoverBgClass = "hover:bg-slate-50";
        hoverTextClass = "hover:text-slate-900";
        logoBgClass = "bg-slate-50/50";
    }

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
            {/* Logo Section */}
            <div className={`h-16 flex items-center px-6 border-b ${borderClass} ${logoBgClass} backdrop-blur-sm`}>
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="relative flex-shrink-0 w-8 h-8 flex items-center justify-center">
                        <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full animate-pulse"></div>
                        <img
                            src="/logo.png"
                            alt="Logo"
                            className="w-8 h-8 object-contain relative z-10"
                            onError={(e) => {
                                e.currentTarget.src = "";
                                e.currentTarget.parentElement!.innerHTML = '<div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-white">A</div>';
                            }}
                        />
                    </div>

                    <div className={cn(
                        "flex flex-col transition-opacity duration-300",
                        sidebarCollapsed ? "opacity-0 w-0" : "opacity-100 min-w-[150px]"
                    )}>
                        <h1 className={cn("font-bold tracking-tight leading-none text-lg", textClass)}>
                            ACR <span className="text-primary">ERP</span>
                        </h1>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">
                            Enterprise System
                        </p>
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
                <Link to="/overview">
                    <div className={cn(
                        "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer mb-2",
                        isActive("/overview")
                            ? "bg-primary text-primary-foreground shadow-[0_0_20px_-5px_hsl(var(--primary)/0.5)]"
                            : `${textClass} ${hoverBgClass} ${hoverTextClass}`
                    )}>
                        <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
                        {!sidebarCollapsed && <span className="font-medium text-sm">Dashboard</span>}
                    </div>
                </Link>

                {!sidebarCollapsed && (
                    <div className="grid grid-cols-2 gap-2 mb-2">
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
                    </div>
                )}
            </div>

            {/* Scrollable Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 pb-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {sidebarCategories.map((category) => (
                    <div key={category.id} className="space-y-1">
                        {!sidebarCollapsed && (
                            <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">
                                {category.label}
                            </h3>
                        )}

                        {category.items.map((item) => {
                            const active = isActive(item.path);
                            return (
                                <div key={item.id} className="relative group/item">
                                    <Link to={item.path}>
                                        <div className={cn(
                                            "group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative",
                                            active
                                                ? `${activeBgClass} ${activeTextClass}`
                                                : `${textClass} ${hoverBgClass} ${hoverTextClass}`
                                        )}>
                                            {/* Active Indicator Line */}
                                            {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full shadow-[0_0_10px_hsl(var(--primary))]"></div>}

                                            <item.icon className={cn(
                                                "w-5 h-5 flex-shrink-0 transition-colors",
                                                active ? "text-primary" : "text-slate-500 group-hover:text-primary"
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
                            <p className={cn("text-sm font-medium truncate", isOnyx ? "text-white" : textClass)}>{profile?.name || "Usuário"}</p>
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
