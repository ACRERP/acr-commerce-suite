import { supabase } from '@/lib/supabase';

export const settingsService = {
    /**
     * Reseta todos os dados do sistema (OS, Clientes, Produtos, Financeiro, etc)
     * Mantém apenas configurações e usuários.
     */
    async resetSystemData() {
        const { error } = await supabase.rpc('reset_system_data');
        if (error) {
            console.error('Erro ao resetar sistema:', error);
            throw error;
        }
    }
};
