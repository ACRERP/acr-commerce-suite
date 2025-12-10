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
const DevLogin = lazy(() => import("./pages/DevLogin"));
const CreateTestUsers = lazy(() => import("./pages/CreateTestUsers"));
const ImportAccess = lazy(() => import("./pages/ImportAccess"));
const ImportSMB = lazy(() => import("./pages/ImportSMB"));
const AccessImport = lazy(() => import("./pages/AccessImport"));
const AccessFileReader = lazy(() => import("./pages/AccessFileReader"));
const SMBSystem = lazy(() => import("./pages/SMBSystem"));
const PDVPage = lazy(() => import("./pages/Dashboard/PDVPage").then(module => ({ default: module.PDVPage })));
const CaixaPage = lazy(() => import("./pages/Dashboard/CaixaPage").then(module => ({ default: module.CaixaPage })));
const RelatoriosCaixaPage = lazy(() => import("./pages/Dashboard/RelatoriosCaixaPage").then(module => ({ default: module.RelatoriosCaixaPage })));
const AuditLogsPage = lazy(() => import("./pages/Dashboard/AuditLogsPage").then(module => ({ default: module.AuditLogsPage })));
const CashRegisterPage = lazy(() => import("./pages/CashRegister"));
const Index = lazy(() => import("./pages/Index"));
const TestIntegrations = lazy(() => import("./pages/TestIntegrations").then(module => ({ default: module.TestIntegrations })));
const SalesPage = lazy(() => import("./pages/Dashboard/SalesPage").then(module => ({ default: module.SalesPage })));
const PurchasesPage = lazy(() => import("./pages/Dashboard/PurchasesPage"));
const PDVMarketPage = lazy(() => import("./pages/Dashboard/PDVMarketPage").then(module => ({ default: module.PDVMarketPage })));
const ProductsPage = lazy(() => import("./pages/Dashboard/ProductsPage").then(module => ({ default: module.ProductsPage })));
const SystemOverviewPage = lazy(() => import("./pages/Dashboard/SystemOverviewPage").then(module => ({ default: module.SystemOverviewPage })));
const FrenteDeCaixaPage = lazy(() => import("./pages/Dashboard/FrenteDeCaixaPage").then(module => ({ default: module.FrenteDeCaixaPage })));
const UserManagementPage = lazy(() => import("./pages/Dashboard/UserManagementPage").then(module => ({ default: module.UserManagementPage })));
const ClientsPage = lazy(() => import("./pages/Dashboard/ClientsPage").then(module => ({ default: module.ClientsPage })));
const SalesHistoryPage = lazy(() => import("./pages/Dashboard/SalesHistoryPage").then(module => ({ default: module.SalesHistoryPage })));
const ActivityLogsPage = lazy(() => import("./pages/Dashboard/ActivityLogsPage").then(module => ({ default: module.ActivityLogsPage })));
const Financeiro = lazy(() => import("./pages/Financeiro"));
const Relatorios = lazy(() => import("./pages/Relatorios"));
const Fiscal = lazy(() => import("./pages/Fiscal"));
const FiscalConfigPage = lazy(() => import("./pages/Dashboard/FiscalConfigPage").then(module => ({ default: module.FiscalConfigPage })));
const DashboardPage = lazy(() => import("./pages/Dashboard/DashboardPage"));
const ReportsPage = lazy(() => import("./pages/Reports/ReportsPage"));
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
                    <Route path="/login" element={<Login />} />
                    <Route path="/dev-login" element={<DevLogin />} />
                    <Route path="/create-users" element={<CreateTestUsers />} />
                    <Route path="/import-access" element={<ImportAccess />} />
                    <Route path="/import-smb" element={<ImportSMB />} />
                    <Route path="/import-access-full" element={<AccessImport />} />
                    <Route path="/access-reader" element={<AccessFileReader />} />
                    <Route path="/smb" element={<SMBSystem />} />
                    <Route path="/pdv" element={<PDVPage />} />
                    <Route path="/caixa-sistema" element={<CaixaPage />} />
                    <Route path="/relatorios-caixa" element={<RelatoriosCaixaPage />} />
                    <Route path="/audit-logs" element={<AuditLogsPage />} />
                    <Route path="/caixa" element={<CashRegisterPage />} />
                    <Route path="/caixa-dash" element={<FrenteDeCaixaPage />} />
                    <Route path="/" element={<Index />} />
                    <Route path="/test" element={<TestIntegrations />} />
                    <Route path="/dev" element={<TestIntegrations />} />
                    <Route path="/vendas" element={<SalesPage />} />
                    <Route path="/compras" element={<PurchasesPage />} />
                    <Route path="/pdv-market" element={<PDVMarketPage />} />
                    <Route path="/produtos" element={<ProductsPage />} />
                    <Route path="/produtos/novo" element={<ProductsPage openForm />} />
                    <Route path="/produtos/categorias" element={<ProductsPage defaultTab="categories" />} />
                    <Route path="/overview" element={<SystemOverviewPage />} />
                    <Route path="/vendas/historico" element={<SalesHistoryPage />} />
                    <Route path="/clientes" element={<ClientsPage />} />
                    <Route path="/clientes/novo" element={<ClientsPage openForm />} />
                    <Route path="/financeiro" element={<Financeiro />} />
                    <Route path="/relatorios" element={<Relatorios />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/fiscal" element={<Fiscal />} />
                    <Route path="/fiscal/configuracoes" element={<FiscalConfigPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/delivery" element={<Delivery />} />
                    <Route path="/crm" element={<CRM />} />
                    <Route path="/estoque" element={<Estoque />} />
                    <Route path="/configuracoes" element={<Configuracoes />} />
                    <Route path="/users" element={<UserManagementPage />} />
                    <Route path="/os" element={<OSPage />} />
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
