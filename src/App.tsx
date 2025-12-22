import { Suspense, lazy, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { UISettingsProvider } from "@/contexts/UISettingsContext";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { GlobalError } from "@/components/GlobalError";
import { startAlertProcessing } from "@/lib/alerts/alert-service";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { QuotePrintable } from "@/components/dashboard/sales/QuotePrintable";
import { BusinessProfileProvider } from "@/contexts/BusinessProfileContext";
import { ModuleGuard } from "@/components/auth/Guards";
import { LicenseGuard } from "@/components/licensing/LicenseGuard";

// Lazy load pages
const UnifiedOnboarding = lazy(() => import("./pages/UnifiedOnboarding"));
const PDVPage = lazy(() => import("./pages/Dashboard/PDVPage"));
const CaixaPage = lazy(() => import("./pages/Dashboard/CaixaPage").then(module => ({ default: module.CaixaPage })));
const RelatoriosCaixaPage = lazy(() => import("./pages/Dashboard/RelatoriosCaixaPage").then(module => ({ default: module.RelatoriosCaixaPage })));
const AuditLogsPage = lazy(() => import("./pages/Dashboard/AuditLogsPage").then(module => ({ default: module.AuditLogsPage })));
const SalesPage = lazy(() => import("./pages/Vendas"));
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
const AgendaPage = lazy(() => import("./pages/Dashboard/AgendaPage").then(m => ({ default: m.AgendaPage })));
const SalasMesasPage = lazy(() => import("./pages/Gastronomy/SalasMesas"));
const KDSPage = lazy(() => import("./pages/Gastronomy/KDSPage"));
const ProvisioningPage = lazy(() => import("./pages/ProvisioningPage"));
const PasswordRecoveryPage = lazy(() => import("./pages/PasswordRecoveryPage"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));
const ProductionPage = lazy(() => import("./pages/ProductionPage"));
const TeamManagementPage = lazy(() => import("./pages/TeamManagementPage"));
const CompliancePage = lazy(() => import("./pages/CompliancePage"));
const AcademicPage = lazy(() => import("./pages/AcademicPage"));
const SurgindoLogin = lazy(() => import("./pages/SurgindoLogin"));
const FleetPage = lazy(() => import("./pages/FleetPage"));
const MarketingPage = lazy(() => import("./pages/MarketingPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LicenseActivation = lazy(() => import("./pages/LicenseActivation"));

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
          <BusinessProfileProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <GlobalError>
                <BrowserRouter>
                  <AppRoutes />
                </BrowserRouter>
              </GlobalError>
            </TooltipProvider>
          </BusinessProfileProvider>
        </UISettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

// Extracted Routes + Profile Interception Logic
const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Main Entry Point - Onboarding Flow */}
        <Route path="/" element={<UnifiedOnboarding />} />
        <Route path="/start" element={<UnifiedOnboarding />} />

        {/* Autenticação */}
        <Route path="/provisioning" element={<ProvisioningPage />} />
        <Route path="/recovery" element={<PasswordRecoveryPage />} />
        <Route path="/login" element={<SurgindoLogin />} />
        <Route path="/activate" element={<LicenseActivation />} />

        <Route element={<ProtectedRoute><LicenseGuard><Outlet /></LicenseGuard></ProtectedRoute>}>
          {/* Dashboard Principal */}
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/overview" element={<SystemOverviewPage />} />

          {/* Operações de Venda */}
          <Route path="/pdv" element={<ModuleGuard module="pdv"><PDVPage /></ModuleGuard>} />
          <Route path="/pdv-market" element={<ModuleGuard module="pdv"><PDVMarketPage /></ModuleGuard>} />
          <Route path="/caixa" element={<ModuleGuard module="finance"><CaixaPage /></ModuleGuard>} />
          <Route path="/vendas" element={<ModuleGuard module="sales"><SalesPage /></ModuleGuard>} />
          <Route path="/vendas/historico" element={<ModuleGuard module="sales"><SalesHistoryPage /></ModuleGuard>} />
          <Route path="/print/quote/:id" element={<QuotePrintable />} />

          {/* Cadastros */}
          <Route path="/produtos" element={<ModuleGuard module="inventory"><ProductsPage /></ModuleGuard>} />
          <Route path="/produtos/novo" element={<ModuleGuard module="inventory"><ProductsPage openForm /></ModuleGuard>} />
          <Route path="/produtos/categorias" element={<ModuleGuard module="inventory"><ProductsPage defaultTab="categories" /></ModuleGuard>} />
          <Route path="/clientes" element={<ModuleGuard module="clients"><ClientsPage /></ModuleGuard>} />
          <Route path="/clientes/novo" element={<ModuleGuard module="clients"><ClientsPage openForm /></ModuleGuard>} />

          {/* Gestão */}
          <Route path="/estoque" element={<ModuleGuard module="inventory"><Estoque /></ModuleGuard>} />
          <Route path="/compras" element={<ModuleGuard module="purchases"><PurchasesPage /></ModuleGuard>} />
          <Route path="/financeiro" element={<ModuleGuard module="finance"><Financeiro /></ModuleGuard>} />
          <Route path="/crm" element={<ModuleGuard module="crm"><CRM /></ModuleGuard>} />
          <Route path="/delivery" element={<ModuleGuard module="delivery"><Delivery /></ModuleGuard>} />
          <Route path="/fiscal" element={<ModuleGuard module="fiscal"><Fiscal /></ModuleGuard>} />
          <Route path="/fiscal/configuracoes" element={<ModuleGuard module="fiscal"><FiscalConfigPage /></ModuleGuard>} />
          <Route path="/os" element={<ModuleGuard module="service_orders"><OSPage /></ModuleGuard>} />
          <Route path="/agenda" element={<ModuleGuard module="scheduling"><AgendaPage /></ModuleGuard>} />
          <Route path="/mesas" element={<ModuleGuard module="kitchen"><SalasMesasPage /></ModuleGuard>} />
          <Route path="/kds" element={<ModuleGuard module="kitchen"><KDSPage /></ModuleGuard>} />

          {/* Relatórios */}
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/relatorios/caixa" element={<RelatoriosCaixaPage />} />

          {/* Administração */}
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="/users" element={<UserManagementPage />} />
          <Route path="/academic" element={<ModuleGuard module="academic"><AcademicPage /></ModuleGuard>} />
          <Route path="/compliance" element={<ModuleGuard module="compliance"><CompliancePage /></ModuleGuard>} />
          <Route path="/team" element={<ModuleGuard module="team"><TeamManagementPage /></ModuleGuard>} />
          <Route path="/production" element={<ModuleGuard module="production"><ProductionPage /></ModuleGuard>} />
          <Route path="/projects" element={<ModuleGuard module="projects"><ProjectsPage /></ModuleGuard>} />
          <Route path="/frota" element={<ModuleGuard module="fleet"><FleetPage /></ModuleGuard>} />
          <Route path="/marketing" element={<ModuleGuard module="marketing"><MarketingPage /></ModuleGuard>} />
          <Route path="/configuracoes/audit-logs" element={<AuditLogsPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default App;
