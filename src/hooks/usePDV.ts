import { create } from 'zustand';
import { Product } from './useProducts';

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
}

export interface SalePayment {
  method: string;
  amount: number;
}

interface PDVState {
  items: CartItem[];
  clientId: number;
  clientName: string;
  discountValue: number;
  deliveryFee: number;
  sellerId: string;
  sellerName: string;
  payments: SalePayment[];
  saleType: 'counter' | 'delivery';
  isCheckingOut: boolean;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  setClient: (id: number, name: string) => void;
  setDiscount: (value: number) => void;
  setDeliveryFee: (value: number) => void;
  setSeller: (id: string, name: string) => void;
  addPayment: (payment: SalePayment) => void;
  clearPayments: () => void;
  setSaleType: (type: 'counter' | 'delivery') => void;
  setCheckingOut: (value: boolean) => void;
  getSubtotal: () => number;
  getTotal: () => number;
}

export const usePDV = create<PDVState>((set, get) => ({
  items: [],
  clientId: 0,
  clientName: '',
  discountValue: 0,
  deliveryFee: 0,
  sellerId: '',
  sellerName: '',
  payments: [],
  saleType: 'counter',
  isCheckingOut: false,
  addItem: (product, quantity = 1) => {
    set((state) => {
      const existing = state.items.find((i) => i.product.id === product.id);
      if (existing) {
        return { items: state.items.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i) };
      }
      return { items: [...state.items, { product, quantity, unitPrice: product.sale_price, discount: 0 }] };
    });
  },
  removeItem: (productId) => set((state) => ({ items: state.items.filter((i) => i.product.id !== productId) })),
  updateQuantity: (productId, quantity) => set((state) => ({ items: state.items.map((i) => i.product.id === productId ? { ...i, quantity } : i) })),
  clearCart: () => set({ items: [], clientId: 0, clientName: '', discountValue: 0, deliveryFee: 0, payments: [] }),
  setClient: (id, name) => set({ clientId: id, clientName: name }),
  setDiscount: (value) => set({ discountValue: value }),
  setDeliveryFee: (value) => set({ deliveryFee: value }),
  setSeller: (id, name) => set({ sellerId: id, sellerName: name }),
  addPayment: (payment) => set((state) => ({ payments: [...state.payments, payment] })),
  clearPayments: () => set({ payments: [] }),
  setSaleType: (type) => set({ saleType: type }),
  setCheckingOut: (value) => set({ isCheckingOut: value }),
  getSubtotal: () => get().items.reduce((sum, i) => sum + (i.unitPrice - i.discount) * i.quantity, 0),
  getTotal: () => get().getSubtotal() - get().discountValue + get().deliveryFee,
}));
