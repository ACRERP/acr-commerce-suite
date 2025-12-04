import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import DevLogin from "./pages/DevLogin";
import CreateTestUsers from "./pages/CreateTestUsers";
import ImportAccess from "./pages/ImportAccess";
import ImportSMB from "./pages/ImportSMB";
import AccessImport from "./pages/AccessImport";
import AccessFileReader from "./pages/AccessFileReader";
import SMBSystem from "./pages/SMBSystem";
import PDVPage from "./pages/PDV";
import CashRegisterPage from "./pages/CashRegister";
import Index from "./pages/Index";
import { TestIntegrations } from "./pages/TestIntegrations";
import { SalesPage } from "./pages/Dashboard/SalesPage";
import { ProductsPage } from "./pages/Dashboard/ProductsPage";
import { ServiceOrdersPage } from "./pages/Dashboard/ServiceOrdersPage";
import { UserManagementPage } from "./pages/Dashboard/UserManagementPage";
import { ClientsPage } from "./pages/Dashboard/ClientsPage";
import { SalesHistoryPage } from "./pages/Dashboard/SalesHistoryPage";
import { ActivityLogsPage } from "./pages/Dashboard/ActivityLogsPage";
import Financeiro from "./pages/Financeiro";
import Relatorios from "./pages/Relatorios";
import Fiscal from "./pages/Fiscal";
import Delivery from "./pages/Delivery";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
            <Route path="/caixa" element={<CashRegisterPage />} />
            <Route path="/" element={<Index />} />
            <Route path="/test" element={<TestIntegrations />} />
            <Route path="/dev" element={<TestIntegrations />} />
            <Route path="/vendas" element={<SalesPage />} />
            <Route path="/produtos" element={<ProductsPage />} />
            <Route path="/ordens-servico" element={<ServiceOrdersPage />} />
            <Route path="/vendas/historico" element={<SalesHistoryPage />} />
            <Route path="/clientes" element={<ClientsPage />} />
            <Route path="/financeiro" element={<Financeiro />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/fiscal" element={<Fiscal />} />
            <Route path="/delivery" element={<Delivery />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/users" element={<UserManagementPage />} />
            <Route path="/logs" element={<ActivityLogsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
