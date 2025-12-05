import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useProductWithVariations, useDeleteVariation, useUpdateVariationStock } from '@/hooks/useProductVariations';
import { ProductVariation } from '@/lib/productVariations';
import { formatCurrency, formatVariationAttributes, getVariationStockStatus, isVariationLowStock } from '@/lib/productVariations';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  AlertTriangle, 
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react';

interface ProductVariationsListProps {
  productId: string;
  baseSKU: string;
  onEditVariation: (variation: ProductVariation) => void;
  onCreateVariation: () => void;
}

export function ProductVariationsList({ 
  productId, 
  baseSKU, 
  onEditVariation, 
  onCreateVariation 
}: ProductVariationsListProps) {
  const { data: variations, isLoading, totalStock, lowStockVariations, outOfStockVariations, priceRange } = useProductWithVariations(productId);
  const deleteVariation = useDeleteVariation();
  const updateVariationStock = useUpdateVariationStock();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
  const [stockUpdateData, setStockUpdateData] = useState<{ id: string; quantity: number } | null>(null);

  const filteredVariations = variations?.filter(variation => {
    const matchesSearch = variation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         variation.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         formatVariationAttributes(variation.attributes).some(attr => 
                           attr.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    
    const matchesStock = stockFilter === 'all' ||
                        (stockFilter === 'in_stock' && variation.stock_quantity > variation.minimum_stock) ||
                        (stockFilter === 'low_stock' && isVariationLowStock(variation)) ||
                        (stockFilter === 'out_of_stock' && variation.stock_quantity === 0);
    
    return matchesSearch && matchesStock;
  }) || [];

  const handleDeleteVariation = (variation: ProductVariation) => {
    setSelectedVariation(variation);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedVariation) {
      deleteVariation.mutate(selectedVariation.id);
    }
    setIsDeleteDialogOpen(false);
    setSelectedVariation(null);
  };

  const handleStockUpdate = (variation: ProductVariation) => {
    const newQuantity = prompt(`Atualizar estoque para ${variation.name}:`, variation.stock_quantity.toString());
    
    if (newQuantity !== null) {
      const quantity = parseInt(newQuantity);
      if (!isNaN(quantity) && quantity >= 0) {
        updateVariationStock.mutate({
          id: variation.id,
          quantity,
        });
      } else {
        toast({
          title: 'Erro',
          description: 'Quantidade inválida',
          variant: 'destructive',
        });
      }
    }
  };

  const getStockStatusColor = (status: 'out' | 'low' | 'normal') => {
    switch (status) {
      case 'out': return 'bg-red-100 text-red-800';
      case 'low': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getStockStatusText = (status: 'out' | 'low' | 'normal') => {
    switch (status) {
      case 'out': return 'Sem Estoque';
      case 'low': return 'Estoque Baixo';
      default: return 'Em Estoque';
    }
  };

  const getProfitColor = (margin?: number) => {
    if (!margin) return 'text-gray-500';
    if (margin >= 50) return 'text-green-600';
    if (margin >= 20) return 'text-yellow-600';
    if (margin > 0) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProfitIcon = (margin?: number) => {
    if (!margin) return DollarSign;
    if (margin >= 20) return TrendingUp;
    if (margin > 0) return TrendingDown;
    return DollarSign;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Variações</p>
                <p className="text-2xl font-bold">{variations?.length || 0}</p>
              </div>
              <Package className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Estoque Total</p>
                <p className="text-2xl font-bold">{totalStock}</p>
              </div>
              <Package className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Estoque Baixo</p>
                <p className="text-2xl font-bold text-yellow-600">{lowStockVariations}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sem Estoque</p>
                <p className="text-2xl font-bold text-red-600">{outOfStockVariations}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Price Range Display */}
      {priceRange && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Faixa de Preço</p>
                <p className="text-lg font-bold">
                  {formatCurrency(priceRange.min)} - {formatCurrency(priceRange.max)}
                </p>
              </div>
              <DollarSign className="h-6 w-6 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Variações do Produto</h3>
            <Button onClick={onCreateVariation}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Variação
            </Button>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por SKU, nome ou atributos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={stockFilter} onValueChange={(value: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock') => setStockFilter(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por estoque" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estoques</SelectItem>
                <SelectItem value="in_stock">Em estoque</SelectItem>
                <SelectItem value="low_stock">Estoque baixo</SelectItem>
                <SelectItem value="out_of_stock">Sem estoque</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Variations Table */}
      <Card>
        <CardContent className="pt-6">
          {filteredVariations.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm || stockFilter !== 'all' 
                  ? 'Nenhuma variação encontrada com os filtros aplicados.'
                  : 'Nenhuma variação cadastrada.'
                }
              </p>
              {!searchTerm && stockFilter === 'all' && (
                <Button className="mt-4" onClick={onCreateVariation}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Variação
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variação</TableHead>
                  <TableHead>Atributos</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Lucro</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVariations.map((variation) => {
                  const stockStatus = getVariationStockStatus(variation);
                  const ProfitIcon = getProfitIcon(variation.profit_margin);
                  
                  return (
                    <TableRow key={variation.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{variation.name}</p>
                          <p className="text-sm text-gray-500">SKU: {variation.sku}</p>
                          {variation.barcode && (
                            <p className="text-sm text-gray-500">Cód: {variation.barcode}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {formatVariationAttributes(variation.attributes).map((attr, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {attr}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{formatCurrency(variation.sale_price)}</p>
                          {variation.cost_price && variation.cost_price > 0 && (
                            <p className="text-sm text-gray-500">
                              Custo: {formatCurrency(variation.cost_price)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <ProfitIcon className={`h-4 w-4 mr-1 ${getProfitColor(variation.profit_margin)}`} />
                          <div>
                            <p className={`text-sm font-medium ${getProfitColor(variation.profit_margin)}`}>
                              {variation.profit_margin?.toFixed(1)}%
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatCurrency(variation.profit_amount || 0)}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{variation.stock_quantity}</p>
                          <p className="text-sm text-gray-500">Min: {variation.minimum_stock}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStockStatusColor(stockStatus)}>
                          {getStockStatusText(stockStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStockUpdate(variation)}
                            disabled={updateVariationStock.isPending}
                          >
                            <Package className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEditVariation(variation)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteVariation(variation)}
                            disabled={deleteVariation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Variação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a variação "{selectedVariation?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
