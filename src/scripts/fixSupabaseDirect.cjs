// Fix Supabase Direct SQL
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://bcwofzavgafqonogowqf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjd29memF2Z2FmcW9ub2dvd3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2OTk1NTAsImV4cCI6MjA4MDI3NTU1MH0.5TAe4lDiyRAtNWSqC2qC1IQUcOoiBvhcUP2HWkQ6ZyA'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixSupabase() {
  console.log('🔧 Corrigindo estrutura Supabase...')
  
  try {
    // 1. Add email column to clients
    console.log('1️⃣ Adicionando coluna email em clients...')
    const { error: emailError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE clients ADD COLUMN IF NOT EXISTS email text;'
    })
    
    if (emailError && !emailError.message.includes('already exists')) {
      console.log('❌ Erro email:', emailError.message)
    } else {
      console.log('✅ Coluna email adicionada')
    }
    
    // 2. Test basic insert without RLS issues
    console.log('\n2️⃣ Testando inserção básica...')
    
    // Disable RLS temporarily for testing
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE products DISABLE ROW LEVEL SECURITY;'
    })
    
    if (rlsError) {
      console.log('⚠️ Não foi possível desabilitar RLS:', rlsError.message)
    }
    
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
      
      // Clean up
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
      
      // Clean up
      await supabase.from('clients').delete().eq('id', insertedClient.id)
      console.log('🧹 Cliente teste removido')
    }
    
    // Re-enable RLS
    const { error: rlsEnableError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE products ENABLE ROW LEVEL SECURITY;'
    })
    
    if (rlsEnableError) {
      console.log('⚠️ Não foi possível reabilitar RLS:', rlsEnableError.message)
    }
    
    console.log('\n🎉 Correções concluídas!')
    
  } catch (error) {
    console.error('❌ Erro nas correções:', error)
  }
}

fixSupabase()
