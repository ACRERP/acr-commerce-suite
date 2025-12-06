import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { CreateTransactionData } from '@/lib/finance';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils'; // Assuming you have a utils file
import { Textarea } from '@/components/ui/textarea';

const transactionSchema = z.object({
    description: z.string().min(1, 'Descrição é obrigatória'),
    amount: z.string().min(1, 'Valor é obrigatório'),
    type: z.enum(['income', 'expense']),
    category: z.string().optional(),
    date: z.date({
        required_error: "Data é obrigatória.",
    }),
    payment_method: z.string().optional(),
    status: z.enum(['pending', 'completed', 'cancelled']),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface Props {
    defaultType?: 'income' | 'expense';
    onSubmit: (data: CreateTransactionData) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export function TransactionForm({ defaultType = 'income', onSubmit, onCancel, isLoading }: Props) {
    const form = useForm<TransactionFormData>({
        resolver: zodResolver(transactionSchema),
        defaultValues: {
            description: '',
            amount: '',
            type: defaultType,
            category: '',
            date: new Date(),
            status: 'completed',
            payment_method: 'pix'
        },
    });

    const handleSubmit = (data: TransactionFormData) => {
        onSubmit({
            ...data,
            amount: parseFloat(data.amount),
            date: data.date.toISOString(),
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tipo</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o tipo" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="income">Entrada (Receita)</SelectItem>
                                        <SelectItem value="expense">Saída (Despesa)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="completed">Concluído (Pago/Recebido)</SelectItem>
                                        <SelectItem value="pending">Pendente (A Pagar/Receber)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Descrição</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Venda Balcão, Pagamento Luz..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Valor (R$)</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel className="mb-1">Data</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? (
                                                    format(field.value, "PPP", { locale: ptBR })
                                                ) : (
                                                    <span>Selecione uma data</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            initialFocus
                                            locale={ptBR}
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Categoria</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="vendas">Vendas</SelectItem>
                                        <SelectItem value="servicos">Serviços</SelectItem>
                                        <SelectItem value="fornecedores">Fornecedores</SelectItem>
                                        <SelectItem value="aluguel">Aluguel/Imóvel</SelectItem>
                                        <SelectItem value="pessoal">Pessoal/Salários</SelectItem>
                                        <SelectItem value="impostos">Impostos</SelectItem>
                                        <SelectItem value="outros">Outros</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="payment_method"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Forma de Pagto</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="pix">PIX</SelectItem>
                                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                                        <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                                        <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                                        <SelectItem value="boleto">Boleto</SelectItem>
                                        <SelectItem value="transferencia">Transferência</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading} className={cn(
                        form.watch('type') === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                    )}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {form.watch('type') === 'income' ? 'Receber' : 'Pagar'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
