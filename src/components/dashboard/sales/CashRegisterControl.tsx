import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { 
  useActiveCashRegisters, 
  useCurrentCashRegisterOperation,
  useCreateCashRegisterOperation,
  useCloseCashRegisterOperation,
  useCancelCashRegisterOperation,
  useCashRegisterStatus,
  useCashRegisterOperationManager
} from '@/hooks/useCashRegister';
import { CashRegister, CashRegisterOperation } from '@/lib/cashRegister';
import { formatOperationTypeDisplay, formatOperationStatusDisplay, getOperationStatusColor } from '@/lib/cashRegister';
import { useToast } from '@/hooks/use-toast';
import { 
  DollarSign, 
  Lock, 
  Unlock, 
  Calculator,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  XCircle
} from 'lucide-react';

interface CashRegisterControlProps {
  onOperationComplete?: (operation: CashRegisterOperation) => void;
}

export function CashRegisterControl({ onOperationComplete }: CashRegisterControlProps) {
  const { data: activeCashRegisters, isLoading: registersLoading } = useActiveCashRegisters();
  const [selectedRegister, setSelectedRegister] = useState<CashRegister | null>(null);
  const [openingBalance, setOpeningBalance] = useState('');
  const [closingBalance, setClosingBalance] = useState('');
  const [notes, setNotes] = useState('');
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  
  const { toast } = useToast();
  
  const { isOpen, canOpen, canClose, status, currentOperation, isLoading: statusLoading } = 
    useCashRegisterStatus(selectedRegister?.id || '');
  
  const createOperation = useCreateCashRegisterOperation();
  const closeOperation = useCloseCashRegisterOperation();
  const cancelOperation = useCancelCashRegisterOperation();

  // Auto-select first register if none selected
  React.useEffect(() => {
    if (activeCashRegisters && activeCashRegisters.length > 0 && !selectedRegister) {
      setSelectedRegister(activeCashRegisters[0]);
    }
  }, [activeCashRegisters, selectedRegister]);

  const handleOpenRegister = async () => {
    if (!selectedRegister) {
      toast({
        title: 'Erro',
        description: 'Selecione um caixa para abrir.',
        variant: 'destructive',
      });
      return;
    }

    const balance = parseFloat(openingBalance);
    if (isNaN(balance) || balance < 0) {
      toast({
        title: 'Erro',
        description: 'Informe um valor de abertura válido.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const operation = await createOperation.mutateAsync({
        cash_register_id: selectedRegister.id,
        operation_type: 'open',
        opening_balance: balance,
        notes: notes || undefined,
      });

      onOperationComplete?.(operation);
      
      // Reset form
      setOpeningBalance('');
      setNotes('');
      
      toast({
        title: 'Caixa aberto',
        description: `Caixa "${selectedRegister.name}" aberto com sucesso.`,
      });
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleCloseRegister = async () => {
    if (!selectedRegister || !currentOperation) {
      return;
    }

    const balance = parseFloat(closingBalance);
    if (isNaN(balance) || balance < 0) {
      toast({
        title: 'Erro',
        description: 'Informe um valor de fechamento válido.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const operation = await closeOperation.mutateAsync({
        operationId: currentOperation.id,
        closingBalance: balance,
        expectedBalance: currentOperation.opening_balance, // This should be calculated based on actual movements
        notes: notes || undefined,
      });

      onOperationComplete?.(operation);
      
      // Reset form
      setClosingBalance('');
      setNotes('');
      setIsCloseDialogOpen(false);
      
      toast({
        title: 'Caixa fechado',
        description: `Caixa "${selectedRegister.name}" fechado com sucesso.`,
      });
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleCancelRegister = async () => {
    if (!currentOperation) {
      return;
    }

    try {
      const operation = await cancelOperation.mutateAsync({
        operationId: currentOperation.id,
        notes: notes || undefined,
      });

      onOperationComplete?.(operation);
      
      // Reset form
      setNotes('');
      setIsCancelDialogOpen(false);
      
      toast({
        title: 'Operação cancelada',
        description: 'A operação do caixa foi cancelada.',
      });
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return Unlock;
      case 'closed': return Lock;
      case 'cancelled': return XCircle;
      default: return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (registersLoading || statusLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
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
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Controle de Caixa
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedRegister && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{selectedRegister.name}</h3>
                  <p className="text-sm text-gray-500">
                    {selectedRegister.location && `Local: ${selectedRegister.location}`}
                  </p>
                </div>
                <Badge className={getStatusColor(status)}>
                  {React.createElement(getStatusIcon(status), { className: "h-3 w-3 mr-1" })}
                  {formatOperationStatusDisplay(status)}
                </Badge>
              </div>

              {currentOperation && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Abertura:</span>
                      <span className="ml-2 font-medium">
                        {new Date(currentOperation.opened_at).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Saldo Inicial:</span>
                      <span className="ml-2 font-medium">
                        R${currentOperation.opening_balance.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Operador:</span>
                      <span className="ml-2 font-medium">
                        {currentOperation.operator?.name || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Duração:</span>
                      <span className="ml-2 font-medium">
                        {Math.floor((Date.now() - new Date(currentOperation.opened_at).getTime()) / (1000 * 60 * 60))}h
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {!selectedRegister && activeCashRegisters?.length === 0 && (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum caixa ativo encontrado.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Register Selection */}
      {activeCashRegisters && activeCashRegisters.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label>Selecione o Caixa</Label>
                <Select 
                  value={selectedRegister?.id || ''} 
                  onValueChange={(value) => {
                    const register = activeCashRegisters.find(r => r.id === value);
                    setSelectedRegister(register || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um caixa..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activeCashRegisters.map((register) => (
                      <SelectItem key={register.id} value={register.id}>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-2" />
                          <span>{register.name}</span>
                          {register.location && (
                            <span className="ml-2 text-gray-500">({register.location})</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedRegister && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Saldo Atual:</span>
                    <span className="ml-2 font-medium text-green-600">
                      R${selectedRegister.current_balance.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Saldo Inicial:</span>
                    <span className="ml-2 font-medium">
                      R${selectedRegister.initial_balance.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Diferença:</span>
                    <span className={`ml-2 font-medium ${
                      selectedRegister.current_balance >= selectedRegister.initial_balance 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {selectedRegister.current_balance >= selectedRegister.initial_balance ? (
                        <TrendingUp className="inline h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="inline h-3 w-3 mr-1" />
                      )}
                      R${Math.abs(selectedRegister.current_balance - selectedRegister.initial_balance).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Operation Controls */}
      {selectedRegister && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Open Register */}
              {canOpen && (
                <div className="space-y-4">
                  <h4 className="font-medium">Abrir Caixa</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Valor de Abertura</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={openingBalance}
                        onChange={(e) => setOpeningBalance(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Observações (opcional)</Label>
                      <Textarea
                        placeholder="Observações sobre a abertura do caixa..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleOpenRegister}
                    disabled={!openingBalance || parseFloat(openingBalance) < 0}
                    className="w-full"
                  >
                    <Unlock className="h-4 w-4 mr-2" />
                    Abrir Caixa
                  </Button>
                </div>
              )}

              {/* Close Register */}
              {canClose && (
                <div className="space-y-4">
                  <h4 className="font-medium">Fechar Caixa</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Valor de Fechamento</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={closingBalance}
                        onChange={(e) => setClosingBalance(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Observações (opcional)</Label>
                      <Textarea
                        placeholder="Observações sobre o fechamento do caixa..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setIsCloseDialogOpen(true)}
                      disabled={!closingBalance || parseFloat(closingBalance) < 0}
                      className="flex-1"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Fechar Caixa
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setIsCancelDialogOpen(true)}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancelar Operação
                    </Button>
                  </div>
                </div>
              )}

              {/* Status Message */}
              {isOpen && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">Caixa Aberto</p>
                      <p className="text-sm text-green-600">
                        O caixa está em operação. Realize as vendas normalmente e feche ao final do expediente.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Closed Status */}
              {status === 'closed' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Lock className="h-6 w-6 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-800">Caixa Fechado</p>
                      <p className="text-sm text-blue-600">
                        O caixa está fechado. Abra uma nova operação para começar a vender.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Close Confirmation Dialog */}
      <AlertDialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fechar Caixa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja fechar o caixa "{selectedRegister?.name}"? 
              Esta ação finalizará a operação atual.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCloseRegister}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Fechar Caixa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Operação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar a operação atual do caixa "{selectedRegister?.name}"? 
              Esta ação não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelRegister}
              className="bg-red-600 hover:bg-red-700"
            >
              Cancelar Operação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
