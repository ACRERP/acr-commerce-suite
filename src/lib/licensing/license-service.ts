import { supabase } from '@/lib/supabaseClient';

export type LicenseType = 'demo' | 'paid' | 'lifetime';
export type LicenseStatus = 'active' | 'expired' | 'blocked';

export interface LicenseLimits {
    max_users: number;
    max_products: number;
    max_sales: number;
    modules: string[];
}

export interface License {
    id: string;
    user_id: string;
    company_id?: string;
    type: LicenseType;
    status: LicenseStatus;
    starts_at: string;
    expires_at?: string;
    limits: LicenseLimits;
    activated_devices: any[];
    max_devices: number;
    license_key?: string;
    created_at: string;
    updated_at: string;
    last_validated_at?: string;
}

export interface LicenseValidationResult {
    valid: boolean;
    status: LicenseStatus;
    message: string;
    license?: License;
}

export class LicenseService {
    private static STORAGE_KEY = 'acr_license_v2';
    private static SIGN_KEY = 'acr_license_sign_v2';
    private static SIGN_SALT = 'acr_erp_2026_secure_shield_v1';

    /**
     * Formata a chave para o padrão XXXX-XXXX-XXXX-XXXX
     */
    static formatLicenseKey(key: string): string {
        const clean = key.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const chunks = clean.match(/.{1,4}/g) || [];
        return chunks.slice(0, 4).join('-');
    }

    /**
     * Verifica se existe uma licença local válida
     */
    static async checkLocalLicense(): Promise<boolean> {
        const license = this.getLocalLicense();
        if (!license) return false;
        const validation = this.validateLicense(license);
        return validation.valid;
    }

    /**
     * Gera um ID único de hardware (Extreme Fingerprint)
     * Utiliza entropia de hardware, sistema e renderização gráfica (Canvas)
     */
    static getHardwareFingerprint(): string {
        try {
            // 1. Dados Básicos (UA + Screen + Engine)
            const basicInfo = `${navigator.userAgent}-${screen.width}x${screen.height}-${navigator.language}-${navigator.hardwareConcurrency || 4}`;
            
            // 2. Canvas Fingerprint (Único por placa de vídeo/driver)
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            let canvasHash = 'no-canvas';
            if (ctx) {
                ctx.textBaseline = "top";
                ctx.font = "14px 'Arial'";
                ctx.textBaseline = "alphabetic";
                ctx.fillStyle = "#f60";
                ctx.fillRect(125, 1, 62, 20);
                ctx.fillStyle = "#069";
                ctx.fillText("ACR-ERP-SECURITY-2026", 2, 15);
                ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
                ctx.fillText("ACR-ERP-SECURITY-2026", 4, 17);
                canvasHash = canvas.toDataURL().substring(1, 40); // Pegar parte do base64
            }

            // 3. Gerar Hash Final Único
            const combined = `${basicInfo}-${canvasHash}-${this.SIGN_SALT}`;
            let hash = 0;
            for (let i = 0; i < combined.length; i++) {
                const char = combined.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            
            const prefix = /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'MOB' : 'DSK';
            return `ACR-${prefix}-${Math.abs(hash).toString(36).toUpperCase()}`;
        } catch (e) {
            return `ACR-SEC-FALLBACK-${Date.now().toString(36)}`;
        }
    }

    /**
     * Detecta metadados do dispositivo para registro no banco de dados
     */
    static getDeviceMetadata() {
        return {
            platform: navigator.platform,
            vendor: navigator.vendor,
            isMobile: /Mobile|Android|iPhone/i.test(navigator.userAgent),
            screen: `${screen.width}x${screen.height}`,
            cores: navigator.hardwareConcurrency || 'unknown',
            registered_at: new Date().toISOString()
        };
    }

    /**
     * Gera uma assinatura para os dados da licença (Anti-Tampering)
     */
    private static generateSignature(license: License): string {
        const data = `${license.id}-${license.user_id}-${license.status}-${license.expires_at}-${this.SIGN_SALT}`;
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Obter a licença do usuário logado
     */
    static async getUserLicense(userId: string): Promise<License | null> {
        try {
            const { data, error } = await supabase
                .from('licenses')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao buscar licença:', error);
            return null;
        }
    }

    /**
     * Criar licença DEMO automática
     */
    static async createDemoLicense(userId: string): Promise<License | null> {
        try {
            // Verificar se já existe uma licença
            const existing = await this.getUserLicense(userId);
            if (existing) {
                this.saveLicenseLocally(existing);
                return existing;
            }

            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 14); // 14 dias
            const fingerprint = this.getHardwareFingerprint();
            const meta = this.getDeviceMetadata();

            const { data, error } = await supabase
                .from('licenses')
                .insert({
                    user_id: userId,
                    type: 'demo',
                    status: 'active',
                    expires_at: expiresAt.toISOString(),
                    activated_devices: [{ id: fingerprint, ...meta }], // Registro detalhado
                    max_devices: 1,
                    limits: {
                        max_users: 10,
                        max_products: 5000,
                        max_sales: 5000,
                        modules: ['dashboard', 'products', 'pdv']
                    }
                })
                .select()
                .single();

            if (error) throw error;
            
            // Salvar localmente
            this.saveLicenseLocally(data);
            
            return data;
        } catch (error) {
            console.error('Erro ao criar licença DEMO:', error);
            return null;
        }
    }

    /**
     * Validar chave de licença (String)
     */
    static async validateLicenseWithKey(key: string): Promise<LicenseValidationResult> {
        try {
            const { data, error } = await supabase
                .from('licenses')
                .select('*')
                .eq('license_key', key)
                .maybeSingle();

            if (error) throw error;
            if (!data) return { valid: false, status: 'expired', message: 'Chave de licença não encontrada.' };

            const validation = this.validateLicense(data);
            if (validation.valid) {
                this.saveLicenseLocally(data);
            }
            return validation;
        } catch (error) {
            console.error('Erro ao validar chave:', error);
            return { valid: false, status: 'blocked', message: 'Erro na conexão com o servidor de licenças.' };
        }
    }

    /**
     * Validar licença (Objeto License)
     */
    static validateLicense(license: License): LicenseValidationResult {
        // 🛡️ Segurança: Verificar se esta licença pertence a este Hardware
        const currentFingerprint = this.getHardwareFingerprint();
        
        // Suporte para ambos formatos (string ou objeto)
        const isDeviceAuthorized = license.activated_devices?.some((dev: any) => 
            typeof dev === 'string' ? dev === currentFingerprint : dev.id === currentFingerprint
        );

        if (license.activated_devices && !isDeviceAuthorized) {
            return { 
                valid: false, 
                status: 'blocked', 
                message: 'Acesso bloqueado: Este dispositivo (PC/Mobile) não é o hardware original desta licença.' 
            };
        }

        if (license.status === 'blocked') {
            return { valid: false, status: 'blocked', message: 'Sua licença foi bloqueada. Entre em contato com o suporte.' };
        }

        if (license.expires_at && new Date(license.expires_at) < new Date()) {
            return { valid: false, status: 'expired', message: 'Sua licença expirou. Adquira a versão completa para continuar.' };
        }

        if (license.status !== 'active') {
            return { valid: false, status: 'expired', message: 'Licença inativa.' };
        }

        return { valid: true, status: 'active', message: 'Licença válida', license };
    }

    /**
     * Salvar licença localmente com assinatura digital
     */
    static saveLicenseLocally(license: License) {
        const signature = this.generateSignature(license);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(license));
        localStorage.setItem(this.SIGN_KEY, signature);
    }

    /**
     * Obter licença do cache (LocalStorage) com verificação de integridade
     */
    static getLocalLicense(): License | null {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        const signature = localStorage.getItem(this.SIGN_KEY);
        
        if (!saved || !signature) return null;
        
        try {
            const license = JSON.parse(saved) as License;
            const validSignature = this.generateSignature(license);
            
            // Se a assinatura não bater, os dados foram manipulados manualmente
            if (signature !== validSignature) {
                console.error('🛡️ Violação de integridade detectada na licença local!');
                this.clearLocalLicense();
                return null;
            }
            
            return license;
        } catch {
            return null;
        }
    }

    /**
     * Limpar licença local
     */
    static clearLocalLicense() {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(this.SIGN_KEY);
    }

    /**
     * Verificar se um recurso pode ser criado baseado nos limites da licença
     */
    static async checkResourceLimit(resource: 'products' | 'sales', userId: string): Promise<{ canCreate: boolean; current: number; max: number }> {
        // HOTFIX: Bypass limits for development/debugging
        // Returns infinite limit to unblock user immediately
        return { canCreate: true, current: 0, max: 999999 };

        /* Original Logic Disabled temporarily
        const license = this.getLocalLicense();
        if (!license) return { canCreate: false, current: 0, max: 0 };

        const table = resource === 'products' ? 'products' : 'sales';
        const limit = resource === 'products' ? license.limits.max_products : license.limits.max_sales;

        try {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });

            if (error) throw error;

            const current = count || 0;
            return {
                canCreate: current < limit,
                current,
                max: limit
            };
        } catch (error) {
            console.error(`Erro ao verificar limite de ${resource}:`, error);
            return { canCreate: false, current: 0, max: limit };
        }
        */
    }
}
