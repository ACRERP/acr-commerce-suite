// Import SMB Data to Supabase
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://bcwofzavgafqonogowqf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjd29memF2Z2FmcW9ub2dvd3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2OTk1NTAsImV4cCI6MjA4MDI3NTU1MH0.5TAe4lDiyRAtNWSqC2qC1IQUcOoiBvhcUP2HWkQ6ZyA'

const supabase = createClient(supabaseUrl, supabaseKey)

const fs = require('fs')
const path = require('path')

// Carregar dados extraídos
const dataPath = path.join(__dirname, '../../../extracted_data/smb_data_1764779873897.json')
const smbData = JSON.parse(fs.readFileSync(dataPath, 'utf8'))

async function importData() {
  console.log('🚀 Importando dados SMB para Supabase...')
  
  try {
    // Import Products
    console.log('📦 Importando produtos...')
    const products = smbData.tblProdutos.map(p => ({
      name: p.Descricao,
      description: p.Descricao,
      category: p.Categoria,
      brand: '',
      code: p.Codigo,
      stock_quantity: p.Estoque,
      minimum_stock_level: p.EstoqueMinimo,
      image_url: p.Imagem || ''
    }))
    
    const { error: productsError } = await supabase
      .from('products')
      .upsert(products)
    
    if (productsError) throw productsError
    console.log(`✅ ${products.length} produtos importados`)
    
    // Import Clients
    console.log('👥 Importando clientes...')
    const clients = smbData.tblClientes.map(c => ({
      name: c.Nome,
      email: c.Email || '',
      phone: c.Telefone || c.Celular || '',
      address: `${c.Endereco}, ${c.Numero} - ${c.Bairro}`,
      cpf_cnpj: c.CPFCNPJ || ''
    }))
    
    const { error: clientsError } = await supabase
      .from('clients')
      .upsert(clients)
    
    if (clientsError) throw clientsError
    console.log(`✅ ${clients.length} clientes importados`)
    
    console.log('🎉 Importação concluída!')
    
  } catch (error) {
    console.error('❌ Erro na importação:', error)
  }
}

importData()
