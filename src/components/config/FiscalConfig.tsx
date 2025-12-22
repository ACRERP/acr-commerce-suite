import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tantml:parameter>
<parameter name="Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FileText, Upload, CheckCircle, AlertCircle, Save } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export function FiscalConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificatePassword, setCertificatePassword] = useState('');
  const [cscToken, setCscToken] = useState('');
  const [cscId, setCscId] = useState('');
  const [sefazState, setSefazState] = useState('SP');
  const [nfceSeries, setNfceSeries] = useState(1);
  const [ambiente, setAmbiente] = useState<'homologacao' | 'producao'>('homologacao');

  // Query config
  const { data: config, isLoading } = useQuery({
    queryKey: ['fiscal-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fiscal_config')
        .select('*')
        .eq('active', true)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  // Mutation
  const saveMutation = useMutation({
    mutationFn: async (configData: any) => {
      const { data, error } = await supabase
        .from('fiscal_config')
        .upsert(configData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-config'] });
      toast({ title: 'Sucesso!', description: 'Configuração fiscal salva.' });
    },
    onError: () => {
      toast({ title: 'Erro!', description: 'Não foi possível salvar.', variant: 'destructive' });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'Erro!', description: 'Arquivo muito grande (máx 5MB)', variant: 'destructive' });
        return;
      }
      setCertificateFile(file);
    }
  };

  const handleSave = async () => {
    let certificateData = config?.certificate_data;

    // Upload certificado se houver
    if (certificateFile) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        certificateData = e.target?.result as string;
        
        const configData = {
          id: config?.id,
          certificate_type: 'A1',
          certificate_data: certificateData,
          certificate_password: certificatePassword,
          csc_token: cscToken,
          csc_id: cscId,
          sefaz_state: sefazState,
          nfce_series: nfceSeries,
          ambiente,
          active: true,
        };

        saveMutation.mutate(configData);
      };
      reader.readAsDataURL(certificateFile);
    } else {
      const configData = {
        id: config?.id,
        csc_token: cscToken || config?.csc_token,
        csc_id: cscId || config?.csc_id,
        sefaz_state: sefazState,
        nfce_series: nfceSeries,
        ambiente,
        active: true,
      };

      saveMutation.mutate(configData);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
    < div className = "flex items-center justify-center" >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div >
        </CardContent >
      </Card >
    );
  }

return (
    <div className="space-y-6">
        {/* Header */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Configuração Fiscal - NFC-e
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Configure certificado digital e parâmetros para emissão de NFC-e
                </p>
            </CardContent>
        </Card>

        {/* Status */}
        {config?.certificate_data && (
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium">Certificado configurado</span>
                        <Badge variant="secondary">{config.certificate_type}</Badge>
                    </div>
                </CardContent>
            </Card>
        )}

        {/* Certificado */}
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Certificado Digital</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label htmlFor="certificate">Arquivo do Certificado (.pfx)</Label>
                    <Input
                        id="certificate"
                        type="file"
                        accept=".pfx,.p12"
                        onChange={handleFileChange}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Apenas certificado A1 (arquivo .pfx). Máximo 5MB.
                    </p>
                </div>

                <div>
                    <Label htmlFor="password">Senha do Certificado</Label>
                    <Input
                        id="password"
                        type="password"
                        value={certificatePassword}
                        onChange={(e) => setCertificatePassword(e.target.value)}
                        placeholder="Digite a senha do certificado"
                    />
                </div>
            </CardContent>
        </Card>

        {/* CSC Token */}
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">CSC - Código de Segurança do Contribuinte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label htmlFor="csc_id">ID do CSC</Label>
                    <Input
                        id="csc_id"
                        value={cscId}
                        onChange={(e) => setCscId(e.target.value)}
                        placeholder="Ex: 1"
                        defaultValue={config?.csc_id}
                    />
                </div>

                <div>
                    <Label htmlFor="csc_token">Token CSC</Label>
                    <Input
                        id="csc_token"
                        value={cscToken}
                        onChange={(e) => setCscToken(e.target.value)}
                        placeholder="Token fornecido pela SEFAZ"
                        defaultValue={config?.csc_token}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Obtenha o CSC no portal da SEFAZ do seu estado
                    </p>
                </div>
            </CardContent>
        </Card>

        {/* Configurações */}
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Configurações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="state">Estado (UF)</Label>
                        <select
                            id="state"
                            value={sefazState}
                            onChange={(e) => setSefazState(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                        >
                            <option value="SP">São Paulo</option>
                            <option value="RJ">Rio de Janeiro</option>
                            <option value="MG">Minas Gerais</option>
                            {/* Adicionar outros estados */}
                        </select>
                    </div>

                    <div>
                        <Label htmlFor="series">Série NFC-e</Label>
                        <Input
                            id="series"
                            type="number"
                            value={nfceSeries}
                            onChange={(e) => setNfceSeries(Number(e.target.value))}
                            defaultValue={config?.nfce_series || 1}
                        />
                    </div>
                </div>

                <div>
                    <Label>Ambiente</Label>
                    <div className="flex gap-4 mt-2">
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                value="homologacao"
                                checked={ambiente === 'homologacao'}
                                onChange={(e) => setAmbiente(e.target.value as 'homologacao')}
                            />
                            <span>Homologação (Testes)</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                value="producao"
                                checked={ambiente === 'producao'}
                                onChange={(e) => setAmbiente(e.target.value as 'producao')}
                            />
                            <span>Produção</span>
                        </label>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Ações */}
        <Card>
            <CardContent className="pt-6">
                <Button
                    onClick={handleSave}
                    disabled={saveMutation.isPending}
                    className="w-full md:w-auto"
                >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Configuração Fiscal
                </Button>
            </CardContent>
        </Card>
    </div>
);
}
