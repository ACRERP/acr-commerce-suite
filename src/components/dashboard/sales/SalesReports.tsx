import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import {
  CalendarIcon,
  Plus,
  RefreshCw,
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  DollarSign,
  ShoppingCart,
  Target,
  Award,
  Crown,
  Medal,
  Star,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  useSellerPerformance,
  useSalesCommissionRules,
  useSalesLeaderboard,
  useSalesReportsSummary,
  formatCurrency,
  formatPercent,
  getRankChangeIcon,
  getRankChangeColor,
  getCommissionTypeText,
  getPeriodTypeText
} from '@/hooks/useSalesReports';

export function SalesReports() {
  const [isCommissionDialogOpen, setIsCommissionDialogOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedSeller, setSelectedSeller] = useState<string>('');
  const [commissionForm, setCommissionForm] = useState({
    name: '',
    description: '',
    commission_type: 'percentage' as 'percentage' | 'fixed' | 'tiered',
    commission_value: '',
    min_sales_amount: '',
    max_sales_amount: '',
    priority: '1',
  });

  const {
    performance,
    calculatePerformance,
    isCalculating
  } = useSellerPerformance(selectedSeller || undefined, startDate, endDate);

  const {
    rules,
    createRule,
    isCreating
  } = useSalesCommissionRules();

  const {
    leaderboard,
    updateLeaderboard,
    isUpdating
  } = useSalesLeaderboard(selectedPeriod, startDate, endDate);

  const { summary } = useSalesReportsSummary(selectedSeller || undefined, startDate, endDate);

  const handleCalculatePerformance = async () => {
    if (!selectedSeller || !startDate || !endDate) return;

    try {
      await calculatePerformance({
        sellerId: selectedSeller,
        periodStart: startDate,
        periodEnd: endDate,
      });
    } catch (error) {
      console.error('Error calculating performance:', error);
    }
  };

  const handleUpdateLeaderboard = async () => {
    if (!startDate || !endDate) return;

    try {
      await updateLeaderboard({
        periodType: selectedPeriod,
        periodStart: startDate,
        periodEnd: endDate,
      });
    } catch (error) {
      console.error('Error updating leaderboard:', error);
    }
  };

  const handleCreateCommissionRule = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createRule({
        name: commissionForm.name,
        description: commissionForm.description,
        commission_type: commissionForm.commission_type,
        commission_value: parseFloat(commissionForm.commission_value),
        min_sales_amount: commissionForm.min_sales_amount ? parseFloat(commissionForm.min_sales_amount) : undefined,
        max_sales_amount: commissionForm.max_sales_amount ? parseFloat(commissionForm.max_sales_amount) : undefined,
        priority: parseInt(commissionForm.priority),
      });

      setIsCommissionDialogOpen(false);
      setCommissionForm({
        name: '',
        description: '',
        commission_type: 'percentage',
        commission_value: '',
        min_sales_amount: '',
        max_sales_amount: '',
        priority: '1',
      });
    } catch (error) {
      console.error('Error creating commission rule:', error);
    }
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-orange-600" />;
      default:
        return <Star className="w-5 h-5 text-gray-300" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Relatórios de Vendas por Vendedor</h2>
          <p className="text-muted-foreground">Análise de performance e comissões da equipe de vendas</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCalculatePerformance} disabled={isCalculating || !selectedSeller}>
            <RefreshCw className={cn("w-4 h-4 mr-2", isCalculating && "animate-spin")} />
            Calcular Performance
          </Button>
          <Button onClick={handleUpdateLeaderboard} disabled={isUpdating}>
            <Trophy className="w-4 h-4 mr-2" />
            Atualizar Ranking
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="grid gap-2">
              <Label>Período</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="quarterly">Trimestral</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Data Inicial</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? (
                      format(new Date(startDate), "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      "Selecione"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate ? new Date(startDate) : undefined}
                    onSelect={(date) =>
                      setStartDate(date ? date.toISOString().split('T')[0] : '')
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label>Data Final</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? (
                      format(new Date(endDate), "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      "Selecione"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate ? new Date(endDate) : undefined}
                    onSelect={(date) =>
                      setEndDate(date ? date.toISOString().split('T')[0] : '')
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label>Vendedor</Label>
              <Select value={selectedSeller || "all"} onValueChange={(v) => setSelectedSeller(v === "all" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Array.from(new Set(performance.map(p => p.seller))).map(seller => (
                    <SelectItem key={seller?.id} value={seller?.id || 'unknown'}>
                      {seller?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalSales)}</div>
              <p className="text-xs text-muted-foreground">
                {summary.totalOrders} pedidos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.averageTicket)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Comissões</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalCommission)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Vendedores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalSellers}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="leaderboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leaderboard">Ranking</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="commissions">Comissões</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle>Ranking de Vendedores</CardTitle>
              <CardDescription>
                {getPeriodTypeText(selectedPeriod)} - {startDate && format(new Date(startDate), 'dd/MM/yyyy', { locale: ptBR })} até {endDate && format(new Date(endDate), 'dd/MM/yyyy', { locale: ptBR })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaderboard.map((entry) => (
                  <Card key={entry.id} className="relative">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100">
                            {getRankIcon(entry.rank_position)}
                          </div>
                          <div>
                            <h3 className="font-semibold">{entry.seller?.name}</h3>
                            <p className="text-sm text-muted-foreground">{entry.seller?.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{formatCurrency(entry.total_sales)}</div>
                          <div className="flex items-center gap-2 text-sm">
                            <span>{entry.total_orders} pedidos</span>
                            {entry.rank_change !== undefined && (
                              <span className={cn("flex items-center gap-1", getRankChangeColor(entry.rank_change))}>
                                {getRankChangeIcon(entry.rank_change)}
                                {Math.abs(entry.rank_change)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Performance</CardTitle>
              <CardDescription>Métricas detalhadas por vendedor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {performance.map((perf) => (
                  <Card key={perf.id}>
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{perf.seller?.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(perf.period_start), 'dd/MM/yyyy', { locale: ptBR })} - {format(new Date(perf.period_end), 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">{formatCurrency(perf.total_sales)}</div>
                            <p className="text-sm text-muted-foreground">{perf.total_orders} vendas</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Ticket Médio:</span> {formatCurrency(perf.average_ticket)}
                          </div>
                          <div>
                            <span className="font-medium">Comissão:</span> {formatPercent(perf.commission_rate)}
                          </div>
                          <div>
                            <span className="font-medium">Total Comissão:</span> {formatCurrency(perf.commission_total)}
                          </div>
                          <div>
                            <span className="font-medium">Itens Vendidos:</span> {perf.total_items}
                          </div>
                        </div>

                        {perf.target_amount && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Meta</span>
                              <span>{formatCurrency(perf.target_amount)}</span>
                            </div>
                            <Progress value={perf.target_achievement || 0} className="h-2" />
                            <div className="text-xs text-muted-foreground">
                              {perf.target_achievement?.toFixed(1)}% da meta alcançada
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                Regras de Comissão
                <Button onClick={() => setIsCommissionDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Regra
                </Button>
              </CardTitle>
              <CardDescription>Configure as regras de comissão para a equipe</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rules.map((rule) => (
                  <Card key={rule.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{rule.name}</h3>
                            <Badge variant="outline">{getCommissionTypeText(rule.commission_type)}</Badge>
                          </div>
                          {rule.description && (
                            <p className="text-sm text-muted-foreground">{rule.description}</p>
                          )}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Valor:</span> {rule.commission_type === 'percentage' ? formatPercent(rule.commission_value) : formatCurrency(rule.commission_value)}
                            </div>
                            {rule.min_sales_amount && (
                              <div>
                                <span className="font-medium">Mínimo:</span> {formatCurrency(rule.min_sales_amount)}
                              </div>
                            )}
                            {rule.max_sales_amount && (
                              <div>
                                <span className="font-medium">Máximo:</span> {formatCurrency(rule.max_sales_amount)}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                            {rule.is_active ? 'Ativa' : 'Inativa'}
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Commission Rule Dialog */}
      <Dialog open={isCommissionDialogOpen} onOpenChange={setIsCommissionDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Regra de Comissão</DialogTitle>
            <DialogDescription>
              Crie uma nova regra de comissão para a equipe de vendas
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCommissionRule}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={commissionForm.name}
                  onChange={(e) => setCommissionForm({ ...commissionForm, name: e.target.value })}
                  placeholder="Nome da regra"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={commissionForm.description}
                  onChange={(e) => setCommissionForm({ ...commissionForm, description: e.target.value })}
                  placeholder="Descrição da regra"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="commission_type">Tipo</Label>
                  <Select
                    value={commissionForm.commission_type}
                    onValueChange={(value: 'percentage' | 'fixed' | 'tiered') =>
                      setCommissionForm({ ...commissionForm, commission_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentual</SelectItem>
                      <SelectItem value="fixed">Fixo</SelectItem>
                      <SelectItem value="tiered">Por Níveis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="commission_value">Valor</Label>
                  <Input
                    id="commission_value"
                    type="number"
                    step="0.01"
                    value={commissionForm.commission_value}
                    onChange={(e) => setCommissionForm({ ...commissionForm, commission_value: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="min_sales_amount">Venda Mínima</Label>
                  <Input
                    id="min_sales_amount"
                    type="number"
                    step="0.01"
                    value={commissionForm.min_sales_amount}
                    onChange={(e) => setCommissionForm({ ...commissionForm, min_sales_amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="max_sales_amount">Venda Máxima</Label>
                  <Input
                    id="max_sales_amount"
                    type="number"
                    step="0.01"
                    value={commissionForm.max_sales_amount}
                    onChange={(e) => setCommissionForm({ ...commissionForm, max_sales_amount: e.target.value })}
                    placeholder="Sem limite"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select
                  value={commissionForm.priority}
                  onValueChange={(value) => setCommissionForm({ ...commissionForm, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Alta</SelectItem>
                    <SelectItem value="2">2 - Média</SelectItem>
                    <SelectItem value="3">3 - Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCommissionDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Criando...' : 'Criar Regra'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
