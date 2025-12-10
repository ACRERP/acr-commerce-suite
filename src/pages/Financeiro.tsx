import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Wallet,
  Edit,
  Trash2
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
import { TransactionForm } from '@/components/dashboard/finance/TransactionForm';
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
import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header">Financeiro</h1>
            <p className="text-muted-foreground mt-1">
              Controle seu fluxo de caixa e finanças
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 bg-green-50 text-green-700 hover:bg-green-100 border-green-200" onClick={() => handleNewTransaction('income')}>
              <ArrowUpRight className="w-4 h-4" />
              Receita
            </Button>
            <Button variant="outline" className="gap-2 bg-red-50 text-red-700 hover:bg-red-100 border-red-200" onClick={() => handleNewTransaction('expense')}>
              <ArrowDownRight className="w-4 h-4" />
              Despesa
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Saldo Atual",
              value: summary?.balance ?? 0,
              icon: Wallet,
              color: (summary?.balance ?? 0) >= 0 ? "success" : "destructive",
              format: true
            },
            {
              label: "Receitas (Total)",
              value: summary?.income ?? 0,
              icon: TrendingUp,
              color: "success",
              format: true
            },
            {
              label: "Despesas (Total)",
              value: summary?.expenses ?? 0,
              icon: TrendingDown,
              color: "destructive",
              format: true
            },
            {
              label: "A Receber (Futuro)",
              value: summary?.pending_income ?? 0,
              icon: CreditCard,
              color: "warning",
              format: true
            },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className="stat-card animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="metric-label">{stat.label}</p>
                  <p className={`metric-value ${stat.color === 'success' ? 'text-green-600' :
                    stat.color === 'destructive' ? 'text-red-600' :
                      stat.color === 'warning' ? 'text-orange-600' : ''
                    }`}>
                    {stat.format
                      ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(stat.value))
                      : stat.value}
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color === 'success' ? 'bg-green-100' :
                  stat.color === 'destructive' ? 'bg-red-100' :
                    stat.color === 'warning' ? 'bg-orange-100' : 'bg-primary/10'
                  }`}>
                  <stat.icon className={`w-5 h-5 ${stat.color === 'success' ? 'text-green-600' :
                    stat.color === 'destructive' ? 'text-red-600' :
                      stat.color === 'warning' ? 'text-orange-600' : 'text-primary'
                    }`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Section */}
          <div className="lg:col-span-2 stat-card">
            <h3 className="section-title mb-4">Fluxo de Caixa (Demo)</h3>
            <div className="h-[300px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-lg">
              <p>Gráfico será implementado com dados históricos reais em breve.</p>
            </div>
          </div>

          {/* Recent Transactions List */}
          <div className="stat-card">
            <h3 className="section-title mb-4">Transações Recentes</h3>
            {isLoadingTransactions ? (
              <div className="flex justify-center p-4">Carregando...</div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {transactions?.map((tx, index) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between py-2 border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === "income" ? "bg-green-100" : "bg-red-100"}`}>
                        {tx.type === "income" ? (
                          <ArrowUpRight className="w-4 h-4 text-green-600" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{tx.description}</p>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span>{format(new Date(tx.date), "dd/MM/yyyy")}</span>
                          <span>•</span>
                          <span className="capitalize">{tx.category || 'Geral'}</span>
                          {tx.status === 'pending' && <span className="text-orange-500 font-bold">• Pendente</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-semibold ${tx.type === "income" ? "text-green-600" : "text-red-600"}`}>
                        {tx.type === "income" ? "+" : "-"}
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(tx.amount)}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditTransaction(tx)}
                          title="Editar transação"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteClick(tx)}
                          title="Excluir transação"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {transactions?.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Nenhuma transação encontrada.</p>
                )}
              </div>
            )}
          </div>
        </div>

        <Dialog open={isTransactionModalOpen} onOpenChange={setIsTransactionModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{transactionType === 'income' ? 'Nova Receita' : 'Nova Despesa'}</DialogTitle>
            </DialogHeader>
            <TransactionForm
              defaultType={transactionType}
              onSubmit={handleFormSubmit}
              onCancel={() => setIsTransactionModalOpen(false)}
              isLoading={createMutation.isPending}
            />
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
                className="bg-red-600 hover:bg-red-700"
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

