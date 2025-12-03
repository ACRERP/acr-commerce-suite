import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function DevLogin() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuth()

  // Contas de teste pré-configuradas
  const testAccounts = [
    {
      email: 'admin@teste.com',
      password: 'admin123',
      role: 'Admin',
      description: 'Acesso total ao sistema'
    },
    {
      email: 'vendedor@teste.com', 
      password: 'vendas123',
      role: 'Vendedor',
      description: 'Acesso a vendas e clientes'
    }
  ]

  async function handleQuickLogin(email: string, password: string) {
    setLoading(true)
    setError('')

    const { error } = await signIn(email, password)
    if (error) {
      setError(error.message)
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>ACR ERP - Desenvolvimento</CardTitle>
          <CardDescription>Use uma conta de teste para acessar o sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {testAccounts.map((account) => (
            <div key={account.email} className="space-y-2">
              <div className="p-3 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{account.role}</p>
                    <p className="text-sm text-muted-foreground">{account.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">{account.description}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleQuickLogin(account.email, account.password)}
                    disabled={loading}
                  >
                    Entrar
                  </Button>
                </div>
              </div>
            </div>
          ))}

          <Alert>
            <AlertDescription>
              <strong>Nota:</strong> Se as contas não funcionarem, verifique se os usuários foram criados no Supabase Dashboard &gt; Authentication &gt; Users.
            </AlertDescription>
          </Alert>

          <div className="pt-2 border-t">
            <Button 
              variant="outline" 
              className="w-full mb-2"
              onClick={() => window.location.href = '/create-users'}
            >
              Criar Novos Usuários
            </Button>
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={() => window.location.href = '/login'}
            >
              Usar Login Normal
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
