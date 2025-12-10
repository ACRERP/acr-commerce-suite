import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Users,
    DollarSign,
    FileText,
    Calculator,
    Truck,
    Settings,
    Store,
    TrendingUp,
    Wrench,
    Target,
    BarChart3,
    Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { LucideIcon } from "lucide-react";

interface SidebarItem {
    id: string;
    label: string;
    icon: LucideIcon;
    path: string;
    badge?: string;
    badgeVariant?: "new" | "popular" | "hot";
    color?: string;
}

interface SidebarCategory {
    id: string;
    label: string;
    icon: LucideIcon;
    color: string;
    items: SidebarItem[];
}

// Menu reorganizado por categorias EXCEPCIONAL
const sidebarCategories: SidebarCategory[] = [
    {
        id: "vendas",
        label: "VENDAS & OPERAÇÕES",
        icon: ShoppingCart,
        color: "from-purple-500 to-pink-500",
        items: [
            {
                id: "pdv",
                label: "PDV",
                icon: Store,
                path: "/pdv",
                color: "text-purple-600"
            },
            {
                id: "vendas",
                label: "Vendas",
                icon: ShoppingCart,
                path: "/vendas",
                color: "text-purple-600"
            },
            {
                id: "delivery",
                label: "Delivery",
                icon: Truck,
                path: "/delivery",
                badge: "Novo",
                badgeVariant: "new",
                color: "text-pink-600"
            }
        ]
    },
    {
        id: "servicos",
        label: "SERVIÇOS",
        icon: Wrench,
        color: "from-orange-500 to-yellow-500",
        items: [
            {
                id: "os",
                label: "Ordem de Serviço",
                icon: Wrench,
                path: "/os",
                color: "text-orange-600"
            },
            {
                id: "produtos",
                label: "Produtos",
                icon: Package,
                path: "/produtos",
                color: "text-yellow-600"
            }
        ]
    },
    {
        id: "relacionamento",
        label: "RELACIONAMENTO",
        icon: Users,
        color: "from-green-500 to-blue-500",
        items: [
            {
                id: "clientes",
                label: "Clientes",
                icon: Users,
                path: "/clientes",
                color: "text-green-600"
            },
            {
                id: "crm",
                label: "CRM",
                icon: Target,
                path: "/crm",
                badge: "Novo",
                badgeVariant: "new",
                color: "text-blue-600"
            }
        ]
    },
    {
        id: "financeiro",
        label: "FINANCEIRO",
        icon: DollarSign,
        color: "from-blue-500 to-indigo-500",
        items: [
            {
                id: "financeiro",
                label: "Financeiro",
                icon: DollarSign,
                path: "/financeiro",
                color: "text-blue-600"
            },
            {
                id: "relatorios",
                label: "Relatórios",
                icon: BarChart3,
                path: "/relatorios",
                color: "text-indigo-600"
            },
            {
                id: "fiscal",
                label: "Fiscal",
                icon: Calculator,
                path: "/fiscal",
                color: "text-blue-700"
            }
        ]
    }
];

export function Sidebar() {
    const location = useLocation();
    const { profile } = useAuth();

    const isActive = (path: string) => {
        return location.pathname === path || location.pathname.startsWith(path + "/");
    };

    const getBadgeStyles = (variant?: "new" | "popular" | "hot") => {
        switch (variant) {
            case "new":
                return "bg-gradient-to-r from-green-400 to-emerald-500 text-white animate-pulse";
            case "popular":
                return "bg-gradient-to-r from-orange-400 to-red-500 text-white";
            case "hot":
                return "bg-gradient-to-r from-yellow-400 to-orange-500 text-white";
            default:
                return "bg-primary/10 text-primary";
        }
    };

    return (
        <div className="w-64 bg-card border-r border-border h-screen fixed left-0 top-0 overflow-y-auto flex flex-col">
            {/* Logo Section - PREMIUM */}
            <div className="p-4 border-b border-border bg-gradient-to-br from-primary/5 to-primary/10">
                <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-2.5 shadow-lg hover:scale-105 transition-transform">
                        <Store className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-foreground bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                            ACR Commerce
                        </h1>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                            Sistema ERP
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Actions - PREMIUM */}
            <div className="p-2 border-b border-border bg-muted/30">
                <div className="grid grid-cols-2 gap-1">
                    <Link to="/pdv">
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-9 text-xs gap-1 hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 hover:text-white hover:border-transparent transition-all duration-300 hover:scale-105 hover:shadow-lg"
                        >
                            <Store className="h-3.5 w-3.5" />
                            PDV
                        </Button>
                    </Link>
                    <Link to="/clientes/novo">
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-9 text-xs gap-1 hover:bg-gradient-to-r hover:from-green-500 hover:to-blue-500 hover:text-white hover:border-transparent transition-all duration-300 hover:scale-105 hover:shadow-lg"
                        >
                            <Users className="h-3.5 w-3.5" />
                            + Cliente
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Dashboard - DESTAQUE */}
            <div className="p-3 border-b border-border">
                <Link to="/overview">
                    <Button
                        variant="ghost"
                        className={cn(
                            "w-full justify-start px-3 py-3 h-auto text-left transition-all duration-300",
                            "hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/5 hover:scale-105",
                            isActive("/overview") && "bg-gradient-to-r from-primary/20 to-primary/10 text-primary font-semibold shadow-sm"
                        )}
                    >
                        <LayoutDashboard className={cn(
                            "h-5 w-5 mr-3 flex-shrink-0",
                            isActive("/overview") && "text-primary"
                        )} />
                        <span className="flex-1 text-base">Dashboard</span>
                        {isActive("/overview") && (
                            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                        )}
                    </Button>
                </Link>
            </div>

            {/* Navigation por Categorias - EXCEPCIONAL */}
            <nav className="flex-1 p-3 space-y-6 overflow-y-auto">
                {sidebarCategories.map((category) => (
                    <div key={category.id} className="space-y-2">
                        {/* Category Header */}
                        <div className="flex items-center gap-2 px-2 mb-3">
                            <div className={cn(
                                "w-1 h-4 rounded-full bg-gradient-to-b",
                                category.color
                            )} />
                            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                {category.label}
                            </h3>
                        </div>

                        {/* Category Items */}
                        <div className="space-y-1">
                            {category.items.map((item) => {
                                const active = isActive(item.path);
                                return (
                                    <Link key={item.id} to={item.path}>
                                        <Button
                                            variant="ghost"
                                            className={cn(
                                                "w-full justify-start px-3 py-2 h-auto text-left transition-all duration-300",
                                                "hover:bg-accent/50 hover:scale-102 hover:shadow-sm",
                                                active && "bg-accent text-accent-foreground font-medium shadow-sm"
                                            )}
                                        >
                                            <item.icon className={cn(
                                                "h-4 w-4 mr-3 flex-shrink-0 transition-colors",
                                                active ? item.color : "text-muted-foreground"
                                            )} />
                                            <span className="flex-1">{item.label}</span>
                                            {item.badge && (
                                                <Badge className={cn(
                                                    "ml-2 text-[10px] px-1.5 py-0 font-semibold",
                                                    getBadgeStyles(item.badgeVariant)
                                                )}>
                                                    {item.badge}
                                                </Badge>
                                            )}
                                        </Button>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {/* Configurações - Separado */}
                <div className="pt-4 border-t border-border">
                    <Link to="/configuracoes">
                        <Button
                            variant="ghost"
                            className={cn(
                                "w-full justify-start px-3 py-2 h-auto text-left transition-all duration-300",
                                "hover:bg-gradient-to-r hover:from-gray-500/10 hover:to-gray-400/10 hover:scale-102",
                                isActive("/configuracoes") && "bg-gradient-to-r from-gray-500/20 to-gray-400/10 font-medium shadow-sm"
                            )}
                        >
                            <Settings className={cn(
                                "h-4 w-4 mr-3 flex-shrink-0",
                                isActive("/configuracoes") ? "text-gray-700" : "text-muted-foreground"
                            )} />
                            <span className="flex-1">Configurações</span>
                        </Button>
                    </Link>
                </div>
            </nav>

            {/* User Info Footer - PREMIUM */}
            <div className="p-3 border-t border-border bg-gradient-to-br from-muted/50 to-muted/30">
                <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-accent/30 transition-colors cursor-pointer">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md">
                        <Users className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{profile?.name || "Usuário"}</p>
                        <p className="text-xs text-muted-foreground capitalize font-medium">
                            {profile?.role || "operador"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
