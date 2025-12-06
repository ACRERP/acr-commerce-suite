import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShoppingCart,
    PackagePlus,
    Users,
    FileText,
    DollarSign,
    Calculator,
    Search
} from 'lucide-react';
import { QuickActionCard } from './QuickActionCard';

export function QuickActionsGrid() {
    const navigate = useNavigate();

    const actions = [
        {
            label: 'Novo Pedido',
            icon: ShoppingCart,
            shortcut: 'F2',
            path: '/vendas', // Or specific new order route
            key: 'F2',
            variant: 'primary' as const
        },
        {
            label: 'Nova Compra',
            icon: PackagePlus,
            shortcut: 'F3',
            path: '/compras', // Assuming route exists or placeholder
            key: 'F3',
            variant: 'success' as const
        },
        {
            label: 'Clientes',
            icon: Users,
            shortcut: 'F4',
            path: '/clientes',
            key: 'F4',
            variant: 'info' as const
        },
        {
            label: 'Produtos',
            icon: Search,
            shortcut: 'F5',
            path: '/produtos',
            key: 'F5',
            variant: 'default' as const
        },
        {
            label: 'Contas a Pagar',
            icon: FileText,
            shortcut: 'F6',
            path: '/financeiro',
            key: 'F6',
            variant: 'warning' as const
        },
        {
            label: 'Caixa',
            icon: Calculator,
            shortcut: 'F8',
            path: '/caixa',
            key: 'F8',
            variant: 'default' as const
        }
    ];

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const action = actions.find(a => a.key === e.key);
            if (action) {
                e.preventDefault();
                navigate(action.path);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigate]);

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8 animate-fade-in">
            {actions.map((action) => (
                <QuickActionCard
                    key={action.label}
                    icon={action.icon}
                    label={action.label}
                    shortcut={action.shortcut}
                    onClick={() => navigate(action.path)}
                    variant={action.variant}
                />
            ))}
        </div>
    );
}
