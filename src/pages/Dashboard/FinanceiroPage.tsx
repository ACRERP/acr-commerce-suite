import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { ContasPagar } from '@/components/dashboard/financeiro/ContasPagar';
import { ContasReceber } from '@/components/dashboard/financeiro/ContasReceber';
import { FluxoCaixa } from '@/components/dashboard/financeiro/FluxoCaixa';
import { DRE } from '@/components/dashboard/financeiro/DRE';

export function FinanceiroPage() {
    const [activeTab, setActiveTab] = useState('dashboard');

    // TODO: Fetch real data from Supabase
    const metrics = {
        saldoAtual: 15420.50,
        totalReceber: 8750.00,
        totalPagar: 4200.00,
        lucroLiquido: 12350.00,
    };

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col space-y-4">
            {/* Header */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <h1 className="text-2xl font-bold">💰 Financeiro</h1>
                <p className="text-sm text-gray-500">Gestão completa de contas a pagar, receber e fluxo de caixa</p>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            R$ {metrics.saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground">Disponível agora</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">A Receber</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            R$ {metrics.totalReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground">Contas a receber</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">A Pagar</CardTitle>
                        <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            R$ {metrics.totalPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground">Contas a pagar</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            R$ {metrics.lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground">Este mês</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="w-fit">
                    <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                    <TabsTrigger value="pagar">Contas a Pagar</TabsTrigger>
                    <TabsTrigger value="receber">Contas a Receber</TabsTrigger>
                    <TabsTrigger value="fluxo">Fluxo de Caixa</TabsTrigger>
                    <TabsTrigger value="dre">DRE</TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="flex-1 overflow-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Resumo Financeiro</CardTitle>
                                <CardDescription>Visão geral do mês atual</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {/* TODO: Add charts here */}
                                <p className="text-sm text-gray-500">Gráficos de receitas vs despesas</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Próximos Vencimentos</CardTitle>
                                <CardDescription>Contas a vencer nos próximos 7 dias</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {/* TODO: Add upcoming bills list */}
                                <p className="text-sm text-gray-500">Lista de vencimentos</p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="pagar" className="flex-1 overflow-auto">
                    <ContasPagar />
                </TabsContent>

                <TabsContent value="receber" className="flex-1 overflow-auto">
                    <ContasReceber />
                </TabsContent>

                <TabsContent value="fluxo" className="flex-1 overflow-auto">
                    <FluxoCaixa />
                </TabsContent>

                <TabsContent value="dre" className="flex-1 overflow-auto">
                    <DRE />
                </TabsContent>
            </Tabs>
        </div>
    );
}
