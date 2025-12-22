/**
 * Dialog de Emissão de Nota Fiscal
 * 
 * Componente reutilizável para emitir NFC-e ou NF-e após finalizar uma venda
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { nfceService } from '@/lib/fiscal/nfce-service';
import { Loader2, FileText, Receipt, CheckCircle, AlertCircle, Printer, Send } from 'lucide-react';

interface EmitirNotaDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    saleId?: string;
    saleTotal?: number;
    onSuccess?: (result: { chaveAcesso: string; qrCode: string }) => void;
}

type TipoNota = 'nenhuma' | 'nfce' | 'nfe';

export function EmitirNotaDialog({
    open,
    onOpenChange,
    saleId,
    saleTotal,
    onSuccess,
}: EmitirNotaDialogProps) {
    const { toast } = useToast();
    const [tipoNota, setTipoNota] = useState<TipoNota>('nenhuma');
    const [cpfCnpj, setCpfCnpj] = useState('');
    const [manualSaleId, setManualSaleId] = useState('');
    const [emitindo, setEmitindo] = useState(false);
    const [notaEmitida, setNotaEmitida] = useState<{
        chaveAcesso: string;
        protocolo: string;
        qrCode: string;
    } | null>(null);

    // Mutation para emitir nota
    const emitirMutation = useMutation({
        mutationFn: async () => {
            const finalSaleId = saleId || manualSaleId;

            if (!finalSaleId) {
                throw new Error('ID da venda é obrigatório');
            }

            if (tipoNota === 'nfce') {
                return await nfceService.emitirNFCe(finalSaleId, cpfCnpj || undefined);
            }
            // TODO: Implementar NF-e
            throw new Error('NF-e ainda não implementada');
        },
        onSuccess: (result) => {
            if (result.success && result.chaveAcesso) {
                setNotaEmitida({
                    chaveAcesso: result.chaveAcesso,
                    protocolo: result.protocolo || '',
                    qrCode: result.qrCode || '',
                });
                toast({
                    title: 'Nota fiscal emitida!',
                    description: `Chave: ${result.chaveAcesso.slice(0, 10)}...`,
                });
                onSuccess?.({ chaveAcesso: result.chaveAcesso, qrCode: result.qrCode || '' });
            } else {
                toast({
                    title: 'Erro ao emitir nota',
                    description: result.error || 'Erro desconhecido',
                    variant: 'destructive',
                });
            }
        },
        onError: (error) => {
            toast({
                title: 'Erro ao emitir nota',
                description: error instanceof Error ? error.message : 'Erro desconhecido',
                variant: 'destructive',
            });
        },
    });

    const handleEmitir = async () => {
        if (tipoNota === 'nenhuma') {
            onOpenChange(false);
            return;
        }

        if (!saleId && !manualSaleId) {
            toast({
                title: 'ID da Venda obrigatório',
                description: 'Por favor, informe o ID da venda.',
                variant: 'destructive',
            });
            return;
        }

        // Validar CPF/CNPJ se fornecido

        // Validar CPF/CNPJ se fornecido
        if (cpfCnpj) {
            const somenteNumeros = cpfCnpj.replace(/\D/g, '');
            if (somenteNumeros.length !== 11 && somenteNumeros.length !== 14) {
                toast({
                    title: 'CPF/CNPJ inválido',
                    description: 'Digite um CPF (11 dígitos) ou CNPJ (14 dígitos) válido',
                    variant: 'destructive',
                });
                return;
            }
        }

        setEmitindo(true);
        await emitirMutation.mutateAsync();
        setEmitindo(false);
    };

    const handleImprimir = () => {
        // TODO: Implementar impressão do cupom com QR Code
        toast({
            title: 'Imprimindo...',
            description: 'Enviando para impressora térmica',
        });
    };

    const handleEnviarEmail = () => {
        // TODO: Implementar envio por email
        toast({
            title: 'Funcionalidade em desenvolvimento',
            description: 'Envio por email será implementado em breve',
        });
    };

    const handleEnviarWhatsApp = () => {
        // TODO: Implementar envio por WhatsApp
        toast({
            title: 'Funcionalidade em desenvolvimento',
            description: 'Envio por WhatsApp será implementado em breve',
        });
    };

    const handleFechar = () => {
        setTipoNota('nenhuma');
        setCpfCnpj('');
        setNotaEmitida(null);
        onOpenChange(false);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const formatCpfCnpj = (value: string) => {
        const numeros = value.replace(/\D/g, '');
        if (numeros.length <= 11) {
            // CPF: 000.000.000-00
            return numeros
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        } else {
            // CNPJ: 00.000.000/0000-00
            return numeros
                .replace(/(\d{2})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1/$2')
                .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Emitir Nota Fiscal</DialogTitle>
                    <DialogDescription>
                        {saleTotal !== undefined
                            ? `Venda finalizada: ${formatCurrency(saleTotal)}`
                            : 'Informe os dados da venda para emitir a nota'}
                    </DialogDescription>
                </DialogHeader>

                {!notaEmitida ? (
                    <div className="space-y-6 py-4">
                        {!saleId && (
                            <div className="space-y-2">
                                <Label htmlFor="sale_id">ID da Venda (UUID)</Label>
                                <Input
                                    id="sale_id"
                                    placeholder="Ex: 550e8400-e29b-41d4-a716-446655440000"
                                    value={manualSaleId}
                                    onChange={(e) => setManualSaleId(e.target.value)}
                                />
                                <p className="text-sm text-muted-foreground">
                                    Esta chave deve corresponder a uma venda existente no sistema.
                                </p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <Label>Tipo de Nota Fiscal</Label>
                            <RadioGroup value={tipoNota} onValueChange={(v) => setTipoNota(v as TipoNota)}>
                                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                                    <RadioGroupItem value="nenhuma" id="nenhuma" />
                                    <Label htmlFor="nenhuma" className="flex-1 cursor-pointer">
                                        <div className="flex items-center gap-2">
                                            <div className="font-medium">Não emitir nota</div>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Cupom não fiscal
                                        </div>
                                    </Label>
                                </div>

                                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                                    <RadioGroupItem value="nfce" id="nfce" />
                                    <Label htmlFor="nfce" className="flex-1 cursor-pointer">
                                        <div className="flex items-center gap-2">
                                            <Receipt className="h-4 w-4" />
                                            <div className="font-medium">NFC-e</div>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Nota Fiscal de Consumidor Eletrônica
                                        </div>
                                    </Label>
                                </div>

                                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer opacity-50">
                                    <RadioGroupItem value="nfe" id="nfe" disabled />
                                    <Label htmlFor="nfe" className="flex-1 cursor-pointer">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            <div className="font-medium">NF-e</div>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Em breve
                                        </div>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {tipoNota !== 'nenhuma' && (
                            <div className="space-y-2">
                                <Label htmlFor="cpf_cnpj">CPF/CNPJ do Cliente (opcional)</Label>
                                <Input
                                    id="cpf_cnpj"
                                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                                    value={cpfCnpj}
                                    onChange={(e) => setCpfCnpj(formatCpfCnpj(e.target.value))}
                                    maxLength={18}
                                />
                                <p className="text-sm text-muted-foreground">
                                    Informe o CPF ou CNPJ para identificar o cliente na nota
                                </p>
                            </div>
                        )}

                        {tipoNota === 'nfce' && (
                            <Alert>
                                <Receipt className="h-4 w-4" />
                                <AlertDescription>
                                    A NFC-e será emitida em ambiente de{' '}
                                    <strong>homologação</strong>. Configure o ambiente em
                                    Configurações Fiscais.
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        <Alert>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-600">
                                <strong>Nota fiscal emitida com sucesso!</strong>
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-2 p-4 bg-secondary/30 rounded-lg">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Chave de Acesso:</span>
                                <span className="font-mono text-xs">
                                    {notaEmitida.chaveAcesso.slice(0, 20)}...
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Protocolo:</span>
                                <span className="font-mono">{notaEmitida.protocolo}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Valor:</span>
                                <span className="font-semibold">{formatCurrency(saleTotal)}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" onClick={handleImprimir} className="gap-2">
                                <Printer className="h-4 w-4" />
                                Imprimir
                            </Button>
                            <Button variant="outline" onClick={handleEnviarEmail} className="gap-2">
                                <Send className="h-4 w-4" />
                                Email
                            </Button>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    {!notaEmitida ? (
                        <>
                            <Button variant="outline" onClick={handleFechar}>
                                Cancelar
                            </Button>
                            <Button onClick={handleEmitir} disabled={emitindo}>
                                {emitindo ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Emitindo...
                                    </>
                                ) : (
                                    <>
                                        {tipoNota === 'nenhuma' ? 'Continuar sem nota' : 'Emitir Nota'}
                                    </>
                                )}
                            </Button>
                        </>
                    ) : (
                        <Button onClick={handleFechar}>Fechar</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
