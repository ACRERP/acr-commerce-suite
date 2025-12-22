import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, CreditCard, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { usePaymentPlans, usePaymentInstallments, usePaymentPlanSummary, calculateInstallmentAmount } from '@/hooks/usePaymentInstallments';

export function PaymentInstallments() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    invoice_id: '',
    total_amount: '',
    number_of_installments: '12',
    first_installment_date: '',
    payment_frequency: 'monthly' as 'monthly' | 'biweekly' | 'weekly',
    interest_rate: '0',
    notes: '',
  });

  const { paymentPlans, createPaymentPlan, cancelPaymentPlan, isCreating } = usePaymentPlans();
  const { installments, payInstallment, isPaying } = usePaymentInstallments(selectedPlan || undefined);
  const { summary } = usePaymentPlanSummary(selectedPlan || undefined);

  const selectedPlanData = paymentPlans.find(p => p.id === selectedPlan);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createPaymentPlan({
        invoice_id: formData.invoice_id,
        total_amount: parseFloat(formData.total_amount),
        number_of_installments: parseInt(formData.number_of_installments),
        first_installment_date: formData.first_installment_date,
        payment_frequency: formData.payment_frequency,
        interest_rate: parseFloat(formData.interest_rate),
        notes: formData.notes,
      });
      
      setIsCreateDialogOpen(false);
      setFormData({
        invoice_id: '',
        total_amount: '',
        number_of_installments: '12',
        first_installment_date: '',
        payment_frequency: 'monthly',
        interest_rate: '0',
        notes: '',
      });
    } catch (error) {
      console.error('Error creating payment plan:', error);
    }
  };

  const handlePayInstallment = async (installmentId: string) => {
    try {
      await payInstallment({
        id: installmentId,
        payment_method_id: '00000000-0000-0000-0000-000000000001', // Default payment method
      });
    } catch (error) {
      console.error('Error paying installment:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      active: { variant: 'default', icon: <Clock className="w-3 h-3" /> },
      completed: { variant: 'default', icon: <CheckCircle className="w-3 h-3" /> },
      cancelled: { variant: 'destructive', icon: <XCircle className="w-3 h-3" /> },
      overdue: { variant: 'destructive', icon: <AlertCircle className="w-3 h-3" /> },
      pending: { variant: 'secondary', icon: <Clock className="w-3 h-3" /> },
      paid: { variant: 'default', icon: <CheckCircle className="w-3 h-3" /> },
    };

    const config = variants[status] || variants.pending;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Parcelamento de Pagamentos</h2>
          <p className="text-muted-foreground">Gerencie planos de parcelamento e parcelas</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Planos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {paymentPlans.filter(p => p.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Parcelas Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {paymentPlans.reduce((acc, plan) => 
                acc + (plan.installments?.filter(i => i.status === 'pending').length || 0), 0
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Parcelas Pagas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {paymentPlans.reduce((acc, plan) => 
                acc + (plan.installments?.filter(i => i.status === 'paid').length || 0), 0
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Parcelas em Atraso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {paymentPlans.reduce((acc, plan) => 
                acc + (plan.installments?.filter(i => i.status === 'overdue').length || 0), 0
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="plans" className="space-y-4">
        <TabsList>
          <TabsTrigger value="plans">Planos de Pagamento</TabsTrigger>
          <TabsTrigger value="installments">Parcelas</TabsTrigger>
        </TabsList>

        <TabsContent value="plans">
          <Card>
            <CardHeader>
              <CardTitle>Planos de Pagamento</CardTitle>
              <CardDescription>Lista de todos os planos de parcelamento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentPlans.map((plan) => (
                  <Card key={plan.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedPlan(plan.id)}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">Plano #{plan.id.slice(0, 8)}</h3>
                            {getStatusBadge(plan.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Fatura: {plan.invoice?.invoice_number || 'N/A'} - {plan.invoice?.client_name || 'N/A'}
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Total:</span> R$ {plan.total_amount.toFixed(2)}
                            </div>
                            <div>
                              <span className="font-medium">Parcelas:</span> {plan.number_of_installments}x R$ {plan.installment_amount.toFixed(2)}
                            </div>
                            <div>
                              <span className="font-medium">Frequência:</span> {plan.payment_frequency === 'monthly' ? 'Mensal' : plan.payment_frequency === 'biweekly' ? 'Quinzenal' : 'Semanal'}
                            </div>
                            <div>
                              <span className="font-medium">Juros:</span> {plan.interest_rate}%
                            </div>
                          </div>
                          {plan.notes && (
                            <p className="text-sm text-muted-foreground">{plan.notes}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {plan.status === 'active' && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                cancelPaymentPlan(plan.id);
                              }}
                            >
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </div>
                      {plan.installments && plan.installments.length > 0 && (
                        <div className="mt-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progresso</span>
                            <span>{plan.installments.filter(i => i.status === 'paid').length}/{plan.installments.length}</span>
                          </div>
                          <Progress 
                            value={(plan.installments.filter(i => i.status === 'paid').length / plan.installments.length) * 100} 
                            className="h-2"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="installments">
          {selectedPlanData ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Detalhes do Plano</CardTitle>
                  <CardDescription>Plano #{selectedPlanData.id.slice(0, 8)}</CardDescription>
                </CardHeader>
                <CardContent>
                  {summary && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Valor Pago</Label>
                        <div className="text-2xl font-bold text-green-600">
                          R$ {summary.paidAmount.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Valor Pendente</Label>
                        <div className="text-2xl font-bold text-yellow-600">
                          R$ {summary.pendingAmount.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Progresso</Label>
                        <div className="text-2xl font-bold">
                          {summary.progressPercentage.toFixed(1)}%
                        </div>
                        <Progress value={summary.progressPercentage} className="mt-2" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Parcelas</CardTitle>
                  <CardDescription>Lista de parcelas do plano</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {installments.map((installment) => (
                      <Card key={installment.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Parcela {installment.installment_number}</span>
                                {getStatusBadge(installment.status)}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Vencimento: {format(new Date(installment.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                              </p>
                              <div className="text-sm">
                                <span className="font-medium">Valor:</span> R$ {installment.total_amount.toFixed(2)}
                                {installment.late_fee > 0 && (
                                  <span className="text-red-600 ml-2">
                                    + Multa: R$ {installment.late_fee.toFixed(2)}
                                  </span>
                                )}
                              </div>
                              {installment.payment_date && (
                                <p className="text-sm text-green-600">
                                  Pago em: {format(new Date(installment.payment_date), 'dd/MM/yyyy', { locale: ptBR })}
                                </p>
                              )}
                            </div>
                            {installment.status === 'pending' && (
                              <Button
                                onClick={() => handlePayInstallment(installment.id)}
                                disabled={isPaying}
                              >
                                <CreditCard className="w-4 h-4 mr-2" />
                                Pagar
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Selecione um plano para visualizar as parcelas</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Plan Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Criar Novo Plano de Pagamento</DialogTitle>
            <DialogDescription>
              Crie um novo plano de parcelamento para uma fatura
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreatePlan}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="invoice_id">ID da Fatura</Label>
                <Input
                  id="invoice_id"
                  value={formData.invoice_id}
                  onChange={(e) => setFormData({ ...formData, invoice_id: e.target.value })}
                  placeholder="UUID da fatura"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="total_amount">Valor Total</Label>
                <Input
                  id="total_amount"
                  type="number"
                  step="0.01"
                  value={formData.total_amount}
                  onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="number_of_installments">Número de Parcelas</Label>
                <Select
                  value={formData.number_of_installments}
                  onValueChange={(value) => setFormData({ ...formData, number_of_installments: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3x</SelectItem>
                    <SelectItem value="6">6x</SelectItem>
                    <SelectItem value="12">12x</SelectItem>
                    <SelectItem value="18">18x</SelectItem>
                    <SelectItem value="24">24x</SelectItem>
                    <SelectItem value="36">36x</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Data da Primeira Parcela</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.first_installment_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.first_installment_date ? (
                        format(new Date(formData.first_installment_date), "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        "Selecione uma data"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.first_installment_date ? new Date(formData.first_installment_date) : undefined}
                      onSelect={(date) => 
                        setFormData({ 
                          ...formData, 
                          first_installment_date: date ? date.toISOString().split('T')[0] : '' 
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="payment_frequency">Frequência de Pagamento</Label>
                <Select
                  value={formData.payment_frequency}
                  onValueChange={(value: 'monthly' | 'biweekly' | 'weekly') => 
                    setFormData({ ...formData, payment_frequency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="biweekly">Quinzenal</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="interest_rate">Taxa de Juros (%)</Label>
                <Input
                  id="interest_rate"
                  type="number"
                  step="0.01"
                  value={formData.interest_rate}
                  onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observações sobre o plano de pagamento"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Criando...' : 'Criar Plano'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
