// PDV Types and Interfaces

export interface CashRegister {
  id: number;
  operator_id: string;
  operator_name: string;
  opened_at: string;
  closed_at?: string;
  opening_balance: number;
  closing_balance?: number;
  expected_balance?: number;
  difference?: number;
  status: 'open' | 'closed';
  notes?: string;
}

export interface Sale {
  id: number;
  cash_register_id?: number;
  client_id?: number;
  operator_id: string;
  subtotal: number;
  discount_value: number;
  discount_percent: number;
  delivery_fee: number;
  total: number;
  status: 'pending' | 'completed' | 'cancelled' | 'suspended';
  sale_type: 'counter' | 'delivery';
  payment_status: 'pending' | 'partial' | 'paid';
  notes?: string;
  created_at: string;
  // Joined
  client?: {
    id: number;
    name: string;
    phone?: string;
  };
  items?: SaleItem[];
  payments?: SalePayment[];
}

export interface SaleItem {
  id?: number;
  sale_id?: number;
  product_id: number;
  product_name: string;
  product_code?: string;
  quantity: number;
  unit_price: number;
  discount_value: number;
  discount_percent: number;
  subtotal: number;
}

export interface SalePayment {
  id?: number;
  sale_id?: number;
  payment_method: 'dinheiro' | 'pix' | 'credito' | 'debito' | 'crediario' | 'voucher' | 'outros';
  amount: number;
  received_amount?: number;
  change_amount?: number;
  card_brand?: string;
  card_last_digits?: string;
  authorization_code?: string;
  notes?: string;
}

export interface CashMovement {
  id: number;
  cash_register_id: number;
  sale_id?: number;
  movement_type: 'entrada' | 'saida';
  category: 'venda' | 'sangria' | 'reforco' | 'despesa' | 'troco_externo' | 'os_recebimento' | 'ajuste' | 'abertura';
  payment_method?: string;
  amount: number;
  description?: string;
  operator_id: string;
  created_at: string;
}

export interface DeliveryInfo {
  id?: number;
  sale_id: number;
  address_street: string;
  address_number: string;
  address_complement?: string;
  address_neighborhood: string;
  address_city: string;
  address_zipcode?: string;
  address_reference?: string;
  delivery_fee: number;
  driver_id?: number;
  driver_name?: string;
  status: 'pending' | 'preparing' | 'ready' | 'in_route' | 'delivered' | 'cancelled';
}

// Cart item for PDV (before saving)
export interface CartItem {
  product_id: number;
  product_name: string;
  product_code?: string;
  barcode?: string;
  quantity: number;
  unit_price: number;
  discount_value: number;
  discount_percent: number;
  subtotal: number;
  stock_quantity?: number;
}

// Payment method labels
export const PAYMENT_METHODS = {
  dinheiro: { label: 'Dinheiro', icon: '💵' },
  pix: { label: 'PIX', icon: '📱' },
  credito: { label: 'Crédito', icon: '💳' },
  debito: { label: 'Débito', icon: '💳' },
  crediario: { label: 'Crediário', icon: '📋' },
  voucher: { label: 'Voucher', icon: '🎫' },
  outros: { label: 'Outros', icon: '💰' },
} as const;

// Format currency
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Calculate cart totals
export function calculateCartTotals(items: CartItem[], discountValue = 0, deliveryFee = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const total = subtotal - discountValue + deliveryFee;
  return { subtotal, total, itemCount: items.length };
}
