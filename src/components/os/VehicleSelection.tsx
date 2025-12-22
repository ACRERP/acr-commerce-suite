import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { osService } from '@/lib/os/os-service';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Car, Search, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VehicleSelectionProps {
    clientId?: number;
    selectedVehicleId?: number | null;
    onSelect: (vehicle: any) => void;
}

export function VehicleSelection({ clientId, selectedVehicleId, onSelect }: VehicleSelectionProps) {
    const [plateSearch, setPlateSearch] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [newVehicle, setNewVehicle] = useState({
        plate: '',
        brand: '',
        model: '',
        year: '',
        color: ''
    });

    // Buscar veículos do cliente
    const { data: vehicles, refetch } = useQuery({
        queryKey: ['vehicles', clientId],
        queryFn: () => osService.getVehicles(clientId),
        enabled: !!clientId
    });

    const handleSearchPlate = async () => {
        if (!plateSearch) return;

        try {
            const vehicle = await osService.getVehicleByPlate(plateSearch);
            if (vehicle) {
                onSelect(vehicle);
                setPlateSearch('');
                toast.success("Veículo localizado!");
            } else {
                setNewVehicle({ ...newVehicle, plate: plateSearch.toUpperCase() });
                setIsCreating(true);
                toast.info("Veículo não encontrado. Cadastre um novo.");
            }
        } catch (error) {
            toast.error("Erro ao buscar placa");
        }
    };

    const handleCreateVehicle = async () => {
        if (!newVehicle.plate || !clientId) return;

        try {
            const created = await osService.createVehicle({
                ...newVehicle,
                client_id: clientId
            });
            onSelect(created);
            setIsCreating(false);
            setNewVehicle({ plate: '', brand: '', model: '', year: '', color: '' });
            refetch();
            toast.success("Veículo cadastrado com sucesso!");
        } catch (error) {
            toast.error("Erro ao cadastrar veículo");
        }
    };

    if (!clientId) {
        return (
            <div className="p-4 border border-dashed rounded-lg text-center text-neutral-400 text-sm">
                Selecione um cliente primeiro para gerenciar veículos.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Busca por Placa */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <Input
                        placeholder="Buscar por placa (ex: ABC1234)"
                        value={plateSearch}
                        onChange={(e) => setPlateSearch(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchPlate())}
                        className="pl-9"
                    />
                </div>
                <Button type="button" variant="secondary" onClick={handleSearchPlate}>
                    Buscar
                </Button>
            </div>

            {/* Lista de Veículos do Cliente */}
            {!isCreating && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {vehicles?.map((v) => (
                        <div
                            key={v.id}
                            onClick={() => onSelect(v)}
                            className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer",
                                selectedVehicleId === v.id
                                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                                    : "border-neutral-200 hover:border-primary/50 bg-white"
                            )}
                        >
                            <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
                                <Car className="w-5 h-5 text-neutral-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm leading-none mb-1">{v.plate}</p>
                                <p className="text-xs text-neutral-500 truncate">{v.brand} {v.model}</p>
                            </div>
                            {selectedVehicleId === v.id && (
                                <Check className="w-4 h-4 text-primary" />
                            )}
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => setIsCreating(true)}
                        className="flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-neutral-300 hover:border-primary hover:text-primary transition-all text-sm text-neutral-500"
                    >
                        <Plus className="w-4 h-4" /> Novo Veículo
                    </button>
                </div>
            )}

            {/* Formulário de Criação Rápida */}
            {isCreating && (
                <div className="p-4 border rounded-xl bg-neutral-50 dark:bg-neutral-900/50 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-neutral-500">Novo Veículo</h4>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreating(false)}>
                            Cancelar
                        </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs">Placa *</Label>
                            <Input
                                value={newVehicle.plate}
                                onChange={(e) => setNewVehicle({ ...newVehicle, plate: e.target.value.toUpperCase() })}
                                placeholder="ABC1234"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Marca</Label>
                            <Input
                                value={newVehicle.brand}
                                onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })}
                                placeholder="Ex: Toyota"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Modelo</Label>
                            <Input
                                value={newVehicle.model}
                                onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                                placeholder="Ex: Corolla"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Ano</Label>
                            <Input
                                value={newVehicle.year}
                                onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })}
                                placeholder="Ex: 2020"
                            />
                        </div>
                    </div>
                    <Button type="button" className="w-full mt-2" onClick={handleCreateVehicle}>
                        Salvar e Selecionar
                    </Button>
                </div>
            )}
        </div>
    );
}
