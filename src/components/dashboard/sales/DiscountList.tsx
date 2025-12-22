import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { useDiscounts, useDeleteDiscount } from '@/hooks/useDiscounts';
import { Discount } from '@/lib/discounts';
import { formatDiscountDisplay, getDiscountStatus, isDiscountExpired, isDiscountUpcoming } from '@/lib/discounts';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Zap,
  Percent,
  DollarSign,
  Calendar,
  Target,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface DiscountListProps {
  onEditDiscount: (discount: Discount) => void;
  onCreateDiscount: () => void;
}

export function DiscountList({ onEditDiscount, onCreateDiscount }: DiscountListProps) {
  const { data: discounts, isLoading } = useDiscounts(true);
  const deleteDiscount = useDeleteDiscount();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'expired' | 'upcoming'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'percentage' | 'fixed_amount'>('all');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);

  const filteredDiscounts = discounts?.filter(discount => {
    const matchesSearch = discount.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         discount.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const status = getDiscountStatus(discount);
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    const matchesType = typeFilter === 'all' || discount.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  }) || [];

  const handleDeleteDiscount = (discount: Discount) => {
    setSelectedDiscount(discount);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedDiscount) {
      deleteDiscount.mutate(selectedDiscount.id);
    }
    setIsDeleteDialogOpen(false);
    setSelectedDiscount(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return CheckCircle;
      case 'expired': return XCircle;
      case 'upcoming': return Clock;
      case 'inactive': return AlertCircle;
      default: return AlertCircle;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'expired': return 'Expirado';
      case 'upcoming': return 'Futuro';
      case 'inactive': return 'Inativo';
      default: return 'Desconhecido';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'percentage' ? Percent : DollarSign;
  };

  const getApplicableToText = (applicableTo: string) => {
    switch (applicableTo) {
      case 'all': return 'Todos os produtos';
      case 'products': return 'Produtos específicos';
      case 'categories': return 'Categorias específicas';
      case 'clients': return 'Clientes específicos';
      default: return 'Desconhecido';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Sem data';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
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
                <p className="text-sm font-medium text-gray-600">Total de Descontos</p>
                <p className="text-2xl font-bold">{discounts?.length || 0}</p>
              </div>
              <Zap className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Descontos Ativos</p>
                <p className="text-2xl font-bold text-green-600">
                  {discounts?.filter(d => getDiscountStatus(d) === 'active').length || 0}
                </p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Descontos Expirados</p>
                <p className="text-2xl font-bold text-red-600">
                  {discounts?.filter(d => getDiscountStatus(d) === 'expired').length || 0}
                </p>
              </div>
              <XCircle className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Descontos Futuros</p>
                <p className="text-2xl font-bold text-blue-600">
                  {discounts?.filter(d => getDiscountStatus(d) === 'upcoming').length || 0}
                </p>
              </div>
              <Clock className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Descontos</h3>
            <Button onClick={onCreateDiscount}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Desconto
            </Button>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nome ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'inactive' | 'expired' | 'upcoming') => setStatusFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filtrar status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
                <SelectItem value="expired">Expirados</SelectItem>
                <SelectItem value="upcoming">Futuros</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(value: 'all' | 'percentage' | 'fixed_amount') => setTypeFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filtrar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="percentage">Percentual</SelectItem>
                <SelectItem value="fixed_amount">Valor Fixo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Discounts List */}
      <Card>
        <CardContent className="p-0">
          {filteredDiscounts.length === 0 ? (
            <div className="text-center py-12">
              <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Nenhum desconto encontrado com os filtros aplicados.'
                  : 'Nenhum desconto cadastrado.'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
                <Button onClick={onCreateDiscount}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Desconto
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filteredDiscounts.map((discount) => {
                const status = getDiscountStatus(discount);
                const StatusIcon = getStatusIcon(status);
                const TypeIcon = getTypeIcon(discount.type);
                
                return (
                  <div key={discount.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <TypeIcon className="h-5 w-5 text-blue-600" />
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{discount.name}</p>
                              <Badge className={getStatusColor(status)}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {getStatusText(status)}
                              </Badge>
                            </div>
                            
                            {discount.description && (
                              <p className="text-sm text-gray-500">{discount.description}</p>
                            )}
                            
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-sm font-medium text-green-600">
                                {formatDiscountDisplay(discount)}
                              </span>
                              
                              <span className="text-sm text-gray-500">
                                {getApplicableToText(discount.applicable_to)}
                              </span>
                              
                              {discount.min_purchase_amount > 0 && (
                                <span className="text-sm text-gray-500">
                                  Mín: R${discount.min_purchase_amount.toFixed(2)}
                                </span>
                              )}
                              
                              {discount.usage_limit && (
                                <span className="text-sm text-gray-500">
                                  Usos: {discount.usage_count}/{discount.usage_limit}
                                </span>
                              )}
                            </div>
                            
                            {(discount.start_date || discount.end_date) && (
                              <div className="flex items-center gap-2 mt-1">
                                <Calendar className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-500">
                                  {discount.start_date && `De: ${formatDate(discount.start_date)}`}
                                  {discount.start_date && discount.end_date && ' • '}
                                  {discount.end_date && `Até: ${formatDate(discount.end_date)}`}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditDiscount(discount)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteDiscount(discount)}
                          disabled={deleteDiscount.isPending}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Desconto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o desconto "{selectedDiscount?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
