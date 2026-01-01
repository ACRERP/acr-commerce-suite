
import { Product } from '@/lib/products';
import { ProductRepository } from './ProductRepository';

const LOCAL_API_URL = 'http://localhost:3000/api';

export class LocalProductRepository implements ProductRepository {
    
    private async fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
        try {
            const res = await fetch(`${LOCAL_API_URL}${endpoint}`, options);
            if (!res.ok) throw new Error(`Local API Error: ${res.statusText}`);
            return await res.json() as T;
        } catch (error) {
            console.error("Local Repository Error:", error);
            throw error;
        }
    }

    async getAll(): Promise<Product[]> {
        return this.fetchJson<Product[]>('/products');
    }

    async getById(id: number): Promise<Product | null> {
        return this.fetchJson<Product>(`/products/${id}`);
    }

    async search(query: string): Promise<Product[]> {
        return this.fetchJson<Product[]>(`/products/search?q=${encodeURIComponent(query)}`);
    }

    async create(product: Partial<Product>): Promise<Product> {
        return this.fetchJson<Product>('/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
        });
    }

    async update(id: number, product: Partial<Product>): Promise<Product> {
        return this.fetchJson<Product>(`/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
        });
    }

    async delete(id: number): Promise<void> {
        await this.fetchJson(`/products/${id}`, { method: 'DELETE' });
    }

    async updateStock(id: number, quantity: number): Promise<void> {
        await this.fetchJson(`/products/${id}/stock`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity })
        });
    }
}
