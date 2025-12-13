
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCart } from './useCart';

describe('useCart Hook', () => {
    beforeEach(() => {
        const { result } = renderHook(() => useCart());
        act(() => {
            result.current.clearCart();
        });
    });

    it('should start empty', () => {
        const { result } = renderHook(() => useCart());
        expect(result.current.items).toEqual([]);
        expect(result.current.itemCount()).toBe(0);
        expect(result.current.total()).toBe(0);
    });

    it('should add item', () => {
        const { result } = renderHook(() => useCart());
        const product = { 
            id: 1, 
            name: 'Test Product', 
            sale_price: 100, 
            stock_quantity: 10 
        };

        act(() => {
            result.current.addItem(product);
        });

        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0].quantity).toBe(1);
        expect(result.current.items[0].subtotal).toBe(100);
        expect(result.current.total()).toBe(100);
    });

    it('should increment quantity of existing item', () => {
        const { result } = renderHook(() => useCart());
        const product = { 
            id: 1, 
            name: 'Test Product', 
            sale_price: 100, 
            stock_quantity: 10 
        };

        act(() => {
            result.current.addItem(product);
            result.current.addItem(product);
        });

        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0].quantity).toBe(2);
        expect(result.current.total()).toBe(200);
    });

    it('should respect stock limit when adding items', () => {
        const { result } = renderHook(() => useCart());
        const product = { 
            id: 1, 
            name: 'Low Stock Product', 
            sale_price: 100, 
            stock_quantity: 2 
        };

        act(() => {
            // Add 2 items (limit reached)
            result.current.addItem(product, 2);
        });
        expect(result.current.items[0].quantity).toBe(2);

        act(() => {
            // Try adding 1 more (should fail silenty or simple return)
            result.current.addItem(product, 1);
        });
        
        // Quantity should still be 2
        expect(result.current.items[0].quantity).toBe(2);
    });

    it('should update quantity manually', () => {
        const { result } = renderHook(() => useCart());
        const product = { 
            id: 1, 
            name: 'Test Product', 
            sale_price: 100, 
            stock_quantity: 10 
        };

        act(() => {
            result.current.addItem(product);
            result.current.updateQuantity(1, 5);
        });

        expect(result.current.items[0].quantity).toBe(5);
        expect(result.current.total()).toBe(500);
    });

    it('should remove item', () => {
        const { result } = renderHook(() => useCart());
        const product = { 
            id: 1, 
            name: 'Test Product', 
            sale_price: 100, 
            stock_quantity: 10 
        };

        act(() => {
            result.current.addItem(product);
            result.current.removeItem(1);
        });

        expect(result.current.items).toHaveLength(0);
    });

    it('should calculate total with delivery fee and discount', () => {
         const { result } = renderHook(() => useCart());
         const product = { 
            id: 1, 
            name: 'Test Product', 
            sale_price: 100, 
            stock_quantity: 10 
        };

        act(() => {
            result.current.addItem(product); // 100
            result.current.setDeliveryFee(20); // +20
            result.current.setDiscount(10); // -10
        });

        // 100 + 20 - 10 = 110
        expect(result.current.total()).toBe(110);
    });
});
