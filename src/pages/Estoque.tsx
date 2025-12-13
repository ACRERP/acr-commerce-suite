import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useProducts } from "@/hooks/useProducts";
import { useCreateInventoryTransaction, useInventorySummary, useAllInventoryTransactions } from "@/hooks/useInventory";
import { useQuery } from "@tanstack/react-query";
import { getStockValueReport } from "@/lib/stock";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    Package,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Filter,
    Download,
    RefreshCw,
    AlertTriangle,
    History,
    Check,
    ChevronsUpDown,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

const Estoque = () => {
    const { toast } = useToast();
    const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
    const [openProductCombo, setOpenProductCombo] = useState(false);
    const [movementForm, setMovementForm] = useState({
        product_id: "",
        type: "entrada",
        quantity: "",
        reason: "",
        notes: ""
    });

    // Hooks
    const { data: products } = useProducts();
    const { data: summary, isLoading: loadingSummary } = useInventorySummary();
    const { data: stockValue } = useQuery({
        queryKey: ['stock-value-report'],
        queryFn: getStockValueReport
    });
    const { data: transactions, isLoading: loadingTransactions } = useAllInventoryTransactions();
    const createTransaction = useCreateInventoryTransaction();

    const handleExportReport = () => {
        if (!stockValue?.items || stockValue.items.length === 0) {
            toast({ title: "Ops!", description: "Não há dados para exportar.", variant: "destructive" });
            return;
        }

        const csvContent = [
            ["Produto", "Codigo", "Estoque", "Custo Unit.", "Total Custo", "Total Venda", "Lucro Est."],
            ...stockValue.items.map(item => [
                `"${item.name}"`,
                `"${item.code || ''}"`,
                item.stock_quantity,
                item.cost_price,
                item.cost_value,
                item.sale_value,
                item.potential_profit
            ])
        ].map(e => e.join(",")).join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `relatorio_estoque_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({ title: "Relatório Exportado", description: "O download começou com sucesso." });
    };

    const handleSubmitMovement = (e: React.FormEvent) => {
        e.preventDefault();
        if (!movementForm.product_id) {
            toast({ title: "Selecione um produto", variant: "destructive" });
            return;
        }
        if (!movementForm.quantity || Number(movementForm.quantity) <= 0) {
            toast({ title: "Quantidade inválida", variant: "destructive" });
            return;
        }

        createTransaction.mutate({
            product_id: parseInt(movementForm.product_id),
            type: movementForm.type as any,
            quantity: parseInt(movementForm.quantity),
            reason: movementForm.reason || "Ajuste manual",
            notes: movementForm.notes
        }, {
            onSuccess: () => {
                setIsMovementModalOpen(false);
                setMovementForm({
                    product_id: "",
                    type: "entrada",
                    quantity: "",
                    reason: "",
                    notes: ""
                });
            }
        });
    };

    return (
        <MainLayout>
            <div className="container-premium py-8 space-y-8 animate-fade-in-up">
                {/* Header Premium */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-neutral-50 dark:to-neutral-400 tracking-tight mb-2">
                            Estoque Inteligente
                        </h1>
                        <p className="text-lg text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                            <Package className="w-5 h-5" />
                            Controle de inventário e movimentações
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="btn-secondary gap-2 hover-lift" onClick={handleExportReport}>
                            <Download className="w-4 h-4" />
                            Exportar Relatório
                        </Button>
                        <Button
                            className="btn-primary hover-lift gap-2"
                            onClick={() => setIsMovementModalOpen(true)}
                        >
                            <ArrowUpRight className="w-4 h-4" />
                            Nova Movimentação
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="card-premium p-6 hover-lift border-l-4 border-l-blue-500">
                        <p className="text-neutral-500 font-medium text-sm mb-1">Total de Itens</p>
                        <h3 className="text-3xl font-bold text-neutral-800 dark:text-white">
                            {summary?.total_items || 0}
                        </h3>
                    </div>
                    <div className="card-premium p-6 hover-lift border-l-4 border-l-green-500">
                        <p className="text-neutral-500 font-medium text-sm mb-1">Valor em Estoque</p>
                        <h3 className="text-3xl font-bold text-neutral-800 dark:text-white">
                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(summary?.total_value || 0)}
                        </h3>
                    </div>
                    <div className="card-premium p-6 hover-lift border-l-4 border-l-red-500">
                        <p className="text-neutral-500 font-medium text-sm mb-1">Alertas de Baixo Estoque</p>
                        <h3 className="text-3xl font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                            {summary?.low_stock_count || 0}
                            <AlertTriangle className="w-5 h-5" />
                        </h3>
                    </div>
                    <div className="card-premium p-6 hover-lift border-l-4 border-l-orange-500">
                        <p className="text-neutral-500 font-medium text-sm mb-1">Movimentações (Hoje)</p>
                        <h3 className="text-3xl font-bold text-neutral-800 dark:text-white">
                            {transactions?.filter(t => new Date(t.created_at).toDateString() === new Date().toDateString()).length || 0}
                        </h3>
                    </div>
                </div>

                {/* Recent Transactions List */}
                <div className="card-premium overflow-hidden">
                    <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <History className="w-5 h-5 text-neutral-500" />
                            Histórico de Movimentações
                        </h3>
                        {/* Search could go here */}
                    </div>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Produto</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Qtd</TableHead>
                                    <TableHead>Motivo</TableHead>
                                    <TableHead>Usuário</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loadingTransactions ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">Carregando...</TableCell>
                                    </TableRow>
                                ) : transactions?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-neutral-500">Nenhuma movimentação recente</TableCell>
                                    </TableRow>
                                ) : (
                                    transactions?.slice(0, 10).map((tx) => (
                                        <TableRow key={tx.id}>
                                            <TableCell className="text-neutral-500">
                                                {format(new Date(tx.created_at), "dd/MM/yyyy HH:mm")}
                                            </TableCell>
                                            <TableCell className="font-medium">{tx.product?.name}</TableCell>
                                            <TableCell>
                                                <span className={cn(
                                                    "px-2 py-1 rounded-full text-xs font-bold uppercase",
                                                    tx.type === 'in' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                                )}>
                                                    {tx.type === 'in' ? 'Entrada' : 'Saída'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="font-bold">
                                                {tx.type === 'in' ? '+' : '-'}{tx.quantity}
                                            </TableCell>
                                            <TableCell className="text-neutral-500">{tx.reason}</TableCell>
                                            <TableCell className="text-neutral-500">{tx.user?.name || '-'}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            {/* Modal de Movimentação */}
            <Dialog open={isMovementModalOpen} onOpenChange={setIsMovementModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Nova Movimentação de Estoque</DialogTitle>
                        <DialogDescription>
                            Registre entradas ou saídas manuais de produtos.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmitMovement} className="space-y-4 py-4">

                        {/* Product Combobox */}
                        <div className="grid gap-2">
                            <Label>Produto</Label>
                            <Popover open={openProductCombo} onOpenChange={setOpenProductCombo}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openProductCombo}
                                        className="w-full justify-between bg-neutral-50"
                                    >
                                        {movementForm.product_id
                                            ? products?.find((p) => p.id.toString() === movementForm.product_id)?.name
                                            : "Selecione o produto..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Buscar produto..." />
                                        <CommandList>
                                            <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                                            <CommandGroup>
                                                {products?.map((product) => (
                                                    <CommandItem
                                                        key={product.id}
                                                        value={product.name}
                                                        onSelect={() => {
                                                            setMovementForm({ ...movementForm, product_id: product.id.toString() });
                                                            setOpenProductCombo(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                movementForm.product_id === product.id.toString() ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        <div className="flex flex-col">
                                                            <span>{product.name}</span>
                                                            <span className="text-xs text-neutral-500">Cod: {product.code || '-'} | Atual: {product.stock_quantity}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Tipo de Movimentação</Label>
                                <Select
                                    value={movementForm.type}
                                    onValueChange={(val) => setMovementForm({ ...movementForm, type: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="entrada">Entrada (+)</SelectItem>
                                        <SelectItem value="saida">Saída (-)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Quantidade</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={movementForm.quantity}
                                    onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label>Motivo</Label>
                            <Select
                                value={movementForm.reason}
                                onValueChange={(val) => setMovementForm({ ...movementForm, reason: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {movementForm.type === 'entrada' ? (
                                        <>
                                            <SelectItem value="compra">Compra de Fornecedor</SelectItem>
                                            <SelectItem value="devolucao">Devolução de Cliente</SelectItem>
                                            <SelectItem value="ajuste">Ajuste de Inventário</SelectItem>
                                        </>
                                    ) : (
                                        <>
                                            <SelectItem value="venda">Venda (Manual)</SelectItem>
                                            <SelectItem value="perda">Perda / Roubo</SelectItem>
                                            <SelectItem value="dano">Dano / Avaria</SelectItem>
                                            <SelectItem value="uso_interno">Uso Interno</SelectItem>
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label>Observações</Label>
                            <Textarea
                                value={movementForm.notes}
                                onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })}
                                placeholder="Detalhes adicionais..."
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsMovementModalOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={createTransaction.isPending}>
                                {createTransaction.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirmar
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
};

export default Estoque;
