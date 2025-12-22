import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Map, Save, Navigation, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deliveryService } from '@/lib/delivery/delivery-service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export function DeliveryMapConfig() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Form State
    const [apiKey, setApiKey] = useState('');
    const [pricePerKm, setPricePerKm] = useState(1.50);
    const [mode, setMode] = useState('hybrid');

    // Fetch Settings
    const { data: settings, isLoading } = useQuery({
        queryKey: ['delivery-settings'],
        queryFn: () => deliveryService.getSettings()
    });

    // Sync State with Data
    useEffect(() => {
        if (settings) {
            setApiKey(settings.google_maps_key || '');
            setPricePerKm(settings.price_per_km || 1.50);
            setMode(settings.calculation_mode || 'hybrid');
        }
    }, [settings]);

    // Save Mutation
    const updateMutation = useMutation({
        mutationFn: (data: any) => deliveryService.updateSettings(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['delivery-settings'] });
            toast({ title: 'Configurações Salvas', description: 'Integração atualizada com sucesso.' });
        },
        onError: () => {
            toast({ title: 'Erro', description: 'Falha ao salvar configurações.', variant: 'destructive' });
        }
    });

    const handleSave = () => {
        updateMutation.mutate({
            google_maps_key: apiKey,
            price_per_km: pricePerKm,
            calculation_mode: mode
        });
    };

    return (
        <Card className="w-full border-l-4 border-l-blue-500">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                    <Map className="w-5 h-5" />
                    Integração Google Maps (Cálculo Automático)
                </CardTitle>
                <CardDescription>
                    Configure a API do Google para calcular rotas e preços baseados em distância.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* API Key */}
                    <div className="space-y-2 md:col-span-2">
                        <Label>Google Maps API Key</Label>
                        <div className="flex gap-2">
                            <Input
                                type="password"
                                placeholder="AIzaVy..."
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="font-mono"
                            />
                        </div>
                        <p className="text-xs text-neutral-500">
                            Necessário habilitar: Distance Matrix API e Maps JavaScript API.
                        </p>
                    </div>

                    {/* Preço por KM */}
                    <div className="space-y-2">
                        <Label>Preço por KM (R$)</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-neutral-500">R$</span>
                            <Input
                                type="number"
                                className="pl-9"
                                step="0.10"
                                value={pricePerKm}
                                onChange={(e) => setPricePerKm(Number(e.target.value))}
                            />
                        </div>
                    </div>

                    {/* Modo de Operação */}
                    <div className="space-y-2">
                        <Label>Modo de Cálculo</Label>
                        <Select value={mode} onValueChange={setMode}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="fixed">Apenas Tabelado (Regiões)</SelectItem>
                                <SelectItem value="distance">Apenas Distância (Google Maps)</SelectItem>
                                <SelectItem value="hybrid">Híbrido (Região Fixa ou KM)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Status Section */}
                <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${apiKey ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-sm font-medium">
                            {apiKey ? 'API Key Configurada' : 'API Key Ausente'}
                        </span>
                    </div>
                    {mode === 'hybrid' && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                            Modo Híbrido Ativo
                        </Badge>
                    )}
                </div>

                <Button onClick={handleSave} disabled={updateMutation.isPending} className="w-full bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    {updateMutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
                </Button>

            </CardContent>
        </Card>
    );
}
