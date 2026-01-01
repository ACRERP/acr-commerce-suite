import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient, CreateClientData } from '@/lib/clients'; // Ensure this import path is correct
import { UserPlus, Loader2, Save } from 'lucide-react';

interface QuickAddClientDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onClientCreated: (client: any) => void;
    initialName?: string;
}

export function QuickAddClientDialog({ open, onOpenChange, onClientCreated, initialName = '' }: QuickAddClientDialogProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [name, setName] = useState(initialName);
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');

    const createClientMutation = useMutation({
        mutationFn: (data: CreateClientData) => createClient(data),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            toast({
                title: 'Cliente cadastrado',
                description: `${response.client.name} foi adicionado com sucesso.`,
            });
            onClientCreated(response.client); // Callback to auto-select in PDV
            onOpenChange(false);
            resetForm();
        },
        onError: (error) => {
            console.error(error);
            toast({
                title: 'Erro ao cadastrar',
                description: 'Não foi possível cadastrar o cliente. Verifique os dados.',
                variant: 'destructive',
            });
        }
    });

    const resetForm = () => {
        setName('');
        setPhone('');
        setEmail('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const clientData: CreateClientData = {
            name,
            phone,
            email,
            client_type: 'pf', // Default for quick add
        };

        createClientMutation.mutate(clientData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] !fixed z-50">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-primary-500" />
                        Novo Cliente Rápido
                    </DialogTitle>
                    <DialogDescription>
                        Cadastre o cliente para prosseguir com a venda.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome Completo *</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nome do cliente"
                            autoFocus
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Telefone / WhatsApp</Label>
                        <Input
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="(00) 00000-0000"
                            type="tel"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">E-mail (Opcional)</Label>
                        <Input
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="cliente@email.com"
                            type="email"
                        />
                    </div>
                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={createClientMutation.isPending || !name.trim()}>
                            {createClientMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Salvar Cliente
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
