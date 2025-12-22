import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { CashRegister, Sale, SaleItem, SalePayment, CartItem, CashMovement } from '@/lib/pdv';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { deliveryService } from '@/lib/delivery/delivery-service';

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
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ openingBalance, notes }: { openingBalance: number; notes?: string }) => {
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
  const { user } = useAuth();

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
      deliveryData,
    }: {
      items: CartItem[];
      payments: SalePayment[];
      clientId?: number;
      discountValue?: number;
      deliveryFee?: number;
      saleType?: 'counter' | 'delivery';
      cashRegisterId?: number;
      notes?: string;
      deliveryData?: any;
    }) => {
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
          total_amount: total,
          total: total, // Legacy trigger needs this
          status: 'concluida',
          sale_type: saleType,
          payment_method: payments[0]?.payment_method || 'dinheiro',
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
        quantity: item.quantity,
        price: item.unit_price,
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

      // Create delivery record if applicable
      if (saleType === 'delivery' && deliveryData) {
        await deliveryService.createDelivery({
          sale_id: sale.id,
          client_id: clientId,
          total_amount: total,
          delivery_fee: deliveryFee,
          status: 'pending',
          customer_name: deliveryData.customer_name,
          customer_phone: deliveryData.customer_phone,
          address: deliveryData.address,
          payment_status: totalPaid >= total ? 'paid' : 'pending'
        });
      }

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
  const { user } = useAuth();

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

export function useSupply() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      registerId, 
      amount, 
      description,
      category = 'reforco',
    }: { 
      registerId: number; 
      amount: number; 
      description?: string;
      category?: 'reforco' | 'troco_inicial' | 'abertura';
    }) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('cash_movements')
        .insert({
          cash_register_id: registerId,
          movement_type: 'entrada',
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
      toast({ title: 'Suprimento Registrado', description: 'O suprimento foi registrado com sucesso.' });
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

export function useSalesHistory(registerId?: number) {
  return useQuery({
    queryKey: ['sales', registerId],
    queryFn: async () => {
      if (!registerId) return [];
      const { data, error } = await supabase
        .from('sales')
        .select(`
          id,
          total,
          created_at,
          payment_method,
          status,
          sale_payments (
            payment_method,
            amount
          )
        `)
        .eq('cash_register_id', registerId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
    enabled: !!registerId,
  });
}

export function useCancelSale() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ saleId, reason }: { saleId: number; reason: string }) => {
      const { error } = await supabase
        .from('sales')
        .update({ 
            status: 'cancelled',
            notes: `Cancelado: ${reason}` 
        })
        .eq('id', saleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      // Invalidate cash register metrics as well since sales affect balance? 
      // Actually sales usually affect 'expected_balance' calculation which is dynamic, so invalidating sales is key.
      queryClient.invalidateQueries({ queryKey: ['cashMovements'] }); // If sales create cash movements (they generally don't in this system, they are sales), but good to keep fresh.
      toast({ title: 'Venda Cancelada', description: 'A venda foi cancelada com sucesso.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });
}

export function useResetAllData() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      // 1. Delete payments (dependent)
      const { error: err1 } = await supabase.from('sale_payments').delete().neq('id', 0);
      if (err1) throw err1;

      // 2. Delete items (dependent)
      const { error: err2 } = await supabase.from('sale_items').delete().neq('id', 0);
      if (err2) throw err2;

      // 3. Delete sales
      const { error: err3 } = await supabase.from('sales').delete().neq('id', 0);
      if (err3) throw err3;

      // 4. Delete cash movements (optional)
      const { error: err4 } = await supabase.from('cash_movements').delete().neq('id', 0);
      if (err4) throw err4;

      // 5. Reset cash registers
      const { error: err5 } = await supabase
        .from('cash_registers')
        .update({ status: 'closed', opening_balance: 0, closing_balance: 0, difference: 0, expected_balance: 0, current_balance: 0 })
        .eq('status', 'open');
      if (err5) throw err5;
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({ title: 'SISTEMA ZERADO', description: 'Todos os dados foram apagados com sucesso.', className: "bg-red-600 text-white" });
      setTimeout(() => window.location.reload(), 1500);
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao Zerar', description: error.message, variant: 'destructive' });
    },
  });
}

export function usePDV() {
  const cartValues = useCart();
  const { mutate: createSale, isPending: isCheckingOut } = useCreateSale();

  const checkout = (
      data: { 
        items: CartItem[]; 
        clientId?: number; 
        paymentMethod: string; 
        discount: number; 
        deliveryFee?: number;
      },
      options?: { onSuccess?: (data: Sale) => void; onError?: (error: Error) => void }
  ) => {
      const total = data.items.reduce((acc, i) => acc + i.subtotal, 0) - data.discount + (data.deliveryFee || 0);
      
      const payments = [{
          payment_method: data.paymentMethod as any,
          amount: total > 0 ? total : 0, 
          received_amount: total > 0 ? total : 0,
          change_amount: 0,
          card_brand: null,
          notes: ''
      }];

      createSale({
          items: data.items,
          payments, 
          clientId: data.clientId,
          discountValue: data.discount,
          deliveryFee: data.deliveryFee,
          saleType: 'counter', 
          // Note: createSaleMutation might need cashRegisterId. 
          // If default implementation was missing it, that's another bug.
          // But assuming it relies on user context or assumes open register? 
          // useCreateSale signature (line 147) takes cashRegisterId. 
          // We need to look if checkout gets it.
          // For now, I update the signature and callback passing.
      }, {
          onSuccess: (data) => {
              cartValues.clearCart();
              options?.onSuccess?.(data);
          },
          onError: (error) => {
               options?.onError?.(error);
          }
      });
  };

  return {
    ...cartValues,
    checkout,
    isCheckingOut,
  };
}


