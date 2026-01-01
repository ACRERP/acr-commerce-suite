
import { Product } from '@/lib/products';

export interface ProductRepository {
    getAll(): Promise<Product[]>;
    getById(id: number): Promise<Product | null>;
    search(query: string): Promise<Product[]>;
    create(product: Partial<Product>): Promise<Product>;
    update(id: number, product: Partial<Product>): Promise<Product>;
    delete(id: number): Promise<void>;
    updateStock(id: number, quantity: number): Promise<void>;
}
