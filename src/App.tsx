import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { UISettingsProvider } from "@/contexts/UISettingsContext";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { GlobalError } from "@/components/GlobalError";
import { startAlertProcessing } from "@/lib/alerts/alert-service";

// Lazy load pages
const Login = lazy(() => import("./pages/Login"));
const PDVPage = lazy(() => import("./pages/Dashboard/PDVPage"));
const CaixaPage = lazy(() => import("./pages/Dashboard/CaixaPage").then(module => ({ default: module.CaixaPage })));
const RelatoriosCaixaPage = lazy(() => import("./pages/Dashboard/RelatoriosCaixaPage").then(module => ({ default: module.RelatoriosCaixaPage })));
const AuditLogsPage = lazy(() => import("./pages/Dashboard/AuditLogsPage").then(module => ({ default: module.AuditLogsPage })));
const Index = lazy(() => import("./pages/Index"));
const SalesPage = lazy(() => import("./pages/Dashboard/SalesPage").then(module => ({ default: module.SalesPage })));
const PurchasesPage = lazy(() => import("./pages/Dashboard/PurchasesPage"));
const PDVMarketPage = lazy(() => import("./pages/Dashboard/PDVMarketPage").then(module => ({ default: module.PDVMarketPage })));
// Apontando para os arquivos refatorados com Design System Premium
const ProductsPage = lazy(() => import("./pages/Produtos"));
const SystemOverviewPage = lazy(() => import("./pages/Dashboard/SystemOverviewPage").then(module => ({ default: module.SystemOverviewPage })));
const UserManagementPage = lazy(() => import("./pages/Dashboard/UserManagementPage").then(module => ({ default: module.UserManagementPage })));
// Apontando para os arquivos refatorados com Design System Premium
const ClientsPage = lazy(() => import("./pages/Clientes"));
const SalesHistoryPage = lazy(() => import("./pages/Dashboard/SalesHistoryPage").then(module => ({ default: module.SalesHistoryPage })));
const ActivityLogsPage = lazy(() => import("./pages/Dashboard/ActivityLogsPage").then(module => ({ default: module.ActivityLogsPage })));
const Financeiro = lazy(() => import("./pages/Financeiro"));
const Relatorios = lazy(() => import("./pages/Relatorios"));
const Fiscal = lazy(() => import("./pages/Fiscal"));
const FiscalConfigPage = lazy(() => import("./pages/Dashboard/FiscalConfigPage").then(module => ({ default: module.FiscalConfigPage })));
const DashboardPage = lazy(() => import("./pages/Dashboard/DashboardPage"));
const Delivery = lazy(() => import("./pages/Delivery"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const CRM = lazy(() => import("./pages/CRM"));
const Estoque = lazy(() => import("./pages/Estoque"));
const OSPage = lazy(() => import("./pages/OS/OSPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => {
  // Iniciar processamento de alertas a cada 5 minutos
  useEffect(() => {
    const interval = startAlertProcessing(5);
    return () => clearInterval(interval);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UISettingsProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <GlobalError>
              <BrowserRouter>
                <Suspense fallback={<LoadingSpinner />}>
                  <Routes>
                    {/* Autenticação */}
                    <Route path="/login" element={<Login />} />

                    {/* Dashboard Principal */}
                    <Route path="/" element={<Index />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/overview" element={<SystemOverviewPage />} />

                    {/* Operações de Venda */}
                    <Route path="/pdv" element={<PDVPage />} />
                    <Route path="/pdv-market" element={<PDVMarketPage />} />
                    <Route path="/caixa" element={<CaixaPage />} />
                    <Route path="/vendas" element={<SalesPage />} />
                    <Route path="/vendas/historico" element={<SalesHistoryPage />} />

                    {/* Cadastros */}
                    <Route path="/produtos" element={<ProductsPage />} />
                    <Route path="/produtos/novo" element={<ProductsPage openForm />} />
                    <Route path="/produtos/categorias" element={<ProductsPage defaultTab="categories" />} />
                    <Route path="/clientes" element={<ClientsPage />} />
                    <Route path="/clientes/novo" element={<ClientsPage openForm />} />

                    {/* Gestão */}
                    <Route path="/estoque" element={<Estoque />} />
                    <Route path="/compras" element={<PurchasesPage />} />
                    <Route path="/financeiro" element={<Financeiro />} />
                    <Route path="/crm" element={<CRM />} />
                    <Route path="/delivery" element={<Delivery />} />
                    <Route path="/fiscal" element={<Fiscal />} />
                    <Route path="/fiscal/configuracoes" element={<FiscalConfigPage />} />
                    <Route path="/os" element={<OSPage />} />

                    {/* Relatórios */}
                    <Route path="/relatorios" element={<Relatorios />} />
                    <Route path="/relatorios/caixa" element={<RelatoriosCaixaPage />} />

                    {/* Administração */}
                    <Route path="/configuracoes" element={<Configuracoes />} />
                    <Route path="/users" element={<UserManagementPage />} />
                    <Route path="/configuracoes/audit-logs" element={<AuditLogsPage />} />

                    {/* 404 */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </GlobalError>
          </TooltipProvider>
        </UISettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
