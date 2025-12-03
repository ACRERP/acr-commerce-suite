// Import All Sales Data from SMB
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = 'https://bcwofzavgafqonogowqf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjd29memF2Z2FmcW9ub2dvd3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2OTk1NTAsImV4cCI6MjA4MDI3NTU1MH0.5TAe4lDiyRAtNWSqC2qC1IQUcOoiBvhcUP2HWkQ6ZyA'

const supabase = createClient(supabaseUrl, supabaseKey)

async function importAllSalesData() {
  console.log('🚀 Importando TODOS os dados de vendas SMB...')
  
  try {
    // Carregar dados extraídos
    const dataPath = path.join(__dirname, '../../../extracted_data/smb_data_1764779873897.json')
    const smbData = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
    
    console.log(`📊 Encontrados ${smbData.tblVendas.length} vendas`)
    console.log(`📋 Encontrados ${smbData.tblItensVenda.length} itens de venda`)
    
    // Importar vendas em lotes
    console.log('\n💰 Importando vendas...')
    const batchSize = 100
    let totalImported = 0
    
    for (let i = 0; i < smbData.tblVendas.length; i += batchSize) {
      const batch = smbData.tblVendas.slice(i, i + batchSize)
      
      const salesData = batch.map(venda => ({
        id: venda.ID,
        client_id: venda.IDCliente || null,
        user_id: null,
        total_amount: venda.Total || 0,
        payment_method: mapPaymentMethod(venda.FormaPagto),
        status: mapSaleStatus(venda.Situacao),
        discount: venda.Desconto || 0,
        addition: venda.Acrescimo || 0,
        installments: venda.Parcelas || 1,
        type: venda.Tipo || 'sale',
        notes: venda.Observacao || '',
        amount_paid: venda.ValorPago || 0,
        change_amount: venda.Troco || 0,
        created_at: venda.Data || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
      
      const { error } = await supabase.from('sales').insert(salesData)
      if (error) {
        console.log(`❌ Erro no lote ${i}-${i+batchSize}:`, error.message)
      } else {
        totalImported += batch.length
        console.log(`✅ Lote ${i}-${i+batchSize}: ${batch.length} vendas importadas`)
      }
    }
    
    console.log(`\n🎉 Vendas importadas: ${totalImported}/${smbData.tblVendas.length}`)
    
    // Importar itens de venda em lotes
    console.log('\n📋 Importando itens de venda...')
    let totalItemsImported = 0
    
    for (let i = 0; i < smbData.tblItensVenda.length; i += batchSize) {
      const batch = smbData.tblItensVenda.slice(i, i + batchSize)
      
      const itemsData = batch.map(item => ({
        id: item.ID,
        sale_id: item.IDVenda,
        product_id: item.IDProduto,
        quantity: item.Quantidade || 1,
        price: item.PrecoUnitario || 0,
        total_price: item.Total || (item.Quantidade * item.PrecoUnitario),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
      
      const { error } = await supabase.from('sale_items').insert(itemsData)
      if (error) {
        console.log(`❌ Erro no lote de itens ${i}-${i+batchSize}:`, error.message)
      } else {
        totalItemsImported += batch.length
        console.log(`✅ Lote de itens ${i}-${i+batchSize}: ${batch.length} itens importados`)
      }
    }
    
    console.log(`\n🎉 Itens importados: ${totalItemsImported}/${smbData.tblItensVenda.length}`)
    
    // Verificação final
    const { count: salesCount } = await supabase.from('sales').select('*', { count: 'exact', head: true })
    const { count: itemsCount } = await supabase.from('sale_items').select('*', { count: 'exact', head: true })
    
    console.log('\n📊 RESUMO FINAL:')
    console.log(`💰 Vendas no banco: ${salesCount}`)
    console.log(`📋 Itens no banco: ${itemsCount}`)
    console.log('🎉 Migração SMB concluída com sucesso!')
    
  } catch (error) {
    console.error('❌ Erro na importação:', error)
  }
}

function mapPaymentMethod(method) {
  const mapping = {
    'DINHEIRO': 'dinheiro',
    'CARTAO_CREDITO': 'cartao_credito',
    'CARTAO_DEBITO': 'cartao_debito',
    'PIX': 'pix'
  }
  return mapping[method] || 'fiado'
}

function mapSaleStatus(status) {
  const mapping = {
    'FECHADA': 'concluida',
    'ABERTA': 'pendente',
    'CANCELADA': 'cancelada'
  }
  return mapping[status] || 'concluida'
}

importAllSalesData()
