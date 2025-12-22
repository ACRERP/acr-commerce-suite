import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, MapPin, Edit2, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deliveryService } from '@/lib/delivery/delivery-service';
import { DeliveryMapConfig } from './DeliveryMapConfig';

interface DeliveryRegion {
    id: number;
    name: string;
    cep_start: string;
    cep_end: string;
    fee: number;
}

export function DeliveryConfig() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [editingId, setEditingId] = useState<number | null>(null);

    const [formData, setFormData] = useState<Partial<DeliveryRegion>>({
        name: '',
        cep_start: '',
        cep_end: '',
        fee: 0
    });

    // Fetch Regions
    const { data: regions = [], isLoading } = useQuery({
        queryKey: ['delivery-regions'],
        queryFn: () => deliveryService.getRegions()
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: any) => deliveryService.createRegion(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['delivery-regions'] });
            toast({ title: 'Sucesso', description: 'Região criada com sucesso.' });
            resetForm();
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => deliveryService.updateRegion(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['delivery-regions'] });
            toast({ title: 'Sucesso', description: 'Região atualizada com sucesso.' });
            resetForm();
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => deliveryService.deleteRegion(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['delivery-regions'] });
            toast({ title: 'Sucesso', description: 'Região removida.' });
        }
    });

    const resetForm = () => {
        setFormData({ name: '', cep_start: '', cep_end: '', fee: 0 });
        setEditingId(null);
    };

    const handleSave = () => {
        if (!formData.name || !formData.fee) {
            toast({ title: 'Erro', description: 'Preencha nome e taxa.', variant: 'destructive' });
            return;
        }

        const payload = {
            name: formData.name,
            cep_start: formData.cep_start,
            cep_end: formData.cep_end,
            fee: Number(formData.fee)
        };

        if (editingId) {
            updateMutation.mutate({ id: editingId, data: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const handleEdit = (region: DeliveryRegion) => {
        setEditingId(region.id);
        setFormData({
            name: region.name,
            cep_start: region.cep_start,
            cep_end: region.cep_end,
            fee: region.fee
        });
    };

    const isSaving = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Google Maps Configuration */}
            <DeliveryMapConfig />

            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        Taxas de Entrega por Região
                    </CardTitle>
                    <CardDescription>
                        Configure os valores de entrega baseados em CEP ou nome da região.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Form to add/edit region */}
                    <div className={`grid grid-cols-1 md:grid-cols-5 gap-4 items-end p-4 rounded-lg border transition-colors ${editingId ? 'bg-amber-50 border-amber-200' : 'bg-neutral-50 border-neutral-100'}`}>
                        <div className="space-y-2 md:col-span-2">
                            <Label>Nome da Região</Label>
                            <Input
                                placeholder="Ex: Zona Leste"
                                value={formData.name || ''}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>CEP Inicial</Label>
                            <Input
                                placeholder="00000-000"
                                value={formData.cep_start || ''}
                                onChange={e => setFormData({ ...formData, cep_start: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>CEP Final</Label>
                            <Input
                                placeholder="00000-000"
                                value={formData.cep_end || ''}
                                onChange={e => setFormData({ ...formData, cep_end: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Valor (R$)</Label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={formData.fee || ''}
                                onChange={e => setFormData({ ...formData, fee: Number(e.target.value) })}
                            />
                        </div>

                        <div className="flex gap-2 w-full md:col-span-5 md:w-auto md:ml-auto">
                            {editingId && (
                                <Button variant="ghost" onClick={resetForm} disabled={isSaving}>
                                    <X className="w-4 h-4 mr-2" /> Cancelar
                                </Button>
                            )}
                            <Button onClick={handleSave} disabled={isSaving} className={editingId ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}>
                                {editingId ? <Save className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                {editingId ? 'Atualizar' : 'Adicionar'}
                            </Button>
                        </div>
                    </div>

                    {/* List of regions */}
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Região</TableHead>
                                    <TableHead>Faixa de CEP</TableHead>
                                    <TableHead className="text-right">Taxa de Entrega</TableHead>
                                    <TableHead className="w-[100px] text-center">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8">Carregando...</TableCell>
                                    </TableRow>
                                ) : regions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-neutral-500">Nenhuma região cadastrada.</TableCell>
                                    </TableRow>
                                ) : (
                                    regions.map((region: DeliveryRegion) => (
                                        <TableRow key={region.id} className={editingId === region.id ? "bg-amber-50" : ""}>
                                            <TableCell className="font-medium">{region.name}</TableCell>
                                            <TableCell>{region.cep_start} - {region.cep_end}</TableCell>
                                            <TableCell className="text-right font-bold text-green-600">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(region.fee)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-center gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(region)}>
                                                        <Edit2 className="w-4 h-4 text-amber-500" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(region.id)}>
                                                        <Trash2 className="w-4 h-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                </CardContent>
            </Card>
        </div>
    );
}
