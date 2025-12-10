import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Plus,
    Package,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    ArrowUpRight,
    ArrowDownRight,
    Edit,
    Trash2,
    Search,
    Download,
    FileText,
    Users,
    BarChart3,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import {
    getStockMovements,
    getProductsLowStock,
    createStockMovement,
    stockEntry,
    stockExit,
    stockAdjustment,
    stockLoss,
    getStockValueReport,
    type MovementType,
} from "@/lib/stock";
import { getProducts } from "@/lib/products";

const Estoque = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("movimentos");
    const [showMovementModal, setShowMovementModal] = useState(false);
    const [movementType, setMovementType] = useState<MovementType>("entrada");
    const [searchTerm, setSearchTerm] = useState("");

    // Queries
    const { data: movements } = useQuery({
        queryKey: ['stock_movements'],
        queryFn: () => getStockMovements(undefined, 50)
    });

    const { data: lowStockProducts } = useQuery({
        queryKey: ['products_low_stock'],
        queryFn: getProductsLowStock
    });

    const { data: products } = useQuery({
        queryKey: ['products'],
        queryFn: getProducts
    });

    const { data: stockValue } = useQuery({
        queryKey: ['stock_value'],
        queryFn: getStockValueReport
    });

    // Movement form state
    const [movementForm, setMovementForm] = useState({
        product_id: '',
        quantity: 0,
        cost_price: 0,
        reason: '',
        notes: '',
    });

    // Mutation
    const createMovementMutation = useMutation({
        mutationFn: createStockMovement,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stock_movements'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['products_low_stock'] });
            queryClient.invalidateQueries({ queryKey: ['stock_value'] });
            toast({ title: 'Movimentação registrada com sucesso!' });
            setShowMovementModal(false);
            resetForm();
        },
        onError: (error: any) => {
            toast({
                title: 'Erro ao registrar movimentação',
                description: error.message,
                variant: 'destructive'
            });
        }
    });

    const resetForm = () => {
        setMovementForm({
            product_id: '',
            quantity: 0,
            cost_price: 0,
            reason: '',
            notes: '',
        });
    };

    const handleSubmitMovement = () => {
        if (!movementForm.product_id || movementForm.quantity <= 0) {
            toast({
                title: 'Preencha todos os campos obrigatórios',
                variant: 'destructive'
            });
            return;
        }

        createMovementMutation.mutate({
            product_id: movementForm.product_id,
            movement_type: movementType,
            quantity: movementForm.quantity,
            cost_price: movementType === 'entrada' ? movementForm.cost_price : undefined,
            reason: movementForm.reason,
            notes: movementForm.notes,
            reference_type: 'manual'
        });
    };

    const getMovementIcon = (type: MovementType) => {
        switch (type) {
            case 'entrada': return <ArrowUpRight className="w-4 h-4 text-green-600" />;
            case 'saida': return <ArrowDownRight className="w-4 h-4 text-red-600" />;
            case 'ajuste': return <Edit className="w-4 h-4 text-blue-600" />;
            case 'perda': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
            default: return <FileText className="w-4 h-4" />;
        }
    };

    const getMovementColor = (type: MovementType) => {
        switch (type) {
            case 'entrada': return 'bg-green-100 text-green-700';
            case 'saida': return 'bg-red-100 text-red-700';
            case 'ajuste': return 'bg-blue-100 text-blue-700';
            case 'perda': return 'bg-orange-100 text-orange-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="page-header">Controle de Estoque</h1>
                        <p className="text-muted-foreground mt-1">
                            Movimentações, alertas e relatórios de estoque
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="gap-2">
                            <Download className="w-4 h-4" />
                            Exportar
                        </Button>
                        <Button className="gap-2" onClick={() => {
                            setMovementType('entrada');
                            setShowMovementModal(true);
                        }}>
                            <Plus className="w-4 h-4" />
                            Nova Movimentação
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Valor em Estoque (Custo)</p>
                                    <p className="text-2xl font-bold">
                                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(stockValue?.totals.total_cost || 0)}
                                    </p>
                                </div>
                                <div className="p-2 rounded-lg bg-blue-100">
                                    <Package className="w-5 h-5 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Valor em Estoque (Venda)</p>
                                    <p className="text-2xl font-bold">
                                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(stockValue?.totals.total_sale || 0)}
                                    </p>
                                </div>
                                <div className="p-2 rounded-lg bg-green-100">
                                    <TrendingUp className="w-5 h-5 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Lucro Potencial</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(stockValue?.totals.total_profit || 0)}
                                    </p>
                                </div>
                                <div className="p-2 rounded-lg bg-purple-100">
                                    <BarChart3 className="w-5 h-5 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Produtos Estoque Baixo</p>
                                    <p className="text-2xl font-bold text-orange-600">{lowStockProducts?.length || 0}</p>
                                    <p className="text-xs text-muted-foreground">Requer atenção</p>
                                </div>
                                <div className="p-2 rounded-lg bg-orange-100">
                                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger value="movimentos" className="gap-2">
                            <FileText className="w-4 h-4" />
                            Movimentações
                        </TabsTrigger>
                        <TabsTrigger value="alertas" className="gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Alertas ({lowStockProducts?.length || 0})
                        </TabsTrigger>
                        <TabsTrigger value="relatorio" className="gap-2">
                            <BarChart3 className="w-4 h-4" />
                            Relatório
                        </TabsTrigger>
                    </TabsList>

                    {/* Movimentações Tab */}
                    <TabsContent value="movimentos">
                        <Card>
                            <CardHeader>
                                <CardTitle>Histórico de Movimentações</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Data/Hora</TableHead>
                                            <TableHead>Tipo</TableHead>
                                            <TableHead>Produto</TableHead>
                                            <TableHead>Quantidade</TableHead>
                                            <TableHead>Custo</TableHead>
                                            <TableHead>Motivo</TableHead>
                                            <TableHead>Usuário</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {movements?.map((movement) => (
                                            <TableRow key={movement.id}>
                                                <TableCell className="text-sm">
                                                    {format(new Date(movement.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={getMovementColor(movement.movement_type)}>
                                                        <span className="flex items-center gap-1">
                                                            {getMovementIcon(movement.movement_type)}
                                                            {movement.movement_type}
                                                        </span>
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{movement.product_name}</p>
                                                        <p className="text-xs text-muted-foreground">{movement.product_code}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {movement.quantity} {movement.unit}
                                                </TableCell>
                                                <TableCell>
                                                    {movement.cost_price ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(movement.cost_price) : '-'}
                                                </TableCell>
                                                <TableCell className="text-sm">{movement.reason || '-'}</TableCell>
                                                <TableCell className="text-sm">{movement.user_name || '-'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Alertas Tab */}
                    <TabsContent value="alertas">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                                    Produtos com Estoque Baixo
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {lowStockProducts && lowStockProducts.length > 0 ? (
                                    <div className="space-y-3">
                                        {lowStockProducts.map((product) => (
                                            <div key={product.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                                                <div className="flex items-center gap-3">
                                                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                                                    <div>
                                                        <p className="font-medium">{product.name}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            Código: {product.code} | Categoria: {product.category || 'Sem categoria'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <p className="text-sm text-muted-foreground">Estoque Atual</p>
                                                        <p className="font-bold text-orange-600">{product.stock}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm text-muted-foreground">Estoque Mínimo</p>
                                                        <p className="font-medium">{product.min_stock}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm text-muted-foreground">Comprar</p>
                                                        <p className="font-bold text-green-600">{product.quantity_to_order}</p>
                                                    </div>
                                                    <Button size="sm" className="gap-1">
                                                        <Plus className="w-3 h-3" />
                                                        Entrada
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>✅ Todos os produtos com estoque adequado!</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Relatório Tab */}
                    <TabsContent value="relatorio">
                        <Card>
                            <CardHeader>
                                <CardTitle>Valor do Estoque por Produto</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Produto</TableHead>
                                            <TableHead>Categoria</TableHead>
                                            <TableHead>Estoque</TableHead>
                                            <TableHead>Custo Unit.</TableHead>
                                            <TableHead>Valor Custo</TableHead>
                                            <TableHead>Valor Venda</TableHead>
                                            <TableHead>Lucro Potencial</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {stockValue?.items.slice(0, 20).map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{item.name}</p>
                                                        <p className="text-xs text-muted-foreground">{item.code}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{item.category || '-'}</TableCell>
                                                <TableCell className="font-medium">{item.stock}</TableCell>
                                                <TableCell>
                                                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.cost)}
                                                </TableCell>
                                                <TableCell>
                                                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.cost_value)}
                                                </TableCell>
                                                <TableCell>
                                                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.sale_value)}
                                                </TableCell>
                                                <TableCell className="font-bold text-green-600">
                                                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.potential_profit)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Movement Modal */}
                <Dialog open={showMovementModal} onOpenChange={setShowMovementModal}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Nova Movimentação de Estoque</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label>Tipo de Movimentação</Label>
                                <Select value={movementType} onValueChange={(v) => setMovementType(v as MovementType)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="entrada">Entrada</SelectItem>
                                        <SelectItem value="saida">Saída</SelectItem>
                                        <SelectItem value="ajuste">Ajuste</SelectItem>
                                        <SelectItem value="perda">Perda</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Produto *</Label>
                                <div>
                                    <Label>Quantidade *</Label>
                                    <Input
                                        type="number"
                                        step="0.001"
                                        value={movementForm.quantity}
                                        onChange={(e) => setMovementForm({ ...movementForm, quantity: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                {movementType === 'entrada' && (
                                    <div>
                                        <Label>Preço de Custo</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={movementForm.cost_price}
                                            onChange={(e) => setMovementForm({ ...movementForm, cost_price: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <Label>Motivo</Label>
                                <Input
                                    value={movementForm.reason}
                                    onChange={(e) => setMovementForm({ ...movementForm, reason: e.target.value })}
                                    placeholder="Ex: Compra do fornecedor, Perda por validade, etc."
                                />
                            </div>

                            <div>
                                <Label>Observações</Label>
                                <Textarea
                                    value={movementForm.notes}
                                    onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })}
                                    placeholder="Informações adicionais..."
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowMovementModal(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleSubmitMovement} disabled={createMovementMutation.isPending}>
                                {createMovementMutation.isPending ? 'Salvando...' : 'Registrar Movimentação'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </MainLayout>
    );
};

export default Estoque;
