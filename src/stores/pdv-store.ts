// PDV Store - Zustand (Alta Performance)
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image_url?: string;
  stock: number;
  barcode?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
  discount: number;
}

export interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
}

export type PaymentMethod = 'dinheiro' | 'debito' | 'credito' | 'pix' | 'vale';

interface PDVState {
  // Carrinho
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  updateDiscount: (productId: number, discount: number) => void;
  clearCart: () => void;

  // Totais
  subtotal: number;
  totalDiscount: number;
  total: number;
  calculateTotals: () => void;

  // Cliente
  customer: Customer | null;
  setCustomer: (customer: Customer | null) => void;

  // Pagamento
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  amountPaid: number;
  setAmountPaid: (amount: number) => void;
  change: number;
  calculateChange: () => void;

  // Busca e Filtros
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;

  // UI State
  isPaymentModalOpen: boolean;
  setPaymentModalOpen: (open: boolean) => void;
}

export const usePDVStore = create<PDVState>()(
  devtools(
    persist(
      (set, get) => ({
        // Estado inicial
        cart: [],
        subtotal: 0,
        totalDiscount: 0,
        total: 0,
        customer: null,
        paymentMethod: 'dinheiro',
        amountPaid: 0,
        change: 0,
        searchTerm: '',
        selectedCategory: 'TODOS',
        isPaymentModalOpen: false,

        // Ações do Carrinho
        addToCart: (product, quantity = 1) => {
          const { cart } = get();
          const existingItem = cart.find(item => item.product.id === product.id);

          if (existingItem) {
            // Atualizar quantidade
            set({
              cart: cart.map(item =>
                item.product.id === product.id
                  ? {
                      ...item,
                      quantity: item.quantity + quantity,
                      subtotal: (item.quantity + quantity) * item.product.price
                    }
                  : item
              )
            });
          } else {
            // Adicionar novo item
            set({
              cart: [
                ...cart,
                {
                  product,
                  quantity,
                  subtotal: product.price * quantity,
                  discount: 0
                }
              ]
            });
          }

          get().calculateTotals();
        },

        removeFromCart: (productId) => {
          set(state => ({
            cart: state.cart.filter(item => item.product.id !== productId)
          }));
          get().calculateTotals();
        },

        updateQuantity: (productId, quantity) => {
          if (quantity <= 0) {
            get().removeFromCart(productId);
            return;
          }

          set(state => ({
            cart: state.cart.map(item =>
              item.product.id === productId
                ? {
                    ...item,
                    quantity,
                    subtotal: quantity * item.product.price
                  }
                : item
            )
          }));
          get().calculateTotals();
        },

        updateDiscount: (productId, discount) => {
          set(state => ({
            cart: state.cart.map(item =>
              item.product.id === productId
                ? { ...item, discount }
                : item
            )
          }));
          get().calculateTotals();
        },

        clearCart: () => {
          set({
            cart: [],
            subtotal: 0,
            totalDiscount: 0,
            total: 0,
            customer: null,
            amountPaid: 0,
            change: 0
          });
        },

        // Cálculos
        calculateTotals: () => {
          const { cart } = get();
          const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
          const totalDiscount = cart.reduce((sum, item) => sum + item.discount, 0);
          const total = subtotal - totalDiscount;

          set({ subtotal, totalDiscount, total });
          get().calculateChange();
        },

        calculateChange: () => {
          const { total, amountPaid } = get();
          const change = Math.max(0, amountPaid - total);
          set({ change });
        },

        // Cliente
        setCustomer: (customer) => set({ customer }),

        // Pagamento
        setPaymentMethod: (method) => set({ paymentMethod: method }),

        setAmountPaid: (amount) => {
          set({ amountPaid: amount });
          get().calculateChange();
        },

        // Busca e Filtros
        setSearchTerm: (term) => set({ searchTerm: term }),
        setSelectedCategory: (category) => set({ selectedCategory: category }),

        // UI
        setPaymentModalOpen: (open) => set({ isPaymentModalOpen: open })
      }),
      {
        name: 'pdv-storage',
        partialize: (state) => ({
          // Persistir apenas configurações, não o carrinho
          paymentMethod: state.paymentMethod,
          selectedCategory: state.selectedCategory
        })
      }
    )
  )
);
