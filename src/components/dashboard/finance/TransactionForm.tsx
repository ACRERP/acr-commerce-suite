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
import { CreateFinancialTransactionData as CreateTransactionData, getFinancialCategories } from '@/lib/financial';
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
            due_date: data.date.toISOString(),
            category_id: data.category_id || undefined
        } as any);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">

                {/* Type Selection as Tabs/Cards */}
                <div className="grid grid-cols-2 gap-3 mb-2">
                    <div
                        onClick={() => form.setValue('type', 'income')}
                        className={cn(
                            "cursor-pointer border rounded-xl p-2.5 flex flex-col items-center justify-center gap-1.5 transition-all backdrop-blur-md",
                            type === 'income' ? "bg-green-500/10 border-green-500/50 text-green-400" : "bg-white/5 border-white/10 text-white/30 hover:bg-white/10"
                        )}
                    >
                        <ArrowUpCircle className={cn("w-5 h-5", type === 'income' ? "text-green-500" : "text-white/20")} />
                        <span className="font-black text-[10px] uppercase tracking-wider">Receita</span>
                    </div>
                    <div
                        onClick={() => form.setValue('type', 'expense')}
                        className={cn(
                            "cursor-pointer border rounded-xl p-2.5 flex flex-col items-center justify-center gap-1.5 transition-all backdrop-blur-md",
                            type === 'expense' ? "bg-red-500/10 border-red-500/50 text-red-400" : "bg-white/5 border-white/10 text-white/30 hover:bg-white/10"
                        )}
                    >
                        <ArrowDownCircle className={cn("w-5 h-5", type === 'expense' ? "text-red-500" : "text-white/20")} />
                        <span className="font-black text-[10px] uppercase tracking-wider">Despesa</span>
                    </div>
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem className="space-y-1">
                            <FormLabel className="text-[9px] font-black uppercase text-white/40 tracking-[2px] ml-1">Descrição</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Venda Balcão..." {...field} className="h-10 bg-black/20 border-white/10 text-white placeholder:text-white/20 focus:bg-black/40 transition-all input-compact font-bold" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-3">
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem className="space-y-1">
                                <FormLabel className="text-[9px] font-black uppercase text-white/40 tracking-[2px] ml-1">Valor (R$)</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" placeholder="0.00" {...field} className="h-10 bg-black/20 border-white/10 text-white placeholder:text-white/20 focus:bg-black/40 transition-all input-compact font-bold" />
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
                                                    "w-full h-10 pl-3 text-left font-bold bg-black/20 border-white/10 text-white hover:bg-black/30 text-[11px]",
                                                    !field.value && "text-white/20"
                                                )}
                                            >
                                                {field.value ? (
                                                    format(field.value, "dd/MM/yyyy")
                                                ) : (
                                                    <span>Selecione</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-3.5 w-3.5 text-white/20" />
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

                <div className="grid grid-cols-2 gap-3">
                    <FormField
                        control={form.control}
                        name="category_id"
                        render={({ field }) => (
                            <FormItem className="space-y-1">
                                <FormLabel className="text-[9px] font-black uppercase text-white/40 tracking-[2px] ml-1">Categoria</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="h-10 bg-black/20 border-white/10 text-white text-[11px] font-bold">
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-neutral-900 border-white/10 text-white">
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
                            <FormItem className="space-y-1">
                                <FormLabel className="text-[9px] font-black uppercase text-white/40 tracking-[2px] ml-1">Pagamento</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="h-10 bg-black/20 border-white/10 text-white text-[11px] font-bold">
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-neutral-900 border-white/10 text-white">
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
                        <FormItem className="space-y-1">
                            <FormLabel className="text-[9px] font-black uppercase text-white/40 tracking-[2px] ml-1">Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger className="h-10 bg-black/20 border-white/10 text-white text-[11px] font-bold">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-neutral-900 border-white/10 text-white">
                                    <SelectItem value="completed">Concluído (Pago/Recebido)</SelectItem>
                                    <SelectItem value="pending">Pendente (A Pagar/Receber)</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-3 pt-5 border-t border-white/5">
                    <Button type="button" variant="ghost" onClick={onCancel} className="h-10 text-white/50 hover:text-white hover:bg-white/5">
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading} className={cn(
                        "h-10 px-8 hover-lift shadow-lg text-[10px] font-black uppercase tracking-widest",
                        type === 'income' ? 'bg-green-600 hover:bg-green-700 shadow-green-500/20' : 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                    )}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {type === 'income' ? 'Confirmar Receita' : 'Confirmar Despesa'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
