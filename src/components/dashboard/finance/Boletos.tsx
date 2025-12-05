import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  CalendarIcon, 
  Plus, 
  Download, 
  Mail, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  FileText,
  CreditCard,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  useBoletos, 
  useBoletoSummary, 
  useBoletoEvents,
  formatCurrency,
  formatCPF_CNPJ,
  formatZipCode,
  isBoletoOverdue,
  getBoletoStatusColor,
  getBoletoStatusText
} from '@/hooks/useBoletos';

export function Boletos() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedBoleto, setSelectedBoleto] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    invoice_id: '',
    amount: '',
    due_date: '',
    payer_name: '',
    payer_cpf_cnpj: '',
    payer_address: '',
    payer_city: '',
    payer_state: '',
    payer_zip_code: '',
    instructions: 'Pagável até o vencimento. Após vencimento cobrar multa de 2%.',
    bank_code: '001',
    discount_amount: '0',
    discount_date: '',
  });

  const { 
    boletos, 
    createBoleto, 
    updateBoletoStatus, 
    cancelBoleto,
    sendEmail,
    sendSMS,
    generatePDF,
    isCreating,
    isSendingEmail,
    isSendingSMS,
    isGeneratingPDF
  } = useBoletos();
  
  const { summary } = useBoletoSummary();
  const { events } = useBoletoEvents(selectedBoleto || undefined);

  const selectedBoletoData = boletos.find(b => b.id === selectedBoleto);

  const handleCreateBoleto = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createBoleto({
        invoice_id: formData.invoice_id,
        amount: parseFloat(formData.amount),
        due_date: formData.due_date,
        payer_name: formData.payer_name,
        payer_cpf_cnpj: formData.payer_cpf_cnpj,
        payer_address: formData.payer_address,
        payer_city: formData.payer_city,
        payer_state: formData.payer_state,
        payer_zip_code: formData.payer_zip_code,
        instructions: formData.instructions,
        bank_code: formData.bank_code,
        discount_amount: parseFloat(formData.discount_amount),
        discount_date: formData.discount_date,
      });
      
      setIsCreateDialogOpen(false);
      setFormData({
        invoice_id: '',
        amount: '',
        due_date: '',
        payer_name: '',
        payer_cpf_cnpj: '',
        payer_address: '',
        payer_city: '',
        payer_state: '',
        payer_zip_code: '',
        instructions: 'Pagável até o vencimento. Após vencimento cobrar multa de 2%.',
        bank_code: '001',
        discount_amount: '0',
        discount_date: '',
      });
    } catch (error) {
      console.error('Error creating boleto:', error);
    }
  };

  const handleMarkAsPaid = async (boletoId: string) => {
    try {
      await updateBoletoStatus({
        id: boletoId,
        status: 'paid',
        payment_date: new Date().toISOString(),
        description: 'Boleto pago'
      });
    } catch (error) {
      console.error('Error marking boleto as paid:', error);
    }
  };

  const getStatusBadge = (status: string, dueDate?: string) => {
    const isOverdue = dueDate && isBoletoOverdue(dueDate, status);
    const actualStatus = isOverdue ? 'overdue' : status;
    
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      pending: { variant: 'secondary', icon: <Clock className="w-3 h-3" /> },
      paid: { variant: 'default', icon: <CheckCircle className="w-3 h-3" /> },
      cancelled: { variant: 'destructive', icon: <XCircle className="w-3 h-3" /> },
      expired: { variant: 'outline', icon: <AlertCircle className="w-3 h-3" /> },
      overdue: { variant: 'destructive', icon: <AlertCircle className="w-3 h-3" /> },
    };

    const config = variants[actualStatus] || variants.pending;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {getBoletoStatusText(actualStatus)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Geração de Boletos</h2>
          <p className="text-muted-foreground">Gerencie a geração e envio de boletos bancários</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Boleto
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Boletos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalBoletos}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(summary.totalAmount)}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Boletos Pagos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.paidBoletos}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(summary.paidAmount)}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Boletos Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{summary.pendingBoletos}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(summary.pendingAmount)}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Boletos Vencidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.overdueBoletos}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(summary.overdueAmount)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Lista de Boletos</TabsTrigger>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Boletos Emitidos</CardTitle>
              <CardDescription>Lista de todos os boletos gerados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {boletos.map((boleto) => (
                  <Card key={boleto.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedBoleto(boleto.id)}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">Boleto #{boleto.document_number}</h3>
                            {getStatusBadge(boleto.status, boleto.due_date)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Fatura: {boleto.invoice?.invoice_number || 'N/A'} - {boleto.invoice?.client_name || 'N/A'}
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Valor:</span> {formatCurrency(boleto.amount)}
                            </div>
                            <div>
                              <span className="font-medium">Vencimento:</span> {format(new Date(boleto.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                            </div>
                            <div>
                              <span className="font-medium">Pagador:</span> {boleto.payer_name}
                            </div>
                            <div>
                              <span className="font-medium">Banco:</span> {boleto.bank_code}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">Nosso Número:</span> {boleto.our_number}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {boleto.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsPaid(boleto.id);
                              }}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Marcar Pago
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              generatePDF(boleto.id);
                            }}
                            disabled={isGeneratingPDF}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            PDF
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              sendEmail(boleto.id);
                            }}
                            disabled={isSendingEmail || boleto.email_sent}
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            {boleto.email_sent ? 'Enviado' : 'Email'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              sendSMS(boleto.id);
                            }}
                            disabled={isSendingSMS || boleto.sms_sent}
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            {boleto.sms_sent ? 'Enviado' : 'SMS'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          {selectedBoletoData ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Detalhes do Boleto</CardTitle>
                  <CardDescription>Boleto #{selectedBoletoData.document_number}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <div className="mt-1">
                          {getStatusBadge(selectedBoletoData.status, selectedBoletoData.due_date)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Valor</Label>
                        <div className="mt-1 text-lg font-semibold">
                          {formatCurrency(selectedBoletoData.amount)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Data de Vencimento</Label>
                        <div className="mt-1">
                          {format(new Date(selectedBoletoData.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Data de Emissão</Label>
                        <div className="mt-1">
                          {format(new Date(selectedBoletoData.issue_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      </div>
                      {selectedBoletoData.payment_date && (
                        <div>
                          <Label className="text-sm font-medium">Data de Pagamento</Label>
                          <div className="mt-1">
                            {format(new Date(selectedBoletoData.payment_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Pagador</Label>
                        <div className="mt-1">
                          <p className="font-medium">{selectedBoletoData.payer_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCPF_CNPJ(selectedBoletoData.payer_cpf_cnpj)}
                          </p>
                        </div>
                      </div>
                      {selectedBoletoData.payer_address && (
                        <div>
                          <Label className="text-sm font-medium">Endereço</Label>
                          <div className="mt-1 text-sm">
                            <p>{selectedBoletoData.payer_address}</p>
                            <p>
                              {selectedBoletoData.payer_city} - {selectedBoletoData.payer_state}
                            </p>
                            <p>{formatZipCode(selectedBoletoData.payer_zip_code || '')}</p>
                          </div>
                        </div>
                      )}
                      <div>
                        <Label className="text-sm font-medium">Banco</Label>
                        <div className="mt-1">
                          <p className="font-medium">Código: {selectedBoletoData.bank_code}</p>
                          {selectedBoletoData.bank_agency && (
                            <p className="text-sm">Agência: {selectedBoletoData.bank_agency}</p>
                          )}
                          {selectedBoletoData.bank_account && (
                            <p className="text-sm">Conta: {selectedBoletoData.bank_account}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {selectedBoletoData.instructions && (
                    <div className="mt-6">
                      <Label className="text-sm font-medium">Instruções</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm">{selectedBoletoData.instructions}</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 space-y-2">
                    <Label className="text-sm font-medium">Linha Digitável</Label>
                    <div className="p-3 bg-gray-50 rounded-md font-mono text-sm break-all">
                      {selectedBoletoData.digitable_line}
                    </div>
                  </div>

                  <div className="mt-6 space-y-2">
                    <Label className="text-sm font-medium">Código de Barras</Label>
                    <div className="p-3 bg-gray-50 rounded-md font-mono text-sm break-all">
                      {selectedBoletoData.barcode}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Events */}
              {events && events.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Histórico de Eventos</CardTitle>
                    <CardDescription>Histórico de alterações no boleto</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {events.map((event) => (
                        <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                          <div className="flex-shrink-0">
                            {event.event_type === 'created' && <Plus className="w-4 h-4 text-blue-600" />}
                            {event.event_type === 'paid' && <CheckCircle className="w-4 h-4 text-green-600" />}
                            {event.event_type === 'cancelled' && <XCircle className="w-4 h-4 text-red-600" />}
                            {event.event_type === 'email_sent' && <Mail className="w-4 h-4 text-purple-600" />}
                            {event.event_type === 'sms_sent' && <MessageSquare className="w-4 h-4 text-orange-600" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{event.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(event.event_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Selecione um boleto para visualizar os detalhes</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Boleto Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Gerar Novo Boleto</DialogTitle>
            <DialogDescription>
              Preencha os dados para gerar um novo boleto bancário
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateBoleto}>
            <div className="grid gap-4 py-4 max-h-[500px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="amount">Valor</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label>Data de Vencimento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.due_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.due_date ? (
                        format(new Date(formData.due_date), "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        "Selecione uma data"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.due_date ? new Date(formData.due_date) : undefined}
                      onSelect={(date) => 
                        setFormData({ 
                          ...formData, 
                          due_date: date ? date.toISOString().split('T')[0] : '' 
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="payer_name">Nome do Pagador</Label>
                <Input
                  id="payer_name"
                  value={formData.payer_name}
                  onChange={(e) => setFormData({ ...formData, payer_name: e.target.value })}
                  placeholder="Nome completo"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="payer_cpf_cnpj">CPF/CNPJ</Label>
                <Input
                  id="payer_cpf_cnpj"
                  value={formData.payer_cpf_cnpj}
                  onChange={(e) => setFormData({ ...formData, payer_cpf_cnpj: e.target.value })}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="payer_address">Endereço</Label>
                <Input
                  id="payer_address"
                  value={formData.payer_address}
                  onChange={(e) => setFormData({ ...formData, payer_address: e.target.value })}
                  placeholder="Rua, número, complemento"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="payer_city">Cidade</Label>
                  <Input
                    id="payer_city"
                    value={formData.payer_city}
                    onChange={(e) => setFormData({ ...formData, payer_city: e.target.value })}
                    placeholder="Cidade"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="payer_state">UF</Label>
                  <Select
                    value={formData.payer_state}
                    onValueChange={(value) => setFormData({ ...formData, payer_state: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(uf => (
                        <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="payer_zip_code">CEP</Label>
                  <Input
                    id="payer_zip_code"
                    value={formData.payer_zip_code}
                    onChange={(e) => setFormData({ ...formData, payer_zip_code: e.target.value })}
                    placeholder="00000-000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="bank_code">Banco</Label>
                  <Select
                    value={formData.bank_code}
                    onValueChange={(value) => setFormData({ ...formData, bank_code: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="001">001 - Banco do Brasil</SelectItem>
                      <SelectItem value="033">033 - Santander</SelectItem>
                      <SelectItem value="104">104 - Caixa Econômica</SelectItem>
                      <SelectItem value="237">237 - Bradesco</SelectItem>
                      <SelectItem value="341">341 - Itaú</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="discount_amount">Desconto (%)</Label>
                  <Input
                    id="discount_amount"
                    type="number"
                    step="0.01"
                    value={formData.discount_amount}
                    onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="instructions">Instruções</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="Instruções de pagamento"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Gerando...' : 'Gerar Boleto'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
