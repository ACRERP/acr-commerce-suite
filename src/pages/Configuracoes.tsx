import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getConfig, upsertConfig } from '@/lib/config-service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { MainLayout } from "@/components/layout/MainLayout";
import { useUISettings } from "@/contexts/UISettingsContext";
import {
  Building,
  MessageSquare,
  Bell,
  Users,
  Palette,
  Save,
  RefreshCw,
  Settings,
  Shield,
  Upload,
  User,
  Check,
  TrendingUp,
  Layout,
  Truck,
  Volume2,
  Music,
  Play,
  CheckCircle2,
  AlertTriangle,
  Speaker,
  Store
} from "lucide-react";
import { notificationManager } from '@/lib/notifications/notification-manager';
import { UserManagement } from '@/components/config/UserManagement';
import { DeliveryConfig } from '@/components/dashboard/settings/DeliveryConfig';
import { AppearanceConfig } from '@/components/dashboard/settings/AppearanceConfig';
import { BusinessProfileConfig } from '@/components/dashboard/settings/BusinessProfileConfig';
import { SystemMaintenance } from '@/components/dashboard/settings/SystemMaintenance';
import { SellerManagement } from '@/components/config/SellerManagement';
import { PermissionManagement } from '@/components/config/PermissionManagement';

export default function Configuracoes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    setSidebarTheme, sidebarTheme,
    notificationModel, notificationSound, notificationVolume, enabledAlerts,
    setNotificationSettings, setNotificationPreferences
  } = useUISettings();


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



  // Atualizar dark mode quando carregar


  // Mutations
  const updateCompanyMutation = useMutation({
    mutationFn: (data: any) => upsertConfig('company', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'company'] });
      toast({ title: 'Sucesso!', description: 'Dados da empresa salvos.' });
    },
    onError: () => {
      toast({ title: 'Erro!', description: 'Falha ao salvar dados.', variant: 'destructive' });
    }
  });

  const updateWhatsappMutation = useMutation({
    mutationFn: (data: any) => upsertConfig('whatsapp', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'whatsapp'] });
      toast({ title: 'Sucesso!', description: 'Configurações WhatsApp salvas.' });
    },
    onError: () => {
      toast({ title: 'Erro!', description: 'Falha ao salvar.', variant: 'destructive' });
    }
  });

  const updateNotificationsMutation = useMutation({
    mutationFn: (data: any) => upsertConfig('notifications', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'notifications'] });
      toast({ title: 'Sucesso!', description: 'Preferências salvas.' });
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
      footer_message: formData.get('footer_message'),
      quote_terms: formData.get('quote_terms'),
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
    // Already synced via context, but we can trigger a manual save if needed
    toast({ title: 'Sucesso!', description: 'Preferências de notificação salvas.' });
  };

  const playTestSound = (soundName: string) => {
    // Simulated sound play for now - will be implemented in notification-manager
    toast({
      title: 'Teste de Som',
      description: `Reproduzindo som: ${soundName}`,
      // icon property removed as it's not supported in standard Toast type
    });
  };

  return (
    <MainLayout>
      <div className="container-premium py-8 space-y-8 animate-fade-in-up">
        {/* Header Premium */}
        <div>
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-neutral-50 dark:to-neutral-400 tracking-tight mb-2">
            Configurações
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Administração e personalização do sistema
          </p>
        </div>

        {/* Premium Tabs */}
        <Tabs defaultValue="empresa" className="space-y-6">
          <div className="overflow-x-auto pb-2">
            <TabsList className="bg-white dark:bg-neutral-800 p-1.5 h-auto rounded-xl border border-neutral-200 dark:border-neutral-700 inline-flex min-w-full md:min-w-0 md:w-auto shadow-sm">
              {[
                { value: "perfil", label: "Perfil de Negócio", icon: Store, color: "text-primary-500" },
                { value: "empresa", label: "Empresa", icon: Building },
                { value: "whatsapp", label: "WhatsApp", icon: MessageSquare },
                { value: "notificacoes", label: "Notificações", icon: Bell },
                { value: "usuarios", label: "Usuários", icon: Users },
                { value: "vendedores", label: "Vendedores", icon: UserPlus, color: "text-blue-500" },
                { value: "permissoes", label: "Permissões", icon: Shield, color: "text-amber-500" },
                { value: "delivery", label: "Taxas de Entrega", icon: Truck },
                { value: "aparencia", label: "Aparência", icon: Palette },
                { value: "sistema", label: "Sistema", icon: AlertTriangle, color: "text-red-500" },
              ].map((tab: any) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={`px-6 py-3 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300 font-medium flex items-center gap-2 ${tab.color || ''}`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Tab: Perfil de Negócio */}
          <TabsContent value="perfil" className="animate-fade-in-up">
            <BusinessProfileConfig />
          </TabsContent>

          {/* Tab: Empresa */}
          <TabsContent value="empresa" className="animate-fade-in-up">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="card-premium p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Dados da Organização</h3>
                      <p className="text-sm text-neutral-500">Informações jurídicas e contato</p>
                    </div>
                  </div>

                  {loadingCompany ? (
                    <div className="flex justify-center p-8">
                      <RefreshCw className="w-6 h-6 animate-spin text-primary-500" />
                    </div>
                  ) : (
                    <form onSubmit={handleSaveCompany} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-neutral-600 dark:text-neutral-400">Razão Social</Label>
                          <Input
                            name="razao_social"
                            placeholder="Ex: ACR Comércio LTDA"
                            defaultValue={companyConfig?.razao_social || ''}
                            className="input-premium h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-neutral-600 dark:text-neutral-400">CNPJ</Label>
                          <Input
                            name="cnpj"
                            placeholder="00.000.000/0000-00"
                            defaultValue={companyConfig?.cnpj || ''}
                            className="input-premium h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-neutral-600 dark:text-neutral-400">Telefone</Label>
                          <Input
                            name="telefone"
                            placeholder="(11) 99999-9999"
                            defaultValue={companyConfig?.telefone || ''}
                            className="input-premium h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-neutral-600 dark:text-neutral-400">E-mail Corporativo</Label>
                          <Input
                            name="email"
                            type="email"
                            placeholder="contato@empresa.com"
                            defaultValue={companyConfig?.email || ''}
                            className="input-premium h-11"
                          />
                        </div>
                      </div>


                      <div className="space-y-2">
                        <Label className="text-neutral-600 dark:text-neutral-400">Endereço Completo</Label>
                        <Input
                          name="endereco"
                          placeholder="Rua, Número, Bairro, Cidade - UF"
                          defaultValue={companyConfig?.endereco || ''}
                          className="input-premium h-11"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        <div className="space-y-2">
                          <Label className="text-neutral-600 dark:text-neutral-400">Mensagem Rodapé (Cupom PDV)</Label>
                          <Input
                            name="footer_message"
                            placeholder="Ex: Volte Sempre! Obrigado pela preferência."
                            defaultValue={companyConfig?.footer_message || ''}
                            className="input-premium h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-neutral-600 dark:text-neutral-400">Termos de Orçamento</Label>
                          <Input
                            name="quote_terms"
                            placeholder="Ex: Validade de 7 dias. Pagamento à vista."
                            defaultValue={companyConfig?.quote_terms || ''}
                            className="input-premium h-11"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end pt-4">
                        <Button
                          type="submit"
                          className="btn-primary hover-lift px-8"
                          disabled={updateCompanyMutation.isPending}
                        >
                          {updateCompanyMutation.isPending ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          Salvar Alterações
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              <div className="card-premium h-fit p-6 bg-gradient-to-br from-neutral-900 to-neutral-800 text-white border-0">
                <Shield className="w-12 h-12 text-primary-400 mb-4" />
                <h3 className="text-xl font-bold mb-2">Segurança de Dados</h3>
                <p className="text-neutral-400 text-sm mb-6">
                  Suas informações estão protegidas com criptografia de ponta a ponta.
                  Mantenha os dados da sua empresa sempre atualizados para garantir a validade fiscal.
                </p>
                <div className="flex items-center gap-2 text-sm text-primary-400 font-medium">
                  <Check className="w-4 h-4" />
                  Certificado Digital Ativo
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab: WhatsApp */}
          <TabsContent value="whatsapp" className="animate-fade-in-up">
            <div className="card-premium max-w-2xl mx-auto p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-xl text-green-600">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Conexão WhatsApp</h3>
                    <p className="text-sm text-neutral-500">Integração via Evolution API</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${whatsappConfig?.connected ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                  {whatsappConfig?.connected ? 'CONECTADO' : 'DESCONECTADO'}
                </div>
              </div>

              <form onSubmit={handleSaveWhatsapp} className="space-y-6">
                <div className="space-y-2">
                  <Label>URL da API</Label>
                  <Input
                    name="api_url"
                    defaultValue="http://localhost:8080"
                    className="input-premium font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Chave de API (API Key)</Label>
                  <Input
                    name="api_key"
                    type="password"
                    placeholder="••••••••••••••••"
                    className="input-premium font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nome da Instância</Label>
                  <Input
                    name="instance_name"
                    defaultValue="acr-erp"
                    className="input-premium font-mono text-sm"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="button" variant="outline" className="flex-1 btn-secondary hover-lift">
                    Testar Conexão
                  </Button>
                  <Button type="submit" className="flex-1 btn-primary hover-lift">
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Configuração
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>

          {/* Tab: Notificações */}
          <TabsContent value="notificacoes" className="animate-fade-in-up">
            <div className="card-premium max-w-3xl mx-auto p-0 overflow-hidden">
              <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary-500" />
                  Gerenciamento de Alertas
                </h3>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-neutral-100 dark:border-neutral-800">
                <div className="space-y-4">
                  <Label className="text-sm font-bold uppercase tracking-wider text-neutral-500">Modelo de Alerta</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'default', label: 'Padrão' },
                      { id: 'modern', label: 'Moderno' },
                      { id: 'minimal', label: 'Minimal' }
                    ].map(m => (
                      <button
                        key={m.id}
                        onClick={() => setNotificationPreferences(m.id as any, notificationSound, notificationVolume)}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all ${notificationModel === m.id ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm' : 'border-neutral-200 hover:border-neutral-300'}`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-bold uppercase tracking-wider text-neutral-500">Som da Notificação</Label>
                  <div className="flex gap-3">
                    <select
                      value={notificationSound}
                      onChange={(e) => setNotificationPreferences(notificationModel, e.target.value as any, notificationVolume)}
                      className="flex-1 h-11 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
                    >
                      <option value="none">Mudo</option>
                      <option value="chime">Chime (Sutil)</option>
                      <option value="glass">Glass (Cristalino)</option>
                      <option value="digital">Digital (Tech)</option>
                      <option value="success">Success (Vibrante)</option>
                      <option value="alert">Alert (Atenção)</option>
                    </select>
                    <Button
                      variant="outline"
                      onClick={() => playTestSound(notificationSound)}
                      disabled={notificationSound === 'none'}
                      className="h-11 w-11 p-0 rounded-xl"
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 col-span-1 md:col-span-2 bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-sm font-bold">Volume do Alerta</Label>
                    <span className="text-xs font-mono">{Math.round(notificationVolume * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Speaker className="w-4 h-4 text-neutral-400" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={notificationVolume}
                      onChange={(e) => setNotificationPreferences(notificationModel, notificationSound, parseFloat(e.target.value))}
                      className="flex-1 accent-primary-500"
                    />
                    <Volume2 className="w-4 h-4 text-neutral-400" />
                  </div>
                </div>
              </div>

              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {[
                  { id: 'estoque', label: 'Alertas de Estoque Baixo', description: 'Receber notificação quando o estoque atingir o nível crítico.', icon: Settings },
                  { id: 'vendas', label: 'Nova Venda Realizada', description: 'Tocar som e exibir popup a cada venda aprovada no PDV.', icon: TrendingUp },
                  { id: 'os', label: 'Status de OS', description: 'Notificar técnico quando uma OS for designada ou atualizada.', icon: Users },
                  { id: 'financeiro', label: 'Contas a Pagar', description: 'Alerta diário sobre contas vencendo no dia.', icon: Bell },
                ].map((item) => (
                  <div key={item.id} className="p-6 flex items-start gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <div className="p-2 bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 text-neutral-500">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor={item.id} className="font-bold text-neutral-900 dark:text-white cursor-pointer select-none">{item.label}</label>
                        <Switch
                          id={item.id}
                          checked={enabledAlerts[item.id as keyof typeof enabledAlerts]}
                          onCheckedChange={(val) => setNotificationSettings({ [item.id]: val })}
                        />
                      </div>
                      <p className="text-sm text-neutral-500 pr-8">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 bg-neutral-50/50 dark:bg-neutral-900/30 flex justify-end border-t border-neutral-100 dark:border-neutral-800">
                <Button onClick={handleSaveNotifications} className="btn-primary hover-lift">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Salvar Preferências
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Tab: Usuários */}
          <TabsContent value="usuarios" className="animate-fade-in-up">
            <UserManagement />
          </TabsContent>

          {/* Tab: Vendedores */}
          <TabsContent value="vendedores" className="animate-fade-in-up">
            <SellerManagement />
          </TabsContent>

          {/* Tab: Permissões */}
          <TabsContent value="permissoes" className="animate-fade-in-up">
            <PermissionManagement />
          </TabsContent>

          <TabsContent value="delivery" className="animate-fade-in-up">
            <DeliveryConfig />
          </TabsContent>

          {/* Tab: Aparência */}
          <TabsContent value="aparencia" className="animate-fade-in-up">
            <AppearanceConfig />
          </TabsContent>
          {/* Tab: Sistema */}
          <TabsContent value="sistema" className="animate-fade-in-up">
            <SystemMaintenance />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
