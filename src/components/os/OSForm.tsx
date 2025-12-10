import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { osService, ServiceOrder } from '@/lib/os/os-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
    Save,
    X,
    Upload,
    Camera,
    Plus,
    Trash2,
    CheckCircle,
    AlertCircle,
    Package
} from 'lucide-react';
import { toast } from 'sonner';

interface OSFormProps {
    osId?: number;
    onClose: () => void;
    onSuccess: () => void;
}

export function OSForm({ osId, onClose, onSuccess }: OSFormProps) {
    const [currentTab, setCurrentTab] = useState('cliente');
    const [acessorios, setAcessorios] = useState<any[]>([]);
    const [fotos, setFotos] = useState<any[]>([]);
    const [servicos, setServicos] = useState<any[]>([]);
    const [pecas, setPecas] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ServiceOrder>({
        defaultValues: {
            status: 'aberta',
            prioridade: 'media',
            power_on: false,
            has_password: false,
        }
    });

    const prioridade = watch('prioridade');
    const prazo_entrega = watch('prazo_entrega');

    // Adicionar acessório
    const addAcessorio = () => {
        setAcessorios([...acessorios, { descricao: '', quantidade: 1, devolvido: false }]);
    };

    const removeAcessorio = (index: number) => {
        setAcessorios(acessorios.filter((_, i) => i !== index));
    };

    // Adicionar serviço
    const addServico = () => {
        setServicos([...servicos, { descricao: '', quantidade: 1, valor_unitario: 0, valor_total: 0 }]);
    };

    const removeServico = (index: number) => {
        setServicos(servicos.filter((_, i) => i !== index));
        recalcularTotal();
    };

    const updateServico = (index: number, field: string, value: any) => {
        const updated = [...servicos];
        updated[index][field] = value;

        if (field === 'quantidade' || field === 'valor_unitario') {
            updated[index].valor_total = updated[index].quantidade * updated[index].valor_unitario;
        }

        setServicos(updated);
        recalcularTotal();
    };

    // Adicionar peça
    const addPeca = () => {
        setPecas([...pecas, { descricao: '', quantidade: 1, valor_unitario: 0, valor_total: 0 }]);
    };

    const removePeca = (index: number) => {
        setPecas(pecas.filter((_, i) => i !== index));
        recalcularTotal();
    };

    const updatePeca = (index: number, field: string, value: any) => {
        const updated = [...pecas];
        updated[index][field] = value;

        if (field === 'quantidade' || field === 'valor_unitario') {
            updated[index].valor_total = updated[index].quantidade * updated[index].valor_unitario;
        }

        setPecas(updated);
        recalcularTotal();
    };

    // Recalcular total
    const recalcularTotal = () => {
        const totalServicos = servicos.reduce((sum, s) => sum + (s.valor_total || 0), 0);
        const totalPecas = pecas.reduce((sum, p) => sum + (p.valor_total || 0), 0);

        setValue('valor_servicos', totalServicos);
        setValue('valor_pecas', totalPecas);
        setValue('valor_total', totalServicos + totalPecas);
        setValue('valor_final', totalServicos + totalPecas - (watch('desconto') || 0));
    };

    // Submit
    const onSubmit = async (data: ServiceOrder) => {
        try {
            setLoading(true);

            // Criar OS
            const os = await osService.createOS(data);

            // Adicionar acessórios
            for (const acessorio of acessorios) {
                if (acessorio.descricao) {
                    await osService.addAccessory({
                        service_order_id: os.id!,
                        ...acessorio
                    });
                }
            }

            // Adicionar serviços
            for (const servico of servicos) {
                if (servico.descricao) {
                    await osService.addService({
                        service_order_id: os.id!,
                        ...servico
                    });
                }
            }

            // Adicionar peças
            for (const peca of pecas) {
                if (peca.descricao) {
                    await osService.addPart({
                        service_order_id: os.id!,
                        ...peca
                    });
                }
            }

            toast.success('OS criada com sucesso!');
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message || 'Erro ao criar OS');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={currentTab} onValueChange={setCurrentTab}>
                <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="cliente">Cliente</TabsTrigger>
                    <TabsTrigger value="equipamento">Equipamento</TabsTrigger>
                    <TabsTrigger value="acessorios">Acessórios</TabsTrigger>
                    <TabsTrigger value="diagnostico">Diagnóstico</TabsTrigger>
                    <TabsTrigger value="orcamento">Orçamento</TabsTrigger>
                    <TabsTrigger value="termos">Termos</TabsTrigger>
                </TabsList>

                {/* Aba 1: Cliente */}
                <TabsContent value="cliente" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Cliente *</Label>
                            <Input
                                type="number"
                                {...register('client_id', { required: true })}
                                placeholder="ID do cliente"
                            />
                            {errors.client_id && (
                                <span className="text-xs text-red-500">Campo obrigatório</span>
                            )}
                        </div>

                        <div>
                            <Label>Prioridade *</Label>
                            <select
                                {...register('prioridade')}
                                className="w-full px-3 py-2 border rounded-lg"
                            >
                                <option value="baixa">Baixa</option>
                                <option value="media">Média</option>
                                <option value="alta">Alta</option>
                                <option value="urgente">🔥 Urgente</option>
                            </select>
                        </div>

                        <div>
                            <Label>Prazo de Entrega</Label>
                            <Input
                                type="datetime-local"
                                {...register('prazo_entrega')}
                            />
                        </div>

                        <div>
                            <Label>Origem do Cliente</Label>
                            <select
                                {...register('origem_cliente')}
                                className="w-full px-3 py-2 border rounded-lg"
                            >
                                <option value="">Selecione...</option>
                                <option value="indicacao">Indicação</option>
                                <option value="google">Google</option>
                                <option value="facebook">Facebook</option>
                                <option value="instagram">Instagram</option>
                                <option value="whatsapp">WhatsApp</option>
                                <option value="outros">Outros</option>
                            </select>
                        </div>
                    </div>

                    {prioridade === 'urgente' && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-2 text-red-700">
                                <AlertCircle className="w-5 h-5" />
                                <span className="font-semibold">OS Marcada como URGENTE</span>
                            </div>
                            <p className="text-sm text-red-600 mt-1">
                                Esta OS aparecerá destacada no painel e terá prioridade máxima.
                            </p>
                        </div>
                    )}
                </TabsContent>

                {/* Aba 2: Equipamento */}
                <TabsContent value="equipamento" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Tipo de Equipamento *</Label>
                            <Input
                                {...register('device_type', { required: true })}
                                placeholder="Ex: Celular, Notebook, Tablet"
                            />
                            {errors.device_type && (
                                <span className="text-xs text-red-500">Campo obrigatório</span>
                            )}
                        </div>

                        <div>
                            <Label>Marca</Label>
                            <Input
                                {...register('device_brand')}
                                placeholder="Ex: Apple, Samsung, Dell"
                            />
                        </div>

                        <div>
                            <Label>Modelo</Label>
                            <Input
                                {...register('device_model')}
                                placeholder="Ex: iPhone 15 Pro, Galaxy S24"
                            />
                        </div>

                        <div>
                            <Label>Número de Série / IMEI</Label>
                            <Input
                                {...register('serial_number')}
                                placeholder="Número de série ou IMEI"
                            />
                        </div>
                    </div>

                    <div>
                        <Label>Defeito Relatado *</Label>
                        <Textarea
                            {...register('reported_issue', { required: true })}
                            placeholder="Descreva o problema relatado pelo cliente..."
                            rows={4}
                        />
                        {errors.reported_issue && (
                            <span className="text-xs text-red-500">Campo obrigatório</span>
                        )}
                    </div>

                    {/* Checklist de Entrada */}
                    <div className="border rounded-lg p-4 space-y-3">
                        <h3 className="font-semibold">Checklist de Entrada</h3>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                {...register('power_on')}
                                className="w-4 h-4"
                            />
                            <Label>Equipamento liga</Label>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                {...register('has_password')}
                                className="w-4 h-4"
                            />
                            <Label>Possui senha/bloqueio</Label>
                        </div>

                        {watch('has_password') && (
                            <div>
                                <Label>Detalhes da Senha</Label>
                                <Input
                                    {...register('password_details')}
                                    placeholder="PIN, padrão, senha..."
                                />
                            </div>
                        )}

                        <div>
                            <Label>Status da Rede</Label>
                            <Input
                                {...register('network_status')}
                                placeholder="Ex: Funcionando, Sem sinal, Wi-Fi OK"
                            />
                        </div>
                    </div>
                </TabsContent>

                {/* Aba 3: Acessórios */}
                <TabsContent value="acessorios" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Acessórios Deixados</h3>
                        <Button type="button" size="sm" onClick={addAcessorio}>
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar
                        </Button>
                    </div>

                    {acessorios.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Nenhum acessório adicionado</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {acessorios.map((acessorio, index) => (
                                <div key={index} className="flex gap-3 items-start p-3 border rounded-lg">
                                    <div className="flex-1 grid grid-cols-3 gap-3">
                                        <div className="col-span-2">
                                            <Input
                                                placeholder="Descrição do acessório"
                                                value={acessorio.descricao}
                                                onChange={(e) => {
                                                    const updated = [...acessorios];
                                                    updated[index].descricao = e.target.value;
                                                    setAcessorios(updated);
                                                }}
                                            />
                                        </div>
                                        <Input
                                            type="number"
                                            placeholder="Qtd"
                                            value={acessorio.quantidade}
                                            onChange={(e) => {
                                                const updated = [...acessorios];
                                                updated[index].quantidade = parseInt(e.target.value);
                                                setAcessorios(updated);
                                            }}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeAcessorio(index)}
                                    >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-700">
                            💡 <strong>Dica:</strong> Liste todos os acessórios deixados pelo cliente para evitar perdas.
                        </p>
                    </div>
                </TabsContent>

                {/* Aba 4: Diagnóstico */}
                <TabsContent value="diagnostico" className="space-y-4">
                    <div>
                        <Label>Diagnóstico Técnico</Label>
                        <Textarea
                            {...register('diagnostico')}
                            placeholder="Problema identificado pelo técnico..."
                            rows={4}
                        />
                    </div>

                    <div>
                        <Label>Solução Proposta</Label>
                        <Textarea
                            {...register('solucao_proposta')}
                            placeholder="Como resolver o problema..."
                            rows={4}
                        />
                    </div>

                    <div>
                        <Label>Observações do Técnico</Label>
                        <Textarea
                            {...register('technician_notes')}
                            placeholder="Observações internas..."
                            rows={3}
                        />
                    </div>
                </TabsContent>

                {/* Aba 5: Orçamento */}
                <TabsContent value="orcamento" className="space-y-4">
                    {/* Serviços */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">Serviços</h3>
                            <Button type="button" size="sm" onClick={addServico}>
                                <Plus className="w-4 h-4 mr-2" />
                                Adicionar Serviço
                            </Button>
                        </div>

                        {servicos.map((servico, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                                <Input
                                    className="col-span-5"
                                    placeholder="Descrição"
                                    value={servico.descricao}
                                    onChange={(e) => updateServico(index, 'descricao', e.target.value)}
                                />
                                <Input
                                    className="col-span-2"
                                    type="number"
                                    placeholder="Qtd"
                                    value={servico.quantidade}
                                    onChange={(e) => updateServico(index, 'quantidade', parseFloat(e.target.value))}
                                />
                                <Input
                                    className="col-span-2"
                                    type="number"
                                    placeholder="Valor Unit."
                                    value={servico.valor_unitario}
                                    onChange={(e) => updateServico(index, 'valor_unitario', parseFloat(e.target.value))}
                                />
                                <Input
                                    className="col-span-2"
                                    type="number"
                                    placeholder="Total"
                                    value={servico.valor_total}
                                    disabled
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="col-span-1"
                                    onClick={() => removeServico(index)}
                                >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    {/* Peças */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">Peças</h3>
                            <Button type="button" size="sm" onClick={addPeca}>
                                <Plus className="w-4 h-4 mr-2" />
                                Adicionar Peça
                            </Button>
                        </div>

                        {pecas.map((peca, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                                <Input
                                    className="col-span-5"
                                    placeholder="Descrição"
                                    value={peca.descricao}
                                    onChange={(e) => updatePeca(index, 'descricao', e.target.value)}
                                />
                                <Input
                                    className="col-span-2"
                                    type="number"
                                    placeholder="Qtd"
                                    value={peca.quantidade}
                                    onChange={(e) => updatePeca(index, 'quantidade', parseFloat(e.target.value))}
                                />
                                <Input
                                    className="col-span-2"
                                    type="number"
                                    placeholder="Valor Unit."
                                    value={peca.valor_unitario}
                                    onChange={(e) => updatePeca(index, 'valor_unitario', parseFloat(e.target.value))}
                                />
                                <Input
                                    className="col-span-2"
                                    type="number"
                                    placeholder="Total"
                                    value={peca.valor_total}
                                    disabled
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="col-span-1"
                                    onClick={() => removePeca(index)}
                                >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    {/* Resumo */}
                    <div className="border-t pt-4 space-y-2">
                        <div className="flex justify-between">
                            <span>Serviços:</span>
                            <span className="font-mono">R$ {(watch('valor_servicos') || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Peças:</span>
                            <span className="font-mono">R$ {(watch('valor_pecas') || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span className="font-mono">R$ {(watch('valor_total') || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Desconto:</span>
                            <Input
                                type="number"
                                className="w-32"
                                {...register('desconto')}
                                onChange={() => recalcularTotal()}
                            />
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t pt-2">
                            <span>TOTAL:</span>
                            <span className="font-mono text-green-600">
                                R$ {(watch('valor_final') || 0).toFixed(2)}
                            </span>
                        </div>
                    </div>
                </TabsContent>

                {/* Aba 6: Termos */}
                <TabsContent value="termos" className="space-y-4">
                    <div>
                        <Label>Termo de Entrada</Label>
                        <Textarea
                            {...register('termo_entrada')}
                            placeholder="Termo de responsabilidade..."
                            rows={6}
                            defaultValue="Declaro que entreguei o equipamento descrito acima em perfeitas condições de funcionamento, exceto pelos defeitos relatados. Estou ciente que a empresa não se responsabiliza por dados armazenados no equipamento."
                        />
                    </div>

                    <div>
                        <Label>Termo de Garantia</Label>
                        <Textarea
                            {...register('termo_garantia')}
                            placeholder="Condições de garantia..."
                            rows={4}
                            defaultValue="Garantia de 90 dias para o serviço realizado, não cobrindo danos físicos ou mau uso do equipamento."
                        />
                    </div>

                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-700">
                            ⚠️ <strong>Assinatura Digital:</strong> Será solicitada ao cliente no momento da entrega do equipamento.
                        </p>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Botões de Ação */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                <Button type="button" variant="outline" onClick={onClose}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? (
                        <>Salvando...</>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Criar OS
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
