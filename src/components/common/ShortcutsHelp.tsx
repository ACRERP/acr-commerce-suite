import { useState } from 'react';
import { Keyboard, X } from 'lucide-react';
import { getAllShortcuts } from '@/hooks/useKeyboardShortcuts';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ShortcutsHelpProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function ShortcutsHelp({ open: controlledOpen, onOpenChange }: ShortcutsHelpProps) {
    const [internalOpen, setInternalOpen] = useState(false);

    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setOpen = onOpenChange || setInternalOpen;

    const shortcuts = getAllShortcuts();

    // Group shortcuts by category
    const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
        const category = shortcut.category || 'Geral';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(shortcut);
        return acc;
    }, {} as Record<string, typeof shortcuts>);

    const formatKey = (key: string) => {
        return key.charAt(0).toUpperCase() + key.slice(1);
    };

    const getKeyBadges = (shortcut: typeof shortcuts[0]) => {
        const keys: string[] = [];
        if (shortcut.ctrl) keys.push('Ctrl');
        if (shortcut.shift) keys.push('Shift');
        if (shortcut.alt) keys.push('Alt');
        if (shortcut.meta) keys.push('⌘');
        keys.push(formatKey(shortcut.key));
        return keys;
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Keyboard className="w-5 h-5" />
                        Atalhos de Teclado
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
                        <div key={category}>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                                {category}
                            </h3>
                            <div className="space-y-2">
                                {categoryShortcuts.map((shortcut, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <span className="text-sm">{shortcut.description}</span>
                                        <div className="flex items-center gap-1">
                                            {getKeyBadges(shortcut).map((key, i) => (
                                                <Badge
                                                    key={i}
                                                    variant="outline"
                                                    className="font-mono text-xs px-2 py-0.5"
                                                >
                                                    {key}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {Object.keys(groupedShortcuts).indexOf(category) < Object.keys(groupedShortcuts).length - 1 && (
                                <Separator className="mt-4" />
                            )}
                        </div>
                    ))}

                    {shortcuts.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            <Keyboard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Nenhum atalho registrado</p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-4">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        <X className="w-4 h-4 mr-2" />
                        Fechar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Hook to open shortcuts help
export function useShortcutsHelp() {
    const [open, setOpen] = useState(false);

    return {
        open,
        openHelp: () => setOpen(true),
        closeHelp: () => setOpen(false),
        ShortcutsDialog: () => <ShortcutsHelp open={open} onOpenChange={setOpen} />,
    };
}
