import React, { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Package, History, Plus, TrendingUp, AlertTriangle, Box } from "lucide-react";
import Produtos from "./Produtos";
import { StockMovementsTab } from "@/components/inventory/StockMovementsTab";
import { useProducts } from "@/hooks/useProducts";

const Estoque = () => {
    const { products, isLoading } = useProducts();
    const [activeTab, setActiveTab] = useState("inventario");

    return (
        <MainLayout>
            <div className="w-full max-w-[95%] mx-auto px-4 py-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-neutral-50 dark:to-neutral-400 tracking-tight mb-2">
                            Gestão de Estoque
                        </h1>
                        <p className="text-lg text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                            <Box className="w-5 h-5" />
                            Central de movimentações e controle de saldos
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button className="btn-primary hover-lift gap-2 shadow-lg shadow-primary-500/20">
                            <Plus className="w-4 h-4" />
                            Registrar Entrada
                        </Button>
                    </div>
                </div>

                {/* Quick Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="card-premium p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-neutral-500 mb-1">Itens em Estoque</p>
                                <h3 className="text-3xl font-bold">{isLoading ? "..." : products.length}</h3>
                            </div>
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl">
                                <Package className="w-6 h-6" />
                            </div>
                        </div>
                    </Card>

                    <Card className="card-premium p-6 border-orange-200 dark:border-orange-900/50">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-neutral-500 mb-1">Reposição Crítica</p>
                                <h3 className="text-3xl font-bold text-orange-600">
                                    {isLoading ? "..." : products.filter(p => p.stock_quantity <= (p.minimum_stock_level || 5)).length}
                                </h3>
                            </div>
                            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-xl">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                        </div>
                    </Card>

                    <Card className="card-premium p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-neutral-500 mb-1">Valor Patrimonial</p>
                                <h3 className="text-3xl font-bold text-green-600">
                                    {isLoading ? "..." : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(products.reduce((acc, p) => acc + ((p.cost_price || 0) * (p.stock_quantity || 0)), 0))}
                                </h3>
                            </div>
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-xl">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Main Tabs */}
                <Tabs defaultValue="inventario" onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-neutral-100 dark:bg-neutral-900/50 p-1 rounded-xl mb-6">
                        <TabsTrigger value="inventario" className="rounded-lg gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800">
                            <Package className="w-4 h-4" />
                            Saldos Atuais
                        </TabsTrigger>
                        <TabsTrigger value="movimentacoes" className="rounded-lg gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800">
                            <History className="w-4 h-4" />
                            Histórico de Movimentos
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="inventario" className="mt-0">
                        {/* We embed the Produtos component here, but tailored for stock view if needed */}
                        <div className="card-premium p-0 overflow-hidden bg-transparent border-0 shadow-none">
                            <Produtos />
                        </div>
                    </TabsContent>

                    <TabsContent value="movimentacoes" className="mt-0">
                        <Card className="card-premium p-6 font-sans">
                            <StockMovementsTab />
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </MainLayout>
    );
};

export default Estoque;
