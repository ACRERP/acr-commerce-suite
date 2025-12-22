/**
 * Componente de indicador de atalhos de teclado
 * 
 * Exibe uma legenda flutuante com os atalhos disponíveis
 */

import { Keyboard } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface Shortcut {
    key: string;
    description: string;
}

const SHORTCUTS: Shortcut[] = [
    { key: 'F2', description: 'Buscar Produto' },
    { key: 'F3', description: 'Buscar Cliente' },
    { key: 'F5', description: 'Aplicar Desconto' },
    { key: 'F12', description: 'Finalizar Venda' },
    { key: 'Ctrl+N', description: 'Nova Venda' },
    { key: 'ESC', description: 'Cancelar' },
];

export function ShortcutsIndicator() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {isOpen && (
                <Card className="mb-2 shadow-lg">
                    <CardContent className="p-4">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <Keyboard className="h-4 w-4" />
                            Atalhos de Teclado
                        </h3>
                        <div className="space-y-2">
                            {SHORTCUTS.map((shortcut) => (
                                <div key={shortcut.key} className="flex items-center justify-between gap-4 text-sm">
                                    <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">
                                        {shortcut.key}
                                    </kbd>
                                    <span className="text-muted-foreground">{shortcut.description}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Button
                variant="outline"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                className="shadow-lg"
                title="Atalhos de Teclado (F1)"
            >
                <Keyboard className="h-4 w-4" />
            </Button>
        </div>
    );
}
