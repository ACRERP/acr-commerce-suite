import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface QuoteItem {
  id?: number;
  product_id: number;
  product_name?: string; // Loaded from join
  product_code?: string; // Loaded from join
  quantity: number;
  unit_price: number;
  discount_amount: number;
  total: number;
}

export interface Quote {
  id: number;
  client_id: number;
  client_name?: string; // Loaded from join
  user_id: string;
  user_name?: string; // Loaded from join
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';
  total_amount: number;
  valid_until?: string;
  payment_terms?: string;
  notes?: string;
  labor_cost?: number; // Added column
  created_at: string;
  updated_at: string;
  items?: QuoteItem[];
}

export function useQuotes() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['quotes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          clients (name),
          quote_items (
            quantity,
            unit_price,
            total,
            products (name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data.map((q: any) => ({
        ...q,
        client_name: q.clients?.name,
        user_name: 'Usuário' // Placeholder until profile relation is fixed
      })) as Quote[];
    },
    enabled: !!user,
  });
}

export function useQuote(id: number | null) {
  return useQuery({
    queryKey: ['quote', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          clients (name),
          quote_items (
            *,
            products (name, code)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      const formattedData: Quote = {
        ...data,
        client_name: data.clients?.name,
        items: data.quote_items.map((item: any) => ({
          ...item,
          product_name: item.products?.name,
          product_code: item.products?.code
        }))
      };

      return formattedData;
    },
    enabled: !!id,
  });
}

export function useCreateQuote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (quote: Partial<Quote> & { items: Partial<QuoteItem>[] }) => {
      if (!user) throw new Error('Usuário não autenticado');

      // 1. Create Quote Header
      const { data: newQuote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          client_id: quote.client_id,
          user_id: user.id,
          status: 'draft',
          total_amount: quote.total_amount,
          valid_until: quote.valid_until,
          payment_terms: quote.payment_terms,
          notes: quote.notes,
          labor_cost: quote.labor_cost
        })
        .select()
        .single();

      if (quoteError) throw quoteError;

      // 2. Create Items
      if (quote.items && quote.items.length > 0) {
        const itemsToInsert = quote.items.map(item => ({
          quote_id: newQuote.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_amount: item.discount_amount,
          total: item.total
        }));

        const { error: itemsError } = await supabase
          .from('quote_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      return newQuote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast({ title: 'Orçamento Criado', description: 'O orçamento foi salvo como rascunho.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  });
}

export function useUpdateQuote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data, items }: { id: number, data: Partial<Quote>, items?: Partial<QuoteItem>[] }) => {
      // 1. Update Quote Header
      const { error: quoteError } = await supabase
        .from('quotes')
        .update({
          client_id: data.client_id,
          total_amount: data.total_amount,
          valid_until: data.valid_until,
          payment_terms: data.payment_terms,
          notes: data.notes,
          labor_cost: data.labor_cost
        })
        .eq('id', id);

      if (quoteError) throw quoteError;

      // 2. Replace Items (Delete all and re-insert)
      if (items) {
        const { error: deleteError } = await supabase
          .from('quote_items')
          .delete()
          .eq('quote_id', id);
        
        if (deleteError) throw deleteError;

        if (items.length > 0) {
            const itemsToInsert = items.map(item => ({
                quote_id: id,
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                discount_amount: item.discount_amount,
                total: item.total
            }));

            const { error: insertError } = await supabase
             .from('quote_items')
             .insert(itemsToInsert);
            
             if (insertError) throw insertError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast({ title: 'Orçamento Atualizado', description: 'As alterações foram salvas.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  });
}

export function useDeleteQuote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      // Items are deleted via Cascade usually, but let's be safe or rely on DB constraint
      // Supabase default FK is NO ACTION usually, unless specified. 
      // Safe way: Delete items first.
      await supabase.from('quote_items').delete().eq('quote_id', id);
      
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast({ title: 'Orçamento Excluído', description: 'O registro foi removido.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  });
}

export function useDuplicateQuote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (quoteId: number) => {
      const { data, error } = await supabase.rpc('duplicate_quote', { p_original_quote_id: quoteId });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast({ title: 'Orçamento Duplicado', description: 'Uma cópia foi criada com sucesso.' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao duplicar', description: error.message, variant: 'destructive' });
    }
  });
}

export function useUpdateQuoteStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number, status: Quote['status'] }) => {
      const { error } = await supabase
        .from('quotes')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast({ title: 'Status Atualizado', description: 'O status do orçamento foi alterado.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  });
}

export function useConvertQuote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (quoteId: number) => {
      const { data, error } = await supabase
        .rpc('convert_quote_to_sale', { p_quote_id: quoteId });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['sales-kanban'] });
      toast({
        title: 'Orçamento Aprovado!',
        description: 'Venda criada e estoque atualizado. Verifique no Kanban.',
      });
    },
    onError: (error: any) => {
        console.error("Convert Error:", error);
      toast({
        title: 'Erro ao converter',
        description: error.message || 'Falha ao processar.',
        variant: 'destructive',
      });
    },
  });
}
