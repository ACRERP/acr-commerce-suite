import React, { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    ChefHat,
    Flame,
    PackageCheck,
    Clock,
    Scale,
    Plus,
    Search,
    TrendingUp,
    Utensils,
    FileText,
    Loader2
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productionService, Recipe, ProductionOrder } from "@/lib/production-service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useProducts } from "@/hooks/useProducts";
import { Label } from "@/components/ui/label";

export default function ProductionPage() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("dashboard");
    const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);

    // Form States
    const [newRecipe, setNewRecipe] = useState<Partial<Recipe>>({ name: "", items: [] });
    const [selectedProduct, setSelectedProduct] = useState("");

    // Queries
    const { products } = useProducts();
    const { data: recipes, isLoading: isLoadingRecipes } = useQuery({
        queryKey: ['recipes'],
        queryFn: productionService.getRecipes
    });

    const { data: orders, isLoading: isLoadingOrders } = useQuery({
        queryKey: ['production-orders'],
        queryFn: productionService.getProductionOrders
    });

    // Mutations
    const createRecipeMutation = useMutation({
        mutationFn: productionService.createRecipe,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recipes'] });
            toast.success("Ficha Técnica criada com sucesso!");
            setIsRecipeModalOpen(false);
        }
    });

    const handleCreateRecipe = () => {
        if (!newRecipe.name || !selectedProduct) {
            toast.error("Preencha o nome e selecione o produto final.");
            return;
        }
        createRecipeMutation.mutate({
            ...newRecipe,
            product_id: selectedProduct,
            is_active: true,
            items: [] // In a real app, we would handle adding ingredients here
        } as Recipe);
    };

    return (
        <MainLayout>
            <div className="w-full max-w-[95%] mx-auto px-4 py-8 space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-400 tracking-tight mb-2">
                            Centro de Produção
                        </h1>
                        <p className="text-lg text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                            <ChefHat className="w-5 h-5 text-orange-500" />
                            Gestão de Fichas Técnicas e Ordens de Produção
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Dialog open={isRecipeModalOpen} onOpenChange={setIsRecipeModalOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-orange-600 hover:bg-orange-700 text-white gap-2 shadow-lg shadow-orange-500/20">
                                    <FileText className="w-4 h-4" />
                                    Nova Receita
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Nova Ficha Técnica</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Nome da Receita</Label>
                                        <Input
                                            placeholder="Ex: Pão Francês Tradicional"
                                            value={newRecipe.name}
                                            onChange={e => setNewRecipe({ ...newRecipe, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Produto Final (Acabado)</Label>
                                        <select
                                            className="w-full h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                                            value={selectedProduct}
                                            onChange={e => setSelectedProduct(e.target.value)}
                                        >
                                            <option value="">Selecione um produto...</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <Button className="w-full bg-orange-600 hover:bg-orange-700" onClick={handleCreateRecipe}>
                                        Salvar Receita
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Button variant="outline" className="gap-2">
                            <Flame className="w-4 h-4" />
                            Nova Fornada (OP)
                        </Button>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-neutral-100 dark:bg-neutral-900/50 p-1 rounded-xl mb-6">
                        <TabsTrigger value="dashboard" className="gap-2">
                            <TrendingUp className="w-4 h-4" /> Dashboard
                        </TabsTrigger>
                        <TabsTrigger value="recipes" className="gap-2">
                            <Utensils className="w-4 h-4" /> Receitas
                        </TabsTrigger>
                        <TabsTrigger value="orders" className="gap-2">
                            <Clock className="w-4 h-4" /> Ordens de Produção
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="dashboard" className="space-y-6">
                        {/* Production Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {[
                                { label: 'Receitas Ativas', value: isLoadingRecipes ? '...' : recipes?.length || 0, icon: Utensils, color: 'text-orange-600', bg: 'bg-orange-100' },
                                { label: 'Em Produção', value: isLoadingOrders ? '...' : orders?.filter(o => o.status === 'in_progress').length || 0, icon: Flame, color: 'text-red-600', bg: 'bg-red-100' },
                                { label: 'Concluídos Hoje', value: '0', icon: PackageCheck, color: 'text-green-600', bg: 'bg-green-100' }, // Mock for now
                                { label: 'Custo Médio', value: 'R$ --,--', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-100' },
                            ].map((stat, i) => (
                                <Card key={i} className="border-none shadow-xl card-premium">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-neutral-500">{stat.label}</p>
                                                <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                                            </div>
                                            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                                                <stat.icon className="w-6 h-6" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="recipes" className="mt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {isLoadingRecipes ? (
                                <div className="col-span-3 text-center py-12"><Loader2 className="animate-spin mx-auto" /></div>
                            ) : recipes?.length === 0 ? (
                                <div className="col-span-3 text-center py-12 text-neutral-500">Nenhuma receita cadastrada.</div>
                            ) : (
                                recipes?.map(recipe => (
                                    <Card key={recipe.id} className="card-premium hover-lift border-l-4 border-l-orange-500">
                                        <CardHeader>
                                            <CardTitle className="text-lg flex justify-between items-start">
                                                <span>{recipe.name}</span>
                                                <Badge variant="outline">{recipe.is_active ? 'Ativa' : 'Inativa'}</Badge>
                                            </CardTitle>
                                            <p className="text-sm text-neutral-500">Produto Final: {recipe.product_name || 'N/A'}</p>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-xs text-neutral-400 mb-4">{recipe.description || 'Sem descrição.'}</p>
                                            <Button variant="ghost" size="sm" className="w-full border border-neutral-200">Ver Ingredientes</Button>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="orders">
                        <Card className="border-none shadow-xl card-premium p-6 text-center text-neutral-500">
                            <p>Módulo de Ordens de Produção em desenvolvimento.</p>
                            <Button className="mt-4" onClick={() => setActiveTab('dashboard')}>Voltar ao Dashboard</Button>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </MainLayout>
    );
}
