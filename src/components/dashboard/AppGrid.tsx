
import {
    ShoppingCart,
    Package,
    Wrench,
    Users,
    DollarSign,
    BarChart3,
    Settings,
    Store,
    FileText,
    Truck
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const apps = [
    { id: "sales", label: "Vendas (PDV)", icon: ShoppingCart, color: "bg-purple-600", path: "/vendas" },
    { id: "products", label: "Produtos", icon: Package, color: "bg-blue-600", path: "/produtos" },
    { id: "service", label: "Ordens de Serviço", icon: Wrench, color: "bg-orange-600", path: "/ordens-servico" },
    { id: "crm", label: "Clientes", icon: Users, color: "bg-green-600", path: "/clientes" },
    { id: "finance", label: "Financeiro", icon: DollarSign, color: "bg-emerald-600", path: "/financeiro" },
    { id: "reports", label: "Relatórios", icon: BarChart3, color: "bg-indigo-600", path: "/relatorios" },
    { id: "fiscal", label: "Fiscal", icon: FileText, color: "bg-slate-600", path: "/fiscal" },
    { id: "delivery", label: "Delivery", icon: Truck, color: "bg-cyan-600", path: "/delivery" },
    { id: "settings", label: "Configurações", icon: Settings, color: "bg-gray-600", path: "/configuracoes" },
];

export function AppGrid() {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 animate-fade-in">
            <div className="mb-12 text-center">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Bem-vindo ao ACR ERP</h1>
                <p className="text-gray-500">Selecione um aplicativo para começar</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 max-w-5xl w-full">
                {apps.map((app) => (
                    <Link
                        key={app.id}
                        to={app.path}
                        className="group flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-gray-100/80 transition-all duration-200"
                    >
                        <div className={cn(
                            "w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-200",
                            app.color
                        )}>
                            <app.icon className="w-8 h-8 text-white" />
                        </div>
                        <span className="font-medium text-gray-700 text-center group-hover:text-gray-900">
                            {app.label}
                        </span>
                    </Link>
                ))}
                {/* Fake "New App" placeholder for Odoo feel */}
                <div className="flex flex-col items-center gap-3 p-4 rounded-xl opacity-50 cursor-not-allowed">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-300">
                        <Store className="w-8 h-8 text-gray-300" />
                    </div>
                    <span className="font-medium text-gray-400 text-center">
                        Loja de Apps
                    </span>
                </div>
            </div>
        </div>
    );
}
