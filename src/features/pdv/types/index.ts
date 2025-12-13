export interface CartItem {
    product_id: number;
    name: string;
    code: string;
    barcode?: string;
    unit_price: number;
    quantity: number;
    subtotal: number;
    stock_quantity: number;
    discount_value?: number;
    discount_percent?: number;
}

export type PaymentMethod = 'credit' | 'debit' | 'cash' | 'pix';

export interface SalePayment {
    method: PaymentMethod;
    amount: number;
    installments?: number;
}

export interface Sale {
    id?: number;
    client_id?: string;
    items: CartItem[];
    payments: SalePayment[];
    subtotal: number;
    discount_value: number;
    delivery_fee: number;
    total: number;
    status: 'completed' | 'suspended' | 'cancelled';
    created_at?: string;
}
