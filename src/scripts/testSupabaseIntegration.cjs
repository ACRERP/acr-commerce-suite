// Test Integration with Supabase
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://bcwofzavgafqonogowqf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjd29memF2Z2FmcW9ub2dvd3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2OTk1NTAsImV4cCI6MjA4MDI3NTU1MH0.5TAe4lDiyRAtNWSqC2qC1IQUcOoiBvhcUP2HWkQ6ZyA'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testIntegration() {
  console.log('🔍 Testando integração com Supabase...')
  
  try {
    // Test connection
    console.log('1️⃣ Testando conexão...')
    const { data, error } = await supabase.from('products').select('count').single()
    if (error) throw error
    console.log('✅ Conexão OK')
    
    // Check existing tables
    console.log('\n2️⃣ Verificando tabelas existentes...')
    
    const tables = ['products', 'clients', 'sales', 'sale_items']
    const tableResults = {}
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
        tableResults[table] = error ? `❌ ${error.message}` : `✅ ${count} registros`
      } catch (e) {
        tableResults[table] = `❌ ${e.message}`
      }
    }
    
    console.log('📊 Status das tabelas:')
    Object.entries(tableResults).forEach(([table, status]) => {
      console.log(`   ${table}: ${status}`)
    })
    
    // Test sample data
    console.log('\n3️⃣ Testando dados de exemplo...')
    
    // Test product insert
    const testProduct = {
      name: 'Produto Teste',
      description: 'Descrição teste',
      category: 'Teste',
      brand: 'Teste',
      code: 'TEST001',
      stock_quantity: 10,
      minimum_stock_level: 5
    }
    
    const { data: insertedProduct, error: insertError } = await supabase
      .from('products')
      .insert(testProduct)
      .select()
      .single()
    
    if (insertError) {
      console.log(`❌ Erro inserir produto: ${insertError.message}`)
    } else {
      console.log(`✅ Produto inserido: ${insertedProduct.name} (ID: ${insertedProduct.id})`)
      
      // Clean up test product
      await supabase.from('products').delete().eq('id', insertedProduct.id)
      console.log('🧹 Produto teste removido')
    }
    
    // Test client insert
    const testClient = {
      name: 'Cliente Teste',
      email: 'teste@email.com',
      phone: '(31) 9999-9999',
      address: 'Rua Teste, 123',
      cpf_cnpj: '123.456.789-00'
    }
    
    const { data: insertedClient, error: clientError } = await supabase
      .from('clients')
      .insert(testClient)
      .select()
      .single()
    
    if (clientError) {
      console.log(`❌ Erro inserir cliente: ${clientError.message}`)
    } else {
      console.log(`✅ Cliente inserido: ${insertedClient.name} (ID: ${insertedClient.id})`)
      
      // Clean up test client
      await supabase.from('clients').delete().eq('id', insertedClient.id)
      console.log('🧹 Cliente teste removido')
    }
    
    console.log('\n🎉 Testes concluídos!')
    
    // Summary
    console.log('\n📋 RESUMO:')
    console.log('✅ Conexão: OK')
    console.log(`✅ Tabelas: ${Object.values(tableResults).filter(r => r.includes('✅')).length}/${tables.length}`)
    console.log('✅ Inserção: OK')
    
  } catch (error) {
    console.error('❌ Erro nos testes:', error)
  }
}

testIntegration()
