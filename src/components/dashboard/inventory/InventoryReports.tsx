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
  Download, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpDown,
  BarChart3,
  FileText,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  useInventoryBalance, 
  useInventoryMovements, 
  useInventoryReports,
  useInventoryTurnover,
  useInventorySummary,
  useInventoryCounts,
  useInventoryCountItems,
  formatCurrency,
  formatQuantity,
  getMovementTypeText,
  getMovementTypeColor,
  getCountStatusText,
  getCountStatusColor,
  getReportTypeText
} from '@/hooks/useInventoryReports';

export function InventoryReports() {
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedCount, setSelectedCount] = useState<string>('');
  
  const [reportForm, setReportForm] = useState({
    reportName: '',
    reportType: 'balance' as 'balance' | 'movement' | 'valuation' | 'turnover' | 'variance' | 'aging',
    periodStart: '',
    periodEnd: '',
  });

  const [movementForm, setMovementForm] = useState({
    productId: '',
    movementType: 'in' as 'in' | 'out' | 'adjustment' | 'transfer' | 'return',
    quantity: '',
    unitCost: '',
    reason: '',
    location: 'Principal',
  });

  const { balance, updateBalance, isUpdating } = useInventoryBalance(selectedProduct || undefined, selectedLocation === 'all' ? undefined : selectedLocation);
  const { movements, createMovement, isCreating } = useInventoryMovements(selectedProduct || undefined, selectedLocation === 'all' ? undefined : selectedLocation, startDate, endDate);
  const { reports, generateReport, isGenerating } = useInventoryReports();
  const { turnover } = useInventoryTurnover(startDate, endDate);
  const { summary } = useInventorySummary();
  const { counts } = useInventoryCounts();
  const { items, updateItem } = useInventoryCountItems(selectedCount);

  const handleGenerateReport = async () => {
    try {
      await generateReport({
        reportType: reportForm.reportType,
        reportName: reportForm.reportName,
        periodStart: reportForm.periodStart,
        periodEnd: reportForm.periodEnd,
      });
      
      setIsReportDialogOpen(false);
      setReportForm({
        reportName: '',
        reportType: 'balance',
        periodStart: '',
        periodEnd: '',
      });
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const handleCreateMovement = async () => {
    try {
      await createMovement({
        product_id: movementForm.productId,
        movement_type: movementForm.movementType,
        quantity: parseFloat(movementForm.quantity),
        unit_cost: movementForm.unitCost ? parseFloat(movementForm.unitCost) : undefined,
        reason: movementForm.reason,
        location: movementForm.location,
      });
      
      setIsMovementDialogOpen(false);
      setMovementForm({
        productId: '',
        movementType: 'in',
        quantity: '',
        unitCost: '',
        reason: '',
        location: 'Principal',
      });
    } catch (error) {
      console.error('Error creating movement:', error);
    }
  };

  const getLocations = () => {
    const locations = new Set(balance.map(item => item.location).filter(Boolean));
    return Array.from(locations);
  };

  const getLowStockItems = () => {
    return balance.filter(item => item.quantity_available <= 5 && item.quantity_available > 0);
  };

  const getOutOfStockItems = () => {
    return balance.filter(item => item.quantity_available === 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Relatórios de Estoque</h2>
          <p className="text-muted-foreground">Monitore movimentações, saldos e análise de inventário</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsMovementDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Registrar Movimentação
          </Button>
          <Button onClick={() => setIsReportDialogOpen(true)}>
            <FileText className="w-4 h-4 mr-2" />
            Gerar Relatório
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                {formatQuantity(summary.totalQuantity)} unidades
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalValue)}</div>
              <p className="text-xs text-muted-foreground">
                Média: {formatCurrency(summary.averageValue)}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{summary.lowStockItems}</div>
              <p className="text-xs text-muted-foreground">
                {summary.lowStockItems > 0 && 'Atenção necessária'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Sem Estoque</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.outOfStockItems}</div>
              <p className="text-xs text-muted-foreground">
                {summary.outOfStockItems > 0 && 'Reposição urgente'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Contagens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.length}</div>
              <p className="text-xs text-muted-foreground">
                {counts.filter(c => c.status === 'completed').length} concluídas
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="grid gap-2">
              <Label>Localização</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {getLocations().map((location) => (
                    <SelectItem key={location} value={location || ''}>
                      {location}
                    </SelectItem>
                  ))}
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
              <Label>Produto</Label>
              <Input
                placeholder="Buscar produto..."
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="balance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="balance">Saldo de Estoque</TabsTrigger>
          <TabsTrigger value="movements">Movimentações</TabsTrigger>
          <TabsTrigger value="turnover">Giro de Estoque</TabsTrigger>
          <TabsTrigger value="counts">Contagens</TabsTrigger>
          <TabsTrigger value="reports">Relatórios Gerados</TabsTrigger>
        </TabsList>

        <TabsContent value="balance">
          <Card>
            <CardHeader>
              <CardTitle>Saldo de Estoque</CardTitle>
              <CardDescription>Quantidade atual de produtos por localização</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {balance.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{item.product?.name}</h3>
                            {item.product?.sku && (
                              <Badge variant="outline">SKU: {item.product.sku}</Badge>
                            )}
                            {item.location && (
                              <Badge variant="secondary">{item.location}</Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Disponível:</span> {formatQuantity(item.quantity_available)}
                            </div>
                            <div>
                              <span className="font-medium">Reservado:</span> {formatQuantity(item.quantity_reserved)}
                            </div>
                            <div>
                              <span className="font-medium">Total:</span> {formatQuantity(item.quantity_on_hand)}
                            </div>
                            <div>
                              <span className="font-medium">Valor:</span> {formatCurrency(item.total_value || 0)}
                            </div>
                          </div>
                          {item.quantity_available <= 5 && (
                            <div className="flex items-center gap-2 text-sm text-yellow-600">
                              <AlertTriangle className="w-4 h-4" />
                              Estoque baixo
                            </div>
                          )}
                          {item.quantity_available === 0 && (
                            <div className="flex items-center gap-2 text-sm text-red-600">
                              <AlertTriangle className="w-4 h-4" />
                              Sem estoque
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="w-32">
                            <Progress 
                              value={item.quantity_on_hand > 0 ? (item.quantity_available / item.quantity_on_hand) * 100 : 0} 
                              className="h-2" 
                            />
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {item.quantity_on_hand > 0 ? Math.round((item.quantity_available / item.quantity_on_hand) * 100) : 0}% disponível
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

        <TabsContent value="movements">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Movimentações</CardTitle>
              <CardDescription>Registro de todas as entradas e saídas do estoque</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {movements.map((movement) => (
                  <Card key={movement.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{movement.product?.name}</h3>
                            <Badge className={getMovementTypeColor(movement.movement_type)}>
                              {getMovementTypeText(movement.movement_type)}
                            </Badge>
                            {movement.location && (
                              <Badge variant="outline">{movement.location}</Badge>
                            )}
                          </div>
                          {movement.reason && (
                            <p className="text-sm text-muted-foreground">{movement.reason}</p>
                          )}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Quantidade:</span> {formatQuantity(movement.quantity)}
                            </div>
                            {movement.unit_cost && (
                              <div>
                                <span className="font-medium">Custo Unit.:</span> {formatCurrency(movement.unit_cost)}
                              </div>
                            )}
                            {movement.total_cost && (
                              <div>
                                <span className="font-medium">Total:</span> {formatCurrency(movement.total_cost)}
                              </div>
                            )}
                            <div>
                              <span className="font-medium">Data:</span> {format(new Date(movement.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">
                            {movement.creator?.name}
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

        <TabsContent value="turnover">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Giro de Estoque</CardTitle>
              <CardDescription>Velocidade de renovação do estoque por produto</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {turnover.map((item) => (
                  <Card key={item.product_id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{item.product_name}</h3>
                            {item.sku && (
                              <Badge variant="outline">SKU: {item.sku}</Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Estoque Médio:</span> {formatCurrency(item.average_inventory)}
                            </div>
                            <div>
                              <span className="font-medium">CMV:</span> {formatCurrency(item.cost_of_goods_sold)}
                            </div>
                            <div>
                              <span className="font-medium">Giro:</span> {item.turnover_ratio.toFixed(2)}x
                            </div>
                            {item.days_supply && (
                              <div>
                                <span className="font-medium">Dias de Estoque:</span> {item.days_supply}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            {item.turnover_ratio.toFixed(1)}x
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.days_supply ? `${item.days_supply} dias` : 'N/A'}
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

        <TabsContent value="counts">
          <Card>
            <CardHeader>
              <CardTitle>Contagens de Inventário</CardTitle>
              <CardDescription>Registro de contagens físicas do estoque</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {counts.map((count) => (
                  <Card key={count.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{count.count_name}</h3>
                            <Badge className={getCountStatusColor(count.status)}>
                              {getCountStatusText(count.status)}
                            </Badge>
                            <Badge variant="outline">{count.count_type}</Badge>
                          </div>
                          {count.notes && (
                            <p className="text-sm text-muted-foreground">{count.notes}</p>
                          )}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Produtos:</span> {count.counted_products}/{count.total_products}
                            </div>
                            {count.variance_amount !== 0 && (
                              <div>
                                <span className="font-medium">Variação:</span> {formatCurrency(count.variance_amount)}
                              </div>
                            )}
                            {count.scheduled_date && (
                              <div>
                                <span className="font-medium">Agendado:</span> {format(new Date(count.scheduled_date), 'dd/MM/yyyy', { locale: ptBR })}
                              </div>
                            )}
                            {count.completed_at && (
                              <div>
                                <span className="font-medium">Concluído:</span> {format(new Date(count.completed_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedCount(count.id)}
                          >
                            <Search className="w-4 h-4 mr-2" />
                            Ver Detalhes
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

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios Gerados</CardTitle>
              <CardDescription>Histórico de relatórios de estoque</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.map((report) => (
                  <Card key={report.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{report.report_name}</h3>
                            <Badge variant="outline">{getReportTypeText(report.report_type)}</Badge>
                            <Badge variant="secondary">{report.status}</Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Gerado:</span> {format(new Date(report.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </div>
                            {report.period_start && report.period_end && (
                              <div>
                                <span className="font-medium">Período:</span> {format(new Date(report.period_start), 'dd/MM/yyyy', { locale: ptBR })} - {format(new Date(report.period_end), 'dd/MM/yyyy', { locale: ptBR })}
                              </div>
                            )}
                            {report.file_format && (
                              <div>
                                <span className="font-medium">Formato:</span> {report.file_format.toUpperCase()}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {report.file_url && (
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4 mr-2" />
                              Baixar
                            </Button>
                          )}
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

      {/* Generate Report Dialog */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Gerar Relatório de Estoque</DialogTitle>
            <DialogDescription>
              Configure os parâmetros para gerar um novo relatório
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reportName">Nome do Relatório</Label>
              <Input
                id="reportName"
                value={reportForm.reportName}
                onChange={(e) => setReportForm({ ...reportForm, reportName: e.target.value })}
                placeholder="Nome do relatório"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="reportType">Tipo de Relatório</Label>
              <Select
                value={reportForm.reportType}
                onValueChange={(value: any) => setReportForm({ ...reportForm, reportType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="balance">Saldo de Estoque</SelectItem>
                  <SelectItem value="movement">Movimentação</SelectItem>
                  <SelectItem value="valuation">Avaliação</SelectItem>
                  <SelectItem value="turnover">Giro de Estoque</SelectItem>
                  <SelectItem value="variance">Variação</SelectItem>
                  <SelectItem value="aging">Envelhecimento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Data Inicial</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !reportForm.periodStart && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {reportForm.periodStart ? (
                        format(new Date(reportForm.periodStart), "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        "Selecione"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={reportForm.periodStart ? new Date(reportForm.periodStart) : undefined}
                      onSelect={(date) => 
                        setReportForm({ 
                          ...reportForm, 
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
                        !reportForm.periodEnd && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {reportForm.periodEnd ? (
                        format(new Date(reportForm.periodEnd), "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        "Selecione"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={reportForm.periodEnd ? new Date(reportForm.periodEnd) : undefined}
                      onSelect={(date) => 
                        setReportForm({ 
                          ...reportForm, 
                          periodEnd: date ? date.toISOString().split('T')[0] : '' 
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsReportDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={handleGenerateReport}
              disabled={!reportForm.reportName || isGenerating}
            >
              {isGenerating ? 'Gerando...' : 'Gerar Relatório'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Movement Dialog */}
      <Dialog open={isMovementDialogOpen} onOpenChange={setIsMovementDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Registrar Movimentação</DialogTitle>
            <DialogDescription>
              Adicione uma nova movimentação de estoque
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="productId">Produto</Label>
              <Input
                id="productId"
                value={movementForm.productId}
                onChange={(e) => setMovementForm({ ...movementForm, productId: e.target.value })}
                placeholder="ID do produto"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="movementType">Tipo</Label>
                <Select
                  value={movementForm.movementType}
                  onValueChange={(value: any) => setMovementForm({ ...movementForm, movementType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">Entrada</SelectItem>
                    <SelectItem value="out">Saída</SelectItem>
                    <SelectItem value="adjustment">Ajuste</SelectItem>
                    <SelectItem value="transfer">Transferência</SelectItem>
                    <SelectItem value="return">Devolução</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantidade</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  value={movementForm.quantity}
                  onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="unitCost">Custo Unitário</Label>
                <Input
                  id="unitCost"
                  type="number"
                  step="0.01"
                  value={movementForm.unitCost}
                  onChange={(e) => setMovementForm({ ...movementForm, unitCost: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="location">Localização</Label>
                <Input
                  id="location"
                  value={movementForm.location}
                  onChange={(e) => setMovementForm({ ...movementForm, location: e.target.value })}
                  placeholder="Principal"
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="reason">Motivo</Label>
              <Textarea
                id="reason"
                value={movementForm.reason}
                onChange={(e) => setMovementForm({ ...movementForm, reason: e.target.value })}
                placeholder="Motivo da movimentação"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsMovementDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={handleCreateMovement}
              disabled={!movementForm.productId || !movementForm.quantity || isCreating}
            >
              {isCreating ? 'Registrando...' : 'Registrar Movimentação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
