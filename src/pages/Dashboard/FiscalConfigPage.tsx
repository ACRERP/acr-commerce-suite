/**
 * Página de Configurações Fiscais
 * 
 * Permite configurar:
 * - Dados da empresa
 * - Certificado digital
 * - Séries de notas
 * - Ambiente (produção/homologação)
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Upload, CheckCircle, AlertCircle, FileText } from 'lucide-react';

interface FiscalConfig {
    id: string;
    razao_social: string;
    nome_fantasia: string;
    cnpj: string;
    inscricao_estadual: string;
    inscricao_municipal?: string;
    regime_tributario: 'simples_nacional' | 'lucro_presumido' | 'lucro_real';
    serie_nfce: string;
    ultimo_numero_nfce: number;
    csc_nfce: string;
    id_csc_nfce: number;
    serie_nfe: string;
    ultimo_numero_nfe: number;
    ambiente: 'producao' | 'homologacao';
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
    certificado_validade?: string;
    is_active: boolean;
}

export function FiscalConfigPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [certificateFile, setCertificateFile] = useState<File | null>(null);
    const [certificatePassword, setCertificatePassword] = useState('');

    // Buscar configuração fiscal
    const { data: config, isLoading } = useQuery({
        queryKey: ['fiscal-config'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('company_fiscal_settings')
                .select('*')
                .eq('is_active', true)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data as FiscalConfig | null;
        },
    });

    // Mutation para salvar configuração
    const saveMutation = useMutation({
        mutationFn: async (data: Partial<FiscalConfig>) => {
            if (config?.id) {
                const { error } = await supabase
                    .from('company_fiscal_settings')
                    .update(data)
                    .eq('id', config.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('company_fiscal_settings')
                    .insert({ ...data, is_active: true });
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fiscal-config'] });
            toast({
                title: 'Configurações salvas',
                description: 'As configurações fiscais foram atualizadas com sucesso.',
            });
        },
        onError: (error) => {
            toast({
                title: 'Erro ao salvar',
                description: error instanceof Error ? error.message : 'Erro desconhecido',
                variant: 'destructive',
            });
        },
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());
        saveMutation.mutate(data as Partial<FiscalConfig>);
    };

    const handleCertificateUpload = async () => {
        if (!certificateFile || !certificatePassword) {
            toast({
                title: 'Dados incompletos',
                description: 'Selecione o certificado e informe a senha.',
                variant: 'destructive',
            });
            return;
        }

        // TODO: Implementar upload e validação do certificado
        toast({
            title: 'Funcionalidade em desenvolvimento',
            description: 'Upload de certificado será implementado em breve.',
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    const isConfigured = config !== null;
    const isProduction = config?.ambiente === 'producao';

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Configurações Fiscais</h1>
                    <p className="text-muted-foreground">
                        Configure os dados fiscais para emissão de NFC-e e NF-e
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {isConfigured && (
                        <Badge variant={isProduction ? 'destructive' : 'secondary'}>
                            {isProduction ? 'PRODUÇÃO' : 'HOMOLOGAÇÃO'}
                        </Badge>
                    )}
                    {config?.certificado_validade && (
                        <Badge variant="outline">
                            Certificado válido até {new Date(config.certificado_validade).toLocaleDateString('pt-BR')}
                        </Badge>
                    )}
                </div>
            </div>

            {!isConfigured && (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Nenhuma configuração fiscal encontrada. Configure os dados abaixo para começar a emitir notas fiscais.
                    </AlertDescription>
                </Alert>
            )}

            <Tabs defaultValue="empresa" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="empresa">Dados da Empresa</TabsTrigger>
                    <TabsTrigger value="certificado">Certificado Digital</TabsTrigger>
                    <TabsTrigger value="nfce">NFC-e</TabsTrigger>
                    <TabsTrigger value="nfe">NF-e</TabsTrigger>
                    <TabsTrigger value="ambiente">Ambiente</TabsTrigger>
                </TabsList>

                <form onSubmit={handleSubmit}>
                    <TabsContent value="empresa" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Dados da Empresa</CardTitle>
                                <CardDescription>
                                    Informações que aparecerão nas notas fiscais
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="razao_social">Razão Social *</Label>
                                        <Input
                                            id="razao_social"
                                            name="razao_social"
                                            defaultValue={config?.razao_social}
                                            required
                                            placeholder="EMPRESA LTDA"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
                                        <Input
                                            id="nome_fantasia"
                                            name="nome_fantasia"
                                            defaultValue={config?.nome_fantasia}
                                            placeholder="Empresa"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="cnpj">CNPJ *</Label>
                                        <Input
                                            id="cnpj"
                                            name="cnpj"
                                            defaultValue={config?.cnpj}
                                            required
                                            placeholder="00.000.000/0000-00"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="inscricao_estadual">Inscrição Estadual *</Label>
                                        <Input
                                            id="inscricao_estadual"
                                            name="inscricao_estadual"
                                            defaultValue={config?.inscricao_estadual}
                                            required
                                            placeholder="000.000.000.000"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="inscricao_municipal">Inscrição Municipal</Label>
                                        <Input
                                            id="inscricao_municipal"
                                            name="inscricao_municipal"
                                            defaultValue={config?.inscricao_municipal}
                                            placeholder="00000000"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="regime_tributario">Regime Tributário *</Label>
                                    <Select
                                        name="regime_tributario"
                                        defaultValue={config?.regime_tributario || 'simples_nacional'}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
                                            <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                                            <SelectItem value="lucro_real">Lucro Real</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="border-t pt-4">
                                    <h3 className="font-semibold mb-4">Endereço Fiscal</h3>
                                    <div className="grid grid-cols-4 gap-4">
                                        <div className="col-span-3 space-y-2">
                                            <Label htmlFor="logradouro">Logradouro *</Label>
                                            <Input
                                                id="logradouro"
                                                name="logradouro"
                                                defaultValue={config?.logradouro}
                                                required
                                                placeholder="Rua, Avenida, etc"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="numero">Número *</Label>
                                            <Input
                                                id="numero"
                                                name="numero"
                                                defaultValue={config?.numero}
                                                required
                                                placeholder="123"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 mt-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="complemento">Complemento</Label>
                                            <Input
                                                id="complemento"
                                                name="complemento"
                                                defaultValue={config?.complemento}
                                                placeholder="Sala, Andar, etc"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="bairro">Bairro *</Label>
                                            <Input
                                                id="bairro"
                                                name="bairro"
                                                defaultValue={config?.bairro}
                                                required
                                                placeholder="Centro"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="cep">CEP *</Label>
                                            <Input
                                                id="cep"
                                                name="cep"
                                                defaultValue={config?.cep}
                                                required
                                                placeholder="00000-000"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="cidade">Cidade *</Label>
                                            <Input
                                                id="cidade"
                                                name="cidade"
                                                defaultValue={config?.cidade}
                                                required
                                                placeholder="São Paulo"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="uf">UF *</Label>
                                            <Input
                                                id="uf"
                                                name="uf"
                                                defaultValue={config?.uf}
                                                required
                                                maxLength={2}
                                                placeholder="SP"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="certificado" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Certificado Digital A1</CardTitle>
                                <CardDescription>
                                    Necessário para assinar as notas fiscais eletronicamente
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {config?.certificado_validade && (
                                    <Alert>
                                        <CheckCircle className="h-4 w-4" />
                                        <AlertDescription>
                                            Certificado instalado e válido até{' '}
                                            {new Date(config.certificado_validade).toLocaleDateString('pt-BR')}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="certificate">Arquivo do Certificado (.pfx)</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="certificate"
                                            type="file"
                                            accept=".pfx,.p12"
                                            onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleCertificateUpload}
                                            disabled={!certificateFile}
                                        >
                                            <Upload className="h-4 w-4 mr-2" />
                                            Upload
                                        </Button>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Arquivo .pfx ou .p12 fornecido pela Certificadora
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="certificate_password">Senha do Certificado</Label>
                                    <Input
                                        id="certificate_password"
                                        type="password"
                                        value={certificatePassword}
                                        onChange={(e) => setCertificatePassword(e.target.value)}
                                        placeholder="••••••••"
                                    />
                                </div>

                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        <strong>Importante:</strong> O certificado digital é armazenado de forma segura e
                                        criptografada. Nunca compartilhe sua senha com terceiros.
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="nfce" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Configurações NFC-e</CardTitle>
                                <CardDescription>
                                    Nota Fiscal de Consumidor Eletrônica (modelo 65)
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="serie_nfce">Série NFC-e *</Label>
                                        <Input
                                            id="serie_nfce"
                                            name="serie_nfce"
                                            defaultValue={config?.serie_nfce || '1'}
                                            required
                                            placeholder="1"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="ultimo_numero_nfce">Último Número Emitido</Label>
                                        <Input
                                            id="ultimo_numero_nfce"
                                            name="ultimo_numero_nfce"
                                            type="number"
                                            defaultValue={config?.ultimo_numero_nfce || 0}
                                            disabled
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="csc_nfce">CSC (Token) *</Label>
                                        <Input
                                            id="csc_nfce"
                                            name="csc_nfce"
                                            defaultValue={config?.csc_nfce}
                                            required
                                            placeholder="Código fornecido pela SEFAZ"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="id_csc_nfce">ID do CSC *</Label>
                                        <Input
                                            id="id_csc_nfce"
                                            name="id_csc_nfce"
                                            type="number"
                                            defaultValue={config?.id_csc_nfce || 1}
                                            required
                                            placeholder="1"
                                        />
                                    </div>
                                </div>

                                <Alert>
                                    <FileText className="h-4 w-4" />
                                    <AlertDescription>
                                        O CSC (Código de Segurança do Contribuinte) é fornecido pela SEFAZ do seu estado.
                                        Acesse o portal da SEFAZ para gerar ou consultar seu CSC.
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="nfe" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Configurações NF-e</CardTitle>
                                <CardDescription>
                                    Nota Fiscal Eletrônica (modelo 55)
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="serie_nfe">Série NF-e *</Label>
                                        <Input
                                            id="serie_nfe"
                                            name="serie_nfe"
                                            defaultValue={config?.serie_nfe || '1'}
                                            required
                                            placeholder="1"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="ultimo_numero_nfe">Último Número Emitido</Label>
                                        <Input
                                            id="ultimo_numero_nfe"
                                            name="ultimo_numero_nfe"
                                            type="number"
                                            defaultValue={config?.ultimo_numero_nfe || 0}
                                            disabled
                                        />
                                    </div>
                                </div>

                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        A NF-e (modelo 55) será implementada em breve. Por enquanto, apenas NFC-e está disponível.
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="ambiente" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Ambiente de Emissão</CardTitle>
                                <CardDescription>
                                    Escolha entre homologação (testes) e produção (notas válidas)
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="ambiente">Ambiente *</Label>
                                    <Select
                                        name="ambiente"
                                        defaultValue={config?.ambiente || 'homologacao'}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="homologacao">
                                                Homologação (Testes)
                                            </SelectItem>
                                            <SelectItem value="producao">
                                                Produção (Notas Válidas)
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {isProduction ? (
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>
                                            <strong>ATENÇÃO:</strong> Você está em ambiente de PRODUÇÃO. Todas as notas
                                            emitidas serão válidas e enviadas para a SEFAZ oficial.
                                        </AlertDescription>
                                    </Alert>
                                ) : (
                                    <Alert>
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>
                                            Você está em ambiente de HOMOLOGAÇÃO. As notas emitidas são apenas para testes
                                            e não têm validade fiscal.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <div className="flex justify-end gap-2">
                        <Button
                            type="submit"
                            disabled={saveMutation.isPending}
                        >
                            {saveMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Salvar Configurações
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </Tabs>
        </div>
    );
}
