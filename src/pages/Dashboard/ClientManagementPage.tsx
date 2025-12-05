import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Calendar,
  Download,
  RefreshCw,
  CreditCard,
  Target,
  Upload
} from 'lucide-react';
import { ClientForm } from '@/components/dashboard/clients/ClientForm';
import { ClientList, Client } from '@/components/dashboard/clients/ClientList';
import { PurchaseHistory } from '@/components/dashboard/clients/PurchaseHistory';
import { CreditLimitManager } from '@/components/dashboard/clients/CreditLimitManager';
import { ClientSegmentation } from '@/components/dashboard/clients/ClientSegmentation';
import { BulkClientImport } from '@/components/dashboard/clients/BulkClientImport';
import { usePurchaseHistory } from '@/hooks/usePurchaseHistory';
import { toast } from '@/hooks/use-toast';

export default function ClientManagementPage() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('clients');
  const [showPurchaseHistory, setShowPurchaseHistory] = useState(false);
  const [showCreditLimit, setShowCreditLimit] = useState(false);
  const [showSegmentation, setShowSegmentation] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);

  const handleCreateClient = async (values: unknown) => {
    try {
      // This would call the client creation service
      console.log('Creating client:', values);
      toast({
        title: 'Cliente criado',
        description: 'O cliente foi criado com sucesso.',
      });
      setIsCreateDialogOpen(false);
      // Refresh client list
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o cliente.',
        variant: 'destructive',
      });
    }
  };

  const handleEditClient = async (values: unknown) => {
    try {
      // This would call the client update service
      console.log('Updating client:', values);
      toast({
        title: 'Cliente atualizado',
        description: 'O cliente foi atualizado com sucesso.',
      });
      setIsEditDialogOpen(false);
      setSelectedClient(null);
      // Refresh client list
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o cliente.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteClient = async (client: Client) => {
    if (!confirm(`Tem certeza que deseja excluir o cliente "${client.name}"?`)) {
      return;
    }

    try {
      // This would call the client deletion service
      console.log('Deleting client:', client);
      toast({
        title: 'Cliente excluído',
        description: 'O cliente foi excluído com sucesso.',
      });
      // Refresh client list
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o cliente.',
        variant: 'destructive',
      });
    }
  };

  const handleViewPurchaseHistory = (client: Client) => {
    setSelectedClient(client);
    setShowPurchaseHistory(true);
    setShowCreditLimit(false);
    setActiveTab('purchase-history');
  };

  const handleManageCreditLimit = (client: Client) => {
    setSelectedClient(client);
    setShowCreditLimit(true);
    setShowPurchaseHistory(false);
    setShowSegmentation(false);
    setActiveTab('credit-limit');
  };

  const handleViewSegmentation = (client: Client) => {
    setSelectedClient(client);
    setShowSegmentation(true);
    setShowPurchaseHistory(false);
    setShowCreditLimit(false);
    setActiveTab('segmentation');
  };

  const handleEditClientClick = (client: Client) => {
    setSelectedClient(client);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Gestão de Clientes</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setShowBulkImport(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Importar em Massa
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Novo Cliente</DialogTitle>
                <DialogDescription>
                  Preencha as informações do novo cliente.
                </DialogDescription>
              </DialogHeader>
              <ClientForm
                onSubmit={handleCreateClient}
                isLoading={false}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="purchase-history" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Histórico de Compras
          </TabsTrigger>
          <TabsTrigger value="credit-limit" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Limite de Crédito
          </TabsTrigger>
          <TabsTrigger value="segmentation" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Segmentação
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Análises
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  +0% em relação ao mês anterior
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  +0% em relação ao mês anterior
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Novos Clientes</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  +0% em relação ao mês anterior
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ 0</div>
                <p className="text-xs text-muted-foreground">
                  +0% em relação ao mês anterior
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Clientes</CardTitle>
              <CardDescription>
                Gerencie todos os seus clientes e suas informações.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClientList
                onEditClient={handleEditClientClick}
                onDeleteClient={handleDeleteClient}
                onViewPurchaseHistory={handleViewPurchaseHistory}
                onManageCreditLimit={handleManageCreditLimit}
                onViewSegmentation={handleViewSegmentation}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchase-history" className="space-y-4">
          {selectedClient ? (
            <PurchaseHistory client={selectedClient} />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Selecione um Cliente</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Escolha um cliente na lista para visualizar seu histórico de compras.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setActiveTab('clients')}
                >
                  Ver Lista de Clientes
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="credit-limit" className="space-y-4">
          {selectedClient ? (
            <CreditLimitManager client={selectedClient} />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Selecione um Cliente</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Escolha um cliente na lista para gerenciar seu limite de crédito.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setActiveTab('clients')}
                >
                  Ver Lista de Clientes
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="segmentation" className="space-y-4">
          {selectedClient ? (
            <ClientSegmentation client={selectedClient} />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Selecione um Cliente</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Escolha um cliente na lista para visualizar sua segmentação e análise comportamental.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setActiveTab('clients')}
                >
                  Ver Lista de Clientes
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ 0</div>
                <p className="text-xs text-muted-foreground">
                  +0% em relação ao mês anterior
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  +0% em relação ao mês anterior
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Retenção</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0%</div>
                <p className="text-xs text-muted-foreground">
                  +0% em relação ao mês anterior
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CLV Médio</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ 0</div>
                <p className="text-xs text-muted-foreground">
                  +0% em relação ao mês anterior
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Análises de Clientes</CardTitle>
              <CardDescription>
                Visualize métricas e insights detalhados sobre seus clientes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Análises em Desenvolvimento</h3>
                <p className="text-muted-foreground">
                  Funcionalidades avançadas de análise estarão disponíveis em breve.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Client Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Atualize as informações do cliente.
            </DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <ClientForm
              onSubmit={handleEditClient}
              isLoading={false}
              client={selectedClient}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <BulkClientImport 
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
      />
    </div>
  );
}
