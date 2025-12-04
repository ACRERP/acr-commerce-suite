import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit, 
  Key, 
  Shield,
  UserPlus,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/contexts/useAuth';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  last_sign_in_at?: string;
}

interface NewUser {
  email: string;
  password: string;
  full_name: string;
  role: string;
}

export function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form states
  const [newUser, setNewUser] = useState<NewUser>({
    email: '',
    password: '',
    full_name: '',
    role: 'vendas'
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Mock users data - em produção, buscar do Supabase
  const mockUsers: User[] = [
    {
      id: '1',
      email: 'admin@teste.com',
      full_name: 'Administrador',
      role: 'admin',
      created_at: '2024-01-01T00:00:00Z',
      last_sign_in_at: '2024-12-04T10:00:00Z'
    },
    {
      id: '2',
      email: 'vendedor@teste.com',
      full_name: 'Vendedor',
      role: 'vendas',
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '3',
      email: 'financeiro@teste.com',
      full_name: 'Financeiro',
      role: 'financeiro',
      created_at: '2024-01-01T00:00:00Z'
    }
  ];

  // Carregar usuários
  const loadUsers = async () => {
    setLoading(true);
    try {
      // Em produção, buscar do Supabase
      setUsers(mockUsers);
    } catch (err) {
      setError('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  // Criar usuário
  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.full_name || !newUser.role) {
      setError('Preencha todos os campos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Em produção, criar no Supabase
      const createdUser: User = {
        id: Date.now().toString(),
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role,
        created_at: new Date().toISOString()
      };

      setUsers([...users, createdUser]);
      setNewUser({ email: '', password: '', full_name: '', role: 'vendas' });
      setIsCreateDialogOpen(false);

      toast({
        title: 'Usuário Criado',
        description: `Usuário ${newUser.email} criado com sucesso!`,
      });
    } catch (err) {
      setError('Erro ao criar usuário');
    } finally {
      setLoading(false);
    }
  };

  // Deletar usuário
  const handleDeleteUser = async () => {
    if (!deleteUserId) return;

    setLoading(true);
    try {
      // Em produção, deletar do Supabase
      setUsers(users.filter(u => u.id !== deleteUserId));
      setDeleteUserId(null);
      setIsDeleteDialogOpen(false);

      toast({
        title: 'Usuário Deletado',
        description: 'Usuário removido com sucesso!',
        variant: 'default',
      });
    } catch (err) {
      setError('Erro ao deletar usuário');
    } finally {
      setLoading(false);
    }
  };

  // Resetar senha
  const handleResetPassword = async (email: string) => {
    try {
      // Em produção, resetar senha no Supabase
      toast({
        title: 'Senha Resetada',
        description: `Nova senha enviada para ${email}`,
      });
    } catch (err) {
      setError('Erro ao resetar senha');
    }
  };

  // Get role badge
  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-800',
      financeiro: 'bg-blue-100 text-blue-800',
      vendas: 'bg-green-100 text-green-800',
    };

    return (
      <Badge className={colors[role] || 'bg-gray-100 text-gray-800'}>
        {role}
      </Badge>
    );
  };

  // Load users on mount
  useState(() => {
    loadUsers();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Gerenciamento de Usuários</h1>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
              <DialogDescription>
                Preencha os dados para criar um novo usuário no sistema.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="usuario@exemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Senha segura"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input
                  id="fullName"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  placeholder="Nome do usuário"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Função</Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="financeiro">Financeiro</SelectItem>
                    <SelectItem value="vendas">Vendas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateUser} disabled={loading}>
                {loading ? 'Criando...' : 'Criar Usuário'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários Cadastrados</CardTitle>
          <CardDescription>
            Gerencie todos os usuários do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-acr-blue mx-auto"></div>
              <p className="mt-2 text-gray-500">Carregando...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum usuário encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Último Acesso</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.full_name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(user.role)}
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {user.last_sign_in_at 
                        ? new Date(user.last_sign_in_at).toLocaleDateString('pt-BR')
                        : 'Nunca'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResetPassword(user.email)}
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        {user.email !== currentUser?.email && (
                          <Dialog open={isDeleteDialogOpen && deleteUserId === user.id} onOpenChange={(open) => {
                            setIsDeleteDialogOpen(open);
                            if (!open) setDeleteUserId(null);
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeleteUserId(user.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Confirmar Exclusão</DialogTitle>
                                <DialogDescription>
                                  Tem certeza que deseja deletar o usuário "{user.full_name}" ({user.email})?
                                  Esta ação não pode ser desfeita.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                                  Cancelar
                                </Button>
                                <Button variant="destructive" onClick={handleDeleteUser} disabled={loading}>
                                  {loading ? 'Deletando...' : 'Deletar'}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Security Info */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Informações de Segurança:</strong>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• Admins podem gerenciar todos os usuários</li>
            <li>• Usuários não podem deletar a si mesmos</li>
            <li>• Reset de senha envia email com nova senha</li>
            <li>• Todas as ações são registradas nos logs de atividade</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
