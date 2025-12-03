import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { mapAccessData, exportInstructions } from '@/lib/access'

export default function ImportAccess() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<any[]>([])
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
          const headers = lines[0].split(',')
          const data = lines.slice(1, 6).map(line => {
            const values = line.split(',')
            const obj: any = {}
            headers.forEach((header, index) => {
              obj[header.trim()] = values[index]?.trim()
            })
            return obj
          })
          setPreview(data)
        } catch (error) {
          console.error('Error reading file:', error)
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
      const headers = lines[0].split(',')
      const data = lines.slice(1).map(line => {
        const values = line.split(',')
        const obj: any = {}
        headers.forEach((header, index) => {
          obj[header.trim()] = values[index]?.trim()
        })
        return obj
      })

      // Mapear dados para nosso formato
      const mappedData = mapAccessData(data, 'products')
      
      toast({
        title: 'Importação Simulada',
        description: `${mappedData.length} registros processados. Implemente integração real com Supabase.`
      })

      console.log('Dados mapeados:', mappedData)
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Importar do Access</h1>
        <p className="text-muted-foreground">
          Migre dados do Microsoft Access para o novo sistema
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Upload de Arquivo</CardTitle>
            <CardDescription>
              Exporte do Access como CSV e faça upload aqui
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Arquivo CSV/Excel</Label>
              <Input
                id="file"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
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
              {loading ? 'Importando...' : 'Importar Dados'}
            </Button>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instruções</CardTitle>
            <CardDescription>
              Como exportar do Microsoft Access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium">1. No Access:</h4>
                <ul className="list-disc list-inside text-muted-foreground">
                  <li>Abra seu banco de dados</li>
                  <li>Selecione a tabela desejada</li>
                  <li>External Data &gt; Export</li>
                  <li>Escolha formato CSV ou Excel</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium">2. Tabelas recomendadas:</h4>
                <ul className="list-disc list-inside text-muted-foreground">
                  <li>produtos → products</li>
                  <li>clientes → clients</li>
                  <li>vendas → sales</li>
                  <li>itens_venda → sale_items</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium">3. Campos importantes:</h4>
                <ul className="list-disc list-inside text-muted-foreground">
                  <li>ID único em cada tabela</li>
                  <li>Nomes dos campos em português ou inglês</li>
                  <li>Datas em formato padrão</li>
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
            <CardTitle>Preview dos Dados</CardTitle>
            <CardDescription>
              Primeiros 5 registros do arquivo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {Object.keys(preview[0] || {}).map(key => (
                      <th key={key} className="text-left p-2">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, index) => (
                    <tr key={index} className="border-b">
                      {Object.values(row).map((value, i) => (
                        <td key={i} className="p-2">{value}</td>
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
          <strong>Nota:</strong> Esta é uma importação simulada. Para implementar a integração real, 
          precisamos configurar a conexão com o Supabase e tratar os dados conforme a estrutura do seu banco Access.
        </AlertDescription>
      </Alert>
    </div>
  )
}
