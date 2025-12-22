import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings, Wrench, Package, Truck, Receipt } from 'lucide-react';

export interface SalesSettings {
    showLabor: boolean;
    showParts: boolean;
    showServices: boolean;
    showShipping: boolean;
    showDiscountPerItem: boolean;
}

const DEFAULT_SETTINGS: SalesSettings = {
    showLabor: true,
    showParts: true,
    showServices: true,
    showShipping: false,
    showDiscountPerItem: true,
};

interface QuoteSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSettingsChange?: () => void;
}

export function QuoteSettingsDialog({ open, onOpenChange, onSettingsChange }: QuoteSettingsDialogProps) {
    const [settings, setSettings] = useState<SalesSettings>(DEFAULT_SETTINGS);

    useEffect(() => {
        const saved = localStorage.getItem('acr_sales_settings');
        if (saved) {
            try {
                setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
            } catch (e) {
                // ignore
            }
        }
    }, [open]);

    const handleSave = () => {
        localStorage.setItem('acr_sales_settings', JSON.stringify(settings));
        onOpenChange(false);
        if (onSettingsChange) onSettingsChange();

        // Dispatch custom event for immediate update
        window.dispatchEvent(new Event('sales-settings-changed'));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-neutral-500" />
                        Configurações de Orçamento
                    </DialogTitle>
                    <DialogDescription>
                        Personalize quais campos devem aparecer na tela de criação de propostas.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="flex items-center justify-between space-x-2">
                        <div className="flex flex-col space-y-1">
                            <Label htmlFor="show-labor" className="font-medium flex items-center gap-2">
                                <Wrench className="w-4 h-4 text-orange-500" />
                                Mão de Obra
                            </Label>
                            <span className="text-xs text-neutral-500">Habilitar campo para valor de serviços/mão de obra.</span>
                        </div>
                        <Switch
                            id="show-labor"
                            checked={settings.showLabor}
                            onCheckedChange={(c) => setSettings(s => ({ ...s, showLabor: c }))}
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                        <div className="flex flex-col space-y-1">
                            <Label htmlFor="show-parts" className="font-medium flex items-center gap-2">
                                <Package className="w-4 h-4 text-blue-500" />
                                Peças e Produtos
                            </Label>
                            <span className="text-xs text-neutral-500">Habilitar seleção de produtos do estoque.</span>
                        </div>
                        <Switch
                            id="show-parts"
                            checked={settings.showParts}
                            onCheckedChange={(c) => setSettings(s => ({ ...s, showParts: c }))}
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                        <div className="flex flex-col space-y-1">
                            <Label htmlFor="show-shipping" className="font-medium flex items-center gap-2">
                                <Truck className="w-4 h-4 text-green-500" />
                                Frete e Entrega
                            </Label>
                            <span className="text-xs text-neutral-500">Habilitar campos de frete na proposta.</span>
                        </div>
                        <Switch
                            id="show-shipping"
                            checked={settings.showShipping}
                            onCheckedChange={(c) => setSettings(s => ({ ...s, showShipping: c }))}
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                        <div className="flex flex-col space-y-1">
                            <Label htmlFor="show-discount" className="font-medium flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-purple-500" />
                                Desconto por Item
                            </Label>
                            <span className="text-xs text-neutral-500">Permitir aplicar desconto individual em cada produto.</span>
                        </div>
                        <Switch
                            id="show-discount"
                            checked={settings.showDiscountPerItem}
                            onCheckedChange={(c) => setSettings(s => ({ ...s, showDiscountPerItem: c }))}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSave} className="btn-primary">Salvar Preferências</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
