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
  CreditCard,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  User,
  Plus,
  Settings,
  FileText,
  Download,
  RefreshCw
} from 'lucide-react';
import { 
  CreditLimit,
  CreditTransaction,
  CreditApplication,
  CreditRiskAnalysis,
  getClientCreditLimit,
  getCreditTransactions,
  createCreditApplication,
  processCreditApplication,
  analyzeCreditRisk,
  generateCreditReport,
  canMakePurchase,
  getCreditStatus,
  calculateCreditUtilization
} from '@/lib/creditLimit';
import { Client } from './ClientList';

interface CreditLimitManagerProps {
  client: Client;
  className?: string;
}

export function CreditLimitManager({ client, className }: CreditLimitManagerProps) {
  const [creditLimit, setCreditLimit] = useState<CreditLimit | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [applications, setApplications] = useState<CreditApplication[]>([]);
  const [riskAnalysis, setRiskAnalysis] = useState<CreditRiskAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);

  const loadCreditData = useCallback(async () => {
    setLoading(true);
    try {
      const [limitData, transactionsData] = await Promise.all([
        getClientCreditLimit(client.id),
        getCreditTransactions(client.id),
      ]);

      setCreditLimit(limitData);
      setTransactions(transactionsData);

      if (limitData) {
        const riskData = analyzeCreditRisk(client, [], limitData);
        setRiskAnalysis(riskData);
      }
    } catch (error) {
      console.error('Error loading credit data:', error);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    loadCreditData();
  }, [loadCreditData]);

  const handleCreateApplication = async (requestedLimit: number, reason: string) => {
    try {
      await createCreditApplication(client.id, requestedLimit, reason, creditLimit?.limit_amount);
      setIsApplicationDialogOpen(false);
      // Refresh applications list
    } catch (error) {
      console.error('Error creating credit application:', error);
    }
  };

  const handleProcessApplication = async (applicationId: number, decision: 'approved' | 'rejected') => {
    try {
      await processCreditApplication(
        applicationId,
        decision,
        'current_user', // Would get from auth context
        decision === 'approved' ? 5000 : undefined, // Example approved limit
        decision === 'rejected' ? 'Risk too high' : undefined
      );
      // Refresh data
      loadCreditData();
    } catch (error) {
      console.error('Error processing application:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'suspended':
      case 'rejected':
        return 'bg-orange-500';
      case 'blocked':
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-orange-600';
      case 'very_high':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading && !creditLimit) {
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
                <CreditCard className="h-5 w-5" />
                Gestão de Crédito
              </CardTitle>
              <CardDescription>
                {client.name} - Limite de crédito e análise de risco
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadCreditData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Dialog open={isApplicationDialogOpen} onOpenChange={setIsApplicationDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Solicitar Aumento
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Solicitar Aumento de Limite</DialogTitle>
                    <DialogDescription>
                      Preencha as informações para solicitar um aumento no limite de crédito.
                    </DialogDescription>
                  </DialogHeader>
                  <CreditApplicationForm
                    currentLimit={creditLimit?.limit_amount || 0}
                    onSubmit={handleCreateApplication}
                    onCancel={() => setIsApplicationDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="transactions">Transações</TabsTrigger>
              <TabsTrigger value="applications">Solicitações</TabsTrigger>
              <TabsTrigger value="risk">Análise de Risco</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {creditLimit ? (
                <CreditOverview 
                  creditLimit={creditLimit}
                  riskAnalysis={riskAnalysis}
                  transactions={transactions}
                />
              ) : (
                <NoCreditLimit client={client} />
              )}
            </TabsContent>

            <TabsContent value="transactions" className="space-y-4">
              <TransactionsList transactions={transactions} loading={loading} />
            </TabsContent>

            <TabsContent value="applications" className="space-y-4">
              <ApplicationsList 
                applications={applications}
                onProcessApplication={handleProcessApplication}
                getStatusColor={getStatusColor}
              />
            </TabsContent>

            <TabsContent value="risk" className="space-y-4">
              {riskAnalysis ? (
                <RiskAnalysisView analysis={riskAnalysis} getRiskLevelColor={getRiskLevelColor} />
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Análise de Risco Indisponível</h3>
                    <p className="text-muted-foreground text-center max-w-md">
                      A análise de risco será disponível quando o cliente tiver um limite de crédito ativo.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function CreditOverview({ 
  creditLimit, 
  riskAnalysis, 
  transactions 
}: { 
  creditLimit: CreditLimit;
  riskAnalysis: CreditRiskAnalysis | null;
  transactions: CreditTransaction[];
}) {
  const utilization = calculateCreditUtilization(creditLimit);
  const creditStatus = getCreditStatus(creditLimit);
  const report = generateCreditReport(creditLimit, transactions, riskAnalysis);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Limite Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {creditLimit.limit_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Status: {creditLimit.status}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilizado</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {creditLimit.used_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {utilization.toFixed(1)}% utilizado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponível</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {creditLimit.available_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {creditStatus.message}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score de Risco</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {riskAnalysis?.risk_score || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {riskAnalysis?.risk_level || 'Sem análise'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Utilização de Crédito</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Utilização Atual</span>
              <span className="font-medium">{utilization.toFixed(1)}%</span>
            </div>
            <Progress value={utilization} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>R$ {creditLimit.used_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              <span>R$ {creditLimit.limit_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {report.recommendations.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Recomendações</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {report.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function NoCreditLimit({ client }: { client: Client }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Sem Limite de Crédito</h3>
        <p className="text-muted-foreground text-center max-w-md mb-4">
          {client.name} não possui um limite de crédito ativo. Solicite um limite para permitir compras a crédito.
        </p>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Solicitar Limite de Crédito
        </Button>
      </CardContent>
    </Card>
  );
}

function TransactionsList({ transactions, loading }: { 
  transactions: CreditTransaction[];
  loading: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Transações Recentes</h3>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : transactions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma transação encontrada</p>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Saldo Anterior</TableHead>
              <TableHead>Saldo Atual</TableHead>
              <TableHead>Descrição</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  {new Date(transaction.created_at).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {transaction.transaction_type}
                  </Badge>
                </TableCell>
                <TableCell className={transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                  {transaction.amount > 0 ? '+' : ''}R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell>
                  R$ {transaction.balance_before.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell>
                  R$ {transaction.balance_after.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {transaction.description}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function ApplicationsList({ 
  applications, 
  onProcessApplication, 
  getStatusColor 
}: { 
  applications: CreditApplication[];
  onProcessApplication: (id: number, decision: 'approved' | 'rejected') => void;
  getStatusColor: (status: string) => string;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Solicitações de Crédito</h3>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma solicitação encontrada</p>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Limite Solicitado</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((application) => (
              <TableRow key={application.id}>
                <TableCell>
                  {new Date(application.created_at).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell>
                  R$ {application.requested_limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getStatusColor(application.status)}>
                    {application.status}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {application.reason}
                </TableCell>
                <TableCell className="text-right">
                  {application.status === 'pending' && (
                    <div className="flex items-center gap-2 justify-end">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onProcessApplication(application.id, 'approved')}
                      >
                        Aprovar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onProcessApplication(application.id, 'rejected')}
                      >
                        Rejeitar
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function RiskAnalysisView({ 
  analysis, 
  getRiskLevelColor 
}: { 
  analysis: CreditRiskAnalysis;
  getRiskLevelColor: (level: string) => string;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Análise de Risco
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Score de Risco</span>
            <span className={`text-2xl font-bold ${getRiskLevelColor(analysis.risk_level)}`}>
              {analysis.risk_score}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="font-medium">Nível de Risco</span>
            <Badge variant="outline" className={getRiskLevelColor(analysis.risk_level)}>
              {analysis.risk_level.toUpperCase()}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium">Limite Sugerido</span>
            <span className="font-semibold">
              R$ {analysis.suggested_limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Fatores de Risco</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Histórico de Pagamentos</span>
                <span className="text-sm font-medium">{analysis.factors.payment_history}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Frequência de Compras</span>
                <span className="text-sm font-medium">{analysis.factors.purchase_frequency}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Ticket Médio</span>
                <span className="text-sm font-medium">{analysis.factors.average_ticket}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Dias Desde Última Compra</span>
                <span className="text-sm font-medium">{analysis.factors.days_since_last_purchase}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Utilização de Crédito</span>
                <span className="text-sm font-medium">{analysis.factors.credit_utilization}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recomendações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{recommendation}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CreditApplicationForm({ 
  currentLimit, 
  onSubmit, 
  onCancel 
}: { 
  currentLimit: number;
  onSubmit: (limit: number, reason: string) => void;
  onCancel: () => void;
}) {
  const [requestedLimit, setRequestedLimit] = useState(currentLimit * 1.5);
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(requestedLimit, reason);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Limite Atual</label>
        <div className="text-lg font-semibold">
          R$ {currentLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>
      </div>

      <div>
        <label htmlFor="requested-limit" className="text-sm font-medium">Limite Solicitado</label>
        <input
          id="requested-limit"
          type="number"
          value={requestedLimit}
          onChange={(e) => setRequestedLimit(Number(e.target.value))}
          className="w-full mt-1 px-3 py-2 border rounded-md"
          min={currentLimit}
          step={100}
          placeholder="Digite o limite desejado"
        />
      </div>

      <div>
        <label htmlFor="reason" className="text-sm font-medium">Motivo da Solicitação</label>
        <textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full mt-1 px-3 py-2 border rounded-md"
          rows={4}
          placeholder="Descreva o motivo do aumento do limite de crédito..."
          required
        />
      </div>

      <div className="flex items-center gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          Enviar Solicitação
        </Button>
      </div>
    </form>
  );
}
