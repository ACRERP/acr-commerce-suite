import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ServiceOrderForm } from '@/components/dashboard/service-orders/ServiceOrderForm';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Wrench } from 'lucide-react';
import * as z from 'zod';

const formSchema = z.object({
    client_id: z.number().min(1, 'É obrigatório selecionar um cliente.'),
    device_type: z.string().min(1, 'O tipo do aparelho é obrigatório.'),
    device_brand: z.string().optional(),
    device_model: z.string().optional(),
    serial_number: z.string().optional(),
    reported_issue: z.string().min(5, 'Descreva o defeito com mais detalhes.'),
    technician_notes: z.string().optional(),
    accessories_included: z.string().optional(),
    power_on: z.boolean().default(false),
    has_password: z.boolean().default(false),
    password_details: z.string().optional(),
    condition: z.string().optional(),
    payment_method: z.string().optional(),
    status: z.enum(['aberta', 'em_analise', 'aguardando_aprovacao', 'em_execucao', 'aguardando_peca', 'concluida', 'entregue', 'cancelada']).default('aberta'),
});

async function addServiceOrder(dataWithItems: any) {
    const { items, ...orderData } = dataWithItems;

    // 1. Create the Service Order
    const { data: order, error: orderError } = await supabase.from('service_orders').insert([orderData]).select().single();
    if (orderError) throw new Error(orderError.message);

    // 2. Create Items if any
    if (items && items.length > 0) {
        const itemsToInsert = items.map((item: any) => ({
            service_order_id: order.id,
            item_type: item.item_type,
            product_id: item.product_id || null,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price
        }));

        const { error: itemsError } = await supabase.from('service_order_items').insert(itemsToInsert);
        if (itemsError) console.error("Error saving items:", itemsError);
    }

    return order;
}

export function NovaOrdemServicoPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const addMutation = useMutation({
        mutationFn: addServiceOrder,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['serviceOrders'] });
            toast({
                title: 'Sucesso!',
                description: `Ordem de Serviço #${data.id} criada com sucesso.`
            });
            navigate('/ordens-servico');
        },
        onError: (error: Error) => {
            toast({
                title: 'Erro!',
                description: `Não foi possível criar a OS. ${error.message}`,
                variant: 'destructive'
            });
        },
    });

    const handleSubmit = (values: z.infer<typeof formSchema>) => {
        addMutation.mutate(values);
    };

    return (
        <MainLayout>
            <div className="space-y-6 max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/ordens-servico')}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Wrench className="w-6 h-6 text-primary" />
                            Nova Ordem de Serviço
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Cadastre uma nova OS para assistência técnica
                        </p>
                    </div>
                </div>

                {/* Form Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Dados da Ordem de Serviço</CardTitle>
                        <CardDescription>
                            Preencha os dados do cliente e do aparelho
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ServiceOrderForm
                            onSubmit={handleSubmit}
                            isLoading={addMutation.isPending}
                            serviceOrder={null}
                        />
                    </CardContent>
                </Card>

                {/* Footer Actions */}
                <div className="flex justify-between items-center py-4 border-t">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/ordens-servico')}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar ao Kanban
                    </Button>
                </div>
            </div>
        </MainLayout>
    );
}

export default NovaOrdemServicoPage;
