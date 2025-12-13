import { Sidebar } from "./Sidebar";
import { ReactNode } from "react";
import { Bell, Search, User, LogOut, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useUISettings } from "@/contexts/UISettingsContext";
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

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { profile, signOut } = useAuth();
  const { sidebarCollapsed, densityMode } = useUISettings();

  return (
    <div className={cn("min-h-screen bg-gray-50", `density-${densityMode}`)}>
      <Sidebar />

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
                        <p className="text-xs text-muted-foreground capitalize">{profile?.role || 'Carregando...'}</p>
                      </div>
                      <div className="rounded-full bg-primary/10 hover:bg-primary/20 p-1">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      <span>Perfil</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Configurações</span>
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
        <main className="p-6 animate-fade-in">
          {children}
        </main>
      </div>
      <GlobalCommandPalette />
    </div>
  );
}
