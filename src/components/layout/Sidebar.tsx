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
        "fixed left-0 top-0 z-40 h-screen bg-acr-blue transition-all duration-300 flex flex-col shadow-lg",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Logo ACR */}
      <div className="flex items-center justify-center h-16 border-b border-acr-orange">
        <div className="flex items-center space-x-3">
          <div className="bg-acr-orange rounded-lg p-2">
            <Store className="h-8 w-8 text-white" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="text-xl font-bold text-white">ACR ERP</h1>
              <p className="text-xs text-white/80">Sistema Comercial</p>
            </div>
          )}
        </div>
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
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200",
                  isActive && "bg-white/20 text-white font-medium"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
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
                        "flex items-center px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded transition-all duration-200",
                        isSubActive && "bg-white/20 text-white font-medium"
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
      <div className="px-3 py-4 border-t border-acr-orange">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full px-3 py-2.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
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
