import { Keyboard } from 'lucide-react';

export function SaleShortcuts() {
    const shortcuts = [
        { key: 'F2', label: 'Buscar Produto' },
        { key: 'F4', label: 'Desconto' },
        { key: 'F5', label: 'Pagamento' },
        { key: 'F6', label: 'Delivery' },
        { key: 'F7', label: 'Cliente' },
        { key: 'ESC', label: 'Cancelar' },
    ];

    return (
        <div className="flex items-center gap-4 text-xs text-gray-500 overflow-x-auto py-2">
            <Keyboard className="h-4 w-4" />
            {shortcuts.map((s) => (
                <div key={s.key} className="flex items-center gap-1.5 whitespace-nowrap">
                    <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded-md font-bold text-gray-700 min-w-[2rem] text-center shadow-[0_1px_0_rgba(0,0,0,0.1)]">
                        {s.key}
                    </kbd>
                    <span>{s.label}</span>
                </div>
            ))}
        </div>
    );
}
