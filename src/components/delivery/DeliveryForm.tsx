import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { deliveryService } from '@/lib/delivery/delivery-service';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface DeliveryFormProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function DeliveryForm({ open, onClose, onSuccess }: DeliveryFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: {
            customer_name: '',
            customer_phone: '',
            address: '',
            total_amount: '',
            delivery_fee: '5.00',
            payment_method: 'dinheiro',
            observations: '',
            priority: 'normal' as 'normal' | 'urgent'
        }
    });

    const onSubmit = async (data: any) => {
        try {
            setIsSubmitting(true);

            await deliveryService.createDelivery({
                customer_name: data.customer_name,
                customer_phone: data.customer_phone,
                address: data.address,
                total_amount: parseFloat(data.total_amount),
                delivery_fee: parseFloat(data.delivery_fee),
                payment_method: data.payment_method,
                payment_status: 'pending',
                observations: data.observations,
                priority: data.priority,
                status: 'pending'
            });

            toast.success('Entrega criada com sucesso!');
            reset();
            onClose();
            onSuccess?.();
        } catch (error: any) {
            console.error('Erro ao criar entrega:', error);
            toast.error('Erro ao criar entrega: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Nova Entrega</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Cliente */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="customer_name">
                                Nome do Cliente <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="customer_name"
                                {...register('customer_name', { required: 'Nome é obrigatório' })}
                                placeholder="João Silva"
                            />
                            {errors.customer_name && (
                                <p className="text-sm text-red-500 mt-1">{errors.customer_name.message}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="customer_phone">
                                Telefone <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="customer_phone"
                                {...register('customer_phone', { required: 'Telefone é obrigatório' })}
                                placeholder="(11) 99999-9999"
                            />
                            {errors.customer_phone && (
                                <p className="text-sm text-red-500 mt-1">{errors.customer_phone.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Endereço */}
                    <div>
                        <Label htmlFor="address">
                            Endereço de Entrega <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="address"
                            {...register('address', { required: 'Endereço é obrigatório' })}
                            placeholder="Rua A, 123 - Centro - São Paulo/SP"
                            rows={2}
                        />
                        {errors.address && (
                            <p className="text-sm text-red-500 mt-1">{errors.address.message}</p>
                        )}
                    </div>

                    {/* Valores */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="total_amount">
                                Valor Total <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="total_amount"
                                type="number"
                                step="0.01"
                                {...register('total_amount', { required: 'Valor é obrigatório' })}
                                placeholder="0.00"
                            />
                            {errors.total_amount && (
                                <p className="text-sm text-red-500 mt-1">{errors.total_amount.message}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="delivery_fee">Taxa de Entrega</Label>
                            <Input
                                id="delivery_fee"
                                type="number"
                                step="0.01"
                                {...register('delivery_fee')}
                                placeholder="5.00"
                            />
                        </div>
                    </div>

                    {/* Pagamento e Prioridade */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="payment_method">Forma de Pagamento</Label>
                            <select
                                id="payment_method"
                                {...register('payment_method')}
                                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
                            >
                                <option value="dinheiro">Dinheiro</option>
                                <option value="cartao">Cartão</option>
                                <option value="pix">PIX</option>
                                <option value="online">Pagamento Online</option>
                            </select>
                        </div>

                        <div>
                            <Label htmlFor="priority">Prioridade</Label>
                            <select
                                id="priority"
                                {...register('priority')}
                                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
                            >
                                <option value="normal">Normal</option>
                                <option value="urgent">Urgente</option>
                            </select>
                        </div>
                    </div>

                    {/* Observações */}
                    <div>
                        <Label htmlFor="observations">Observações</Label>
                        <Textarea
                            id="observations"
                            {...register('observations')}
                            placeholder="Informações adicionais sobre a entrega..."
                            rows={3}
                        />
                    </div>

                    {/* Botões */}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            <X className="w-4 h-4 mr-2" />
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>Salvando...</>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Criar Entrega
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
