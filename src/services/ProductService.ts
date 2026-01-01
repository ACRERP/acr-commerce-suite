
import { ProductRepository } from './repos/ProductRepository';
import { SupabaseProductRepository } from './repos/SupabaseProductRepository';
import { LocalProductRepository } from './repos/LocalProductRepository';

// Basic detection of "Electron/Local" mode
// We can use a window property or env var
const isLocalMode = () => {
    return window.location.hostname === 'localhost' || window.location.protocol === 'file:';
    // TODO: Better detection using Electron context bridge
};

class ProductServiceFactory {
    private static instance: ProductRepository;

    static getRepository(): ProductRepository {
        if (!this.instance) {
            // For now, we default to Supabase unless explicitly configured or if connection fails
            // In the future, this logic will be smarter (check ping, check config)
            const preferLocal = localStorage.getItem('acr_mode') === 'offline';
            
            if (preferLocal) {
                console.log("🔌 Using Local Repository (Offline Mode)");
                this.instance = new LocalProductRepository();
            } else {
                console.log("☁️ Using Supabase Repository (Online Mode)");
                this.instance = new SupabaseProductRepository();
            }
        }
        return this.instance;
    }
    
    // Allow forcing a mode switch
    static switchMode(mode: 'online' | 'offline') {
        localStorage.setItem('acr_mode', mode);
        if (mode === 'offline') {
            this.instance = new LocalProductRepository();
        } else {
            this.instance = new SupabaseProductRepository();
        }
        // Force reload might be needed to refresh all hooks
        window.location.reload();
    }
}

export const productService = ProductServiceFactory.getRepository();
export const ProductServiceManager = ProductServiceFactory;
