import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

interface Breadcrumb {
  label: string;
  path: string;
}

const routeLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/produtos': 'Produtos',
  '/produtos/categorias': 'Categorias',
  '/clientes': 'Clientes',
  '/vendas': 'Vendas',
  '/vendas/historico': 'Histórico',
  '/ordens-servico': 'Ordens de Serviço',
  '/financeiro': 'Financeiro',
  '/relatorios': 'Relatórios',
  '/fiscal': 'Fiscal',
  '/delivery': 'Delivery',
  '/crm': 'CRM',
  '/estoque': 'Estoque',
  '/configuracoes': 'Configurações',
  '/pdv': 'PDV',
  '/caixa': 'Caixa',
};

export function useBreadcrumbs(customBreadcrumbs?: Breadcrumb[]): Breadcrumb[] {
  const location = useLocation();

  return useMemo(() => {
    if (customBreadcrumbs) {
      return customBreadcrumbs;
    }

    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: Breadcrumb[] = [];

    // Always add home
    breadcrumbs.push({ label: 'Início', path: '/' });

    // Build breadcrumbs from path
    let currentPath = '';
    for (const segment of pathSegments) {
      currentPath += `/${segment}`;
      const label = routeLabels[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1);
      breadcrumbs.push({ label, path: currentPath });
    }

    return breadcrumbs;
  }, [location.pathname, customBreadcrumbs]);
}
