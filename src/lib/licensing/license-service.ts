import { supabase } from '@/lib/supabaseClient';

interface LicenseValidationResult {
  valid: boolean;
  message: string;
  expiresAt?: string;
  features?: any;
  licenseType?: string;
}

interface License {
  id: string;
  license_key: string;
  customer_email?: string;
  customer_name?: string;
  is_active: boolean;
  activated_at?: string;
  expires_at?: string;
  max_activations: number;
  current_activations: number;
  machine_ids: string[];
  license_type: string;
  features: any;
  last_validated_at?: string;
}

export class LicenseService {
  private static STORAGE_KEY = 'acr_license_data';
  private static MACHINE_ID_KEY = 'acr_machine_id';
  
  /**
   * Gerar ID único da máquina baseado em características do sistema
   */
  static async getMachineId(): Promise<string> {
    let machineId = localStorage.getItem(this.MACHINE_ID_KEY);
    
    if (!machineId) {
      // Combinar informações do navegador/sistema para criar fingerprint
      const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        screen.colorDepth,
        new Date().getTimezoneOffset(),
        navigator.hardwareConcurrency || 0,
        navigator.platform,
      ].join('|');
      
      // Gerar hash do fingerprint
      const encoder = new TextEncoder();
      const data = encoder.encode(fingerprint);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      machineId = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
      
      localStorage.setItem(this.MACHINE_ID_KEY, machineId);
    }
    
    return machineId;
  }
  
  /**
   * Validar licença no servidor
   */
  static async validateLicense(licenseKey: string): Promise<LicenseValidationResult> {
    try {
      const machineId = await this.getMachineId();
      const cleanKey = licenseKey.trim().toUpperCase();
      
      // Buscar licença no banco
      const { data: license, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('license_key', cleanKey)
        .single();
      
      if (error || !license) {
        await this.logValidation(cleanKey, machineId, false, 'Licença não encontrada');
        return { 
          valid: false, 
          message: 'Chave de licença inválida. Verifique se digitou corretamente.' 
        };
      }
      
      // Verificar se está ativa
      if (!license.is_active) {
        await this.logValidation(cleanKey, machineId, false, 'Licença desativada');
        return { 
          valid: false, 
          message: 'Esta licença foi desativada. Entre em contato com o suporte.' 
        };
      }
      
      // Verificar expiração
      if (license.expires_at && new Date(license.expires_at) < new Date()) {
        await this.logValidation(cleanKey, machineId, false, 'Licença expirada');
        return { 
          valid: false, 
          message: `Licença expirada em ${new Date(license.expires_at).toLocaleDateString('pt-BR')}` 
        };
      }
      
      // Verificar limite de ativações
      const machineIds = license.machine_ids || [];
      const isNewMachine = !machineIds.includes(machineId);
      
      if (isNewMachine && license.current_activations >= license.max_activations) {
        await this.logValidation(cleanKey, machineId, false, 'Limite de ativações excedido');
        return { 
          valid: false, 
          message: `Limite de ${license.max_activations} instalação(ões) atingido. Contate o suporte para mais licenças.` 
        };
      }
      
      // Registrar nova ativação se necessário
      if (isNewMachine) {
        const { error: updateError } = await supabase
          .from('licenses')
          .update({
            current_activations: license.current_activations + 1,
            machine_ids: [...machineIds, machineId],
            activated_at: license.activated_at || new Date().toISOString(),
            last_validated_at: new Date().toISOString(),
          })
          .eq('id', license.id);
          
        if (updateError) {
          console.error('Erro ao atualizar licença:', updateError);
        }
      } else {
        // Atualizar última validação
        await supabase
          .from('licenses')
          .update({ last_validated_at: new Date().toISOString() })
          .eq('id', license.id);
      }
      
      // Registrar validação bem-sucedida
      await this.logValidation(cleanKey, machineId, true);
      
      // Salvar licença localmente
      this.saveLicenseLocally(cleanKey, license);
      
      return {
        valid: true,
        message: isNewMachine ? 'Licença ativada com sucesso!' : 'Licença validada com sucesso!',
        expiresAt: license.expires_at,
        features: license.features,
        licenseType: license.license_type,
      };
      
    } catch (error) {
      console.error('Erro ao validar licença:', error);
      return { 
        valid: false, 
        message: 'Erro ao validar licença. Verifique sua conexão com a internet e tente novamente.' 
      };
    }
  }
  
  /**
   * Verificar licença salva localmente (cache)
   */
  static async checkLocalLicense(): Promise<boolean> {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (!saved) return false;
    
    try {
      const { key, lastCheck, expiresAt } = JSON.parse(saved);
      
      // Verificar se expirou
      if (expiresAt && new Date(expiresAt) < new Date()) {
        this.clearLocalLicense();
        return false;
      }
      
      const hoursSinceCheck = (Date.now() - lastCheck) / (1000 * 60 * 60);
      
      // Revalidar online a cada 24 horas
      if (hoursSinceCheck > 24) {
        const result = await this.validateLicense(key);
        return result.valid;
      }
      
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Obter dados da licença local
   */
  static getLocalLicenseData(): { key: string; expiresAt?: string } | null {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (!saved) return null;
    
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }
  
  /**
   * Salvar licença localmente
   */
  private static saveLicenseLocally(key: string, license: License) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
      key,
      lastCheck: Date.now(),
      expiresAt: license.expires_at,
      licenseType: license.license_type,
      customerName: license.customer_name,
    }));
  }
  
  /**
   * Limpar licença local
   */
  static clearLocalLicense() {
    localStorage.removeItem(this.STORAGE_KEY);
  }
  
  /**
   * Registrar tentativa de validação
   */
  private static async logValidation(
    licenseKey: string,
    machineId: string,
    success: boolean,
    errorMessage?: string
  ) {
    try {
      await supabase.from('license_validations').insert({
        license_key: licenseKey,
        machine_id: machineId,
        success,
        error_message: errorMessage,
        user_agent: navigator.userAgent,
      });
    } catch (error) {
      console.error('Erro ao registrar validação:', error);
    }
  }
  
  /**
   * Desativar licença (para administração)
   */
  static async deactivateLicense(licenseKey: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('licenses')
        .update({ is_active: false })
        .eq('license_key', licenseKey);
      
      return !error;
    } catch {
      return false;
    }
  }
  
  /**
   * Formatar chave de licença (adicionar hífens)
   */
  static formatLicenseKey(key: string): string {
    const clean = key.replace(/[^A-Z0-9]/g, '').toUpperCase();
    const segments = clean.match(/.{1,4}/g) || [];
    return segments.join('-');
  }
}
