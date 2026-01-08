import { useLocation } from 'react-router-dom';

export interface Breadcrumb {
  label: string;
  path: string;
}

const routeLabels: Record<string, string> = {
  '/': 'Início',
  '/dashboard': 'Dashboard',
  '/produtos': 'Produtos',
  '/clientes': 'Clientes',
  '/financeiro': 'Financeiro',
  '/pdv': 'PDV',
  '/configuracoes': 'Configurações',
};

export function useBreadcrumbs(): Breadcrumb[] {
  const location = useLocation();
  const paths = location.pathname.split('/').filter(Boolean);
  
  return paths.map((_, index) => {
    const path = '/' + paths.slice(0, index + 1).join('/');
    return { label: routeLabels[path] || paths[index], path };
  });
}
