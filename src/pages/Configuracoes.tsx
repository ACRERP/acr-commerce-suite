import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getConfig, updateConfig } from '@/lib/config-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Building,
  MessageSquare,
  Bell,
  Users,
  Palette,
  Save,
  RefreshCw
} from "lucide-react";
import { UserManagement } from '@/components/config/UserManagement';

export default function Configuracoes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [darkMode, setDarkMode] = useState(false);
  const [selectedColor, setSelectedColor] = useState('blue');

  // Buscar configurações
  const { data: companyConfig, isLoading: loadingCompany } = useQuery({
    queryKey: ['config', 'company'],
    queryFn: () => getConfig('company')
  });

  const { data: whatsappConfig, isLoading: loadingWhatsapp } = useQuery({
    queryKey: ['config', 'whatsapp'],
    queryFn: () => getConfig('whatsapp')
  });

  const { data: notificationsConfig, isLoading: loadingNotifications } = useQuery({
    queryKey: ['config', 'notifications'],
    queryFn: () => getConfig('notifications')
  });

  const { data: appearanceConfig, isLoading: loadingAppearance } = useQuery({
    queryKey: ['config', 'appearance'],
    queryFn: () => getConfig('appearance')
  });

  // Atualizar dark mode quando carregar
  useEffect(() => {
    if (appearanceConfig) {
      setDarkMode(appearanceConfig.dark_mode || false);
      setSelectedColor(appearanceConfig.primary_color || 'blue');
    }
  }, [appearanceConfig]);

  // Mutations
  const updateCompanyMutation = useMutation({
    mutationFn: (data: any) => updateConfig('company', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'company'] });
      toast({ title: 'Sucesso!', description: 'Dados da empresa salvos.' });
    },
    onError: () => {
      toast({ title: 'Erro!', description: 'Falha ao salvar dados.', variant: 'destructive' });
    }
  });

  const updateWhatsappMutation = useMutation({
    mutationFn: (data: any) => updateConfig('whatsapp', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'whatsapp'] });
      toast({ title: 'Sucesso!', description: 'Configurações WhatsApp salvas.' });
    },
    onError: () => {
      toast({ title: 'Erro!', description: 'Falha ao salvar.', variant: 'destructive' });
    }
  });

  const updateNotificationsMutation = useMutation({
    mutationFn: (data: any) => updateConfig('notifications', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'notifications'] });
      toast({ title: 'Sucesso!', description: 'Preferências salvas.' });
    },
    onError: () => {
      toast({ title: 'Erro!', description: 'Falha ao salvar.', variant: 'destructive' });
    }
  });

  const updateAppearanceMutation = useMutation({
    mutationFn: (data: any) => updateConfig('appearance', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'appearance'] });
      toast({ title: 'Sucesso!', description: 'Aparência atualizada.' });
    },
    onError: () => {
      toast({ title: 'Erro!', description: 'Falha ao salvar.', variant: 'destructive' });
    }
  });

  // Handlers
  const handleSaveCompany = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      razao_social: formData.get('razao_social'),
      cnpj: formData.get('cnpj'),
      telefone: formData.get('telefone'),
      email: formData.get('email'),
      endereco: formData.get('endereco'),
      logo_url: companyConfig?.logo_url || ''
    };
    updateCompanyMutation.mutate(data);
  };

  const handleSaveWhatsapp = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      api_url: formData.get('api_url'),
      api_key: formData.get('api_key'),
      instance_name: formData.get('instance_name'),
      connected: whatsappConfig?.connected || false
    };
    updateWhatsappMutation.mutate(data);
  };

  const handleSaveNotifications = () => {
    updateNotificationsMutation.mutate(notificationsConfig);
  };

  const handleSaveAppearance = () => {
    const data = {
      dark_mode: darkMode,
      primary_color: selectedColor,
      logo_url: appearanceConfig?.logo_url || ''
    };
    updateAppearanceMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Configurações
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Personalize o sistema conforme sua necessidade
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="empresa" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="empresa">Empresa</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="aparencia">Aparência</TabsTrigger>
        </TabsList>

        {/* Tab: Empresa */}
        <TabsContent value="empresa">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Dados da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingCompany ? (
                <div className="flex justify-center p-8">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <form onSubmit={handleSaveCompany}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="razao_social">Razão Social</Label>
                      <Input
                        id="razao_social"
                        name="razao_social"
                        placeholder="Ex: ACR Comércio LTDA"
                        defaultValue={companyConfig?.razao_social || ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cnpj">CNPJ</Label>
                      <Input
                        id="cnpj"
                        name="cnpj"
                        placeholder="00.000.000/0000-00"
                        defaultValue={companyConfig?.cnpj || ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input
                        id="telefone"
                        name="telefone"
                        placeholder="(11) 99999-9999"
                        defaultValue={companyConfig?.telefone || ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="contato@empresa.com"
                        defaultValue={companyConfig?.email || ''}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="endereco">Endereço Completo</Label>
                    <Input
                      id="endereco"
                      name="endereco"
                      placeholder="Rua, Número, Bairro, Cidade - UF"
                      defaultValue={companyConfig?.endereco || ''}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full md:w-auto"
                    disabled={updateCompanyMutation.isPending}
                  >
                    {updateCompanyMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Salvar Dados da Empresa
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: WhatsApp */}
        <TabsContent value="whatsapp">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Configurações WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-url">URL da API Evolution</Label>
                <Input
                  id="api-url"
                  placeholder="http://localhost:8080"
                  defaultValue="http://localhost:8080"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="Sua chave da API"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instance-name">Nome da Instância</Label>
                <Input
                  id="instance-name"
                  placeholder="acr-erp"
                  defaultValue="acr-erp"
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium">Status da Conexão</p>
                  <p className="text-sm text-gray-500">Verificar conexão com WhatsApp</p>
                </div>
                <Button variant="outline">Testar Conexão</Button>
              </div>
              <Button className="w-full md:w-auto">
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações WhatsApp
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Notificações */}
        <TabsContent value="notificacoes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Preferências de Notificações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { id: 'estoque', label: 'Alertas de estoque baixo', description: 'Notificar quando produtos atingirem estoque mínimo' },
                { id: 'vendas', label: 'Notificações de vendas', description: 'Receber alerta a cada nova venda realizada' },
                { id: 'os', label: 'Atualizações de OS', description: 'Notificar mudanças de status em ordens de serviço' },
                { id: 'contas', label: 'Lembretes de contas a pagar', description: 'Alertas de contas próximas do vencimento' },
                { id: 'email', label: 'Resumo diário por e-mail', description: 'Receber relatório diário de atividades' },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                  </div>
                  <Switch defaultChecked={item.id !== 'contas' && item.id !== 'email'} />
                </div>
              ))}
              <Button className="w-full md:w-auto">
                <Save className="w-4 h-4 mr-2" />
                Salvar Preferências
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Usuários */}
        <TabsContent value="usuarios">
          <UserManagement />
        </TabsContent>

        {/* Tab: Aparência */}
        <TabsContent value="aparencia">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Personalização Visual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingAppearance ? (
                <div className="flex justify-center p-8">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Modo Escuro</p>
                      <p className="text-sm text-gray-500">Ativar tema escuro no sistema</p>
                    </div>
                    <Switch
                      checked={darkMode}
                      onCheckedChange={setDarkMode}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cor Primária do Sistema</Label>
                    <div className="grid grid-cols-6 gap-2">
                      {['blue', 'purple', 'green', 'orange', 'red', 'pink'].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={`w-12 h-12 rounded-lg bg-${color}-600 hover:scale-110 transition-transform relative`}
                          title={color}
                        >
                          {selectedColor === color && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                                <span className="text-xs">✓</span>
                              </div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logo">Logotipo da Empresa</Label>
                    <Input id="logo" type="file" accept="image/*" />
                    <p className="text-xs text-gray-500">Formatos aceitos: PNG, JPG, SVG (máx. 2MB)</p>
                  </div>
                  <Button
                    onClick={handleSaveAppearance}
                    className="w-full md:w-auto"
                    disabled={updateAppearanceMutation.isPending}
                  >
                    {updateAppearanceMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Salvar Aparência
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Usuários */}
        <TabsContent value="usuarios">
          <UserManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
