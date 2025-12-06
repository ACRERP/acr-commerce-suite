import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { CashRegister, Sale, SaleItem, SalePayment, CartItem, CashMovement } from '@/lib/pdv';
import { useToast } from '@/hooks/use-toast';

// =====================================================
// CASH REGISTER HOOKS
// =====================================================

export function useOpenCashRegister() {
  return useQuery({
    queryKey: ['openCashRegister'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cash_registers')
        .select('*')
        .eq('status', 'open')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as CashRegister | null;
    },
  });
}

export function useOpenCash() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ openingBalance, notes }: { openingBalance: number; notes?: string }) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('cash_registers')
        .insert({
          operator_id: user.id,
          operator_name: user.email || 'Operador',
          opening_balance: openingBalance,
          status: 'open',
          notes,
        })
        .select()
        .single();

      if (error) throw error;

      // Create opening movement
      await supabase.from('cash_movements').insert({
        cash_register_id: data.id,
        movement_type: 'entrada',
        category: 'abertura',
        payment_method: 'dinheiro',
        amount: openingBalance,
        description: 'Abertura de caixa',
        operator_id: user.id,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['openCashRegister'] });
      toast({ title: 'Caixa Aberto', description: 'O caixa foi aberto com sucesso.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });
}

export function useCloseCash() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      registerId, 
      closingBalance, 
      notes 
    }: { 
      registerId: number; 
      closingBalance: number; 
      notes?: string;
    }) => {
      // Calculate expected balance
      const { data: movements } = await supabase
        .from('cash_movements')
        .select('movement_type, amount, payment_method')
        .eq('cash_register_id', registerId);

      let expectedCash = 0;
      movements?.forEach(m => {
        if (m.payment_method === 'dinheiro') {
          expectedCash += m.movement_type === 'entrada' ? m.amount : -m.amount;
        }
      });

      const difference = closingBalance - expectedCash;

      const { data, error } = await supabase
        .from('cash_registers')
        .update({
          closed_at: new Date().toISOString(),
          closing_balance: closingBalance,
          expected_balance: expectedCash,
          difference,
          status: 'closed',
          notes,
        })
        .eq('id', registerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['openCashRegister'] });
      toast({ title: 'Caixa Fechado', description: 'O caixa foi fechado com sucesso.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });
}

// =====================================================
// SALES HOOKS
// =====================================================

export function useCreateSale() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      items, 
      payments, 
      clientId, 
      discountValue = 0,
      deliveryFee = 0,
      saleType = 'counter',
      cashRegisterId,
      notes,
    }: {
      items: CartItem[];
      payments: SalePayment[];
      clientId?: number;
      discountValue?: number;
      deliveryFee?: number;
      saleType?: 'counter' | 'delivery';
      cashRegisterId?: number;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      const total = subtotal - discountValue + deliveryFee;
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

      // Create sale
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          cash_register_id: cashRegisterId,
          client_id: clientId,
          operator_id: user.id,
          subtotal,
          discount_value: discountValue,
          delivery_fee: deliveryFee,
          total,
          status: 'completed',
          sale_type: saleType,
          payment_status: totalPaid >= total ? 'paid' : 'partial',
          notes,
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items
      const itemsToInsert = items.map(item => ({
        sale_id: sale.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_code: item.product_code,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_value: item.discount_value,
        discount_percent: item.discount_percent,
        subtotal: item.subtotal,
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // Create payments
      const paymentsToInsert = payments.map(p => ({
        sale_id: sale.id,
        payment_method: p.payment_method,
        amount: p.amount,
        received_amount: p.received_amount,
        change_amount: p.change_amount,
        card_brand: p.card_brand,
        notes: p.notes,
      }));

      const { error: paymentsError } = await supabase
        .from('sale_payments')
        .insert(paymentsToInsert);

      if (paymentsError) throw paymentsError;

      return sale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast({ 
        title: '✅ Venda Finalizada!', 
        description: 'A venda foi registrada com sucesso.' 
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Erro na Venda', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });
}

// =====================================================
// CART HOOK (Local State)
// =====================================================

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [clientId, setClientId] = useState<number | undefined>();
  const [clientName, setClientName] = useState<string>('Consumidor');
  const [discountValue, setDiscountValue] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);

  const addItem = useCallback((product: {
    id: number;
    name: string;
    code?: string;
    barcode?: string;
    sale_price: number;
    stock_quantity?: number;
  }) => {
    setItems(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product_id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.unit_price - item.discount_value,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          product_name: product.name,
          product_code: product.code,
          barcode: product.barcode,
          quantity: 1,
          unit_price: product.sale_price,
          discount_value: 0,
          discount_percent: 0,
          subtotal: product.sale_price,
          stock_quantity: product.stock_quantity,
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.product_id === productId
          ? {
              ...item,
              quantity,
              subtotal: quantity * item.unit_price - item.discount_value,
            }
          : item
      )
    );
  }, []);

  const removeItem = useCallback((productId: number) => {
    setItems(prev => prev.filter(item => item.product_id !== productId));
  }, []);

  const applyItemDiscount = useCallback((productId: number, discount: number, isPercent = false) => {
    setItems(prev =>
      prev.map(item => {
        if (item.product_id !== productId) return item;
        const discountValue = isPercent ? (item.unit_price * item.quantity * discount) / 100 : discount;
        return {
          ...item,
          discount_value: discountValue,
          discount_percent: isPercent ? discount : 0,
          subtotal: item.unit_price * item.quantity - discountValue,
        };
      })
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setClientId(undefined);
    setClientName('Consumidor');
    setDiscountValue(0);
    setDeliveryFee(0);
  }, []);

  const setClient = useCallback((id: number | undefined, name: string) => {
    setClientId(id);
    setClientName(name);
  }, []);

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const total = subtotal - discountValue + deliveryFee;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items,
    clientId,
    clientName,
    discountValue,
    deliveryFee,
    subtotal,
    total,
    itemCount,
    addItem,
    updateQuantity,
    removeItem,
    applyItemDiscount,
    setDiscount: setDiscountValue,
    setDiscountValue,
    setDeliveryFee,
    setClient,
    clearCart,
  };
}

// =====================================================
// CASH MOVEMENTS
// =====================================================

export function useWithdrawal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      registerId, 
      amount, 
      description,
      category = 'sangria',
    }: { 
      registerId: number; 
      amount: number; 
      description?: string;
      category?: 'sangria' | 'despesa' | 'troco_externo';
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('cash_movements')
        .insert({
          cash_register_id: registerId,
          movement_type: 'saida',
          category,
          payment_method: 'dinheiro',
          amount,
          description,
          operator_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashMovements'] });
      toast({ title: 'Sangria Registrada', description: 'A retirada foi registrada com sucesso.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });
}

export function useCashMovements(registerId?: number) {
  return useQuery({
    queryKey: ['cashMovements', registerId],
    queryFn: async () => {
      if (!registerId) return [];
      const { data, error } = await supabase
        .from('cash_movements')
        .select('*')
        .eq('cash_register_id', registerId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as CashMovement[];
    },
    enabled: !!registerId,
  });
}
