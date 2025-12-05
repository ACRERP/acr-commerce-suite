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
  Play, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart,
  Settings,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Target,
  DollarSign,
  Package,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  useABCAnalysis, 
  useABCAnalysisSummary, 
  useABCAnalysisConfig,
  useABCRecommendations,
  useABCHistory,
  formatCurrency,
  formatPercent,
  getABCClassColor,
  getABCClassDescription,
  getAnalysisTypeText,
  getRecommendationTypeText,
  getPriorityColor
} from '@/hooks/useABCAnalysis';

export function ABCAnalysis() {
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [analysisForm, setAnalysisForm] = useState({
    periodStart: '',
    periodEnd: '',
    analysisType: 'revenue' as 'revenue' | 'quantity' | 'profit',
    classAThreshold: '80',
    classBThreshold: '95',
  });

  const { 
    analysis, 
    performAnalysis, 
    isPerforming 
  } = useABCAnalysis(selectedDate, selectedClass);
  
  const { summary } = useABCAnalysisSummary(selectedDate);
  const { configs } = useABCAnalysisConfig();
  const { recommendations } = useABCRecommendations(selectedDate);
  const { history } = useABCHistory();

  const handlePerformAnalysis = async () => {
    try {
      await performAnalysis({
        periodStart: analysisForm.periodStart,
        periodEnd: analysisForm.periodEnd,
        analysisType: analysisForm.analysisType,
        classAThreshold: parseFloat(analysisForm.classAThreshold),
        classBThreshold: parseFloat(analysisForm.classBThreshold),
      });
      
      setIsAnalysisDialogOpen(false);
      setAnalysisForm({
        periodStart: '',
        periodEnd: '',
        analysisType: 'revenue',
        classAThreshold: '80',
        classBThreshold: '95',
      });
    } catch (error) {
      console.error('Error performing ABC analysis:', error);
    }
  };

  const getLatestAnalysisDate = React.useCallback(() => {
    if (history.length > 0) {
      return history[0].analysis_date;
    }
    return format(new Date(), 'yyyy-MM-dd');
  }, [history]);

  React.useEffect(() => {
    if (!selectedDate && history.length > 0) {
      setSelectedDate(getLatestAnalysisDate());
    }
  }, [history, selectedDate, getLatestAnalysisDate]);

  const classStats = summary ? {
    A: {
      products: summary.class_a_products,
      revenue: summary.class_a_revenue,
      percentage: summary.class_a_percentage,
    },
    B: {
      products: summary.class_b_products,
      revenue: summary.class_b_revenue,
      percentage: summary.class_b_percentage,
    },
    C: {
      products: summary.class_c_products,
      revenue: summary.class_c_revenue,
      percentage: summary.class_c_percentage,
    },
  } : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Análise ABC de Produtos</h2>
          <p className="text-muted-foreground">Classificação de produtos por relevância e desempenho</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAnalysisDialogOpen(true)}>
            <Play className="w-4 h-4 mr-2" />
            Nova Análise
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label>Data da Análise</Label>
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma data" />
                </SelectTrigger>
                <SelectContent>
                  {history.map((h) => (
                    <SelectItem key={h.analysis_date} value={h.analysis_date}>
                      {format(new Date(h.analysis_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label>Classe ABC</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="A">Classe A</SelectItem>
                  <SelectItem value="B">Classe B</SelectItem>
                  <SelectItem value="C">Classe C</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label>Configuração</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Configuração padrão" />
                </SelectTrigger>
                <SelectContent>
                  {configs.map((config) => (
                    <SelectItem key={config.id} value={config.id}>
                      {config.name}
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
              <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_products}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(summary.total_revenue)}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Classe A</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.class_a_products}</div>
              <p className="text-xs text-muted-foreground">
                {formatPercent(summary.class_a_percentage)} da receita
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Classe B</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{summary.class_b_products}</div>
              <p className="text-xs text-muted-foreground">
                {formatPercent(summary.class_b_percentage)} da receita
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Classe C</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.class_c_products}</div>
              <p className="text-xs text-muted-foreground">
                {formatPercent(summary.class_c_percentage)} da receita
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="analysis" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analysis">Análise</TabsTrigger>
          <TabsTrigger value="chart">Gráficos</TabsTrigger>
          <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis">
          <Card>
            <CardHeader>
              <CardTitle>Análise Detalhada</CardTitle>
              <CardDescription>
                {selectedDate && format(new Date(selectedDate), 'dd/MM/yyyy', { locale: ptBR })} - 
                {summary && ` ${format(new Date(summary.period_start), 'dd/MM/yyyy', { locale: ptBR })} até ${format(new Date(summary.period_end), 'dd/MM/yyyy', { locale: ptBR })}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{item.product_name}</h3>
                            <Badge className={getABCClassColor(item.abc_class)}>
                              Classe {item.abc_class}
                            </Badge>
                            <Badge variant="outline">#{item.rank_position}</Badge>
                          </div>
                          {item.product_sku && (
                            <p className="text-sm text-muted-foreground">SKU: {item.product_sku}</p>
                          )}
                          {item.product_category && (
                            <p className="text-sm text-muted-foreground">Categoria: {item.product_category}</p>
                          )}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Receita:</span> {formatCurrency(item.total_revenue)}
                            </div>
                            <div>
                              <span className="font-medium">Quantidade:</span> {item.total_quantity}
                            </div>
                            <div>
                              <span className="font-medium">Margem:</span> {formatPercent(item.profit_margin)}
                            </div>
                            <div>
                              <span className="font-medium">% Acumulada:</span> {formatPercent(item.cumulative_revenue_percentage)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground mb-2">
                            {getABCClassDescription(item.abc_class)}
                          </div>
                          <div className="w-32">
                            <Progress value={item.cumulative_revenue_percentage} className="h-2" />
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

        <TabsContent value="chart">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Distribuição por Classe
                </CardTitle>
              </CardHeader>
              <CardContent>
                {classStats && (
                  <div className="space-y-4">
                    {Object.entries(classStats).map(([className, stats]) => (
                      <div key={className} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Classe {className}</span>
                          <span>{formatPercent(stats.percentage)}</span>
                        </div>
                        <Progress value={stats.percentage} className="h-3" />
                        <div className="text-sm text-muted-foreground">
                          {stats.products} produtos - {formatCurrency(stats.revenue)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Curva ABC
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Gráfico mostrando a distribuição cumulativa de receita por produto
                  </div>
                  <div className="h-64 flex items-center justify-center border rounded-lg">
                    <div className="text-center text-muted-foreground">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                      <p>Gráfico será implementado com biblioteca de visualização</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Recomendações
              </CardTitle>
              <CardDescription>
                Sugestões baseadas na análise ABC para otimização de estoque e estratégias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {rec.priority === 'ALTA' && <AlertTriangle className="w-5 h-5 text-red-600" />}
                          {rec.priority === 'MEDIA' && <CheckCircle className="w-5 h-5 text-yellow-600" />}
                          {rec.priority === 'BAIXA' && <CheckCircle className="w-5 h-5 text-green-600" />}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{rec.product_name}</h3>
                            <Badge className={getABCClassColor(rec.current_class)}>
                              Classe {rec.current_class}
                            </Badge>
                            <Badge className={getPriorityColor(rec.priority)}>
                              {rec.priority}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-blue-600">
                            {getRecommendationTypeText(rec.recommendation_type)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {rec.suggested_action}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {rec.reasoning}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Análises</CardTitle>
              <CardDescription>
                Evolução das análises ABC ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {history.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">
                              {format(new Date(item.analysis_date), 'dd/MM/yyyy', { locale: ptBR })}
                            </h3>
                            <Badge variant="outline">
                              {format(new Date(item.period_start), 'dd/MM/yyyy', { locale: ptBR })} - {format(new Date(item.period_end), 'dd/MM/yyyy', { locale: ptBR })}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Classe A:</span> {item.class_a_products} produtos ({formatPercent(item.class_a_percentage)})
                            </div>
                            <div>
                              <span className="font-medium">Classe B:</span> {item.class_b_products} produtos ({formatPercent(item.class_b_percentage)})
                            </div>
                            <div>
                              <span className="font-medium">Classe C:</span> {item.class_c_products} produtos ({formatPercent(item.class_c_percentage)})
                            </div>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Total:</span> {formatCurrency(item.total_revenue)} em {item.total_products} produtos
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDate(item.analysis_date)}
                        >
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Ver Detalhes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Perform Analysis Dialog */}
      <Dialog open={isAnalysisDialogOpen} onOpenChange={setIsAnalysisDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Análise ABC</DialogTitle>
            <DialogDescription>
              Configure os parâmetros para realizar uma nova análise ABC
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Data Inicial</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !analysisForm.periodStart && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {analysisForm.periodStart ? (
                        format(new Date(analysisForm.periodStart), "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        "Selecione"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={analysisForm.periodStart ? new Date(analysisForm.periodStart) : undefined}
                      onSelect={(date) => 
                        setAnalysisForm({ 
                          ...analysisForm, 
                          periodStart: date ? date.toISOString().split('T')[0] : '' 
                        })
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
                        !analysisForm.periodEnd && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {analysisForm.periodEnd ? (
                        format(new Date(analysisForm.periodEnd), "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        "Selecione"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={analysisForm.periodEnd ? new Date(analysisForm.periodEnd) : undefined}
                      onSelect={(date) => 
                        setAnalysisForm({ 
                          ...analysisForm, 
                          periodEnd: date ? date.toISOString().split('T')[0] : '' 
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label>Tipo de Análise</Label>
              <Select
                value={analysisForm.analysisType}
                onValueChange={(value: 'revenue' | 'quantity' | 'profit') => 
                  setAnalysisForm({ ...analysisForm, analysisType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Receita</SelectItem>
                  <SelectItem value="quantity">Quantidade</SelectItem>
                  <SelectItem value="profit">Lucratividade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Limite Classe A (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={analysisForm.classAThreshold}
                  onChange={(e) => setAnalysisForm({ ...analysisForm, classAThreshold: e.target.value })}
                  placeholder="80"
                />
              </div>
              
              <div className="grid gap-2">
                <Label>Limite Classe B (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={analysisForm.classBThreshold}
                  onChange={(e) => setAnalysisForm({ ...analysisForm, classBThreshold: e.target.value })}
                  placeholder="95"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsAnalysisDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={handlePerformAnalysis}
              disabled={!analysisForm.periodStart || !analysisForm.periodEnd || isPerforming}
            >
              {isPerforming ? 'Analisando...' : 'Realizar Análise'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
