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
import { CreateTransactionData, getFinancialCategories } from '@/lib/finance';
import { CalendarIcon, Loader2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

const transactionSchema = z.object({
    description: z.string().min(1, 'Descrição é obrigatória'),
    amount: z.string().min(1, 'Valor é obrigatório'),
    type: z.enum(['income', 'expense']),
    category_id: z.string().optional(),
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
            category_id: '',
            date: new Date(),
            status: 'completed',
            payment_method: 'pix'
        },
    });

    const { data: categories } = useQuery({
        queryKey: ['financial_categories'],
        queryFn: getFinancialCategories
    });

    const type = form.watch('type');

    // Filter categories. The type in DB is 'revenue' or 'expense'. 
    // Typescript says 'income' | 'expense'.
    // Mapping: income -> revenue, expense -> expense.
    const filteredCategories = categories?.filter((c: any) => {
        const dbType = type === 'income' ? 'revenue' : 'expense';
        return c.type === dbType;
    });

    const handleSubmit = (data: TransactionFormData) => {
        onSubmit({
            ...data,
            amount: parseFloat(data.amount),
            date: data.date.toISOString(),
            category_id: data.category_id || undefined
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">

                {/* Type Selection as Tabs/Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div
                        onClick={() => form.setValue('type', 'income')}
                        className={cn(
                            "cursor-pointer border rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all",
                            type === 'income' ? "bg-success-50 border-success-500 text-success-700" : "bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50"
                        )}
                    >
                        <ArrowUpCircle className={cn("w-6 h-6", type === 'income' ? "text-success-600" : "text-neutral-400")} />
                        <span className="font-bold text-sm">Receita</span>
                    </div>
                    <div
                        onClick={() => form.setValue('type', 'expense')}
                        className={cn(
                            "cursor-pointer border rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all",
                            type === 'expense' ? "bg-danger-50 border-danger-500 text-danger-700" : "bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50"
                        )}
                    >
                        <ArrowDownCircle className={cn("w-6 h-6", type === 'expense' ? "text-danger-600" : "text-neutral-400")} />
                        <span className="font-bold text-sm">Despesa</span>
                    </div>
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-bold uppercase text-neutral-500">Descrição</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Venda Balcão..." {...field} className="bg-neutral-50" />
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
                                <FormLabel className="text-xs font-bold uppercase text-neutral-500">Valor (R$)</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" placeholder="0.00" {...field} className="bg-neutral-50" />
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
                                <FormLabel className="text-xs font-bold uppercase text-neutral-500 mb-1.5">Data</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal bg-neutral-50",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? (
                                                    format(field.value, "dd/MM/yyyy")
                                                ) : (
                                                    <span>Selecione</span>
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
                        name="category_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-bold uppercase text-neutral-500">Categoria</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="bg-neutral-50">
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {filteredCategories?.map((cat: any) => (
                                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                        ))}
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
                                <FormLabel className="text-xs font-bold uppercase text-neutral-500">Pagamento</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="bg-neutral-50">
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
                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-bold uppercase text-neutral-500">Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger className="bg-neutral-50">
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

                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                    <Button type="button" variant="outline" onClick={onCancel} className="h-10 px-6">
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading} className={cn(
                        "h-10 px-8 hover-lift shadow-lg",
                        type === 'income' ? 'bg-success-600 hover:bg-success-700 shadow-success-500/20' : 'bg-danger-600 hover:bg-danger-700 shadow-danger-500/20'
                    )}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {type === 'income' ? 'Confirmar Receita' : 'Confirmar Despesa'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
