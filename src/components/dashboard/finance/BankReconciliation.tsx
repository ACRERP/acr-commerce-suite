import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BanknoteIcon, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  TrendingUp,
  TrendingDown,
  Settings,
  Upload,
  Play,
  Eye,
  EyeOff,
  Link,
  Unlink
} from 'lucide-react';
import { 
  useBankAccounts, 
  useBankStatements, 
  useBankStatementTransactions,
  useReconciliationRules,
  useReconciliationSummary,
  useAutoReconciliation
} from '@/hooks/useBankReconciliation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function BankReconciliation() {
  const [selectedStatement, setSelectedStatement] = useState<string | null>(null);
  const [showIgnored, setShowIgnored] = useState(false);

  const { bankAccounts } = useBankAccounts();
  const { bankStatements } = useBankStatements();
  const { transactions, updateTransaction } = useBankStatementTransactions(selectedStatement || undefined);
  const { rules } = useReconciliationRules();
  const { summary } = useReconciliationSummary();
  const { reconcileStatement, isPending: isReconciling } = useAutoReconciliation();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'matched': return 'bg-green-100 text-green-800';
      case 'unmatched': return 'bg-yellow-100 text-yellow-800';
      case 'manual': return 'bg-blue-100 text-blue-800';
      case 'ignored': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'matched': return <CheckCircle2 className="w-4 h-4" />;
      case 'unmatched': return <AlertCircle className="w-4 h-4" />;
      case 'manual': return <Clock className="w-4 h-4" />;
      case 'ignored': return <EyeOff className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const handleAutoReconcile = async (statementId: string) => {
    await reconcileStatement(statementId);
  };

  const handleManualMatch = async (transactionId: string, financialTransactionId: string) => {
    await updateTransaction({
      id: transactionId,
      matched_transaction_id: financialTransactionId,
      reconciliation_status: 'manual',
      confidence_score: 1.0
    });
  };

  const handleIgnoreTransaction = async (transactionId: string) => {
    await updateTransaction({
      id: transactionId,
      reconciliation_status: 'ignored',
      matched_transaction_id: null
    });
  };

  const handleUnmatchTransaction = async (transactionId: string) => {
    await updateTransaction({
      id: transactionId,
      reconciliation_status: 'unmatched',
      matched_transaction_id: null,
      confidence_score: 0
    });
  };

  const filteredTransactions = transactions.filter(t => 
    showIgnored || t.reconciliation_status !== 'ignored'
  );

  const selectedStatementData = bankStatements.find(s => s.id === selectedStatement);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Conciliação Bancária</h2>
          <p className="text-gray-600">
            Reconcile transações financeiras com extratos bancários
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Configurar Regras
          </Button>
          <Button>
            <Upload className="w-4 h-4 mr-2" />
            Importar Extrato
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Contas Bancárias</p>
                  <p className="text-2xl font-bold">{bankAccounts.length}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-full">
                  <BanknoteIcon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Transações Matched</p>
                  <p className="text-2xl font-bold text-green-600">{summary.stats.matched || 0}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-600">{summary.stats.unmatched || 0}</p>
                </div>
                <div className="p-2 bg-yellow-100 rounded-full">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Regras Ativas</p>
                  <p className="text-2xl font-bold">{rules.length}</p>
                </div>
                <div className="p-2 bg-purple-100 rounded-full">
                  <Settings className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="statements" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="statements">Extratos</TabsTrigger>
          <TabsTrigger value="reconciliation">Conciliação</TabsTrigger>
          <TabsTrigger value="rules">Regras</TabsTrigger>
          <TabsTrigger value="accounts">Contas</TabsTrigger>
        </TabsList>

        {/* Bank Statements Tab */}
        <TabsContent value="statements">
          <Card>
            <CardHeader>
              <CardTitle>Extratos Bancários</CardTitle>
              <CardDescription>
                Upload e gerencie extratos bancários para conciliação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bankStatements.map((statement) => (
                  <div key={statement.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <h4 className="font-medium">{statement.bank_account?.name}</h4>
                          <p className="text-sm text-gray-600">
                            {statement.bank_account?.bank_name} - {statement.bank_account?.account_number}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {format(new Date(statement.statement_date), 'PPP', { locale: ptBR })}
                          </p>
                          <p className="text-sm text-gray-600">
                            Saldo: {formatCurrency(statement.closing_balance)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(statement.status)}>
                        {statement.status}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedStatement(statement.id)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver
                      </Button>
                      {statement.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleAutoReconcile(statement.id)}
                          disabled={isReconciling}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Auto Conciliar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reconciliation Tab */}
        <TabsContent value="reconciliation">
          {selectedStatementData ? (
            <div className="space-y-6">
              {/* Statement Info */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Conciliação - {selectedStatementData.bank_account?.name}</CardTitle>
                      <CardDescription>
                        {format(new Date(selectedStatementData.statement_date), 'PPP', { locale: ptBR })}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowIgnored(!showIgnored)}
                      >
                        {showIgnored ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                        {showIgnored ? 'Ocultar Ignorados' : 'Mostrar Ignorados'}
                      </Button>
                      <Button
                        onClick={() => handleAutoReconcile(selectedStatementData.id)}
                        disabled={isReconciling}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Auto Conciliar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Saldo Inicial</p>
                      <p className="font-medium">{formatCurrency(selectedStatementData.opening_balance)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Saldo Final</p>
                      <p className="font-medium">{formatCurrency(selectedStatementData.closing_balance)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Variação</p>
                      <p className={`font-medium ${
                        selectedStatementData.closing_balance >= selectedStatementData.opening_balance 
                          ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(selectedStatementData.closing_balance - selectedStatementData.opening_balance)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle>Transações</CardTitle>
                  <CardDescription>
                    {filteredTransactions.length} transações encontradas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {filteredTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="font-medium">{transaction.description}</p>
                              <p className="text-sm text-gray-600">
                                {format(new Date(transaction.transaction_date), 'dd/MM/yyyy')}
                                {transaction.reference_number && ` • Ref: ${transaction.reference_number}`}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`font-medium ${
                                transaction.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {transaction.transaction_type === 'credit' ? '+' : '-'}
                                {formatCurrency(transaction.amount)}
                              </p>
                              {transaction.balance_after_transaction && (
                                <p className="text-sm text-gray-600">
                                  Saldo: {formatCurrency(transaction.balance_after_transaction)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(transaction.reconciliation_status)}>
                            {getStatusIcon(transaction.reconciliation_status)}
                            <span className="ml-1">{transaction.reconciliation_status}</span>
                          </Badge>
                          {transaction.confidence_score > 0 && (
                            <div className="text-sm text-gray-600">
                              {Math.round(transaction.confidence_score * 100)}%
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            {transaction.reconciliation_status !== 'matched' && (
                              <Button variant="outline" size="sm">
                                <Link className="w-4 h-4" />
                              </Button>
                            )}
                            {transaction.reconciliation_status === 'matched' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleUnmatchTransaction(transaction.id)}
                              >
                                <Unlink className="w-4 h-4" />
                              </Button>
                            )}
                            {transaction.reconciliation_status !== 'ignored' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleIgnoreTransaction(transaction.id)}
                              >
                                <EyeOff className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Selecione um Extrato
                </h3>
                <p className="text-gray-600">
                  Escolha um extrato bancário para iniciar a conciliação
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>Regras de Conciliação</CardTitle>
              <CardDescription>
                Configure regras automáticas para matching de transações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{rule.name}</h4>
                      <p className="text-sm text-gray-600">{rule.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant="outline">{rule.rule_type}</Badge>
                        <span className="text-sm text-gray-600">
                          Threshold: {Math.round(rule.match_threshold * 100)}%
                        </span>
                        <span className="text-sm text-gray-600">
                          Priority: {rule.priority}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        Editar
                      </Button>
                      <Button variant="outline" size="sm">
                        Testar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Accounts Tab */}
        <TabsContent value="accounts">
          <Card>
            <CardHeader>
              <CardTitle>Contas Bancárias</CardTitle>
              <CardDescription>
                Gerencie suas contas bancárias para conciliação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bankAccounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{account.name}</h4>
                      <p className="text-sm text-gray-600">
                        {account.bank_name} - {account.account_number}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant="outline">{account.account_type}</Badge>
                        <span className="text-sm text-gray-600">
                          Saldo: {formatCurrency(account.current_balance)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        Editar
                      </Button>
                      <Button variant="outline" size="sm">
                        Extratos
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
