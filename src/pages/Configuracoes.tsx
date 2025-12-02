import { MainLayout } from "@/components/layout/MainLayout";
import {
  Settings,
  User,
  Building,
  Printer,
  Bell,
  Shield,
  Link,
  Database,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

const settingsGroups = [
  {
    title: "Empresa",
    icon: Building,
    items: [
      { label: "Dados da Empresa", desc: "CNPJ, razão social, endereço" },
      { label: "Logotipo", desc: "Imagem e marca da empresa" },
      { label: "Certificado Digital", desc: "A1/A3 para emissão de notas" },
    ],
  },
  {
    title: "Usuários",
    icon: User,
    items: [
      { label: "Gerenciar Usuários", desc: "Adicionar, editar e remover" },
      { label: "Permissões", desc: "Grupos e níveis de acesso" },
      { label: "Logs de Atividade", desc: "Histórico de ações" },
    ],
  },
  {
    title: "Impressão",
    icon: Printer,
    items: [
      { label: "Impressoras", desc: "Configurar impressoras" },
      { label: "Modelos de Impressão", desc: "Cupons, etiquetas, relatórios" },
      { label: "Tamanho de Papel", desc: "A4, 80mm, 58mm" },
    ],
  },
  {
    title: "Integrações",
    icon: Link,
    items: [
      { label: "iFood", desc: "Conectar pedidos online" },
      { label: "Mercado Livre", desc: "Sincronizar produtos" },
      { label: "Contabilidade", desc: "Exportar dados fiscais" },
    ],
  },
];

const Configuracoes = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="page-header">Configurações</h1>
          <p className="text-muted-foreground mt-1">
            Personalize o sistema conforme sua necessidade
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {settingsGroups.map((group, groupIndex) => (
            <div
              key={group.title}
              className="stat-card animate-fade-in"
              style={{ animationDelay: `${groupIndex * 100}ms` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <group.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="section-title">{group.title}</h3>
              </div>
              <div className="space-y-3">
                {group.items.map((item, index) => (
                  <button
                    key={item.label}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors text-left"
                  >
                    <div>
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Settings className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <h3 className="section-title">Notificações</h3>
          </div>
          <div className="space-y-4">
            {[
              { label: "Alertas de estoque baixo", enabled: true },
              { label: "Notificações de vendas", enabled: true },
              { label: "Lembretes de contas a pagar", enabled: false },
              { label: "Resumo diário por e-mail", enabled: false },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between py-2"
              >
                <span className="text-sm">{item.label}</span>
                <Switch defaultChecked={item.enabled} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Configuracoes;
