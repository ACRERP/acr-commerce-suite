import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Users,
  Target,
  TrendingUp,
  PieChart,
  BarChart3,
  Plus,
  Settings,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  UserPlus,
  UserMinus,
  Lightbulb
} from 'lucide-react';
import { 
  ClientSegment,
  ClientSegmentation,
  SegmentationAnalytics,
  SegmentationSuggestion,
  createDefaultSegments,
  generateSegmentationSuggestions,
  calculateRFMScore,
  predictChurnProbability,
  getSegmentColors,
  exportSegmentToCSV,
  applySegmentationRules
} from '@/lib/clientSegmentation';
import { Client } from './ClientList';

interface ClientSegmentationProps {
  client: Client;
  className?: string;
}

export function ClientSegmentation({ client, className }: ClientSegmentationProps) {
  const [segments, setSegments] = useState<ClientSegment[]>([]);
  const [clientSegmentations, setClientSegmentations] = useState<ClientSegmentation[]>([]);
  const [analytics, setAnalytics] = useState<SegmentationAnalytics | null>(null);
  const [suggestions, setSuggestions] = useState<SegmentationSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const loadSegmentationData = useCallback(async () => {
    setLoading(true);
    try {
      // Load default segments
      const defaultSegments = createDefaultSegments();
      setSegments(defaultSegments);

      // Generate suggestions
      const suggestions = generateSegmentationSuggestions([client], []);
      setSuggestions(suggestions);

      // Apply segmentation to current client
      const mockClientData = {
        lastPurchaseDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
        purchaseFrequency: 4.5,
        totalSpent: 2500,
        averageTicket: 180,
        creditLimit: 1000,
        creditUsed: 300,
      };

      const segmentations = applySegmentationRules(client, defaultSegments, mockClientData);
      setClientSegmentations(segmentations);

      // Mock analytics
      setAnalytics({
        totalClients: 150,
        segmentDistribution: defaultSegments.map(segment => ({
          segmentId: segment.id,
          segmentName: segment.name,
          clientCount: Math.floor(Math.random() * 50) + 10,
          percentage: 0,
          totalRevenue: Math.floor(Math.random() * 10000) + 1000,
          averageTicket: Math.floor(Math.random() * 500) + 100,
          growthRate: (Math.random() - 0.5) * 20,
        })),
        performanceMetrics: {
          retentionRate: 75,
          acquisitionRate: 12,
          churnRate: 8,
          averageLifetimeValue: 2500,
        },
        trends: [],
      });

      // Calculate percentages
      const totalClients = defaultSegments.reduce((sum, segment) => {
        const segmentData = analytics?.segmentDistribution.find(s => s.segmentId === segment.id);
        return sum + (segmentData?.clientCount || 0);
      }, 0);

      setAnalytics(prev => prev ? {
        ...prev,
        segmentDistribution: prev.segmentDistribution.map(segment => ({
          ...segment,
          percentage: totalClients > 0 ? (segment.clientCount / totalClients) * 100 : 0,
        })),
      } : null);

    } catch (error) {
      console.error('Error loading segmentation data:', error);
    } finally {
      setLoading(false);
    }
  }, [client, analytics?.segmentDistribution]);

  useEffect(() => {
    loadSegmentationData();
  }, [loadSegmentationData]);

  const handleExportSegment = (segment: ClientSegment) => {
    const csv = exportSegmentToCSV(segment, clientSegmentations, [client]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `segment_${segment.name.replace(/\s+/g, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSegmentColor = (segmentName: string) => {
    const colors = getSegmentColors();
    return colors[segmentName] || '#6b7280';
  };

  const getRFMScore = () => {
    return calculateRFMScore(
      new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      4.5,
      2500
    );
  };

  const getChurnPrediction = () => {
    return predictChurnProbability(15, 4.5, 180, 12);
  };

  if (loading && !segments.length) {
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
                <Target className="h-5 w-5" />
                Segmentação de Clientes
              </CardTitle>
              <CardDescription>
                {client.name} - Análise de segmentação e comportamento
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadSegmentationData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Segmento
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Novo Segmento</DialogTitle>
                    <DialogDescription>
                      Defina critérios para criar um novo segmento de clientes.
                    </DialogDescription>
                  </DialogHeader>
                  <SegmentCreationForm 
                    onSubmit={(segmentData) => {
                      // Handle segment creation
                      setIsCreateDialogOpen(false);
                    }}
                    onCancel={() => setIsCreateDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="segments">Segmentos</TabsTrigger>
              <TabsTrigger value="analytics">Análises</TabsTrigger>
              <TabsTrigger value="suggestions">Sugestões</TabsTrigger>
              <TabsTrigger value="rfm">RFM</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <ClientOverview 
                client={client}
                segmentations={clientSegmentations}
                rfmScore={getRFMScore()}
                churnPrediction={getChurnPrediction()}
              />
            </TabsContent>

            <TabsContent value="segments" className="space-y-4">
              <SegmentsList 
                segments={segments}
                clientSegmentations={clientSegmentations}
                onExport={handleExportSegment}
                getSegmentColor={getSegmentColor}
              />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <SegmentationAnalyticsView analytics={analytics} getSegmentColor={getSegmentColor} />
            </TabsContent>

            <TabsContent value="suggestions" className="space-y-4">
              <SegmentationSuggestions suggestions={suggestions} />
            </TabsContent>

            <TabsContent value="rfm" className="space-y-4">
              <RFMAnalysis rfmScore={getRFMScore()} client={client} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function ClientOverview({ 
  client, 
  segmentations, 
  rfmScore, 
  churnPrediction 
}: { 
  client: Client;
  segmentations: ClientSegmentation[];
  rfmScore: ReturnType<typeof calculateRFMScore>;
  churnPrediction: ReturnType<typeof predictChurnProbability>;
}) {
  const primarySegment = segmentations[0];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Segmento Principal</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {primarySegment?.segmentName || 'Não segmentado'}
            </div>
            <p className="text-xs text-muted-foreground">
              Score: {primarySegment?.score || 0}/100
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score RFM</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rfmScore.overallScore.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              {rfmScore.segment}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risco de Churn</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {churnPrediction.probability}%
            </div>
            <p className="text-xs text-muted-foreground">
              {churnPrediction.riskLevel}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confiança</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {primarySegment?.confidence || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Na segmentação
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes da Segmentação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium mb-2">Segmentos Ativos</h4>
                <div className="space-y-1">
                  {segmentations.map((segmentation, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{segmentation.segmentName}</span>
                      <Badge variant="outline">{segmentation.confidence}%</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Análise RFM</h4>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Recência</span>
                    <span className="text-sm font-medium">{rfmScore.recencyScore}/5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Frequência</span>
                    <span className="text-sm font-medium">{rfmScore.frequencyScore}/5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Monetário</span>
                    <span className="text-sm font-medium">{rfmScore.monetaryScore}/5</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Fatores de Risco</h4>
                <div className="space-y-1">
                  {churnPrediction.factors.map((factor, index) => (
                    <div key={index} className="text-sm text-muted-foreground">
                      • {factor}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SegmentsList({ 
  segments, 
  clientSegmentations, 
  onExport, 
  getSegmentColor 
}: { 
  segments: ClientSegment[];
  clientSegmentations: ClientSegmentation[];
  onExport: (segment: ClientSegment) => void;
  getSegmentColor: (name: string) => string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Segmentos Disponíveis</h3>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exportar Todos
        </Button>
      </div>

      <div className="grid gap-4">
        {segments.map((segment) => {
          const clientSegmentation = clientSegmentations.find(cs => cs.segmentId === segment.id);
          const isAssigned = !!clientSegmentation;

          return (
            <Card key={segment.id} className={isAssigned ? 'border-green-200 bg-green-50' : ''}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: getSegmentColor(segment.name) }}
                    />
                    <div>
                      <h4 className="font-semibold">{segment.name}</h4>
                      <p className="text-sm text-muted-foreground">{segment.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAssigned && (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {clientSegmentation.confidence}% match
                      </Badge>
                    )}
                    <Button variant="outline" size="sm" onClick={() => onExport(segment)}>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function SegmentationAnalyticsView({ 
  analytics, 
  getSegmentColor 
}: { 
  analytics: SegmentationAnalytics | null;
  getSegmentColor: (name: string) => string;
}) {
  if (!analytics) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Dados Indisponíveis</h3>
          <p className="text-muted-foreground text-center max-w-md">
            As análises de segmentação serão disponíveis quando houver dados suficientes.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              Em todos os segmentos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Retenção</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.performanceMetrics.retentionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Clientes ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Churn</CardTitle>
            <UserMinus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{analytics.performanceMetrics.churnRate}%</div>
            <p className="text-xs text-muted-foreground">
              Clientes perdidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CLV Médio</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {analytics.performanceMetrics.averageLifetimeValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor de vida do cliente
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Segmento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.segmentDistribution.map((segment) => (
              <div key={segment.segmentId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getSegmentColor(segment.segmentName) }}
                    />
                    <span className="font-medium">{segment.segmentName}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{segment.clientCount} clientes</div>
                    <div className="text-sm text-muted-foreground">{segment.percentage.toFixed(1)}%</div>
                  </div>
                </div>
                <Progress value={segment.percentage} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>R$ {segment.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })} receita</span>
                  <span>Ticket médio: R$ {segment.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
                  <span className={segment.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {segment.growthRate >= 0 ? '+' : ''}{segment.growthRate.toFixed(1)}%
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

function SegmentationSuggestions({ suggestions }: { suggestions: SegmentationSuggestion[] }) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Sugestões de Segmentação</h3>
        <Button variant="outline" size="sm">
          <Lightbulb className="h-4 w-4 mr-2" />
          Gerar Novas
        </Button>
      </div>

      <div className="grid gap-4">
        {suggestions.map((suggestion, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{suggestion.name}</h4>
                    <Badge variant="outline" className={getPriorityColor(suggestion.priority)}>
                      {suggestion.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{suggestion.description}</p>
                  <div className="space-y-1">
                    <div className="text-sm">
                      <span className="font-medium">Tipo:</span> {suggestion.type}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Tamanho esperado:</span> ~{suggestion.expectedSize} clientes
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Justificativa:</span> {suggestion.reasoning}
                    </div>
                  </div>
                </div>
                <div className="ml-4">
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function RFMAnalysis({ rfmScore, client }: { rfmScore: ReturnType<typeof calculateRFMScore>; client: Client }) {
  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-yellow-600';
    if (score >= 2) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Análise RFM - {client.name}</CardTitle>
          <CardDescription>
            Recency, Frequency, and Monetary analysis for customer segmentation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${getScoreColor(rfmScore.recencyScore)}`}>
                {rfmScore.recencyScore}
              </div>
              <div className="text-sm font-medium">Recência</div>
              <div className="text-xs text-muted-foreground">Tempo desde última compra</div>
            </div>
            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${getScoreColor(rfmScore.frequencyScore)}`}>
                {rfmScore.frequencyScore}
              </div>
              <div className="text-sm font-medium">Frequência</div>
              <div className="text-xs text-muted-foreground">Frequência de compras</div>
            </div>
            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${getScoreColor(rfmScore.monetaryScore)}`}>
                {rfmScore.monetaryScore}
              </div>
              <div className="text-sm font-medium">Monetário</div>
              <div className="text-xs text-muted-foreground">Valor total gasto</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Segmento RFM</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-2xl font-bold mb-2">{rfmScore.segment}</div>
            <div className="text-sm text-muted-foreground">
              Score geral: {rfmScore.overallScore.toFixed(1)}/5
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SegmentCreationForm({ 
  onSubmit, 
  onCancel 
}: { 
  onSubmit: (data: { name: string; description: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, description });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="segment-name" className="text-sm font-medium">Nome do Segmento</label>
        <input
          id="segment-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mt-1 px-3 py-2 border rounded-md"
          placeholder="Ex: Clientes VIP"
          required
        />
      </div>

      <div>
        <label htmlFor="segment-description" className="text-sm font-medium">Descrição</label>
        <textarea
          id="segment-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full mt-1 px-3 py-2 border rounded-md"
          rows={4}
          placeholder="Descreva as características deste segmento..."
          required
        />
      </div>

      <div className="flex items-center gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          Criar Segmento
        </Button>
      </div>
    </form>
  );
}
