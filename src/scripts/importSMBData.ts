// Import SMB Data to Supabase
import { supabase } from '../lib/supabaseClient'

const smbData = require('../../extracted_data/smb_data_1764779873897.json')

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
      image_url: p.Imagem
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
      email: c.Email,
      phone: c.Telefone,
      address: `${c.Endereco}, ${c.Numero}`,
      cpf_cnpj: c.CPFCNPJ
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
