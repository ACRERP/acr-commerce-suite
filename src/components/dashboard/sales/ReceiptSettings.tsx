import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { CompanyInfo, ReceiptOptions, defaultCompanyInfo } from '@/lib/receipt';
import { useReceiptSettings } from './receiptUtils';
import { 
  Building2, 
  Printer, 
  FileText, 
  Mail, 
  Save,
  RotateCcw,
  Eye,
  Download
} from 'lucide-react';

interface ReceiptSettingsProps {
  onSave?: (settings: ReceiptSettings) => void;
  onPreview?: (settings: ReceiptSettings) => void;
}

export interface ReceiptSettings {
  companyInfo: CompanyInfo;
  defaultOptions: ReceiptOptions;
}

const defaultSettings: ReceiptSettings = {
  companyInfo: defaultCompanyInfo,
  defaultOptions: {
    printHeader: true,
    printFooter: true,
    printClientInfo: true,
    printPaymentDetails: true,
    printDiscounts: true,
    printBarcode: false,
    printQrCode: false,
    fontSize: 'medium',
    paperWidth: 80,
  },
};

export function ReceiptSettings({ onSave, onPreview }: ReceiptSettingsProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<ReceiptSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);

  const updateCompanyInfo = (field: keyof CompanyInfo, value: string) => {
    setSettings(prev => ({
      ...prev,
      companyInfo: {
        ...prev.companyInfo,
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const updateOptions = (field: keyof ReceiptOptions, value: boolean | string | number) => {
    setSettings(prev => ({
      ...prev,
      defaultOptions: {
        ...prev.defaultOptions,
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // In a real implementation, this would save to localStorage or backend
    localStorage.setItem('receiptSettings', JSON.stringify(settings));
    
    onSave?.(settings);
    setHasChanges(false);
    
    toast({
      title: 'Configurações salvas',
      description: 'As configurações do recibo foram salvas com sucesso.',
    });
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
    
    toast({
      title: 'Configurações redefinidas',
      description: 'As configurações foram redefinidas para os valores padrão.',
    });
  };

  const handlePreview = () => {
    onPreview?.(settings);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'receipt-settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Configurações exportadas',
      description: 'As configurações foram exportadas como arquivo JSON.',
    });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string);
        setSettings(importedSettings);
        setHasChanges(true);
        
        toast({
          title: 'Configurações importadas',
          description: 'As configurações foram importadas com sucesso.',
        });
      } catch (error) {
        toast({
          title: 'Erro na importação',
          description: 'O arquivo de configurações é inválido.',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
  };

  // Load settings from localStorage on mount
  React.useEffect(() => {
    const savedSettings = localStorage.getItem('receiptSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
      } catch (error) {
        console.error('Failed to load receipt settings:', error);
      }
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configurações de Recibo</h2>
          <p className="text-gray-600">Personalize a aparência e conteúdo dos recibos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-2" />
            Visualizar
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              Informações da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="companyName">Nome da Empresa</Label>
              <Input
                id="companyName"
                value={settings.companyInfo.name}
                onChange={(e) => updateCompanyInfo('name', e.target.value)}
                placeholder="Nome da sua empresa"
              />
            </div>
            
            <div>
              <Label htmlFor="companyDocument">CNPJ/CPF</Label>
              <Input
                id="companyDocument"
                value={settings.companyInfo.document || ''}
                onChange={(e) => updateCompanyInfo('document', e.target.value)}
                placeholder="00.000.000/0001-00"
              />
            </div>
            
            <div>
              <Label htmlFor="companyAddress">Endereço</Label>
              <Input
                id="companyAddress"
                value={settings.companyInfo.address || ''}
                onChange={(e) => updateCompanyInfo('address', e.target.value)}
                placeholder="Rua Principal, 123 - Centro"
              />
            </div>
            
            <div>
              <Label htmlFor="companyPhone">Telefone</Label>
              <Input
                id="companyPhone"
                value={settings.companyInfo.phone || ''}
                onChange={(e) => updateCompanyInfo('phone', e.target.value)}
                placeholder="(11) 1234-5678"
              />
            </div>
            
            <div>
              <Label htmlFor="companyEmail">Email</Label>
              <Input
                id="companyEmail"
                type="email"
                value={settings.companyInfo.email || ''}
                onChange={(e) => updateCompanyInfo('email', e.target.value)}
                placeholder="contato@empresa.com"
              />
            </div>
            
            <div>
              <Label htmlFor="companyLogo">URL do Logo (opcional)</Label>
              <Input
                id="companyLogo"
                value={settings.companyInfo.logo || ''}
                onChange={(e) => updateCompanyInfo('logo', e.target.value)}
                placeholder="https://exemplo.com/logo.png"
              />
            </div>
          </CardContent>
        </Card>

        {/* Receipt Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Opções do Recibo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Content Options */}
            <div className="space-y-4">
              <h4 className="font-medium">Conteúdo</h4>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="printHeader">Imprimir cabeçalho</Label>
                <Switch
                  id="printHeader"
                  checked={settings.defaultOptions.printHeader}
                  onCheckedChange={(checked) => updateOptions('printHeader', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="printFooter">Imprimir rodapé</Label>
                <Switch
                  id="printFooter"
                  checked={settings.defaultOptions.printFooter}
                  onCheckedChange={(checked) => updateOptions('printFooter', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="printClientInfo">Dados do cliente</Label>
                <Switch
                  id="printClientInfo"
                  checked={settings.defaultOptions.printClientInfo}
                  onCheckedChange={(checked) => updateOptions('printClientInfo', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="printPaymentDetails">Detalhes de pagamento</Label>
                <Switch
                  id="printPaymentDetails"
                  checked={settings.defaultOptions.printPaymentDetails}
                  onCheckedChange={(checked) => updateOptions('printPaymentDetails', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="printDiscounts">Descontos aplicados</Label>
                <Switch
                  id="printDiscounts"
                  checked={settings.defaultOptions.printDiscounts}
                  onCheckedChange={(checked) => updateOptions('printDiscounts', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="printBarcode">Código de barras</Label>
                <Switch
                  id="printBarcode"
                  checked={settings.defaultOptions.printBarcode}
                  onCheckedChange={(checked) => updateOptions('printBarcode', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="printQrCode">QR Code</Label>
                <Switch
                  id="printQrCode"
                  checked={settings.defaultOptions.printQrCode}
                  onCheckedChange={(checked) => updateOptions('printQrCode', checked)}
                />
              </div>
            </div>

            <Separator />

            {/* Formatting Options */}
            <div className="space-y-4">
              <h4 className="font-medium">Formatação</h4>
              
              <div>
                <Label htmlFor="fontSize">Tamanho da fonte</Label>
                <Select
                  value={settings.defaultOptions.fontSize}
                  onValueChange={(value: 'small' | 'medium' | 'large') => 
                    updateOptions('fontSize', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Pequeno</SelectItem>
                    <SelectItem value="medium">Médio</SelectItem>
                    <SelectItem value="large">Grande</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="paperWidth">Largura do papel (mm)</Label>
                <Select
                  value={settings.defaultOptions.paperWidth?.toString()}
                  onValueChange={(value) => updateOptions('paperWidth', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="58">58mm (Mini)</SelectItem>
                    <SelectItem value="80">80mm (Padrão)</SelectItem>
                    <SelectItem value="112">112mm (Grande)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Redefinir
              </Button>
              
              <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    aria-label="Importar configurações de recibo"
                    title="Importar configurações de recibo"
                  />
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Importar
                  </Button>
                </div>
            </div>
            
            {hasChanges && (
              <div className="flex items-center gap-2 text-sm text-orange-600">
                <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                Alterações não salvas
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
