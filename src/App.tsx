import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Login from "./pages/Login";
import Index from "./pages/Index";
import { SalesPage } from "./pages/Dashboard/SalesPage";
import { ProductsPage } from "./pages/Dashboard/ProductsPage";
import { ServiceOrdersPage } from "./pages/Dashboard/ServiceOrdersPage";
import { ClientsPage } from "./pages/Dashboard/ClientsPage";
import { SalesHistoryPage } from "./pages/Dashboard/SalesHistoryPage";
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
            <Route path="/" element={<Index />} />
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
