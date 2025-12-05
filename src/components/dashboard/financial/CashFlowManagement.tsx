import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDown, ArrowUp, TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react';
import { useFinancialSummary, useFinancialTransactions } from '@/hooks/useFinancial';
import { formatCurrency, formatDate } from '@/lib/format';

export function CashFlowManagement() {
  const [period, setPeriod] = useState('month');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());

  const getPeriodFilters = () => {
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case 'week': {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        startDate = weekStart.toISOString().split('T')[0];
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        endDate = weekEnd.toISOString().split('T')[0];
        break;
      }

      case 'month': {
        startDate = `${year}-${month.padStart(2, '0')}-01`;
        const lastDayOfMonth = new Date(parseInt(year), parseInt(month), 0);
        endDate = lastDayOfMonth.toISOString().split('T')[0];
        break;
      }

      case 'quarter': {
        const quarter = Math.floor((parseInt(month) - 1) / 3) + 1;
        const quarterStart = ((quarter - 1) * 3) + 1;
        startDate = `${year}-${quarterStart.toString().padStart(2, '0')}-01`;
        const quarterEndMonth = quarter * 3;
        const lastDayOfQuarter = new Date(parseInt(year), quarterEndMonth, 0);
        endDate = lastDayOfQuarter.toISOString().split('T')[0];
        break;
      }

      case 'year': {
        startDate = `${year}-01-01`;
        endDate = `${year}-12-31`;
        break;
      }

      default: {
        startDate = `${year}-${month.padStart(2, '0')}-01`;
        endDate = `${year}-${month.padStart(2, '0')}-31`;
      }
    }

    return { start_date: startDate, end_date: endDate };
  };

  const { data: summary, isLoading: summaryLoading } = useFinancialSummary(getPeriodFilters());
  const { data: transactions, isLoading: transactionsLoading } = useFinancialTransactions(getPeriodFilters());

  const netCashFlow = (summary?.totalReceived || 0) - (summary?.totalPaid || 0);
  const totalInflow = summary?.totalReceivable || 0;
  const totalOutflow = summary?.totalPayable || 0;

  const recentTransactions = transactions?.slice(0, 10) || [];

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: new Date(0, i).toLocaleDateString('pt-BR', { month: 'long' })
  }));

  const years = Array.from({ length: 5 }, (_, i) => {
    const yearValue = new Date().getFullYear() - i;
    return { value: yearValue.toString(), label: yearValue.toString() };
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fluxo de Caixa</h2>
          <p className="text-muted-foreground">Gerencie e acompanhe o fluxo financeiro</p>
        </div>
        
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="month">Mês</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="year">Ano</SelectItem>
            </SelectContent>
          </Select>

          {(period === 'month' || period === 'quarter') && (
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y.value} value={y.value}>
                  {y.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={netCashFlow >= 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Fluxo de Caixa Líquido</p>
                <p className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {formatCurrency(netCashFlow)}
                </p>
              </div>
              {netCashFlow >= 0 ? (
                <TrendingUp className="h-8 w-8 text-green-500" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total a Receber</p>
                <p className="text-2xl font-bold text-blue-700">{formatCurrency(totalInflow)}</p>
                <p className="text-xs text-blue-600 mt-1">
                  {summary?.pendingCount || 0} pendentes
                </p>
              </div>
              <ArrowDown className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Total a Pagar</p>
                <p className="text-2xl font-bold text-orange-700">{formatCurrency(totalOutflow)}</p>
                <p className="text-xs text-orange-600 mt-1">
                  {summary?.overdueCount || 0} vencidos
                </p>
              </div>
              <ArrowUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Saldo em Conta</p>
                <p className="text-2xl font-bold text-purple-700">
                  {formatCurrency((summary?.totalReceived || 0) - (summary?.totalPaid || 0))}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Transações Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${
                      transaction.type === 'receivable' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {transaction.type === 'receivable' ? (
                        <ArrowDown className="h-4 w-4" />
                      ) : (
                        <ArrowUp className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.client?.name || transaction.supplier?.name || 'Sem nome'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Vencimento: {formatDate(transaction.due_date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={
                        transaction.status === 'paid' ? 'default' :
                        transaction.status === 'overdue' ? 'destructive' :
                        'secondary'
                      }
                    >
                      {transaction.status === 'paid' ? 'Pago' :
                       transaction.status === 'overdue' ? 'Vencido' :
                       transaction.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                    </Badge>
                    <p className="font-bold mt-1">
                      {transaction.type === 'receivable' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                    {transaction.paid_amount && (
                      <p className="text-xs text-muted-foreground">
                        Pago: {formatCurrency(transaction.paid_amount)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>Nenhuma transação encontrada neste período</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="w-full justify-start">
              <ArrowDown className="h-4 w-4 mr-2" />
              Nova Receita
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <ArrowUp className="h-4 w-4 mr-2" />
              Nova Despesa
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Calendar className="h-4 w-4 mr-2" />
              Relatório de Fluxo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
