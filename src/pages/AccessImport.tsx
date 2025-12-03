import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Database, 
  Upload, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  FileText,
  Settings,
  Package,
  Users,
  ShoppingCart,
  TrendingUp,
  Loader2
} from 'lucide-react'
import { extractAccessData, compatibilityAnalysis } from '@/lib/accessExtractor'

// Tipo para resultado dados
interface ImportResult {
  success: boolean
  message: string
  summary?: {
    products: number
    clients: number
    sales: number
    sale_items: number
    sellers?: number
    suppliers?: number
    accountsReceivable?: number
    accountsPayable?: number
    cashRegisters?: number
  }
  file?: {
    name: string
    size: string
    version: string
    lastModified: string
  }
  error?: string
}

// Página de importação do Access SMB v4.0a
export default function AccessImportPage() {
  const [filePath, setFilePath] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [selectedTables, setSelectedTables] = useState<string[]>([
    'products',
    'clients', 
    'sales',
    'sale_items'
  ])

  // Tabelas disponíveis para importação
  const availableTables = [
    { 
      id: 'products', 
      name: 'Produtos', 
      icon: <Package className="h-4 w-4" />,
      description: 'Cadastro completo de produtos',
      compatibility: 'full',
      records: 0
    },
    { 
      id: 'clients', 
      name: 'Clientes', 
      icon: <Users className="h-4 w-4" />,
      description: 'Cadastro de clientes',
      compatibility: 'full',
      records: 0
    },
    { 
      id: 'sales', 
      name: 'Vendas', 
      icon: <ShoppingCart className="h-4 w-4" />,
      description: 'Histórico de vendas',
      compatibility: 'full',
      records: 0
    },
    { 
      id: 'sale_items', 
      name: 'Itens de Venda', 
      icon: <FileText className="h-4 w-4" />,
      description: 'Detalhes das vendas',
      compatibility: 'full',
      records: 0
    },
    { 
      id: 'sellers', 
      name: 'Vendedores', 
      icon: <Users className="h-4 w-4" />,
      description: 'Cadastro de vendedores',
      compatibility: 'partial',
      records: 0
    },
    { 
      id: 'suppliers', 
      name: 'Fornecedores', 
      icon: <Package className="h-4 w-4" />,
      description: 'Cadastro de fornecedores',
      compatibility: 'partial',
      records: 0
    },
    { 
      id: 'accounts_receivable', 
      name: 'Contas a Receber', 
      icon: <TrendingUp className="h-4 w-4" />,
      description: 'Contas a receber',
      compatibility: 'partial',
      records: 0
    },
    { 
      id: 'accounts_payable', 
      name: 'Contas a Pagar', 
      icon: <TrendingUp className="h-4 w-4" />,
      description: 'Contas a pagar',
      compatibility: 'partial',
      records: 0
    },
    { 
      id: 'cash_registers', 
      name: 'Caixa', 
      icon: <Database className="h-4 w-4" />,
      description: 'Movimentações de caixa',
      compatibility: 'partial',
      records: 0
    }
  ]

  // Simulação de análise do arquivo
  const analyzeFile = async () => {
    setIsProcessing(true)
    setProgress(0)

    try {
      // Simulação de progresso
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Simular análise
      await new Promise(resolve => setTimeout(resolve, 2000))

      clearInterval(progressInterval)
      setProgress(100)

      // Simular resultado
      setResult({
        success: true,
        message: 'Arquivo analisado com sucesso',
        summary: {
          products: 1248,
          clients: 423,
          sales: 8456,
          sale_items: 12450,
          sellers: 8,
          suppliers: 45,
          accountsReceivable: 234,
          accountsPayable: 89,
          cashRegisters: 156
        },
        file: {
          name: 'SMB_v4.0a.accdb',
          size: '45.2 MB',
          version: 'SMB v4.0a',
          lastModified: '2024-11-15'
        }
      })
    } catch (error) {
      setResult({
        success: false,
        message: 'Erro ao analisar arquivo',
        error: error.message
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Iniciar importação
  const startImport = async () => {
    setIsProcessing(true)
    setProgress(0)

    try {
      const result = await extractAccessData(filePath)
      setResult(result)
    } catch (error) {
      setResult({
        success: false,
        message: 'Erro na importação',
        error: error.message
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Toggle table selection
  const toggleTable = (tableId: string) => {
    setSelectedTables(prev => 
      prev.includes(tableId) 
        ? prev.filter(id => id !== tableId)
        : [...prev, tableId]
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-acr-blue text-white rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Database className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">Importação Access SMB v4.0a</h1>
                <p className="text-sm opacity-90">Extração completa de dados do sistema SMB</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white">
              Sistema ACR Comercial
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Coluna Esquerda - Configuração */}
          <div className="col-span-4 space-y-4">
            {/* Seleção de Arquivo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2" />
                  Arquivo Access
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Caminho do Arquivo:</label>
                  <Input
                    placeholder="C:\\Sistema\\SMB_v4.0a.accdb"
                    value={filePath}
                    onChange={(e) => setFilePath(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button 
                  className="w-full"
                  onClick={analyzeFile}
                  disabled={!filePath || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4 mr-2" />
                      Analisar Arquivo
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Progresso */}
            {isProcessing && (
              <Card>
                <CardHeader>
                  <CardTitle>Progresso</CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={progress} className="mb-2" />
                  <p className="text-sm text-muted-foreground">{progress}% concluído</p>
                </CardContent>
              </Card>
            )}

            {/* Resultado */}
            {result && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
                    )}
                    Resultado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result.success ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-green-600">{result.message}</p>
                      {result.summary && (
                        <div className="space-y-1">
                          {Object.entries(result.summary).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-sm">
                              <span className="capitalize">{key.replace('_', ' ')}:</span>
                              <span className="font-medium">{value} registros</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <Button 
                        className="w-full mt-4"
                        onClick={startImport}
                        disabled={isProcessing}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Iniciar Importação
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-red-600">{result.message}</p>
                      {result.error && (
                        <p className="text-xs text-muted-foreground">{result.error}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Coluna Central - Tabelas */}
          <div className="col-span-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Tabelas Disponíveis
                  </span>
                  <Badge variant="outline">
                    {selectedTables.length} selecionadas
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {availableTables.map((table) => (
                    <div
                      key={table.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedTables.includes(table.id)
                          ? 'border-acr-blue bg-acr-blue/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleTable(table.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className={`p-2 rounded ${
                            table.compatibility === 'full' 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-yellow-100 text-yellow-600'
                          }`}>
                            {table.icon}
                          </div>
                          <div>
                            <h3 className="font-medium">{table.name}</h3>
                            <p className="text-xs text-muted-foreground">{table.description}</p>
                          </div>
                        </div>
                        <Badge 
                          variant={table.compatibility === 'full' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {table.compatibility === 'full' ? '100%' : 'Parcial'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {result?.summary?.[table.id] || 0} registros
                        </span>
                        <div className={`w-4 h-4 rounded border ${
                          selectedTables.includes(table.id)
                            ? 'bg-acr-blue border-acr-blue'
                            : 'border-gray-300'
                        }`}>
                          {selectedTables.includes(table.id) && (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Informações de Compatibilidade */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Informações de Compatibilidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">100%</div>
                    <div className="text-sm font-medium">Compatível</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Produtos, Clientes, Vendas
                    </div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">Parcial</div>
                    <div className="text-sm font-medium">Adaptação Necessária</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Financeiro, Estoque
                    </div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">Novo</div>
                    <div className="text-sm font-medium">Criação Requerida</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      OS, Delivery, Restaurante
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alertas */}
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Importante:</strong> A importação preservará todos os dados existentes no sistema ACR. 
                Os dados do Access serão adicionados como novos registros. Faça backup antes de prosseguir.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </div>
  )
}
