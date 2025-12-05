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
import { usePaymentMethods, useDeletePaymentMethod } from '@/hooks/usePaymentMethods';
import { PaymentMethod } from '@/lib/paymentMethods';
import { formatPaymentMethodDisplay, supportsInstallments } from '@/lib/paymentMethods';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  CreditCard,
  DollarSign,
  Smartphone,
  CheckCircle,
  XCircle,
  Percent,
  Calculator
} from 'lucide-react';

interface PaymentManagementProps {
  onEditPaymentMethod: (paymentMethod: PaymentMethod) => void;
  onCreatePaymentMethod: () => void;
}

export function PaymentManagement({ 
  onEditPaymentMethod, 
  onCreatePaymentMethod 
}: PaymentManagementProps) {
  const { data: paymentMethods, isLoading } = usePaymentMethods(true);
  const deletePaymentMethod = useDeletePaymentMethod();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'cash' | 'card' | 'digital' | 'check' | 'other'>('all');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);

  const filteredPaymentMethods = paymentMethods?.filter(method => {
    const matchesSearch = method.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         method.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && method.is_active) ||
                         (statusFilter === 'inactive' && !method.is_active);
    
    const matchesType = typeFilter === 'all' || method.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  }) || [];

  const handleDeletePaymentMethod = (paymentMethod: PaymentMethod) => {
    setSelectedPaymentMethod(paymentMethod);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedPaymentMethod) {
      deletePaymentMethod.mutate(selectedPaymentMethod.id);
    }
    setIsDeleteDialogOpen(false);
    setSelectedPaymentMethod(null);
  };

  const getPaymentIcon = (type: PaymentMethod['type']) => {
    switch (type) {
      case 'cash': return DollarSign;
      case 'card': return CreditCard;
      case 'digital': return Smartphone;
      default: return CreditCard;
    }
  };

  const getPaymentTypeLabel = (type: PaymentMethod['type']) => {
    switch (type) {
      case 'cash': return 'Dinheiro';
      case 'card': return 'Cartão';
      case 'digital': return 'Digital';
      case 'check': return 'Cheque';
      case 'other': return 'Outro';
      default: return type;
    }
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? CheckCircle : XCircle;
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? 'Ativo' : 'Inativo';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Métodos</p>
                <p className="text-2xl font-bold">{paymentMethods?.length || 0}</p>
              </div>
              <CreditCard className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Métodos Ativos</p>
                <p className="text-2xl font-bold text-green-600">
                  {paymentMethods?.filter(m => m.is_active).length || 0}
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
                <p className="text-sm font-medium text-gray-600">Com Parcelas</p>
                <p className="text-2xl font-bold text-purple-600">
                  {paymentMethods?.filter(m => supportsInstallments(m)).length || 0}
                </p>
              </div>
              <Percent className="h-6 w-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Métodos de Pagamento</h3>
            <Button onClick={onCreatePaymentMethod}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Método
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
            
            <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filtrar status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(value: 'all' | 'cash' | 'card' | 'digital' | 'check' | 'other') => setTypeFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filtrar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="cash">Dinheiro</SelectItem>
                <SelectItem value="card">Cartão</SelectItem>
                <SelectItem value="digital">Digital</SelectItem>
                <SelectItem value="check">Cheque</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods List */}
      <Card>
        <CardContent className="p-0">
          {filteredPaymentMethods.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Nenhum método de pagamento encontrado com os filtros aplicados.'
                  : 'Nenhum método de pagamento cadastrado.'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
                <Button onClick={onCreatePaymentMethod}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Método
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filteredPaymentMethods.map((paymentMethod) => {
                const Icon = getPaymentIcon(paymentMethod.type);
                const StatusIcon = getStatusIcon(paymentMethod.is_active);
                
                return (
                  <div key={paymentMethod.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: paymentMethod.color + '20' }} // Required for dynamic color
                          >
                            <Icon 
                              className="h-5 w-5" 
                              style={{ color: paymentMethod.color }} // Required for dynamic color
                            />
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{paymentMethod.name}</p>
                              <Badge className={getStatusColor(paymentMethod.is_active)}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {getStatusText(paymentMethod.is_active)}
                              </Badge>
                              <Badge variant="outline">
                                {getPaymentTypeLabel(paymentMethod.type)}
                              </Badge>
                            </div>
                            
                            {paymentMethod.description && (
                              <p className="text-sm text-gray-500">{paymentMethod.description}</p>
                            )}
                            
                            <div className="flex items-center gap-4 mt-1">
                              {supportsInstallments(paymentMethod) && (
                                <span className="text-sm text-gray-500">
                                  Até {paymentMethod.max_installments}x
                                </span>
                              )}
                              
                              {(paymentMethod.fee_percentage > 0 || paymentMethod.fee_fixed_amount > 0) && (
                                <span className="text-sm text-orange-600 flex items-center gap-1">
                                  <Calculator className="h-3 w-3" />
                                  Taxa: {paymentMethod.fee_percentage > 0 && `${paymentMethod.fee_percentage}%`}
                                  {paymentMethod.fee_percentage > 0 && paymentMethod.fee_fixed_amount > 0 && ' + '}
                                  {paymentMethod.fee_fixed_amount > 0 && `R$${paymentMethod.fee_fixed_amount.toFixed(2)}`}
                                </span>
                              )}
                              
                              {paymentMethod.requires_approval && (
                                <Badge variant="outline" className="text-yellow-600">
                                  Req. Aprovação
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditPaymentMethod(paymentMethod)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePaymentMethod(paymentMethod)}
                          disabled={deletePaymentMethod.isPending}
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
            <AlertDialogTitle>Excluir Método de Pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o método de pagamento "{selectedPaymentMethod?.name}"? 
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
