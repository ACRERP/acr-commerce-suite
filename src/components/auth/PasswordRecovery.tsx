import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mail, 
  ArrowLeft, 
  CheckCircle, 
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { usePasswordReset } from '@/hooks/useUserManagement';

export function PasswordRecovery() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const { requestReset, verifyToken, resetPassword, isRequesting, isVerifying, isResetting } = usePasswordReset();

  React.useEffect(() => {
    if (token) {
      setStep('reset');
    }
  }, [token]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      await requestReset(email);
      setMessage({
        type: 'success',
        text: 'Email de redefinição de senha enviado! Verifique sua caixa de entrada.'
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Erro ao solicitar redefinição de senha. Verifique o email informado.'
      });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({
        type: 'error',
        text: 'As senhas não coincidem.'
      });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({
        type: 'error',
        text: 'A senha deve ter pelo menos 6 caracteres.'
      });
      return;
    }

    try {
      await resetPassword({ token: token!, newPassword });
      setMessage({
        type: 'success',
        text: 'Senha redefinida com sucesso! Você pode fazer login agora.'
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Token inválido ou expirado. Solicite uma nova redefinição de senha.'
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Recuperação de Senha
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 'request' 
              ? 'Digite seu email para receber um link de redefinição'
              : 'Crie sua nova senha'
            }
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {step === 'request' ? (
                <>
                  <Mail className="w-5 h-5" />
                  Solicitar Redefinição
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Nova Senha
                </>
              )}
            </CardTitle>
            <CardDescription>
              {step === 'request' 
                ? 'Enviaremos um link para seu email'
                : 'Digite sua nova senha abaixo'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {message && (
              <Alert className={`mb-4 ${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                <div className="flex items-center gap-2">
                  {message.type === 'error' ? (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
                    {message.text}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {step === 'request' ? (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    disabled={isRequesting}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!email || isRequesting}
                >
                  {isRequesting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar Link de Redefinição'
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Digite sua nova senha"
                    required
                    disabled={isResetting}
                  />
                  <p className="text-xs text-gray-500">
                    Mínimo de 6 caracteres
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme sua nova senha"
                    required
                    disabled={isResetting}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!newPassword || !confirmPassword || isResetting}
                >
                  {isResetting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Redefinindo...
                    </>
                  ) : (
                    'Redefinir Senha'
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para o Login
              </Link>
            </div>
          </CardContent>
        </Card>

        {step === 'request' && (
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Não recebeu o email? Verifique sua pasta de spam ou lixeira.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
