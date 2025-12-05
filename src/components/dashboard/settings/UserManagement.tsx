import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  Users, 
  Settings, 
  Activity,
  Clock,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Key,
  Eye,
  EyeOff,
  UserPlus,
  UserX,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  useUserProfiles, 
  useUserRoles, 
  useUserRoleAssignments,
  useUserActivityLog,
  usePasswordReset,
  formatFullName,
  getRoleDisplayName,
  getActionDescription,
  formatPermissions,
  UserProfile
} from '@/hooks/useUserManagement';

export function UserManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: '',
    role_names: [] as string[],
    department: '',
    position: '',
  });

  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    department: '',
    position: '',
    bio: '',
  });

  const [resetForm, setResetForm] = useState({
    email: '',
  });

  const { profiles, createProfile, updateProfile, isCreating, isUpdating } = useUserProfiles();
  const { roles } = useUserRoles();
  const { assignments } = useUserRoleAssignments();
  const { logs } = useUserActivityLog();
  const { requestReset, isRequesting } = usePasswordReset();

  const handleCreateUser = async () => {
    if (createForm.password !== createForm.confirmPassword) {
      alert('As senhas não coincidem');
      return;
    }

    try {
      await createProfile({
        email: createForm.email,
        password: createForm.password,
        first_name: createForm.first_name,
        last_name: createForm.last_name,
        phone: createForm.phone,
        role_names: createForm.role_names,
        department: createForm.department,
        position: createForm.position,
      });
      
      setIsCreateDialogOpen(false);
      setCreateForm({
        email: '',
        password: '',
        confirmPassword: '',
        first_name: '',
        last_name: '',
        phone: '',
        role_names: [],
        department: '',
        position: '',
      });
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    try {
      await updateProfile({
        userId: selectedUser.user_id,
        ...editForm,
      });
      
      setIsEditDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleResetPassword = async () => {
    try {
      await requestReset(resetForm.email);
      
      setIsResetPasswordDialogOpen(false);
      setResetForm({ email: '' });
      alert('Email de redefinição de senha enviado com sucesso!');
    } catch (error) {
      console.error('Error requesting password reset:', error);
    }
  };

  const openEditDialog = (profile: UserProfile) => {
    setSelectedUser(profile);
    setEditForm({
      first_name: profile.first_name,
      last_name: profile.last_name,
      phone: profile.phone || '',
      department: profile.department || '',
      position: profile.position || '',
      bio: profile.bio || '',
    });
    setIsEditDialogOpen(true);
  };

  const getUserRoles = (userId: string) => {
    return assignments
      .filter(a => a.user_id === userId)
      .map(a => a.role?.display_name)
      .filter(Boolean);
  };

  const getUserStatus = (profile: UserProfile) => {
    const lastSignIn = profile.user?.last_sign_in_at;
    if (!lastSignIn) return { status: 'never', text: 'Nunca acessou', color: 'text-gray-600 bg-gray-100' };
    
    const daysSinceSignIn = Math.floor((new Date().getTime() - new Date(lastSignIn).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceSignIn <= 7) return { status: 'active', text: 'Ativo', color: 'text-green-600 bg-green-100' };
    if (daysSinceSignIn <= 30) return { status: 'inactive', text: 'Inativo', color: 'text-yellow-600 bg-yellow-100' };
    return { status: 'dormant', text: 'Inativo há muito tempo', color: 'text-red-600 bg-red-100' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gerenciamento de Usuários</h2>
          <p className="text-muted-foreground">Administre usuários, permissões e acessos</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsResetPasswordDialogOpen(true)}>
            <Key className="w-4 h-4 mr-2" />
            Redefinir Senha
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Novo Usuário
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profiles.length}</div>
            <p className="text-xs text-muted-foreground">
              {profiles.filter(p => p.user?.last_sign_in_at).length} já acessaram
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {profiles.filter(p => {
                const status = getUserStatus(p);
                return status.status === 'active';
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Acessaram nos últimos 7 dias
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Funções</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles.length}</div>
            <p className="text-xs text-muted-foreground">
              {roles.filter(r => r.is_system_role).length} do sistema
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Atividades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
            <p className="text-xs text-muted-foreground">
              Últimas 24 horas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="roles">Funções</TabsTrigger>
          <TabsTrigger value="activity">Atividades</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Usuários</CardTitle>
              <CardDescription>Gerencie todos os usuários do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profiles.map((profile) => {
                  const status = getUserStatus(profile);
                  const userRoles = getUserRoles(profile.user_id);
                  
                  return (
                    <Card key={profile.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4">
                            <Avatar>
                              <AvatarImage src={profile.avatar_url} />
                              <AvatarFallback>
                                {profile.first_name[0]}{profile.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{formatFullName(profile)}</h3>
                                <Badge className={status.color}>{status.text}</Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {profile.user?.email}
                                </span>
                                {profile.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {profile.phone}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(profile.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {userRoles.map((role, index) => (
                                  <Badge key={index} variant="outline">
                                    {role}
                                  </Badge>
                                ))}
                              </div>
                              {profile.department && (
                                <p className="text-sm text-muted-foreground">
                                  {profile.position && `${profile.position} • `}{profile.department}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEditDialog(profile)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Settings className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>Funções e Permissões</CardTitle>
              <CardDescription>Configure as funções e permissões do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roles.map((role) => (
                  <Card key={role.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{role.display_name}</h3>
                            <Badge variant={role.is_system_role ? 'default' : 'secondary'}>
                              {role.is_system_role ? 'Sistema' : 'Personalizada'}
                            </Badge>
                          </div>
                          {role.description && (
                            <p className="text-sm text-muted-foreground">{role.description}</p>
                          )}
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Permissões:</p>
                            <div className="flex flex-wrap gap-1">
                              {formatPermissions(role.permissions).map((permission, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {permission}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          {!role.is_system_role && (
                            <Button variant="outline" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Log de Atividades</CardTitle>
              <CardDescription>Acompanhe as atividades dos usuários no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logs.map((log) => (
                  <Card key={log.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{getActionDescription(log.action)}</h3>
                            <Badge variant="outline">{log.resource_type}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {log.user?.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </span>
                            {log.ip_address && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {log.ip_address}
                              </span>
                            )}
                          </div>
                          {Object.keys(log.details).length > 0 && (
                            <div className="text-sm">
                              <span className="font-medium">Detalhes:</span>
                              <pre className="mt-1 text-xs bg-gray-50 p-2 rounded">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
            <DialogDescription>
              Crie um novo usuário no sistema
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">Nome</Label>
                <Input
                  id="firstName"
                  value={createForm.first_name}
                  onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })}
                  placeholder="Nome"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Sobrenome</Label>
                <Input
                  id="lastName"
                  value={createForm.last_name}
                  onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })}
                  placeholder="Sobrenome"
                  required
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="email@exemplo.com"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="••••••••"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={createForm.confirmPassword}
                  onChange={(e) => setCreateForm({ ...createForm, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="department">Departamento</Label>
                <Input
                  id="department"
                  value={createForm.department}
                  onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                  placeholder="Vendas, Financeiro, etc."
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="position">Cargo</Label>
              <Input
                id="position"
                value={createForm.position}
                onChange={(e) => setCreateForm({ ...createForm, position: e.target.value })}
                placeholder="Gerente, Vendedor, etc."
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Funções</Label>
              <div className="space-y-2">
                {roles.filter(r => !r.is_system_role || r.name === 'user').map((role) => (
                  <div key={role.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={role.id}
                      checked={createForm.role_names.includes(role.name)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setCreateForm({
                            ...createForm,
                            role_names: [...createForm.role_names, role.name],
                          });
                        } else {
                          setCreateForm({
                            ...createForm,
                            role_names: createForm.role_names.filter(r => r !== role.name),
                          });
                        }
                      }}
                    />
                    <Label htmlFor={role.id} className="text-sm">
                      {role.display_name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={handleCreateUser}
              disabled={isCreating || !createForm.email || !createForm.password || !createForm.first_name || !createForm.last_name}
            >
              {isCreating ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="editFirstName">Nome</Label>
                <Input
                  id="editFirstName"
                  value={editForm.first_name}
                  onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editLastName">Sobrenome</Label>
                <Input
                  id="editLastName"
                  value={editForm.last_name}
                  onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="editPhone">Telefone</Label>
              <Input
                id="editPhone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="editDepartment">Departamento</Label>
                <Input
                  id="editDepartment"
                  value={editForm.department}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  placeholder="Vendas, Financeiro, etc."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editPosition">Cargo</Label>
                <Input
                  id="editPosition"
                  value={editForm.position}
                  onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                  placeholder="Gerente, Vendedor, etc."
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="editBio">Biografia</Label>
              <Textarea
                id="editBio"
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                placeholder="Informações adicionais sobre o usuário"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={handleEditUser}
              disabled={isUpdating}
            >
              {isUpdating ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Redefinir Senha</DialogTitle>
            <DialogDescription>
              Envie um email de redefinição de senha para o usuário
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="resetEmail">Email do Usuário</Label>
              <Input
                id="resetEmail"
                type="email"
                value={resetForm.email}
                onChange={(e) => setResetForm({ ...resetForm, email: e.target.value })}
                placeholder="email@exemplo.com"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={handleResetPassword}
              disabled={!resetForm.email || isRequesting}
            >
              {isRequesting ? 'Enviando...' : 'Enviar Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
