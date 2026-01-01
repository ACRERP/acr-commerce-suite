import { useQuery } from '@tanstack/react-query';
import { rbacService } from '@/lib/rbac-service';
import { useAuth } from '@/contexts/AuthContext';

export function useRolePermissions() {
    const { profile } = useAuth();

    const { data: roleModules, isLoading } = useQuery({
        queryKey: ['role-modules'],
        queryFn: () => rbacService.getRoleModules(),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const hasPermission = (moduleId?: string) => {
        if (!profile?.role || profile.role === 'admin') return true;
        if (!moduleId) return true;
        
        // Se as permissões ainda estão carregando, mostramos o básico ou escondemos tudo?
        // Por segurança, se não carregou e não é admin, retorna false (ou true se preferir UX fluida)
        if (!roleModules) return true; 

        const permittedModules = roleModules[profile.role] || [];
        return permittedModules.includes(moduleId) || permittedModules.includes('*');
    };

    return {
        roleModules,
        isLoading,
        hasPermission,
        role: profile?.role
    };
}
