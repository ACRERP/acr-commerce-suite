import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Users,
    UserCheck,
    DollarSign,
    Calendar,
    Star,
    Plus,
    MessageSquare,
    ChevronRight,
    Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rbacService, UserProfile, UserRole } from "@/lib/rbac-service";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function TeamManagementPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);

    const { data: members, isLoading } = useQuery({
        queryKey: ['team-members'],
        queryFn: () => rbacService.listUsers()
    });

    const updateRoleMutation = useMutation({
        mutationFn: ({ id, role }: { id: string, role: UserRole }) => rbacService.updateUserRole(id, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['team-members'] });
            toast({ title: "Sucesso", description: "Cargo atualizado com sucesso!" });
            setIsRoleDialogOpen(false);
        },
        onError: () => {
            toast({ title: "Erro", description: "Falha ao atualizar cargo.", variant: "destructive" });
        }
    });

    return (
        <MainLayout>
            <div className="w-full max-w-[95%] mx-auto px-4 py-8 space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-400 dark:to-green-400 tracking-tight mb-2">
                            Minha Equipe
                        </h1>
                        <p className="text-lg text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                            <Users className="w-5 h-5 text-emerald-500" />
                            Gestão de profissionais, comissões e permissões de acesso
                        </p>
                    </div>
                </div>

                {/* Team Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Membros', value: members?.length || 0, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-100' },
                        { label: 'Ativos', value: members?.filter(m => m.status === 'active').length || 0, icon: UserCheck, color: 'text-green-600', bg: 'bg-green-100' },
                        { label: 'Vendedores', value: members?.filter(m => m.role === 'vendas').length || 0, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-100' },
                        { label: 'Admins', value: members?.filter(m => m.role === 'admin').length || 0, icon: ShieldCheck, color: 'text-purple-600', bg: 'bg-purple-100' },
                    ].map((stat, i) => (
                        <Card key={i} className="border-none shadow-xl">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-neutral-500">{stat.label}</p>
                                        <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                                    </div>
                                    <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                                        <stat.icon className="w-6 h-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Professionals List */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-neutral-500 font-medium">Carregando equipe...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {members?.map((member) => (
                            <Card key={member.id} className="border-none shadow-xl overflow-hidden group">
                                <CardContent className="p-0 flex">
                                    <div className="w-32 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-4xl font-black text-neutral-300 dark:text-neutral-700">
                                        {member.name?.charAt(0) || member.email.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 p-6 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-xl font-bold text-neutral-900 group-hover:text-emerald-600 transition-colors uppercase italic">{member.name || 'Sem Nome'}</h3>
                                                <p className="text-sm text-neutral-500">{member.email}</p>
                                            </div>
                                            <Badge variant={member.status === 'active' ? 'secondary' : 'outline'} className="capitalize bg-emerald-100 text-emerald-700 border-none">
                                                {member.role}
                                            </Badge>
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1 gap-2 border-emerald-200 hover:bg-emerald-50"
                                                onClick={() => {
                                                    setSelectedUser(member);
                                                    setIsRoleDialogOpen(true);
                                                }}
                                            >
                                                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                                Alterar Cargo/Permissões
                                            </Button>
                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Role Change Dialog */}
            <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Alterar Cargo: {selectedUser?.name || selectedUser?.email}</DialogTitle>
                        <DialogDescription>
                            Defina o nível de acesso deste colaborador no sistema.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Select
                            defaultValue={selectedUser?.role}
                            onValueChange={(value: UserRole) => {
                                if (selectedUser) {
                                    updateRoleMutation.mutate({ id: selectedUser.id, role: value });
                                }
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um cargo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">Administrador (Acesso Total)</SelectItem>
                                <SelectItem value="vendas">Vendas (PDV, Clientes, Vendas)</SelectItem>
                                <SelectItem value="financeiro">Financeiro (Contas, Relatórios)</SelectItem>
                                <SelectItem value="estoque">Estoque (Produtos, Compras)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}

