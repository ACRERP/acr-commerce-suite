import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  Database, 
  Copy, 
  Download, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Table,
  Eye,
  Save,
  RefreshCw,
  FolderOpen
} from 'lucide-react'
import { 
  readAccessFile, 
  copyAllAccessData, 
  exportAccessToJSON,
  AccessReadResult 
} from '@/lib/accessFileReader'

// Página para leitura e cópia de arquivo Access
export default function AccessFileReaderPage() {
  const [filePath, setFilePath] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<AccessReadResult | null>(null)
  const [selectedTable, setSelectedTable] = useState<string>('')
  const [tableData, setTableData] = useState<Array<Record<string, unknown>>>([])

  // Ler arquivo completo
  const readFullFile = async () => {
    if (!filePath) {
      alert('Por favor, informe o caminho do arquivo Access')
      return
    }

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
          return prev + 5
        })
      }, 100)

      const result = await readAccessFile(filePath)
      
      clearInterval(progressInterval)
      setProgress(100)
      setResult(result)

      if (result.success) {
        console.log('Arquivo lido com sucesso:', {
          tables: result.tables?.length,
          totalRecords: Object.values(result.recordCounts || {}).reduce((sum, count) => sum + count, 0)
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Erro na leitura do arquivo',
        error: error.message
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Copiar todos os dados
  const copyAllData = async () => {
    if (!filePath) {
      alert('Por favor, informe o caminho do arquivo Access')
      return
    }

    setIsProcessing(true)
    setProgress(0)

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 3
        })
      }, 100)

      const result = await copyAllAccessData(filePath)
      
      clearInterval(progressInterval)
      setProgress(100)

      if (result.success) {
        alert(`Dados copiados com sucesso!\n\nTotal: ${result.totalRecords} registros\nTabelas: ${result.tables.length}`)
      } else {
        alert(`Erro na cópia: ${result.message}`)
      }
    } catch (error) {
      alert(`Erro na cópia: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // Exportar para JSON
  const exportToJSON = async () => {
    if (!filePath) {
      alert('Por favor, informe o caminho do arquivo Access')
      return
    }

    setIsProcessing(true)

    try {
      const outputPath = filePath.replace('.accdb', '_exported.json')
      const success = await exportAccessToJSON(filePath, outputPath)

      if (success) {
        alert(`Dados exportados com sucesso para:\n${outputPath}`)
      } else {
        alert('Erro na exportação dos dados')
      }
    } catch (error) {
      alert(`Erro na exportação: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // Ver tabela específica
  const viewTable = async (tableName: string) => {
    if (!filePath) return

    setSelectedTable(tableName)
    setIsProcessing(true)

    try {
      // Simulação - na implementação real leríamos os dados
      const mockData = Array.from({ length: 10 }, (_, i) => ({
        ID: i + 1,
        Nome: `Registro ${i + 1}`,
        Valor: Math.random() * 100,
        Data: new Date().toLocaleDateString('pt-BR')
      }))

      setTableData(mockData)
    } catch (error) {
      console.error('Erro ao ler tabela:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Selecionar arquivo
  const selectFile = () => {
    // Simulação - na implementação real usaríamos input type="file"
    const path = prompt('Digite o caminho completo do arquivo Access:', 'C:\\Sistema\\SMB_v4.0a.accdb')
    if (path) {
      setFilePath(path)
    }
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
                <h1 className="text-2xl font-bold">Leitor de Arquivo Access</h1>
                <p className="text-sm opacity-90">SMB v4.0a - Leitura e Cópia Completa</p>
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
                  <FolderOpen className="h-5 w-5 mr-2" />
                  Arquivo Access
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Caminho do Arquivo:</label>
                  <div className="flex space-x-2 mt-1">
                    <Input
                      placeholder="C:\\Sistema\\SMB_v4.0a.accdb"
                      value={filePath}
                      onChange={(e) => setFilePath(e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="outline" onClick={selectFile}>
                      <FolderOpen className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Progresso */}
                {isProcessing && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Processando...</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>
                )}

                {/* Ações Principais */}
                <div className="space-y-2">
                  <Button 
                    className="w-full"
                    onClick={readFullFile}
                    disabled={!filePath || isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Lendo Arquivo...
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Ler Arquivo
                      </>
                    )}
                  </Button>

                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={copyAllData}
                    disabled={!filePath || isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Copiando...
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar Todos os Dados
                      </>
                    )}
                  </Button>

                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={exportToJSON}
                    disabled={!filePath || isProcessing}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar para JSON
                  </Button>
                </div>
              </CardContent>
            </Card>

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
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-green-600">{result.message}</p>
                      
                      {result.tables && (
                        <div>
                          <p className="text-sm font-medium">Tabelas encontradas: {result.tables.length}</p>
                        </div>
                      )}

                      {result.recordCounts && (
                        <div>
                          <p className="text-sm font-medium mb-2">Registros por tabela:</p>
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {Object.entries(result.recordCounts).map(([table, count]) => (
                              <div key={table} className="flex justify-between text-xs">
                                <span className="font-mono">{table}:</span>
                                <span className="font-medium">{count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-2 border-t">
                        <p className="text-sm font-medium">
                          Total de registros: {Object.values(result.recordCounts || {}).reduce((sum, count) => sum + count, 0)}
                        </p>
                      </div>
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

          {/* Coluna Direita - Visualização */}
          <div className="col-span-8">
            <Tabs defaultValue="tables" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="tables">Tabelas</TabsTrigger>
                <TabsTrigger value="preview">Visualização</TabsTrigger>
              </TabsList>

              <TabsContent value="tables" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Table className="h-5 w-5 mr-2" />
                      Tabelas do Banco de Dados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {result?.tables ? (
                      <div className="grid grid-cols-3 gap-3">
                        {result.tables.map((table) => (
                          <div
                            key={table}
                            className="border rounded-lg p-3 cursor-pointer hover:border-acr-blue hover:bg-acr-blue/5 transition-colors"
                            onClick={() => viewTable(table)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-mono text-sm font-medium">{table}</span>
                              <Badge variant="outline" className="text-xs">
                                {result.recordCounts?.[table] || 0}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {result.recordCounts?.[table] || 0} registros
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Database className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">
                          Selecione um arquivo Access para visualizar as tabelas
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Eye className="h-5 w-5 mr-2" />
                        Visualização de Dados
                      </span>
                      {selectedTable && (
                        <Badge variant="outline">{selectedTable}</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedTable && tableData.length > 0 ? (
                      <div className="space-y-4">
                        <div className="text-sm text-muted-foreground">
                          Mostrando {tableData.length} registros
                        </div>
                        
                        <div className="border rounded-lg overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                {Object.keys(tableData[0]).map((key) => (
                                  <th key={key} className="px-4 py-2 text-left font-medium border-b">
                                    {key}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {tableData.map((row, index) => (
                                <tr key={index} className="border-b hover:bg-gray-50">
                                  {Object.values(row).map((value, cellIndex) => (
                                    <td key={cellIndex} className="px-4 py-2">
                                      {String(value)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Table className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">
                          {result?.tables 
                            ? 'Selecione uma tabela para visualizar os dados'
                            : 'Carregue um arquivo Access primeiro'
                          }
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Alertas */}
        <Alert className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Importante:</strong> Este sistema simula a leitura de arquivos Access. 
            Na implementação real, seriam necessárias bibliotecas específicas como 'node-adodb' 
            ou 'mdb-tools' para conectar-se ao arquivo .accdb.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
