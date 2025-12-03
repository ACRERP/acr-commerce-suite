import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/hooks/use-toast'

export default function CreateTestUsers() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('admin')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const { toast } = useToast()

  async function handleCreateUser() {
    if (!email || !password || !name) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    setMessage('')

    try {
      // 1. Criar usuário no auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role
          }
        }
      })

      if (authError) {
        // Se usuário já existe, tentar fazer login para pegar o ID
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (signInError) {
          throw signInError
        }

        // Criar profile se não existir
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: signInData.user.id,
            name,
            email,
            role,
            updated_at: new Date().toISOString()
          })

        if (profileError) {
          throw profileError
        }

        setMessage('Usuário atualizado com sucesso!')
        await supabase.auth.signOut()
      } else {
        // Criar profile para novo usuário
        if (authData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              name,
              email,
              role
            })

          if (profileError) {
            throw profileError
          }
        }
        setMessage('Usuário criado com sucesso! Verifique seu email.')
      }

      toast({
        title: 'Sucesso',
        description: message || 'Operação concluída'
      })

      // Limpar formulário
      setEmail('')
      setPassword('')
      setName('')

    } catch (error: unknown) {
      console.error('Error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar usuário'
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleQuickCreate() {
    setLoading(true)
    
    const testUsers = [
      { email: 'admin@teste.com', password: 'admin123', name: 'Admin Teste', role: 'admin' },
      { email: 'vendedor@teste.com', password: 'vendas123', name: 'Vendedor Teste', role: 'vendas' }
    ]

    for (const user of testUsers) {
      try {
        // Tentar criar usuário
        const { error: signUpError } = await supabase.auth.signUp({
          email: user.email,
          password: user.password,
          options: {
            data: {
              name: user.name,
              role: user.role
            }
          }
        })

        if (signUpError && signUpError.message.includes('already registered')) {
          // Usuário já existe, fazer login para pegar ID
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: user.password
          })

          if (!signInError && signInData.user) {
            await supabase
              .from('profiles')
              .upsert({
                id: signInData.user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                updated_at: new Date().toISOString()
              })
          }
          await supabase.auth.signOut()
        }

        await new Promise(resolve => setTimeout(resolve, 1000)) // Delay entre criações
      } catch (error) {
        console.error(`Error creating ${user.email}:`, error)
      }
    }

    setLoading(false)
    toast({
      title: 'Usuários de Teste Criados',
      description: 'Tente fazer login com admin@teste.com / admin123'
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Criar Usuário de Teste</CardTitle>
          <CardDescription>Crie usuários para testar o sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do usuário"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Função</Label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-2 border rounded-md"
              title="Selecione a função do usuário"
              aria-label="Função do usuário"
            >
              <option value="admin">Admin</option>
              <option value="vendas">Vendas</option>
              <option value="financeiro">Financeiro</option>
            </select>
          </div>

          <Button 
            onClick={handleCreateUser} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Criando...' : 'Criar Usuário'}
          </Button>

          <div className="pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={handleQuickCreate}
              disabled={loading}
              className="w-full"
            >
              Criar Usuários Padrão
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Cria admin@teste.com/admin123 e vendedor@teste.com/vendas123
            </p>
          </div>

          <div className="pt-2 border-t">
            <Button 
              variant="ghost" 
              onClick={() => window.location.href = '/dev-login'}
              className="w-full"
            >
              Voltar para Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
