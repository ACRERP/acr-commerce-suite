import { useState, useEffect } from 'react';
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
  Layout
} from "lucide-react";
import { UserManagement } from '@/components/config/UserManagement';

export default function Configuracoes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setSidebarTheme, sidebarTheme, setPrimaryColor, primaryColor } = useUISettings();
  const [darkMode, setDarkMode] = useState(false);
  const [selectedColor, setSelectedColor] = useState(primaryColor || 'blue');

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
      if (appearanceConfig.primary_color) {
        setSelectedColor(appearanceConfig.primary_color);
        setPrimaryColor(appearanceConfig.primary_color);
      }
    }
  }, [appearanceConfig]);

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

  const updateAppearanceMutation = useMutation({
    mutationFn: (data: any) => upsertConfig('appearance', data),
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
    // Atualizar estado global
    setPrimaryColor(selectedColor as any);

    // Salvar no banco
    const data = {
      dark_mode: darkMode,
      primary_color: selectedColor,
      sidebar_theme: sidebarTheme,
      logo_url: appearanceConfig?.logo_url || ''
    };
    updateAppearanceMutation.mutate(data);
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
                { value: "empresa", label: "Empresa", icon: Building },
                { value: "whatsapp", label: "WhatsApp", icon: MessageSquare },
                { value: "notificacoes", label: "Notificações", icon: Bell },
                { value: "usuarios", label: "Usuários", icon: Users },
                { value: "aparencia", label: "Aparência", icon: Palette },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="px-6 py-3 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300 font-medium flex items-center gap-2"
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

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
                  Preferências de Alerta
                </h3>
              </div>
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {[
                  { id: 'estoque', label: 'Alertas de Estoque Baixo', description: 'Receber notificação quando o estoque atingir o nível crítico.', icon: Settings },
                  { id: 'vendas', label: 'Nova Venda Realizada', description: 'Tocar som e exibir popup a cada venda aprovada no PDV.', icon: MessageSquare },
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
                        <Switch id={item.id} defaultChecked />
                      </div>
                      <p className="text-sm text-neutral-500 pr-8">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 bg-neutral-50/50 dark:bg-neutral-900/30 flex justify-end border-t border-neutral-100 dark:border-neutral-800">
                <Button onClick={handleSaveNotifications} className="btn-primary hover-lift">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Preferências
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Tab: Usuários */}
          <TabsContent value="usuarios" className="animate-fade-in-up">
            <UserManagement />
          </TabsContent>

          {/* Tab: Aparência */}
          <TabsContent value="aparencia" className="animate-fade-in-up">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Theme Selector */}
              <div className="card-premium p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Palette className="w-5 h-5 text-purple-500" />
                      Tema Visual
                    </h3>
                    <p className="text-sm text-neutral-500">Personalize as cores do sistema</p>
                  </div>
                  <div className="flex items-center gap-3 bg-neutral-100 dark:bg-neutral-800 p-1.5 rounded-full border border-neutral-200 dark:border-neutral-700">
                    <button
                      onClick={() => setDarkMode(false)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${!darkMode ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}
                    >
                      Claro
                    </button>
                    <button
                      onClick={() => setDarkMode(true)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${darkMode ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}
                    >
                      Escuro
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <Label className="mb-3 block text-neutral-600 dark:text-neutral-400">Estilo da Barra Lateral</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      {/* ONYX THEME */}
                      <div
                        onClick={() => setSidebarTheme('onyx')}
                        className={`cursor-pointer rounded-xl border-2 p-4 transition-all hover:scale-[1.02] ${sidebarTheme === 'onyx' ? 'border-primary-500 bg-black shadow-xl shadow-primary-500/10' : 'border-transparent bg-neutral-100 dark:bg-neutral-800'}`}
                      >
                        <div className="flex gap-2 h-20 mb-2 rounded-lg overflow-hidden border border-neutral-800">
                          <div className="w-1/4 bg-black h-full flex flex-col p-1 gap-1 relative">
                            <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-transparent via-primary-500 to-transparent opacity-50"></div>
                            <div className="h-2 w-full bg-neutral-900 rounded-sm" />
                            <div className="h-1.5 w-3/4 bg-neutral-900 rounded-sm" />
                          </div>
                          <div className="flex-1 bg-neutral-50 dark:bg-neutral-900 h-full p-2">
                            <div className="h-2 w-1/2 bg-neutral-200 dark:bg-neutral-800 rounded mb-2" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm flex items-center gap-1.5">
                            Onyx
                            <span className="text-[10px] bg-primary-500 text-black px-1.5 rounded font-bold">PRO</span>
                          </span>
                          {sidebarTheme === 'onyx' && <Check className="w-4 h-4 text-primary-500" />}
                        </div>
                      </div>

                      {/* NAVY THEME */}
                      <div
                        onClick={() => setSidebarTheme('navy')}
                        className={`cursor-pointer rounded-xl border-2 p-4 transition-all hover:scale-[1.02] ${sidebarTheme === 'navy' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-transparent bg-neutral-100 dark:bg-neutral-800'}`}
                      >
                        <div className="flex gap-2 h-20 mb-2 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700">
                          <div className="w-1/4 bg-[#0f172a] h-full flex flex-col p-1 gap-1">
                            <div className="h-2 w-full bg-slate-700 rounded-sm" />
                            <div className="h-1.5 w-3/4 bg-slate-800 rounded-sm" />
                          </div>
                          <div className="flex-1 bg-white dark:bg-neutral-900 h-full p-2">
                            <div className="h-2 w-1/2 bg-neutral-200 dark:bg-neutral-800 rounded mb-2" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm">Navy</span>
                          {sidebarTheme === 'navy' && <Check className="w-4 h-4 text-primary-500" />}
                        </div>
                      </div>

                      {/* LIGHT THEME */}
                      <div
                        onClick={() => setSidebarTheme('light')}
                        className={`cursor-pointer rounded-xl border-2 p-4 transition-all hover:scale-[1.02] ${sidebarTheme === 'light' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-transparent bg-neutral-100 dark:bg-neutral-800'}`}
                      >
                        <div className="flex gap-2 h-20 mb-2 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700">
                          <div className="w-1/4 bg-white border-r border-neutral-200 h-full flex flex-col p-1 gap-1">
                            <div className="h-2 w-full bg-neutral-200 rounded-sm" />
                            <div className="h-1.5 w-3/4 bg-neutral-100 rounded-sm" />
                          </div>
                          <div className="flex-1 bg-white dark:bg-neutral-900 h-full p-2">
                            <div className="h-2 w-1/2 bg-neutral-200 dark:bg-neutral-800 rounded mb-2" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm">Light</span>
                          {sidebarTheme === 'light' && <Check className="w-4 h-4 text-primary-500" />}
                        </div>
                      </div>
                    </div>

                    <Label className="mb-3 block text-neutral-600 dark:text-neutral-400">Cor de Destaque (Primary)</Label>
                    <div className="grid grid-cols-6 gap-4">
                      {[
                        { name: 'blue', hex: '#3b82f6', bg: 'bg-blue-500' },
                        { name: 'purple', hex: '#8b5cf6', bg: 'bg-purple-500' },
                        { name: 'green', hex: '#10b981', bg: 'bg-green-500' },
                        { name: 'orange', hex: '#f59e0b', bg: 'bg-orange-500' },
                        { name: 'red', hex: '#ef4444', bg: 'bg-red-500' },
                        { name: 'pink', hex: '#ec4899', bg: 'bg-pink-500' }
                      ].map((color) => (
                        <button
                          key={color.name}
                          onClick={() => setSelectedColor(color.name)}
                          className={`group relative aspect-square rounded-2xl ${color.bg} shadow-lg transition-all duration-300 hover:scale-110 hover:rotate-3 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-${color.name}-300`}
                        >
                          {selectedColor === color.name && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-white font-bold" />
                              </div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                        <Upload className="w-6 h-6 text-neutral-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-neutral-900 dark:text-white">Customizar Logo</p>
                        <p className="text-xs text-neutral-500">Faça upload da sua marca para extrair cores</p>
                      </div>
                      <Button variant="outline" size="sm" className="h-8 text-xs">
                        Escolher Arquivo
                      </Button>
                    </div>

                    <Button onClick={handleSaveAppearance} className="w-full btn-primary hover-lift">
                      Salvar Aparência
                    </Button>
                  </div>
                </div>
              </div>

              {/* Preview Card */}
              <div className={`card-premium p-8 ${darkMode ? 'bg-neutral-900 text-white border-neutral-800' : 'bg-white text-neutral-900'}`}>
                <div className="flex items-center justify-between mb-8 opacity-50 pointer-events-none select-none">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="text-xs font-mono">PREVIEW DO SISTEMA</div>
                </div>

                <div className="space-y-6 pointer-events-none select-none">
                  {/* Fake Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-xl ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'} border border-transparent`}>
                      <div className={`w-8 h-8 rounded-lg mb-3 flex items-center justify-center ${selectedColor === 'blue' ? 'bg-blue-100 text-blue-600' :
                        selectedColor === 'purple' ? 'bg-purple-100 text-purple-600' :
                          selectedColor === 'green' ? 'bg-green-100 text-green-600' :
                            selectedColor === 'orange' ? 'bg-orange-100 text-orange-600' :
                              selectedColor === 'red' ? 'bg-red-100 text-red-600' :
                                'bg-pink-100 text-pink-600'
                        }`}>
                        <Users className="w-4 h-4" />
                      </div>
                      <div className="h-2 w-16 bg-neutral-200 dark:bg-neutral-700 rounded mb-2" />
                      <div className="h-6 w-12 bg-neutral-300 dark:bg-neutral-600 rounded" />
                    </div>
                    <div className={`p-4 rounded-xl ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'} border border-transparent`}>
                      <div className={`w-8 h-8 rounded-lg mb-3 flex items-center justify-center ${selectedColor === 'blue' ? 'bg-blue-100 text-blue-600' :
                        selectedColor === 'purple' ? 'bg-purple-100 text-purple-600' :
                          selectedColor === 'green' ? 'bg-green-100 text-green-600' :
                            selectedColor === 'orange' ? 'bg-orange-100 text-orange-600' :
                              selectedColor === 'red' ? 'bg-red-100 text-red-600' :
                                'bg-pink-100 text-pink-600'
                        }`}>
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div className="h-2 w-16 bg-neutral-200 dark:bg-neutral-700 rounded mb-2" />
                      <div className="h-6 w-12 bg-neutral-300 dark:bg-neutral-600 rounded" />
                    </div>
                  </div>

                  {/* Fake Button */}
                  <div className={`h-12 w-full rounded-xl flex items-center justify-center text-white font-bold shadow-lg ${selectedColor === 'blue' ? 'bg-blue-600' :
                    selectedColor === 'purple' ? 'bg-purple-600' :
                      selectedColor === 'green' ? 'bg-green-600' :
                        selectedColor === 'orange' ? 'bg-orange-600' :
                          selectedColor === 'red' ? 'bg-red-600' :
                            'bg-pink-600'
                    }`}>
                    Botão Primário
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
