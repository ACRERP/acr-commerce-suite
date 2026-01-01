import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supplierService } from "@/lib/purchases/supplier-service";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
    name: z.string().min(2, "Razão social é obrigatória"),
    trade_name: z.string().optional(),
    cnpj_cpf: z.string().optional(),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    notes: z.string().optional(),
});

interface CreateSupplierDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateSupplierDialog({ open, onOpenChange }: CreateSupplierDialogProps) {
    const queryClient = useQueryClient();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            trade_name: "",
            cnpj_cpf: "",
            email: "",
            phone: "",
            whatsapp: "",
            address: "",
            city: "",
            state: "",
            notes: "",
        },
    });

    const createMutation = useMutation({
        mutationFn: supplierService.createSupplier,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            toast.success("Fornecedor cadastrado com sucesso!");
            onOpenChange(false);
            form.reset();
        },
        onError: (error) => {
            console.error(error);
            toast.error("Erro ao cadastrar fornecedor.");
        }
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        createMutation.mutate(values);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Novo Fornecedor</DialogTitle>
                    <DialogDescription>
                        Preencha os dados para cadastrar um novo fornecedor.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Razão Social *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nome da empresa" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="trade_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome Fantasia</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nome comercial" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="cnpj_cpf"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>CNPJ / CPF</FormLabel>
                                        <FormControl>
                                            <Input placeholder="00.000.000/0000-00" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="contato@empresa.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Telefone</FormLabel>
                                        <FormControl>
                                            <Input placeholder="(00) 0000-0000" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="whatsapp"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>WhatsApp</FormLabel>
                                        <FormControl>
                                            <Input placeholder="(00) 90000-0000" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-12 md:col-span-6">
                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Endereço</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Rua, Av..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="col-span-12 md:col-span-4">
                                <FormField
                                    control={form.control}
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Cidade</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Cidade" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="col-span-12 md:col-span-2">
                                <FormField
                                    control={form.control}
                                    name="state"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>UF</FormLabel>
                                            <FormControl>
                                                <Input placeholder="UF" maxLength={2} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Observações</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Informações adicionais..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={createMutation.isPending}>
                                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Cadastrar
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
