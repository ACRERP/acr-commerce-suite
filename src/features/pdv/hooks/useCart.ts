import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from '../types';

interface CartState {
    items: CartItem[];
    clientId: string | null;
    clientName: string | null;
    discountValue: number;
    deliveryFee: number;
    
    // Computed (helper getters)
    subtotal: () => number;
    total: () => number;
    itemCount: () => number;

    // Actions
    addItem: (product: any, quantity?: number) => void;
    removeItem: (productId: number) => void;
    updateQuantity: (productId: number, quantity: number) => void;
    setClient: (id: string | null, name: string | null) => void;
    setDiscount: (value: number) => void;
    setDeliveryFee: (value: number) => void;
    clearCart: () => void;
}

export const useCart = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            clientId: null,
            clientName: 'Cliente Balcão',
            discountValue: 0,
            deliveryFee: 0,

            subtotal: () => {
                return get().items.reduce((sum, item) => sum + item.subtotal, 0);
            },

            total: () => {
                const subtotal = get().items.reduce((sum, item) => sum + item.subtotal, 0);
                return Math.max(0, subtotal + get().deliveryFee - get().discountValue);
            },

            itemCount: () => {
                return get().items.reduce((sum, item) => sum + item.quantity, 0);
            },

            addItem: (product, quantity = 1) => {
                const items = get().items;
                const existingItem = items.find((i) => i.product_id === product.id);
                const currentQty = existingItem ? existingItem.quantity : 0;
                const maxStock = product.stock_quantity || 0;

                if (currentQty + quantity > maxStock) {
                    // You might want to import useToast globally or return false to UI, 
                    // but for a store, we can just cap it or ignore. 
                    // Let's cap it to maxStock if possible, or do nothing.
                    // Ideally, we'd trigger a toast notification.
                    return; 
                }

                if (existingItem) {
                    const newQuantity = existingItem.quantity + quantity;
                    const newItems = items.map((i) =>
                        i.product_id === product.id
                            ? { ...i, quantity: newQuantity, subtotal: newQuantity * i.unit_price }
                            : i
                    );
                    set({ items: newItems });
                } else {
                    const newItem: CartItem = {
                        product_id: product.id,
                        name: product.name,
                        code: product.code || '',
                        barcode: product.barcode,
                        unit_price: Number(product.sale_price),
                        quantity,
                        subtotal: Number(product.sale_price) * quantity,
                        stock_quantity: maxStock,
                    };
                    set({ items: [...items, newItem] });
                }
            },

            removeItem: (productId) => {
                set({
                    items: get().items.filter((i) => i.product_id !== productId),
                });
            },

            updateQuantity: (productId, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(productId);
                    return;
                }
                
                const item = get().items.find(i => i.product_id === productId);
                if (item && quantity > item.stock_quantity) {
                    return; // Exceeds stock, do nothing or show toast
                }

                set({
                    items: get().items.map((i) =>
                        i.product_id === productId
                            ? { ...i, quantity, subtotal: quantity * i.unit_price }
                            : i
                    ),
                });
            },

            setClient: (id, name) => set({ clientId: id, clientName: name || 'Cliente Balcão' }),
            setDiscount: (value) => set({ discountValue: value }),
            setDeliveryFee: (value) => set({ deliveryFee: value }),
            clearCart: () => {
                set({
                    items: [],
                    clientId: null,
                    clientName: 'Cliente Balcão',
                    discountValue: 0,
                    deliveryFee: 0,
                });
            },
        }),
        {
            name: 'pdv-cart-storage', // unique name
            partialize: (state) => ({ 
                items: state.items, 
                clientId: state.clientId,
                clientName: state.clientName 
            }), // persist only specific fields
        }
    )
);
