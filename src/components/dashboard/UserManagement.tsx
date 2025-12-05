import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, 
  Shield, 
  Search, 
  Edit, 
  Trash2, 
  UserPlus, 
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser, updateUserMetadata } from '@/lib/supabaseClient';

type UserRole = 'admin' | 'vendas' | 'financeiro' | 'estoque';

interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  created_at: string;
  last_sign_in_at?: string;
  status: 'active' | 'inactive';
}

const ROLE_DESCRIPTIONS = {
  admin: {
    name: 'Administrador',
    description: 'Acesso total a todas as funcionalidades do sistema',
    color: 'bg-purple-100 text-purple-800',
    icon: Shield,
  },
  vendas: {
    name: 'Vendas',
    description: 'Gerencia vendas, clientes e produtos',
    color: 'bg-blue-100 text-blue-800',
    icon: Users,
  },
  financeiro: {
    name: 'Financeiro',
    description: 'Gerencia contas a pagar/receber e relatórios financeiros',
    color: 'bg-green-100 text-green-800',
    icon: Shield,
  },
  estoque: {
    name: 'Estoque',
    description: 'Gerencia produtos e controle de estoque',
    color: 'bg-orange-100 text-orange-800',
    icon: Shield,
  },
};

export function UserManagement() {
  const { profile, hasRole } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    role: 'vendas' as UserRole,
    notes: '',
  });

  // Mock data for now - in real implementation, fetch from Supabase
  const mockUsers: User[] = [
    {
      id: '1',
      email: 'admin@acrcommerce.com',
      name: 'Administrador',
      role: 'admin',
      created_at: '2024-01-01T00:00:00Z',
      last_sign_in_at: '2024-12-04T10:00:00Z',
      status: 'active',
    },
    {
      id: '2',
      email: 'vendedor@acrcommerce.com',
      name: 'João Vendedor',
      role: 'vendas',
      created_at: '2024-01-15T00:00:00Z',
      last_sign_in_at: '2024-12-04T09:00:00Z',
      status: 'active',
    },
    {
      id: '3',
      email: 'financeiro@acrcommerce.com',
      name: 'Maria Financeiro',
      role: 'financeiro',
      created_at: '2024-02-01T00:00:00Z',
      last_sign_in_at: '2024-12-03T16:00:00Z',
      status: 'active',
    },
    {
      id: '4',
      email: 'estoque@acrcommerce.com',
      name: 'Pedro Estoque',
      role: 'estoque',
      created_at: '2024-02-15T00:00:00Z',
      last_sign_in_at: '2024-12-02T14:00:00Z',
      status: 'active',
    },
  ];

  // Only admins can access this page
  if (!hasRole('admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Acesso restrito. Apenas administradores podem gerenciar usuários.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      role: user.role,
      notes: '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUserRole = async () => {
    if (!selectedUser) return;

    try {
      // In real implementation, update user role in Supabase
      const { error } = await updateUserMetadata({
        role: editForm.role,
        updated_by: profile?.email,
        updated_at: new Date().toISOString(),
        notes: editForm.notes,
      });

      if (error) {
        throw error;
      }

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === selectedUser.id
            ? { ...user, role: editForm.role }
            : user
        )
      );

      toast({
        title: 'Sucesso',
        description: `Cargo do usuário atualizado para ${ROLE_DESCRIPTIONS[editForm.role].name}`,
      });

      setIsEditDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar cargo do usuário. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    try {
      // In real implementation, deactivate user in Supabase
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId
            ? { ...user, status: 'inactive' as const }
            : user
        )
      );

      toast({
        title: 'Sucesso',
        description: 'Usuário desativado com sucesso',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao desativar usuário. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const getRoleInfo = (role: UserRole) => ROLE_DESCRIPTIONS[role];
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciamento de Usuários</h2>
          <p className="text-muted-foreground">Gerencie os usuários e permissões do sistema</p>
        </div>
        
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(ROLE_DESCRIPTIONS).map(([role, info]) => {
          const Icon = info.icon;
          const count = mockUsers.filter(user => user.role === role).length;
          
          return (
            <Card key={role}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{info.name}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                  <div className={`p-2 rounded-full ${info.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por email ou nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={roleFilter} onValueChange={(value: UserRole | 'all') => setRoleFilter(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por cargo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os cargos</SelectItem>
                {Object.entries(ROLE_DESCRIPTIONS).map(([role, info]) => (
                  <SelectItem key={role} value={role}>
                    {info.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Último Acesso</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const roleInfo = getRoleInfo(user.role);
                const Icon = roleInfo.icon;
                
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.name || user.email}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={roleInfo.color}>
                        <Icon className="h-3 w-3 mr-1" />
                        {roleInfo.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                        {user.status === 'active' ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ativo
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Inativo
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'Nunca'}
                    </TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        {user.id !== profile?.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeactivateUser(user.id)}
                            disabled={user.status === 'inactive'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <Label>Usuário</Label>
                <p className="text-sm text-gray-600">{selectedUser.email}</p>
              </div>
              
              <div>
                <Label htmlFor="role">Cargo</Label>
                <Select
                  value={editForm.role}
                  onValueChange={(value: UserRole) => setEditForm(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_DESCRIPTIONS).map(([role, info]) => (
                      <SelectItem key={role} value={role}>
                        {info.name} - {info.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="notes">Notas da alteração</Label>
                <Textarea
                  id="notes"
                  placeholder="Motivo da alteração de cargo..."
                  value={editForm.notes}
                  onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdateUserRole}>
                  Atualizar Cargo
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
