import { NavLink, useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Wrench,
  Users,
  DollarSign,
  BarChart3,
  FileText,
  Truck,
  Settings,
  ChevronLeft,
  Store,
} from "lucide-react";
import { useState, Fragment } from "react";
import { ChevronDown } from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  {
    icon: ShoppingCart,
    label: "Vendas",
    module: "vendas",
    requiredAction: "read",
    subItems: [
      { path: "/vendas", label: "Ponto de Venda" },
      { path: "/vendas/historico", label: "Histórico" },
    ],
  },
  { icon: Package, label: "Produtos", path: "/produtos" },
  { icon: Wrench, label: "Ordens de Serviço", path: "/ordens-servico" },
  { icon: Users, label: "Clientes", path: "/clientes" },
  { icon: DollarSign, label: "Financeiro", path: "/financeiro" },
  { icon: BarChart3, label: "Relatórios", path: "/relatorios" },
  { icon: FileText, label: "Fiscal", path: "/fiscal" },
  { icon: Truck, label: "Delivery", path: "/delivery" },
  { icon: Settings, label: "Configurações", path: "/configuracoes" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 flex flex-col shadow-sidebar",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-sidebar-primary">
          <Store className="w-5 h-5 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="flex flex-col animate-fade-in">
            <span className="font-bold text-sidebar-foreground tracking-tight">
              ACR Store
            </span>
            <span className="text-xs text-sidebar-muted">Sistema ERP</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
                    const isParentActive = item.subItems && item.subItems.some(sub => location.pathname.startsWith(sub.path));
          const isActive = location.pathname === item.path || isParentActive;
          return (
            <Fragment key={item.label}>
              <Link
                to={item.subItems ? '#' : item.path}
                onClick={(e) => {
                  if (item.subItems) {
                    e.preventDefault();
                    // Lógica para expandir/recolher pode ser adicionada aqui
                  }
                }}
                className={cn(
                  "sidebar-item group",
                  isActive && "sidebar-item-active"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 flex-shrink-0 transition-colors",
                    isActive ? "text-sidebar-primary" : "text-sidebar-muted group-hover:text-sidebar-foreground"
                  )}
                />
                {!collapsed && (
                  <span className="truncate animate-fade-in flex-1">{item.label}</span>
                )}
                {item.subItems && !collapsed && (
                  <ChevronDown className="w-4 h-4 transition-transform" />
                )}
              </Link>
              {isParentActive && !collapsed && (
                <div className="pl-8 py-1 space-y-1 animate-fade-in">
                  {item.subItems.map(subItem => (
                    <NavLink
                      key={subItem.path}
                      to={subItem.path}
                      className={({ isActive: isSubActive }) => cn(
                        "sidebar-sub-item group",
                        isSubActive && "sidebar-item-active"
                      )}
                    >
                      <span className="truncate">{subItem.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </Fragment>
          );
        })}
      </nav>

      {/* Collapse Button */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-item w-full justify-center"
        >
          <ChevronLeft
            className={cn(
              "w-5 h-5 transition-transform duration-300",
              collapsed && "rotate-180"
            )}
          />
          {!collapsed && <span className="animate-fade-in">Recolher</span>}
        </button>
      </div>
    </aside>
  );
}
