import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Vendas from "./pages/Vendas";
import Produtos from "./pages/Produtos";
import OrdensServico from "./pages/OrdensServico";
import Clientes from "./pages/Clientes";
import Financeiro from "./pages/Financeiro";
import Relatorios from "./pages/Relatorios";
import Fiscal from "./pages/Fiscal";
import Delivery from "./pages/Delivery";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/vendas" element={<Vendas />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/ordens-servico" element={<OrdensServico />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/financeiro" element={<Financeiro />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/fiscal" element={<Fiscal />} />
          <Route path="/delivery" element={<Delivery />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
