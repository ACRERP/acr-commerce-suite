import { 
  Store, ShoppingCart, ShoppingBag, Package, Truck, 
  Wrench, Users, Target, DollarSign, BarChart3, 
  Calculator, NotebookPen, ClipboardList, UtensilsCrossed,
  Clock, Calendar, HeartPulse, GraduationCap, Briefcase,
  Car, Sparkles, ShieldCheck,
  LucideIcon
} from "lucide-react";

export interface ModuleDefinition {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  description: string;
}

export const MODULE_REGISTRY: Record<string, ModuleDefinition> = {
  // Vendas e Operações
  'pdv': { id: 'pdv', label: 'PDV', icon: Store, path: '/pdv', description: 'Ponto de Venda e Frente de Caixa' },
  'sales': { id: 'sales', label: 'Vendas', icon: ShoppingCart, path: '/vendas', description: 'Gestão de vendas e pedidos' },
  'purchases': { id: 'purchases', label: 'Compras', icon: ShoppingBag, path: '/compras', description: 'Entrada de mercadorias e fornecedores' },
  'inventory': { id: 'inventory', label: 'Estoque', icon: Package, path: '/estoque', description: 'Controle de movimentação e inventário' },
  'delivery': { id: 'delivery', label: 'Delivery', icon: Truck, path: '/delivery', description: 'Gestão de entregas e motoboys' },
  'fleet': { id: 'fleet', label: 'Frota', icon: Car, path: '/frota', description: 'Gestão de veículos e logística' },
  
  // Serviços
  'service_orders': { id: 'service_orders', label: 'Ordens de Serviço', icon: Wrench, path: '/os', description: 'Gestão de serviços e oficinas' },
  'production': { id: 'production', label: 'Produção', icon: ClipboardList, path: '/production', description: 'Controle de fabricação e receitas' },
  'kitchen': { id: 'kitchen', label: 'Cozinha (KDS)', icon: UtensilsCrossed, path: '/kds', description: 'Gestão de pedidos na cozinha' },
  'scheduling': { id: 'scheduling', label: 'Agenda', icon: Calendar, path: '/agenda', description: 'Agendamentos e compromissos' },
  
  // Relacionamento
  'clients': { id: 'clients', label: 'Clientes', icon: Users, path: '/clientes', description: 'Cadastro e histórico de clientes' },
  'crm': { id: 'crm', label: 'CRM / Leads', icon: Target, path: '/crm', description: 'Funil de vendas e prospecção' },
  'marketing': { id: 'marketing', label: 'Marketing', icon: Sparkles, path: '/marketing', description: 'Campanhas e automação' },
  'patients': { id: 'patients', label: 'Pacientes', icon: HeartPulse, path: '/pacientes', description: 'Gestão de pacientes e prontuários' },
  'students': { id: 'students', label: 'Alunos', icon: GraduationCap, path: '/alunos', description: 'Gestão de matrículas e presença' },
  
  // Financeiro e Administrativo
  'team': { id: 'team', label: 'Time', icon: Users, path: '/team', description: 'Gestão de equipe e comissões' },
  'compliance': { id: 'compliance', label: 'Compliance', icon: ShieldCheck, path: '/compliance', description: 'Regulamentação e conformidade' },
  'academic': { id: 'academic', label: 'Acadêmico', icon: GraduationCap, path: '/academic', description: 'Gestão acadêmica e escolar' },
  'finance': { id: 'finance', label: 'Financeiro', icon: DollarSign, path: '/financeiro', description: 'Contas a pagar e receber' },
  'reports': { id: 'reports', label: 'Relatórios', icon: BarChart3, path: '/relatorios', description: 'BI e análise de dados' },
  'fiscal': { id: 'fiscal', label: 'Fiscal', icon: Calculator, path: '/fiscal', description: 'Emissão de notas e impostos' },
  'projects': { id: 'projects', label: 'Projetos', icon: Briefcase, path: '/projects', description: 'Gestão de projetos e obras' }
};

export type ModuleID = keyof typeof MODULE_REGISTRY;
