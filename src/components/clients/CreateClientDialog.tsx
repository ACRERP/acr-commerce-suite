
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useCreateClient } from "@/hooks/useClients";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, Users, CalendarIcon, Search } from "lucide-react";

interface CreateClientDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: (client: any) => void;
}

export function CreateClientDialog({ open, onOpenChange, onSuccess }: CreateClientDialogProps) {
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
        defaultValues: {
            client_type: 'pf',
            name: '',
            email: '',
            phone: '',
            whatsapp: '',
            cpf_cnpj: '',
            rg_ie: '',
            birth_date: '',
            zip_code: '',
            address: '',
            address_number: '',
            complement: '',
            neighborhood: '',
            city: '',
            state: '',
            notes: ''
        }
    });

    const createClientMutation = useCreateClient();
    const { toast } = useToast();
    const clientType = watch('client_type');

    const onSubmit = (data: any) => {
        const cleanData = {
            ...data,
            credit_limit: 0,
            financial_status: 'ok',
            status: 'active'
        };

        createClientMutation.mutate(cleanData, {
            onSuccess: (newClient) => {
                toast({ title: "Cliente cadastrado com sucesso!" });
                onOpenChange(false);
                reset();
                if (onSuccess) {
                    onSuccess(newClient);
                }
            },
            onError: (error) => {
                toast({ title: "Erro ao criar cliente", description: error.message, variant: "destructive" });
            }
        });
    };

    const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const cep = e.target.value.replace(/\D/g, '');
        if (cep.length === 8) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const data = await response.json();
                if (!data.erro) {
                    setValue('address', data.logradouro);
                    setValue('neighborhood', data.bairro);
                    setValue('city', data.localidade);
                    setValue('state', data.uf);
                    document.getElementById('address_number')?.focus();
                }
            } catch (error) {
                console.error("Erro ao buscar CEP", error);
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-[2rem] border-0 shadow-2xl glass-window glass-window-compact !p-0">
                <DialogHeader className="p-5 bg-gradient-to-r from-neutral-800/80 to-neutral-900/80 text-white backdrop-blur-md border-b border-white/10">
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
                            <Users className="w-4 h-4 text-white" />
                        </div>
                        Novo Cliente
                    </DialogTitle>
                    <DialogDescription className="text-white/50 text-[11px] font-bold uppercase tracking-wider">
                        Preencha os dados completos para cadastro.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="bg-white/5 backdrop-blur-sm">
                    <Tabs defaultValue="dados" className="w-full">
                        <div className="border-b border-white/5 px-5 bg-white/5">
                            <TabsList className="bg-transparent h-10 p-0 gap-4 w-full justify-start">
                                <TabsTrigger value="dados" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary-500 rounded-none h-full px-0 font-bold text-[10px] uppercase tracking-wider text-white/40 data-[state=active]:text-white transition-all">
                                    Dados Pessoais
                                </TabsTrigger>
                                <TabsTrigger value="endereco" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary-500 rounded-none h-full px-0 font-bold text-[10px] uppercase tracking-wider text-white/40 data-[state=active]:text-white transition-all">
                                    Endereço
                                </TabsTrigger>
                                <TabsTrigger value="outros" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary-500 rounded-none h-full px-0 font-bold text-[10px] uppercase tracking-wider text-white/40 data-[state=active]:text-white transition-all">
                                    Observações
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="p-5">
                            <TabsContent value="dados" className="mt-0 space-y-4 focus-visible:ring-0">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <Label className="block mb-3 text-xs font-bold uppercase tracking-wider text-neutral-500">Tipo de Pessoa</Label>
                                        <RadioGroup
                                            defaultValue="pf"
                                            className="flex gap-4"
                                            onValueChange={(val) => setValue('client_type', val)}
                                        >
                                            <div className="flex items-center space-x-2 border rounded-lg p-3 w-full cursor-pointer hover:bg-neutral-50 transition-colors">
                                                <RadioGroupItem value="pf" id="pf" />
                                                <Label htmlFor="pf" className="cursor-pointer flex-1">Pessoa Física</Label>
                                            </div>
                                            <div className="flex items-center space-x-2 border rounded-lg p-3 w-full cursor-pointer hover:bg-neutral-50 transition-colors">
                                                <RadioGroupItem value="pj" id="pj" />
                                                <Label htmlFor="pj" className="cursor-pointer flex-1">Pessoa Jurídica</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>

                                    <div className="col-span-2">
                                        <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                                            {clientType === 'pf' ? 'Nome Completo' : 'Razão Social'} *
                                        </Label>
                                        <Input id="name" {...register("name", { required: true })} className="h-9 bg-black/20 border-white/10 text-white placeholder:text-white/30 focus:bg-black/40 transition-all input-compact" placeholder={clientType === 'pf' ? "Ex: João Silva" : "Ex: Empresa LTDA"} />
                                        {errors.name && <span className="text-xs text-red-500">Campo obrigatório</span>}
                                    </div>

                                    <div className="space-y-1 relative">
                                        <Label htmlFor="cpf_cnpj" className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                                            {clientType === 'pf' ? 'CPF' : 'CNPJ'}
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="cpf_cnpj"
                                                {...register("cpf_cnpj")}
                                                onChange={(e) => {
                                                    let value = e.target.value.replace(/\D/g, '');
                                                    if (clientType === 'pf') {
                                                        if (value.length > 11) value = value.slice(0, 11);
                                                        value = value.replace(/(\d{3})(\d)/, '$1.$2');
                                                        value = value.replace(/(\d{3})(\d)/, '$1.$2');
                                                        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                                                    } else {
                                                        if (value.length > 14) value = value.slice(0, 14);
                                                        value = value.replace(/^(\d{2})(\d)/, '$1.$2');
                                                        value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
                                                        value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
                                                        value = value.replace(/(\d{4})(\d)/, '$1-$2');
                                                    }
                                                    setValue('cpf_cnpj', value);
                                                }}
                                                onBlur={async (e) => {
                                                    if (clientType !== 'pj') return;
                                                    const cnpj = e.target.value.replace(/\D/g, '');
                                                    if (cnpj.length !== 14) return;

                                                    const toastId = toast({ title: "Buscando dados do CNPJ...", duration: 2000 });
                                                    try {
                                                        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
                                                        const data = await response.json();
                                                        if (!data.message) {
                                                            setValue('name', data.razao_social);
                                                            if (data.logradouro) setValue('address', data.logradouro);
                                                            if (data.numero) setValue('address_number', data.numero);
                                                            if (data.complemento) setValue('complement', data.complemento);
                                                            if (data.bairro) setValue('neighborhood', data.bairro);
                                                            if (data.municipio) setValue('city', data.municipio);
                                                            if (data.uf) setValue('state', data.uf);
                                                            if (data.cep) setValue('zip_code', data.cep.replace(/\D/g, ''));
                                                            if (data.nome_fantasia) setValue('notes', `Nome Fantasia: ${data.nome_fantasia}`);
                                                            toast({ title: "Dados encontrados!" });
                                                        } else {
                                                            toast({ title: "CNPJ não encontrado", variant: "destructive" });
                                                        }
                                                    } catch (error) {
                                                        toast({ title: "Erro ao buscar CNPJ", variant: "destructive" });
                                                    }
                                                }}
                                                className="h-10 bg-neutral-50 pr-10"
                                                placeholder={clientType === 'pf' ? "000.000.000-00" : "00.000.000/0000-00"}
                                            />
                                            {clientType === 'pj' && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                    <Search className="w-4 h-4 text-neutral-400" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="rg_ie" className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                                            {clientType === 'pf' ? 'RG' : 'Inscrição Estadual'}
                                        </Label>
                                        <Input id="rg_ie" {...register("rg_ie")} className="h-9 bg-black/20 border-white/10 text-white placeholder:text-white/30 focus:bg-black/40 transition-all input-compact" />
                                    </div>

                                    {clientType === 'pf' && (
                                        <div className="space-y-1">
                                            <Label htmlFor="birth_date" className="text-xs font-bold uppercase tracking-wider text-neutral-500">Data de Nascimento</Label>
                                            <div className="relative">
                                                <Input id="birth_date" type="date" {...register("birth_date")} className="h-10 bg-neutral-50 pl-10" />
                                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-1">
                                        <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-neutral-500">Email</Label>
                                        <Input id="email" type="email" {...register("email")} className="h-9 bg-black/20 border-white/10 text-white placeholder:text-white/30 focus:bg-black/40 transition-all input-compact" placeholder="cliente@email.com" />
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-neutral-500">Telefone Principal</Label>
                                        <Input id="phone" {...register("phone")} className="h-9 bg-black/20 border-white/10 text-white placeholder:text-white/30 focus:bg-black/40 transition-all input-compact" placeholder="(00) 00000-0000" />
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="whatsapp" className="text-xs font-bold uppercase tracking-wider text-neutral-500">WhatsApp</Label>
                                        <Input id="whatsapp" {...register("whatsapp")} className="h-9 bg-black/20 border-white/10 text-white placeholder:text-white/30 focus:bg-black/40 transition-all input-compact" placeholder="(00) 00000-0000" />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="endereco" className="mt-0 space-y-4 focus-visible:ring-0">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="zip_code" className="text-xs font-bold uppercase tracking-wider text-neutral-500">CEP</Label>
                                        <Input
                                            id="zip_code"
                                            {...register("zip_code")}
                                            onBlur={handleCepBlur}
                                            className="h-9 bg-black/20 border-white/10 text-white placeholder:text-white/30 focus:bg-black/40 transition-all input-compact"
                                            placeholder="00000-000"
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                        <Label htmlFor="address" className="text-xs font-bold uppercase tracking-wider text-neutral-500">Endereço (Logradouro)</Label>
                                        <Input id="address" {...register("address")} className="h-9 bg-black/20 border-white/10 text-white placeholder:text-white/30 focus:bg-black/40 transition-all input-compact" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="address_number" className="text-xs font-bold uppercase tracking-wider text-neutral-500">Número</Label>
                                        <Input id="address_number" {...register("address_number")} className="h-9 bg-black/20 border-white/10 text-white placeholder:text-white/30 focus:bg-black/40 transition-all input-compact" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="complement" className="text-xs font-bold uppercase tracking-wider text-neutral-500">Complemento</Label>
                                        <Input id="complement" {...register("complement")} className="h-9 bg-black/20 border-white/10 text-white placeholder:text-white/30 focus:bg-black/40 transition-all input-compact" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="neighborhood" className="text-xs font-bold uppercase tracking-wider text-neutral-500">Bairro</Label>
                                        <Input id="neighborhood" {...register("neighborhood")} className="h-9 bg-black/20 border-white/10 text-white placeholder:text-white/30 focus:bg-black/40 transition-all input-compact" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="city" className="text-xs font-bold uppercase tracking-wider text-neutral-500">Cidade</Label>
                                        <Input id="city" {...register("city")} className="h-9 bg-black/20 border-white/10 text-white placeholder:text-white/30 focus:bg-black/40 transition-all input-compact" />
                                    </div>
                                    <div className="space-y-1 col-span-2 md:col-span-1">
                                        <Label htmlFor="state" className="text-xs font-bold uppercase tracking-wider text-neutral-500">Estado (UF)</Label>
                                        <Input id="state" {...register("state")} className="h-10 bg-neutral-50 w-24" maxLength={2} placeholder="UF" />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="outros" className="mt-0 space-y-4 focus-visible:ring-0">
                                <div className="space-y-2">
                                    <Label htmlFor="notes" className="text-xs font-bold uppercase tracking-wider text-neutral-500">Observações Internas</Label>
                                    <Textarea
                                        id="notes"
                                        {...register("notes")}
                                        className="min-h-[150px] bg-neutral-50 resize-none"
                                        placeholder="Registre informações importantes sobre o cliente..."
                                    />
                                </div>
                            </TabsContent>
                        </div>

                        <DialogFooter className="p-5 bg-black/20 dark:bg-black/40 border-t border-white/5 gap-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-9 px-4 border-white/10 text-white hover:bg-white/5 bg-transparent">
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={createClientMutation.isPending} className="h-9 px-6 btn-primary hover-lift shadow-lg shadow-primary-500/20">
                                {createClientMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                Salvar Cadastro
                            </Button>
                        </DialogFooter>
                    </Tabs>
                </form>
            </DialogContent>
        </Dialog>
    );
}
