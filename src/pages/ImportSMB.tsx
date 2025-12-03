import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { mapSMBData, smbExportInstructions } from '@/lib/smbAccess'

export default function ImportSMB() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<Record<string, string>[]>([])
  const [tableType, setTableType] = useState<'products' | 'customers' | 'sales'>('products')
  const { toast } = useToast()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      // Preview do arquivo
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string
          const lines = text.split('\n').filter(line => line.trim())
          
          if (lines.length > 0) {
            // Detectar delimitador (vírgula ou ponto e vírgula)
            const firstLine = lines[0]
            const delimiter = firstLine.includes(';') ? ';' : ','
            
            const headers = firstLine.split(delimiter).map(h => h.trim().replace(/"/g, ''))
            const data = lines.slice(1, 6).map(line => {
              const values = line.split(delimiter)
              const obj: Record<string, string> = {}
              headers.forEach((header, index) => {
                obj[header] = values[index]?.trim().replace(/"/g, '') || ''
              })
              return obj
            })
            setPreview(data)
          }
        } catch (error) {
          console.error('Error reading file:', error)
          setPreview([])
        }
      }
      reader.readAsText(selectedFile)
    }
  }

  async function handleImport() {
    if (!file) return

    setLoading(true)
    try {
      // Ler arquivo completo
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length === 0) {
        throw new Error('Arquivo vazio')
      }

      // Detectar delimitador
      const delimiter = lines[0].includes(';') ? ';' : ','
      
      const headers = lines[0].split(delimiter).map(h => h.trim().replace(/"/g, ''))
      const data = lines.slice(1).map(line => {
        const values = line.split(delimiter)
        const obj: Record<string, string> = {}
        headers.forEach((header, index) => {
          obj[header] = values[index]?.trim().replace(/"/g, '') || ''
        })
        return obj
      }).filter(row => Object.values(row).some(val => val.trim() !== ''))

      // Mapear dados para nosso formato
      const mappedData = mapSMBData(data, tableType)
      
      toast({
        title: 'Importação SMB Simulada',
        description: `${mappedData.length} registros de ${tableType} processados. Implemente integração real com Supabase.`
      })

      console.log('Dados SMB mapeados:', mappedData)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao processar arquivo'
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getExpectedFields = () => {
    switch (tableType) {
      case 'products':
        return ['CODIGO', 'DESCRICAO', 'PRECO_VENDA', 'ESTOQUE', 'CATEGORIA']
      case 'customers':
        return ['CODIGO', 'NOME', 'CPF_CNPJ', 'TELEFONE', 'ENDERECO']
      case 'sales':
        return ['CODIGO', 'DATA', 'TOTAL', 'FORMA_PAGTO', 'COD_CLIENTE']
      default:
        return []
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Importar do SMB v4.0a</h1>
        <p className="text-muted-foreground">
          Migre dados do Sistema de Gerenciamento de Bares e Restaurantes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Upload de Arquivo SMB</CardTitle>
            <CardDescription>
              Exporte do SMB como CSV e faça upload aqui
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tableType">Tipo de Dados</Label>
              <select
                id="tableType"
                value={tableType}
                onChange={(e) => setTableType(e.target.value as any)}
                className="w-full p-2 border rounded-md"
                title="Selecione o tipo de dados"
                aria-label="Tipo de dados"
              >
                <option value="products">Produtos</option>
                <option value="customers">Clientes</option>
                <option value="sales">Vendas</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Arquivo CSV/Excel do SMB</Label>
              <Input
                id="file"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                title="Selecione o arquivo exportado do SMB"
              />
            </div>

            {file && (
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>Arquivo:</strong> {file.name}
                </p>
                <p className="text-sm">
                  <strong>Tamanho:</strong> {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            )}

            <Button 
              onClick={handleImport} 
              disabled={!file || loading}
              className="w-full"
            >
              {loading ? 'Importando...' : 'Importar Dados SMB'}
            </Button>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Exportar do SMB v4.0a</CardTitle>
            <CardDescription>
              Como extrair dados do sistema SMB
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium">Via Relatórios SMB:</h4>
                <ul className="list-disc list-inside text-muted-foreground">
                  <li>Abrir sistema SMB</li>
                  <li>Relatórios → {tableType === 'products' ? 'Produtos' : tableType === 'customers' ? 'Clientes' : 'Vendas'}</li>
                  <li>Listagem Completa</li>
                  <li>Exportar → CSV/Excel</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium">Via Banco de Dados:</h4>
                <ul className="list-disc list-inside text-muted-foreground">
                  <li>Localizar arquivo .mdb do SMB</li>
                  <li>Abrir com Microsoft Access</li>
                  <li>Exportar tabelas correspondentes</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium">Campos esperados:</h4>
                <ul className="list-disc list-inside text-muted-foreground">
                  {getExpectedFields().map(field => (
                    <li key={field}>{field}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview dos Dados SMB</CardTitle>
            <CardDescription>
              Primeiros registros do arquivo {tableType}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    {Object.keys(preview[0] || {}).map(key => (
                      <th key={key} className="text-left p-2 border">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, index) => (
                    <tr key={index} className="border-b">
                      {Object.values(row).map((value, i) => (
                        <td key={i} className="p-2 border">{value}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Alert>
        <AlertDescription>
          <strong>Integração SMB v4.0a:</strong> Sistema preparado para receber dados do SMB. 
          Os campos serão mapeados automaticamente para o formato do novo ERP.
        </AlertDescription>
      </Alert>
    </div>
  )
}
