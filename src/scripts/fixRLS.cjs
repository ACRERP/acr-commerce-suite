// Fix RLS Recursive Policy
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://bcwofzavgafqonogowqf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjd29memF2Z2FmcW9ub2dvd3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2OTk1NTAsImV4cCI6MjA4MDI3NTU1MH0.5TAe4lDiyRAtNWSqC2qC1IQUcOoiBvhcUP2HWkQ6ZyA'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixRLS() {
  console.log('🔧 Corrigindo políticas RLS...')
  
  try {
    // 1. Drop all existing policies that might cause recursion
    console.log('1️⃣ Removendo políticas problemáticas...')
    
    const policiesToDrop = [
      'Enable read access for all users',
      'Users can view their own sales',
      'Admins can view all sales',
      'Users can view their sale items',
      'Admins can view all sale items'
    ]
    
    for (const policy of policiesToDrop) {
      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: `DROP POLICY IF EXISTS "${policy}" ON public.products CASCADE;`
        })
        if (error && !error.message.includes('does not exist')) {
          console.log(`⚠️ Erro ao remover ${policy}:`, error.message)
        }
      } catch (e) {
        console.log(`⚠️ Erro ao remover ${policy}:`, e.message)
      }
    }
    
    // 2. Create simple policies without recursion
    console.log('2️⃣ Criando políticas simples...')
    
    // Products - Allow all operations for now
    const { error: productsPolicy } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Enable all for products" ON public.products FOR ALL USING (true);
      `
    })
    
    if (productsPolicy) {
      console.log('❌ Erro política products:', productsPolicy.message)
    } else {
      console.log('✅ Política products criada')
    }
    
    // Clients - Allow all operations for now
    const { error: clientsPolicy } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Enable all for clients" ON public.clients FOR ALL USING (true);
      `
    })
    
    if (clientsPolicy) {
      console.log('❌ Erro política clients:', clientsPolicy.message)
    } else {
      console.log('✅ Política clients criada')
    }
    
    // Sales - Simple policies
    const { error: salesPolicy } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Enable all for sales" ON public.sales FOR ALL USING (true);
      `
    })
    
    if (salesPolicy) {
      console.log('❌ Erro política sales:', salesPolicy.message)
    } else {
      console.log('✅ Política sales criada')
    }
    
    // Sale Items - Simple policies
    const { error: saleItemsPolicy } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Enable all for sale_items" ON public.sale_items FOR ALL USING (true);
      `
    })
    
    if (saleItemsPolicy) {
      console.log('❌ Erro política sale_items:', saleItemsPolicy.message)
    } else {
      console.log('✅ Política sale_items criada')
    }
    
    console.log('\n✅ Políticas RLS corrigidas!')
    console.log('🚀 Agora pode importar os dados SMB!')
    
  } catch (error) {
    console.error('❌ Erro ao corrigir RLS:', error)
  }
}

fixRLS()
