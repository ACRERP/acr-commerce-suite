import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/lib/pdv';
import { ArrowUpCircle, ArrowDownCircle, AlertCircle, RefreshCw } from 'lucide-react';

export function StockMovementList() {
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');

    const { data: movements, isLoading } = useQuery({
        queryKey: ['stock-movements', searchTerm, typeFilter],
        queryFn: async () => {
            let query = supabase
                .from('stock_movement_history') // Using the View
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (searchTerm) {
                query = query.ilike('product_name', `%${searchTerm}%`);
            }

            if (typeFilter !== 'all') {
                query = query.eq('movement_type', typeFilter);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        }
    });

    const getMovementIcon = (type: string) => {
        switch (type) {
            case 'entrada': return <ArrowUpCircle className="w-4 h-4 text-green-500" />;
            case 'devolucao': return <ArrowUpCircle className="w-4 h-4 text-green-500" />;
            case 'saida': return <ArrowDownCircle className="w-4 h-4 text-red-500" />;
            case 'perda': return <AlertCircle className="w-4 h-4 text-red-500" />;
            case 'ajuste': return <RefreshCw className="w-4 h-4 text-blue-500" />;
            default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'entrada': return 'Entrada (Compra)';
            case 'saida': return 'Saída (Venda)';
            case 'ajuste': return 'Ajuste Manual';
            case 'perda': return 'Perda / Quebra';
            case 'devolucao': return 'Devolução';
            default: return type;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
                <Input
                    placeholder="Buscar produto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-xs"
                />
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Tipo de Movimento" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="entrada">Entradas</SelectItem>
                        <SelectItem value="saida">Saídas</SelectItem>
                        <SelectItem value="ajuste">Ajustes</SelectItem>
                        <SelectItem value="perda">Perdas</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Produto</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Referência</TableHead>
                            <TableHead className="text-right">Qtd</TableHead>
                            <TableHead>Motivo / Obs</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">Carregando Kardex...</TableCell>
                            </TableRow>
                        ) : movements?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma movimentação encontrada.</TableCell>
                            </TableRow>
                        ) : (
                            movements?.map((mov) => (
                                <TableRow key={mov.id}>
                                    <TableCell className="text-xs">
                                        {format(new Date(mov.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{mov.product_name}</div>
                                        <div className="text-xs text-muted-foreground">{mov.product_code}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {getMovementIcon(mov.movement_type)}
                                            <span className="capitalize">{getTypeLabel(mov.movement_type)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {mov.reference_type === 'sale' && <Badge variant="outline">Venda #{mov.reference_id}</Badge>}
                                        {mov.reference_type === 'purchase' && <Badge variant="outline">Compra #{mov.reference_id}</Badge>}
                                        {mov.reference_type === 'manual' && <span className="text-xs text-gray-500">Manual</span>}
                                    </TableCell>
                                    <TableCell className={`text-right font-bold ${['saida', 'perda'].includes(mov.movement_type) ? 'text-red-500' : 'text-green-500'}`}>
                                        {['saida', 'perda'].includes(mov.movement_type) ? '-' : '+'}{mov.quantity}
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate text-sm text-gray-500">
                                        {mov.reason || mov.notes || '-'}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
