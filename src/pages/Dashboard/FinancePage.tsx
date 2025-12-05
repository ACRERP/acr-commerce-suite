import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryList } from '@/components/dashboard/finance/CategoryList';
import { DREReport } from '@/components/dashboard/finance/DREReport';
import { BankReconciliation } from '@/components/dashboard/finance/BankReconciliation';
import { PaymentInstallments } from '@/components/dashboard/finance/PaymentInstallments';
import { Boletos } from '@/components/dashboard/finance/Boletos';
import { DynamicReports } from '@/components/dashboard/finance/DynamicReports';
import { useCategoryStats } from '@/hooks/useFinancialCategories';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  CreditCard,
  Folder,
  BarChart3
} from 'lucide-react';

export function FinancePage() {
  const { data: stats } = useCategoryStats();

  const TYPE_CONFIG = {
    revenue: { label: 'Receitas', icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-100' },
    expense: { label: 'Despesas', icon: DollarSign, color: 'text-red-600', bgColor: 'bg-red-100' },
    asset: { label: 'Ativos', icon: Package, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    liability: { label: 'Passivos', icon: CreditCard, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Gestão Financeira</h1>
        <p className="text-gray-600">
          Organize e categorize suas transações financeiras
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Folder className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          {Object.entries(TYPE_CONFIG).map(([type, config]) => {
            const Icon = config.icon;
            const count = stats.byType[type as keyof typeof stats.byType];
            return (
              <Card key={type}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{config.label}</p>
                      <p className="text-2xl font-bold">{count}</p>
                    </div>
                    <div className={`p-2 rounded-lg ${config.bgColor}`}>
                      <Icon className={`w-6 h-6 ${config.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="categories" className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="transactions">Transações</TabsTrigger>
          <TabsTrigger value="installments">Parcelas</TabsTrigger>
          <TabsTrigger value="boletos">Boletos</TabsTrigger>
          <TabsTrigger value="dynamic">Dinâmicos</TabsTrigger>
          <TabsTrigger value="reconciliation">Conciliação</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <CategoryList />
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transações Financeiras</CardTitle>
              <CardDescription>
                Gerencie todas as transações financeiras
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Transações em Desenvolvimento
                </h3>
                <p className="text-gray-600">
                  O módulo de transações será implementado em breve.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="installments">
          <PaymentInstallments />
        </TabsContent>

        <TabsContent value="boletos">
          <Boletos />
        </TabsContent>

        <TabsContent value="dynamic">
          <DynamicReports />
        </TabsContent>

        <TabsContent value="reconciliation">
          <BankReconciliation />
        </TabsContent>

        <TabsContent value="reports">
          <DREReport />
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Financeiras</CardTitle>
              <CardDescription>
                Configure parâmetros e preferências financeiras
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Configurações em Desenvolvimento
                </h3>
                <p className="text-gray-600">
                  As configurações financeiras serão implementadas em breve.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
