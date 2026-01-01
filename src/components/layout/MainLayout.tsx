import { Sidebar } from "./Sidebar";
import { ReactNode, useState } from "react";
import { Bell, Search, User, LogOut, Settings, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useUISettings } from "@/contexts/UISettingsContext";
import { DemoBadge } from "@/components/licensing/DemoBadge";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { DensitySelector } from "@/components/ui/density-selector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GlobalCommandPalette } from "../dashboard/GlobalCommandPalette";
import { AlertCenter } from "@/components/alerts/AlertCenter";
import { cn } from "@/lib/utils";
import { SupportBadge } from "@/components/common/SupportBadge";
import { HelpCenterModal } from "@/components/common/HelpCenterModal";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { profile, signOut, loading } = useAuth();
  const { sidebarCollapsed, densityMode, pageBackground } = useUISettings();
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  const getBackgroundClass = () => {
    return `page-bg-${pageBackground}`;
  };

  return (
    <div className={cn("min-h-screen", getBackgroundClass(), `density-${densityMode}`)}>
      <Sidebar />
      <DemoBadge />

      {/* Main Content */}
      <div className={cn(
        "transition-all duration-300",
        sidebarCollapsed ? "pl-20" : "pl-72"
      )}>
        {/* Top Header - Estilo ACR */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border shadow-sm">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center gap-4 flex-1">
              <Breadcrumbs />
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produtos, clientes, vendas..."
                  className="pl-9 bg-muted/50 border-input text-foreground placeholder:text-muted-foreground focus:bg-background"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <DensitySelector />

              <AlertCenter />

              <Button variant="outline" className="border-border text-foreground hover:bg-muted">
                {new Date().toLocaleDateString('pt-BR')}
              </Button>

              <div className="flex items-center gap-3 pl-3 border-l border-border">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-3 h-auto p-2 text-foreground hover:bg-muted">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium">{profile?.name || 'Usuário'}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {loading ? 'Carregando...' : (profile?.role || 'Convidado')}
                        </p>
                      </div>
                      <div className="rounded-full bg-primary/10 hover:bg-primary/20 p-1">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => window.location.href = '/perfil'}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Perfil</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.location.href = '/configuracoes'}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Configurações</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setHelpModalOpen(true)}>
                      <HelpCircle className="mr-2 h-4 w-4" />
                      <span>Ajuda</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 animate-fade-in min-h-[calc(100vh-140px)]">
          {children}
        </main>

        {/* Global Footer ACR Elite */}
        <footer className="px-6 py-6 border-t border-border bg-background/50 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-tighter text-foreground">ACR <span className="text-primary italic">STORE</span></span>
              <span className="text-[10px] opacity-50">Sistemas Elite v5.0.0</span>
            </div>
            <p className="text-[10px] font-medium">© 2026 ACR Software. Todos os direitos reservados.</p>
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
              <span className="text-primary/50">🛡️ Proteção Ativa</span>
              <span className="text-primary/50">⚡ High Performance</span>
            </div>
          </div>
        </footer>
      </div>
      <GlobalCommandPalette />
      <SupportBadge />
      <HelpCenterModal open={helpModalOpen} onClose={() => setHelpModalOpen(false)} />
    </div>
  );
}
