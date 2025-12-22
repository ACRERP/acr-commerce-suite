import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSupplier, CreateSupplierData } from '@/lib/stock';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, Plus, Save } from 'lucide-react';

interface CreateSupplierDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
}

export function CreateSupplierDialog({ open: controlledOpen, onOpenChange: setControlledOpen, trigger }: CreateSupplierDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? setControlledOpen : setInternalOpen;

    const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateSupplierData>();

    const createMutation = useMutation({
        mutationFn: createSupplier,
        onSuccess: (newSupplier) => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            toast({ title: 'Fornecedor Cadastrado!', description: `${newSupplier.name} adicionado com sucesso.` });
            reset();
            setOpen && setOpen(false);
        },
        onError: (error) => {
            console.error(error);
            toast({ title: 'Erro ao cadastrar', description: 'Tente novamente.', variant: 'destructive' });
        }
    });

    const onSubmit = (data: CreateSupplierData) => {
        createMutation.mutate({ ...data, active: true });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Novo Fornecedor</DialogTitle>
                    <DialogDescription>Cadastre um novo parceiro comercial.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <Label>Nome / Razão Social *</Label>
                            <Input {...register('name', { required: true })} placeholder="Ex: Distribuidora XYZ" />
                            {errors.name && <span className="text-xs text-red-500">Obrigatório</span>}
                        </div>

                        <div>
                            <Label>CNPJ / CPF</Label>
                            <Input {...register('cnpj')} placeholder="00.000.000/0000-00" />
                        </div>

                        <div>
                            <Label>Telefone / WhatsApp</Label>
                            <Input {...register('whatsapp')} placeholder="(00) 00000-0000" />
                        </div>

                        <div className="col-span-2">
                            <Label>Email</Label>
                            <Input type="email" {...register('email')} placeholder="contato@fornecedor.com" />
                        </div>

                        <div className="col-span-2">
                            <Label>Endereço</Label>
                            <Input {...register('address')} placeholder="Rua, Número, Bairro" />
                        </div>

                        <div className="col-span-2">
                            <Label>Observações</Label>
                            <Textarea {...register('notes')} placeholder="Detalhes adicionais..." />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen && setOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={createMutation.isPending} className="bg-primary">
                            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Salvar Fornecedor
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
