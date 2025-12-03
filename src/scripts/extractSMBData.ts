// Script de Extração Completa do SMB v4.0a
// Extrai todos os dados do banco Access para análise

import { AccessSMBExtractor } from '../lib/accessExtractor.js'
import { readAccessFile, copyAllAccessData } from '../lib/accessFileReader.js'
import { supabase } from '../lib/supabaseClient.js'

// Configurações
const SMB_PATH = 'C:\\Users\\Alisson Cruz\\Desktop\\ACRERP\\smb\\SMB v4.0a.accdb'
const OUTPUT_PATH = 'C:\\Users\\Alisson Cruz\\Desktop\\ACRERP\\extracted_data\\'

interface ExtractionResult {
  success: boolean
  timestamp: string
  database: {
    path: string
    size: string
    tables: string[]
    recordCounts: Record<string, number>
  }
  data?: Partial<AccessSMBStructure>
  analysis: {
    totalRecords: number
    tablesToImport: string[]
    compatibilityIssues: string[]
  }
  errors?: string[]
}

class SMBDataExtractor {
  private extractor: AccessSMBExtractor
  private results: ExtractionResult

  constructor() {
    this.extractor = new AccessSMBExtractor(SMB_PATH)
    this.results = {
      success: false,
      timestamp: new Date().toISOString(),
      database: {
        path: SMB_PATH,
        size: '0 MB',
        tables: [],
        recordCounts: {}
      },
      analysis: {
        totalRecords: 0,
        tablesToImport: [],
        compatibilityIssues: []
      }
    }
  }

  // Análise inicial do banco
  async analyzeDatabase(): Promise<void> {
    console.log('🔍 Analisando banco de dados SMB v4.0a...')
    
    try {
      // Ler arquivo Access
      const readResult = await readAccessFile(SMB_PATH)
      
      if (!readResult.success) {
        throw new Error(`Falha na leitura: ${readResult.error}`)
      }

      // Atualizar resultados
      this.results.database.tables = readResult.tables || []
      this.results.database.recordCounts = readResult.recordCounts || {}
      this.results.analysis.totalRecords = Object.values(this.results.database.recordCounts)
        .reduce((sum, count) => sum + count, 0)
      
      console.log(`📊 Banco analisado:`)
      console.log(`   - Tabelas: ${this.results.database.tables.length}`)
      console.log(`   - Registros totais: ${this.results.analysis.totalRecords}`)
      
    } catch (error) {
      console.error('❌ Erro na análise:', error)
      this.results.errors?.push(`Análise: ${error.message}`)
    }
  }

  // Extração completa dos dados
  async extractAllData(): Promise<void> {
    console.log('🚀 Iniciando extração completa dos dados...')
    
    try {
      // Copiar todos os dados
      const copyResult = await copyAllAccessData(SMB_PATH)
      
      if (!copyResult.success) {
        throw new Error(`Falha na cópia: ${copyResult.error}`)
      }

      this.results.data = copyResult.data
      
      console.log('✅ Dados extraídos com sucesso!')
      console.log(`   - Registros copiados: ${copyResult.totalRecords}`)
      console.log(`   - Tabelas processadas: ${copyResult.tables.length}`)
      
    } catch (error) {
      console.error('❌ Erro na extração:', error)
      this.results.errors?.push(`Extração: ${error.message}`)
    }
  }

  // Análise de compatibilidade
  async analyzeCompatibility(): Promise<void> {
    console.log('🔬 Analisando compatibilidade com ACR...')
    
    const compatibility = {
      fullyCompatible: ['products', 'clients', 'sales', 'sale_items'],
      partiallyCompatible: ['sellers', 'suppliers', 'accounts_receivable', 'accounts_payable'],
      needsCreation: [
        'service_orders', 'equipment', 'inventory_movements', 
        'delivery', 'tables', 'commands', 'configurations'
      ]
    }

    // Verificar quais tabelas têm dados
    const tablesWithData = Object.entries(this.results.database.recordCounts)
      .filter(([_, count]) => count > 0)
      .map(([table, _]) => table)

    this.results.analysis.tablesToImport = tablesWithData
    this.results.analysis.compatibilityIssues = tablesWithData
      .filter(table => !compatibility.fullyCompatible.includes(table.replace('tbl', '').toLowerCase()))
      .map(table => `Tabela ${table} precisa de criação/mapeamento`)

    console.log('📋 Análise de compatibilidade:')
    console.log(`   - 100% compatíveis: ${compatibility.fullyCompatible.length}`)
    console.log(`   - Parcialmente compatíveis: ${compatibility.partiallyCompatible.length}`)
    console.log(`   - Precisam criação: ${compatibility.needsCreation.length}`)
  }

  // Gerar relatório detalhado
  generateReport(): void {
    console.log('\n' + '='.repeat(60))
    console.log('📄 RELATÓRIO DE EXTRAÇÃO SMB v4.0a')
    console.log('='.repeat(60))
    console.log(`🕐 Data/Hora: ${this.results.timestamp}`)
    console.log(`📁 Banco: ${this.results.database.path}`)
    console.log(`📊 Tabelas: ${this.results.database.tables.length}`)
    console.log(`🔢 Registros: ${this.results.analysis.totalRecords}`)
    
    console.log('\n📈 ESTATÍSTICAS POR TABELA:')
    Object.entries(this.results.database.recordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([table, count]) => {
        console.log(`   ${table}: ${count.toLocaleString()} registros`)
      })

    console.log('\n✅ COMPATIBILIDADE:')
    console.log(`   - Tabelas para importar: ${this.results.analysis.tablesToImport.length}`)
    console.log(`   - Issues encontrados: ${this.results.analysis.compatibilityIssues.length}`)

    if (this.results.errors && this.results.errors.length > 0) {
      console.log('\n❌ ERROS:')
      this.results.errors.forEach(error => console.log(`   - ${error}`))
    }

    console.log('\n' + '='.repeat(60))
    console.log('🎉 EXTRAÇÃO CONCLUÍDA!')
    console.log('='.repeat(60))
  }

  // Processo completo
  async runFullExtraction(): Promise<ExtractionResult> {
    console.log('🚀 Iniciando extração completa do SMB v4.0a...')
    
    try {
      await this.analyzeDatabase()
      await this.extractAllData()
      await this.analyzeCompatibility()
      
      this.results.success = true
      this.generateReport()
      
      return this.results
      
    } catch (error) {
      console.error('❌ Falha na extração:', error)
      this.results.success = false
      this.results.errors?.push(`Processo: ${error.message}`)
      
      return this.results
    }
  }
}

// Executar extração
async function main() {
  const extractor = new SMBDataExtractor()
  const result = await extractor.runFullExtraction()
  
  // Salvar resultado em arquivo JSON
  try {
    const fs = require('fs')
    const path = require('path')
    
    // Criar diretório de saída se não existir
    if (!fs.existsSync(OUTPUT_PATH)) {
      fs.mkdirSync(OUTPUT_PATH, { recursive: true })
    }
    
    // Salvar relatório
    const reportPath = path.join(OUTPUT_PATH, `extraction_report_${Date.now()}.json`)
    fs.writeFileSync(reportPath, JSON.stringify(result, null, 2))
    
    console.log(`📄 Relatório salvo em: ${reportPath}`)
    
  } catch (error) {
    console.error('❌ Erro ao salvar relatório:', error)
  }
  
  return result
}

// Executar se chamado diretamente
if (require.main === module) {
  main()
    .then(result => {
      console.log('\n✅ Processo concluído!')
      process.exit(result.success ? 0 : 1)
    })
    .catch(error => {
      console.error('❌ Erro fatal:', error)
      process.exit(1)
    })
}

export { SMBDataExtractor }
