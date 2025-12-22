import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calendar,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Users,
  Download,
  Filter,
  RefreshCw,
  Award,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { 
  getClientPurchaseHistory, 
  calculatePurchaseSummary,
  exportPurchaseHistoryToCSV,
  PurchaseHistoryItem,
  PurchaseHistorySummary,
  PurchaseHistoryFilters,
  getClientSegmentation,
  calculateClientLifetimeValue,
  predictNextPurchase
} from '@/lib/purchaseHistory';
import { Client } from './ClientList';

interface PurchaseHistoryProps {
  client: Client;
  className?: string;
}

export function PurchaseHistory({ client, className }: PurchaseHistoryProps) {
  const [purchases, setPurchases] = useState<PurchaseHistoryItem[]>([]);
  const [summary, setSummary] = useState<PurchaseHistorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<PurchaseHistoryFilters>({});
  const [activeTab, setActiveTab] = useState('overview');

  const loadPurchaseHistory = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getClientPurchaseHistory(client.id, filters);
      setPurchases(result.items);
      setSummary(result.summary);
    } catch (error) {
      console.error('Error loading purchase history:', error);
    } finally {
      setLoading(false);
    }
  }, [client.id, filters]);

  useEffect(() => {
    loadPurchaseHistory();
  }, [loadPurchaseHistory]);

  const handleExportCSV = () => {
    if (purchases.length === 0) return;
    
    const csv = exportPurchaseHistoryToCSV(purchases, client);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `historico_compras_${client.name.replace(/\s+/g, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'refunded':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default',
      pending: 'secondary',
      cancelled: 'destructive',
      refunded: 'outline',
    };

    const labels: Record<string, string> = {
      completed: 'Concluída',
      pending: 'Pendente',
      cancelled: 'Cancelada',
      refunded: 'Estornada',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (loading && !summary) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Histórico de Compras
              </CardTitle>
              <CardDescription>
                {client.name} - {summary?.total_purchases || 0} compras realizadas
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => loadPurchaseHistory()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={purchases.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="purchases">Compras</TabsTrigger>
              <TabsTrigger value="analytics">Análises</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {summary && <OverviewTab summary={summary} client={client} />}
            </TabsContent>

            <TabsContent value="purchases" className="space-y-4">
              <PurchasesTab 
                purchases={purchases} 
                loading={loading}
                filters={filters}
                onFiltersChange={setFilters}
                getStatusIcon={getStatusIcon}
                getStatusBadge={getStatusBadge}
              />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              {summary && <AnalyticsTab summary={summary} purchases={purchases} />}
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              {summary && <InsightsTab summary={summary} purchases={purchases} client={client} />}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function OverviewTab({ summary, client }: { summary: PurchaseHistorySummary; client: Client }) {
  const clv = calculateClientLifetimeValue([],); // Would pass actual purchases
  const segmentation = getClientSegmentation(summary, clv);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Compras</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.total_purchases}</div>
          <p className="text-xs text-muted-foreground">
            Última: {summary.last_purchase_date ? new Date(summary.last_purchase_date).toLocaleDateString('pt-BR') : 'N/A'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Gasto</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R$ {summary.total_spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground">
            Média: R$ {summary.average_purchase_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Segmento</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold capitalize">{segmentation.segment}</div>
          <p className="text-xs text-muted-foreground">
            Score: {segmentation.score}/100
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Frequência</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.purchase_frequency.monthly.toFixed(1)}</div>
          <p className="text-xs text-muted-foreground">
            compras/mês
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function PurchasesTab({ 
  purchases, 
  loading, 
  filters, 
  onFiltersChange,
  getStatusIcon,
  getStatusBadge 
}: {
  purchases: PurchaseHistoryItem[];
  loading: boolean;
  filters: PurchaseHistoryFilters;
  onFiltersChange: (filters: PurchaseHistoryFilters) => void;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusBadge: (status: string) => React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          {purchases.length} compras encontradas
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : purchases.length === 0 ? (
        <div className="text-center py-8">
          <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhuma compra encontrada</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Produtos</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.map((purchase) => (
              <TableRow key={purchase.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(purchase.status)}
                    <span>{new Date(purchase.sale_date).toLocaleDateString('pt-BR')}</span>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                <TableCell>
                  R$ {purchase.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell>{purchase.payment_method}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    {purchase.items.length} item(s)
                    {purchase.items.length > 0 && (
                      <div className="text-muted-foreground">
                        {purchase.items[0].product?.name}
                        {purchase.items.length > 1 && ` +${purchase.items.length - 1}`}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    Ver Detalhes
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function AnalyticsTab({ summary, purchases }: { summary: PurchaseHistorySummary; purchases: PurchaseHistoryItem[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Produtos Favoritos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {summary.favorite_products.slice(0, 5).map((product, index) => (
              <div key={product.product_id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{product.product_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.quantity} unidades
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    R$ {product.total_spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Preferências de Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {summary.payment_preferences.map((pref) => (
              <div key={pref.method} className="flex items-center justify-between">
                <span className="font-medium">{pref.method}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-muted rounded-full h-2">
                    {/* Inline style used for dynamic width calculation - justified for progress bar */}
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${pref.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {pref.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InsightsTab({ summary, purchases, client }: { 
  summary: PurchaseHistorySummary; 
  purchases: PurchaseHistoryItem[];
  client: Client;
}) {
  const clv = calculateClientLifetimeValue(purchases);
  const segmentation = getClientSegmentation(summary, clv);
  const prediction = predictNextPurchase(purchases);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Análise do Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Segmento: {segmentation.segment}</h4>
            <p className="text-sm text-muted-foreground mb-2">Score: {segmentation.score}/100</p>
            <div className="space-y-1">
              {segmentation.reasons.map((reason, index) => (
                <div key={index} className="text-sm text-muted-foreground">
                  • {reason}
                </div>
              ))}
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Valor de Vida do Cliente</h4>
            <p className="text-2xl font-bold">
              R$ {clv.clv.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-muted-foreground">
              Média mensal: R$ {clv.averageMonthlyValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Previsões
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Próxima Compra Prevista</h4>
            {prediction.predictedDate ? (
              <div>
                <p className="text-lg font-semibold">
                  {new Date(prediction.predictedDate).toLocaleDateString('pt-BR')}
                </p>
                <p className="text-sm text-muted-foreground">
                  Confiança: {prediction.confidence.toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {prediction.reasoning}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {prediction.reasoning}
              </p>
            )}
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Frequência de Compras</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">{summary.purchase_frequency.weekly.toFixed(1)}</p>
                <p className="text-muted-foreground">por semana</p>
              </div>
              <div>
                <p className="font-medium">{summary.purchase_frequency.monthly.toFixed(1)}</p>
                <p className="text-muted-foreground">por mês</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
