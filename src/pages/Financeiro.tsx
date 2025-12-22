import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Wallet,
  Edit,
  Trash2,
  DollarSign,
  Search,
  Filter
} from "lucide-react";
import {
  useQuery,
  useMutation,
  useQueryClient
} from '@tanstack/react-query';
import {
  getFinancialSummary,
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  CreateTransactionData,
  Transaction
} from '@/lib/finance';
import {
  predictCashFlow,
  detectAnomalies,
  getFinancialInsights,
  calculateHealthScore,
  FinancialAnomaly,
  FinancialInsight
} from '@/lib/ai/financial-ai-service';
import { TransactionForm } from '@/components/dashboard/finance/TransactionForm';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, BrainCircuit, Lightbulb, Zap, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const Financeiro = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['financial_summary'],
    queryFn: getFinancialSummary
  });

  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: getTransactions
  });

  const createMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial_summary'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({ title: 'Sucesso', description: 'Transação registrada com sucesso.' });
      setIsTransactionModalOpen(false);
      setSelectedTransaction(null);
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao registrar transação.', variant: 'destructive' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateTransactionData> }) =>
      updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial_summary'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({ title: 'Sucesso', description: 'Transação atualizada com sucesso.' });
      setIsTransactionModalOpen(false);
      setSelectedTransaction(null);
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao atualizar transação.', variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial_summary'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({ title: 'Sucesso', description: 'Transação excluída com sucesso.' });
      setIsDeleteAlertOpen(false);
      setTransactionToDelete(null);
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao excluir transação.', variant: 'destructive' });
    }
  });

  const handleNewTransaction = (type: 'income' | 'expense') => {
    setSelectedTransaction(null);
    setTransactionType(type);
    setIsTransactionModalOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setTransactionType(transaction.type);
    setIsTransactionModalOpen(true);
  };

  const handleDeleteClick = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setIsDeleteAlertOpen(true);
  };

  const handleConfirmDelete = () => {
    if (transactionToDelete) {
      deleteMutation.mutate(transactionToDelete.id);
    }
  };

  const handleFormSubmit = async (data: CreateTransactionData) => {
    if (selectedTransaction) {
      await updateMutation.mutateAsync({ id: selectedTransaction.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const chartData = useMemo(() => {
    if (!transactions) return [];

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return days.map(date => {
      const dayTransactions = transactions.filter(t => t.date.startsWith(date));
      const income = dayTransactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => acc + Number(t.amount), 0);
      const expense = dayTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => acc + Number(t.amount), 0);

      return {
        date: format(new Date(date), 'dd/MM'),
        receita: income,
        despesa: expense
      };
    });
  }, [transactions]);

  const anomalies = useMemo(() => transactions ? detectAnomalies(transactions) : [], [transactions]);
  const insights = useMemo(() => summary ? getFinancialInsights(summary) : [], [summary]);
  const healthScore = useMemo(() => summary ? calculateHealthScore(summary) : 0, [summary]);
  const projection = useMemo(() => (transactions && summary) ? predictCashFlow(transactions, summary.balance) : [], [transactions, summary]);

  const getAnomalyForTransaction = (id: number) => anomalies.find(a => a.transactionId === id);

  return (
    <MainLayout>
      <div className="container-premium py-8 space-y-8 animate-fade-in-up">
        {/* Header Section Premium */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-neutral-50 dark:to-neutral-400 tracking-tight mb-2">
              Financeiro & Caixa
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Controle seu fluxo de caixa e finanças
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="btn-secondary gap-2 hover-lift text-success-600 border-success-200 hover:bg-success-50" onClick={() => handleNewTransaction('income')}>
              <ArrowUpRight className="w-4 h-4" />
              Nova Receita
            </Button>
            <Button variant="outline" className="btn-secondary gap-2 hover-lift text-danger-600 border-danger-200 hover:bg-danger-50" onClick={() => handleNewTransaction('expense')}>
              <ArrowDownRight className="w-4 h-4" />
              Nova Despesa
            </Button>
          </div>
        </div>

        {/* Stats Grid Premium */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              label: "Saldo Atual",
              value: summary?.balance ?? 0,
              icon: Wallet,
              color: "text-blue-600",
              bg: "bg-blue-100 dark:bg-blue-900/30",
              gradient: "from-white to-blue-50/50",
              format: true
            },
            {
              label: "Receitas (Total)",
              value: summary?.income ?? 0,
              icon: TrendingUp,
              color: "text-success-600",
              bg: "bg-success-100 dark:bg-success-900/30",
              gradient: "from-white to-success-50/50",
              format: true
            },
            {
              label: "Despesas (Total)",
              value: summary?.expenses ?? 0,
              icon: TrendingDown,
              color: "text-danger-600",
              bg: "bg-danger-100 dark:bg-danger-900/30",
              gradient: "from-white to-danger-50/50",
              format: true
            },
            {
              label: "A Receber (Futuro)",
              value: summary?.pending_income ?? 0,
              icon: CreditCard,
              color: "text-warning-600",
              bg: "bg-warning-100 dark:bg-warning-900/30",
              gradient: "from-white to-warning-50/50",
              format: true
            },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className={`relative overflow-hidden group p-6 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-xl transition-all duration-300 bg-gradient-to-br ${stat.gradient} dark:from-neutral-900 dark:to-neutral-800 cursor-pointer`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 opacity-50`}></div>

              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{stat.label}</p>
                  <h3 className={`text-3xl font-bold mt-1 ${stat.color.includes('success') ? 'text-success-600' :
                    stat.color.includes('danger') ? 'text-danger-600' :
                      stat.color.includes('warning') ? 'text-warning-600' :
                        'text-neutral-900 dark:text-neutral-100'
                    }`}>
                    {stat.format
                      ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(stat.value))
                      : stat.value}
                  </h3>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart & Intelligence Container */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card-premium p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-500" />
                Fluxo de Caixa (7 dias)
              </h3>
              <div className="h-[300px] w-full">
                {isLoadingTransactions ? (
                  <div className="h-full flex items-center justify-center text-neutral-400">
                    Carregando dados...
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                        tickFormatter={(value) => `R$ ${value}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          borderRadius: '12px',
                          border: 'none',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                        formatter={(value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)}
                      />
                      <Area
                        type="monotone"
                        dataKey="receita"
                        name="Receitas"
                        stroke="#22c55e"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorReceita)"
                      />
                      <Area
                        type="monotone"
                        dataKey="despesa"
                        name="Despesas"
                        stroke="#ef4444"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorDespesa)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Projection Panel */}
            <div className="card-premium p-6 bg-gradient-to-br from-primary-500/5 to-transparent">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  Projeção de Saldo (30 dias)
                </h3>
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-none">Previsão IA</Badge>
              </div>
              <div className="flex items-end gap-1 h-32 px-2 border-b border-neutral-100 dark:border-neutral-800">
                {projection.filter((_, i) => i % 3 === 0).map((p, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                    <div
                      className="w-full bg-primary-500/40 rounded-t-md transition-all group-hover:bg-primary-500"
                      style={{ height: `${Math.max(20, Math.min(100, (p.expectedBalance / (summary?.balance || 1) * 50)))}%` }}
                    />
                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-neutral-900 text-white text-[8px] p-1 rounded whitespace-nowrap z-50">
                      R$ {p.expectedBalance.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                <span>Hoje</span>
                <span>Meio do Mês</span>
                <span>Próximo Mês</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            {/* Health Score Card */}
            <div className="card-premium p-6 overflow-hidden relative">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary-500/10 rounded-full blur-2xl" />
              <div className="relative z-10 flex flex-col items-center text-center space-y-3">
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-neutral-100 dark:text-neutral-800" />
                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * healthScore / 100)} className="text-primary-500 transition-all duration-1000" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-black">{healthScore}</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-neutral-900 dark:text-neutral-100">Saúde Financeira</h4>
                  <p className="text-[10px] text-neutral-500">Baseado em liquidez e inadimplência</p>
                </div>
              </div>
            </div>

            {/* AI Insights Card */}
            <div className="card-premium p-6 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" /> Insights Estratégicos
              </h3>
              <div className="space-y-3">
                {insights.map((insight, idx) => (
                  <div key={idx} className={`p-4 rounded-2xl border flex gap-3 animate-in slide-in-from-right-4`} style={{ animationDelay: `${idx * 150}ms`, backgroundColor: insight.type === 'positive' ? 'rgba(34, 197, 94, 0.05)' : insight.type === 'warning' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(59, 130, 246, 0.05)', borderColor: insight.type === 'positive' ? 'rgba(34, 197, 94, 0.1)' : insight.type === 'warning' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)' }}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${insight.type === 'positive' ? 'bg-success-100 text-success-600' : insight.type === 'warning' ? 'bg-danger-100 text-danger-600' : 'bg-blue-100 text-blue-600'}`}>
                      {insight.type === 'positive' ? <CheckCircle2 className="w-4 h-4" /> : insight.type === 'warning' ? <ShieldAlert className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{insight.title}</h4>
                      <p className="text-[10px] text-neutral-500 leading-relaxed">{insight.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Search Section Premium */}
          <div className="lg:col-span-3 card-premium p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  placeholder="Buscar transações..."
                  className="pl-10 h-10 bg-neutral-50 border-neutral-200 focus:bg-white transition-all"
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

          {/* Recent Transactions List Premium */}
          <div className="card-premium p-0 flex flex-col h-[400px]">
            <div className="p-6 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary-500" />
                Transações Recentes
              </h3>
            </div>

            {isLoadingTransactions ? (
              <div className="flex-1 flex items-center justify-center text-neutral-400">
                Carregando...
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {transactions?.map((tx) => (
                  <div
                    key={tx.id}
                    className="group flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all duration-200 border border-transparent hover:border-neutral-100 dark:hover:border-neutral-700"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tx.type === "income"
                        ? "bg-success-100 text-success-600 dark:bg-success-900/30"
                        : "bg-danger-100 text-danger-600 dark:bg-danger-900/30"
                        }`}>
                        {tx.type === "income" ? (
                          <ArrowUpRight className="w-5 h-5" />
                        ) : (
                          <ArrowDownRight className="w-5 h-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">{tx.description}</p>
                        <div className="flex items-center gap-2 text-xs text-neutral-500">
                          <span>{format(new Date(tx.date), "dd/MM/yyyy")}</span>
                          <span className="w-1 h-1 rounded-full bg-neutral-300"></span>
                          <span className="capitalize">{tx.category_name || 'Geral'}</span>
                          {getAnomalyForTransaction(tx.id) && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-neutral-300"></span>
                              <Badge variant="outline" className="text-[8px] h-4 bg-red-500/10 text-red-600 border-none flex gap-1">
                                <AlertCircle className="w-2 h-2" /> Anomalia
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 ml-2">
                      <span className={`font-bold ${tx.type === "income" ? "text-success-600" : "text-danger-600"
                        }`}>
                        {tx.type === "income" ? "+" : "-"}
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(tx.amount)}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:bg-primary-50 hover:text-primary-600"
                          onClick={() => handleEditTransaction(tx)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:bg-danger-50 hover:text-danger-600"
                          onClick={() => handleDeleteClick(tx)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {transactions?.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
                    <Wallet className="w-12 h-12 mb-2 opacity-20" />
                    <p>Nenhuma transação encontrada</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <Dialog open={isTransactionModalOpen} onOpenChange={setIsTransactionModalOpen}>
          <DialogContent className="max-w-md p-0 overflow-hidden rounded-[2rem] border-0 shadow-2xl glass-window glass-window-compact !p-0">
            <DialogHeader className="p-5 bg-gradient-to-r from-neutral-800/80 to-neutral-900/80 text-white backdrop-blur-md border-b border-white/10">
              <DialogTitle className="flex items-center gap-2 text-lg font-black">
                {transactionType === 'income' ? (
                  <div className="p-1.5 bg-green-500/10 rounded-lg backdrop-blur-sm">
                    <ArrowUpRight className="w-4 h-4 text-green-400" />
                  </div>
                ) : (
                  <div className="p-1.5 bg-red-500/10 rounded-lg backdrop-blur-sm">
                    <ArrowDownRight className="w-4 h-4 text-red-400" />
                  </div>
                )}
                {transactionType === 'income' ? 'Nova Receita' : 'Nova Despesa'}
              </DialogTitle>
              <p className="text-white/50 text-[10px] font-black uppercase tracking-[2px] mt-0.5">
                {transactionType === 'income' ? 'Registre uma entrada no seu caixa' : 'Registre uma saída ou custo'}
              </p>
            </DialogHeader>
            <div className="p-6 bg-white/5 backdrop-blur-sm">
              <TransactionForm
                defaultType={transactionType}
                onSubmit={handleFormSubmit}
                onCancel={() => setIsTransactionModalOpen(false)}
                isLoading={createMutation.isPending}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* AlertDialog de Confirmação de Exclusão */}
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir a transação "{transactionToDelete?.description}"?
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-danger-600 hover:bg-danger-700 text-white"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
};

export default Financeiro;
