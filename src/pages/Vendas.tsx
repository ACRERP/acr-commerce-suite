import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Plus, ShoppingCart, Sparkles, TrendingUp, DollarSign, Calendar, Clock, CheckCircle, AlertCircle, Eye, FileText } from "lucide-react";
import { useSales } from "@/hooks/useSales";
import { useQuotes } from "@/hooks/useQuotes";
import { SalesPDV } from "@/components/dashboard/sales/SalesPDV";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QuoteList } from "@/components/dashboard/sales/QuoteList";
import { QuoteBuilder } from "@/components/dashboard/sales/QuoteBuilder";
import { Quote } from "@/hooks/useQuotes";

// Status Configuration (matching OrdensServico style)
const statusConfig = {
  concluida: { label: 'Concluída', color: 'green', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  pendente: { label: 'Pendente', color: 'amber', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  cancelada: { label: 'Cancelada', color: 'rose', bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200' },
};

const Vendas = () => {
  const [isPDVOpen, setIsPDVOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showQuotesSheet, setShowQuotesSheet] = useState(false);
  const [showQuoteBuilder, setShowQuoteBuilder] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);

  const { data: sales, isLoading: loadingSales } = useSales();
  const { data: quotes } = useQuotes();

  // Calculate Stats
  const stats = useMemo(() => {
    if (!sales) return { totalToday: 0, countToday: 0, ticketMedia: 0 };
    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(s => s.created_at.startsWith(today));
    const total = todaySales.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
    return {
      totalToday: total,
      countToday: todaySales.length,
      ticketMedia: todaySales.length ? total / todaySales.length : 0
    };
  }, [sales]);

  const filteredSales = useMemo(() => {
    if (!sales) return [];
    return sales.filter(sale =>
      sale.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.id.toString().includes(searchTerm)
    );
  }, [sales, searchTerm]);

  // If PDV mode is active, show the Full Screen PDV Interface
  if (isPDVOpen) {
    return (
      <MainLayout>
        <div className="w-full max-w-[95%] mx-auto px-4 py-8">
          <SalesPDV onBack={() => setIsPDVOpen(false)} />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="w-full max-w-[95%] mx-auto px-4 py-8 space-y-8 animate-fade-in-up">

        {/* Header Section (Matching OrdensServico style) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-neutral-100 dark:border-neutral-800/50">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neutral-950 via-neutral-800 to-neutral-600 dark:from-white dark:via-neutral-200 dark:to-neutral-400 tracking-tight">
                Vendas & PDV
              </h1>
            </div>
            <p className="text-lg text-neutral-500 dark:text-neutral-400 flex items-center gap-2 ml-1">
              Gestão comercial e histórico de transações
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="btn-secondary gap-2 hover-lift border-neutral-200"
              onClick={() => setShowQuotesSheet(true)}
            >
              <FileText className="w-4 h-4" />
              Orçamentos
              {quotes && quotes.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary-500 text-white text-[10px] font-bold">
                  {quotes.length}
                </span>
              )}
            </Button>
            <Button
              className="btn-primary hover-lift gap-2 shadow-lg shadow-primary-500/20 px-6"
              onClick={() => setIsPDVOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Nova Venda
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-down">
          {/* Total Today */}
          <div className="card-premium hover-lift group border-none shadow-lg shadow-emerald-500/5 bg-gradient-to-br from-white to-emerald-50/30 dark:from-neutral-900 dark:to-emerald-900/10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-1">Vendas Hoje</p>
                <h3 className="text-3xl font-black text-neutral-900 dark:text-neutral-100">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(stats.totalToday)}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">{stats.countToday} pedidos</span>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-600 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 shadow-inner">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Quotes Count */}
          <div
            className="card-premium hover-lift group border-none shadow-lg shadow-blue-500/5 bg-gradient-to-br from-white to-blue-50/30 dark:from-neutral-900 dark:to-blue-900/10 cursor-pointer"
            onClick={() => setShowQuotesSheet(true)}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-1">Orçamentos</p>
                <h3 className="text-3xl font-black text-neutral-900 dark:text-neutral-100">{quotes?.length || 0}</h3>
                <p className="text-xs font-medium text-blue-600 mt-2">Ver detalhes &rarr;</p>
              </div>
              <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-600 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 shadow-inner">
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Ticket Medio */}
          <div className="card-premium hover-lift group border-none shadow-lg shadow-purple-500/5 bg-gradient-to-br from-white to-purple-50/30 dark:from-neutral-900 dark:to-purple-900/10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-1">Ticket Médio</p>
                <h3 className="text-3xl font-black text-neutral-900 dark:text-neutral-100">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(stats.ticketMedia)}
                </h3>
                <p className="text-xs font-medium text-neutral-400 mt-2">Por pedido</p>
              </div>
              <div className="p-4 rounded-2xl bg-purple-500/10 text-purple-600 group-hover:scale-110 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300 shadow-inner">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Quick Action / PDV Status */}
          <div
            className="card-premium hover-lift group border-none shadow-lg shadow-orange-500/5 bg-gradient-to-br from-white to-orange-50/30 dark:from-neutral-900 dark:to-orange-900/10 cursor-pointer"
            onClick={() => setIsPDVOpen(true)}
          >
            <div className="flex items-center justify-between h-full">
              <div>
                <h3 className="text-2xl font-black text-neutral-900 dark:text-neutral-100">Abrir PDV</h3>
                <p className="text-sm text-neutral-500 mt-1">Iniciar nova venda</p>
              </div>
              <div className="p-4 rounded-full bg-orange-500 text-white shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform">
                <ShoppingCart className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="card-premium p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                placeholder="Buscar venda por cliente ou ID..."
                className="pl-10 h-10 bg-neutral-50 border-neutral-200 focus:bg-white transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button variant="outline" className="flex-1 md:flex-none hover:bg-neutral-50">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </div>

        {/* Sales List - Premium Card Style (Matching OrdensServico) */}
        <div className="card-premium overflow-hidden">
          <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
            <h3 className="font-bold text-lg text-neutral-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-neutral-500" />
              Vendas Recentes
            </h3>
          </div>
          <div className="space-y-0 divide-y divide-neutral-100 dark:divide-neutral-800">
            {loadingSales ? (
              <div className="p-8 text-center text-neutral-500">Carregando histórico...</div>
            ) : filteredSales.length === 0 ? (
              <div className="p-8 text-center text-neutral-500">Nenhuma venda encontrada.</div>
            ) : (
              filteredSales.map((sale, index) => {
                const statusStyle = statusConfig[sale.status as keyof typeof statusConfig] || statusConfig.concluida;

                return (
                  <div
                    key={sale.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer animate-fade-in gap-4"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center font-bold text-primary-600">
                        #{sale.id}
                      </div>
                      <div>
                        <p className="font-bold text-neutral-900 dark:text-neutral-100">{sale.client?.name || 'Cliente Balcão'}</p>
                        <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {new Date(sale.created_at).toLocaleDateString('pt-BR')}
                          <span className="w-1 h-1 rounded-full bg-neutral-300"></span>
                          {sale.payment_method?.replace('_', ' ').toUpperCase()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 flex-1">
                      <div className="text-right">
                        <p className="font-black text-neutral-900 dark:text-neutral-100 tabular-nums">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(sale.total_amount)}
                        </p>
                      </div>
                      <Badge variant="outline" className={`${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} border h-7 px-3`}>
                        {statusStyle.label}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-primary-500">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Legacy Quotes Dialog (Still accessible via button) */}
      <Dialog open={showQuotesSheet} onOpenChange={setShowQuotesSheet}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto rounded-[2rem] border-none shadow-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-3xl font-black flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-primary-500/10 text-primary-600">
                <FileText className="w-8 h-8" />
              </div>
              Controle de Orçamentos
            </DialogTitle>
          </DialogHeader>

          {showQuoteBuilder ? (
            <QuoteBuilder
              initialData={editingQuote}
              onCancel={() => {
                setShowQuoteBuilder(false);
                setEditingQuote(null);
              }}
              onSuccess={() => {
                setShowQuoteBuilder(false);
                setEditingQuote(null);
              }}
            />
          ) : (
            <QuoteList
              onCreateNew={() => {
                setEditingQuote(null);
                setShowQuoteBuilder(true);
              }}
              onEdit={(quote) => {
                setEditingQuote(quote);
                setShowQuoteBuilder(true);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Vendas;
