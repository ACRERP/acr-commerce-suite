// Brazilian CEP (Código de Endereçamento Postal) utilities

export interface CEPAddress {
  cep: string;
  logradouro: string; // Street name
  complemento: string; // Complement
  bairro: string; // Neighborhood
  localidade: string; // City
  uf: string; // State abbreviation
  ibge: string; // IBGE code
  gia: string; // GIA code
  ddd: string; // Area code
  siafi: string; // SIAFI code
}

export interface CEPValidationResult {
  isValid: boolean;
  message?: string;
  formatted?: string;
  address?: CEPAddress;
}

export interface CEPLookupOptions {
  timeout?: number;
  retries?: number;
  service?: 'viacep' | 'correios' | 'apicep';
}

/**
 * Validates Brazilian CEP format
 * @param cep CEP string (can be formatted or unformatted)
 * @returns ValidationResult with validation status and message
 */
export function validateCEP(cep: string): CEPValidationResult {
  if (!cep) {
    return { isValid: false, message: 'CEP é obrigatório' };
  }

  // Remove all non-numeric characters
  const cleanCEP = cep.replace(/\D/g, '');

  // Check if it has 8 digits
  if (cleanCEP.length !== 8) {
    return { isValid: false, message: 'CEP deve ter 8 dígitos' };
  }

  // Check if all digits are the same (invalid CEPs)
  if (/^(\d)\1{7}$/.test(cleanCEP)) {
    return { isValid: false, message: 'CEP inválido' };
  }

  // Format CEP
  const formatted = cleanCEP.replace(/(\d{5})(\d{3})/, '$1-$2');

  return { isValid: true, formatted };
}

/**
 * Masks CEP input during typing
 * @param value Input value
 * @returns Masked value
 */
export function maskCEP(value: string): string {
  if (!value) return '';

  const cleanValue = value.replace(/\D/g, '').slice(0, 8);

  return cleanValue
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{3})\d+?$/, '$1');
}

/**
 * Lookup address by CEP using ViaCEP API (free and reliable)
 * @param cep CEP string
 * @param options Lookup options
 * @returns Promise with address data
 */
export async function lookupCEP(
  cep: string, 
  options: CEPLookupOptions = {}
): Promise<CEPValidationResult> {
  const { timeout = 10000, retries = 3, service = 'viacep' } = options;

  // Validate CEP format first
  const validation = validateCEP(cep);
  if (!validation.isValid) {
    return validation;
  }

  const cleanCEP = cep.replace(/\D/g, '');

  try {
    let address: CEPAddress;

    switch (service) {
      case 'viacep':
        address = await lookupViaCEP(cleanCEP, timeout, retries);
        break;
      case 'apicep':
        address = await lookupAPICEP(cleanCEP, timeout, retries);
        break;
      default:
        address = await lookupViaCEP(cleanCEP, timeout, retries);
    }

    return {
      isValid: true,
      formatted: validation.formatted,
      address,
    };
  } catch (error) {
    return {
      isValid: false,
      message: error instanceof Error ? error.message : 'Erro ao consultar CEP',
      formatted: validation.formatted,
    };
  }
}

/**
 * ViaCEP API lookup
 */
async function lookupViaCEP(
  cep: string, 
  timeout: number, 
  retries: number
): Promise<CEPAddress> {
  const url = `https://viacep.com.br/ws/${cep}/json/`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Check if CEP was not found
      if (data.erro) {
        throw new Error('CEP não encontrado');
      }

      // Validate required fields
      if (!data.logradouro || !data.bairro || !data.localidade || !data.uf) {
        throw new Error('Dados do CEP incompletos');
      }

      return {
        cep: data.cep,
        logradouro: data.logradouro,
        complemento: data.complemento || '',
        bairro: data.bairro,
        localidade: data.localidade,
        uf: data.uf,
        ibge: data.ibge || '',
        gia: data.gia || '',
        ddd: data.ddd || '',
        siafi: data.siafi || '',
      };
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => 
        setTimeout(resolve, 1000 * Math.pow(2, attempt - 1))
      );
    }
  }

  throw new Error('Falha na consulta do CEP');
}

/**
 * API CEP lookup (alternative service)
 */
async function lookupAPICEP(
  cep: string, 
  timeout: number, 
  retries: number
): Promise<CEPAddress> {
  const url = `https://apicep.com/api/v1/cep/${cep}.json`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Check if CEP was not found
      if (data.status !== 200) {
        throw new Error('CEP não encontrado');
      }

      // Validate required fields
      if (!data.address || !data.district || !data.city || !data.state) {
        throw new Error('Dados do CEP incompletos');
      }

      return {
        cep: data.code,
        logradouro: data.address,
        complemento: data.complement || '',
        bairro: data.district,
        localidade: data.city,
        uf: data.state,
        ibge: data.city_ibge || '',
        gia: '',
        ddd: data.state_ddd || '',
        siafi: '',
      };
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
    }
  }

  throw new Error('Falha na consulta do CEP');
}

/**
 * Format address string from CEP data
 */
export function formatAddress(address: CEPAddress): string {
  const parts = [
    address.logradouro,
    address.complemento,
    address.bairro,
    address.localidade,
    address.uf,
  ].filter(Boolean);

  return parts.join(', ');
}

/**
 * Format city and state from CEP data
 */
export function formatCityState(address: CEPAddress): string {
  return `${address.localidade} - ${address.uf}`;
}

/**
 * Get state full name from abbreviation
 */
export function getStateFullName(uf: string): string {
  const states: Record<string, string> = {
    'AC': 'Acre',
    'AL': 'Alagoas',
    'AP': 'Amapá',
    'AM': 'Amazonas',
    'BA': 'Bahia',
    'CE': 'Ceará',
    'DF': 'Distrito Federal',
    'ES': 'Espírito Santo',
    'GO': 'Goiás',
    'MA': 'Maranhão',
    'MT': 'Mato Grosso',
    'MS': 'Mato Grosso do Sul',
    'MG': 'Minas Gerais',
    'PA': 'Pará',
    'PB': 'Paraíba',
    'PR': 'Paraná',
    'PE': 'Pernambuco',
    'PI': 'Piauí',
    'RJ': 'Rio de Janeiro',
    'RN': 'Rio Grande do Norte',
    'RS': 'Rio Grande do Sul',
    'RO': 'Rondônia',
    'RR': 'Roraima',
    'SC': 'Santa Catarina',
    'SP': 'São Paulo',
    'SE': 'Sergipe',
    'TO': 'Tocantins',
  };

  return states[uf.toUpperCase()] || uf;
}

/**
 * Check if CEP is from a specific state
 */
export function isCEPFromState(cep: string, state: string): boolean {
  const validation = validateCEP(cep);
  if (!validation.isValid || !validation.address) {
    return false;
  }

  return validation.address.uf.toUpperCase() === state.toUpperCase();
}

/**
 * Generate test CEPs for development (NOT FOR PRODUCTION USE)
 */
export function generateTestCEP(state: string = 'SP'): string {
  // Common test CEPs for different states
  const testCEPs: Record<string, string[]> = {
    'SP': ['01310-100', '01234-567', '04538-133', '04094-050'],
    'RJ': ['20040-020', '22041-040', '22290-080', '24030-110'],
    'MG': ['30130-009', '31270-340', '37500-000', '38400-000'],
    'RS': ['90010-000', '91410-000', '91540-000', '93510-000'],
    'BA': ['40020-000', '40290-280', '41820-000', '45000-000'],
    'AC': ['69900-000'],
    'AL': ['57020-000'],
    'AP': ['68900-000'],
    'AM': ['69020-000'],
    'CE': ['60020-000'],
    'DF': ['70040-000'],
    'ES': ['29010-000'],
    'GO': ['74020-000'],
    'MA': ['65020-000'],
    'MT': ['78020-000'],
    'MS': ['79020-000'],
    'PA': ['66020-000'],
    'PB': ['58020-000'],
    'PE': ['50020-000'],
    'PI': ['64020-000'],
    'PR': ['80020-000'],
    'RN': ['59020-000'],
    'RO': ['78900-000'],
    'RR': ['69300-000'],
    'SC': ['88020-000'],
    'SE': ['49020-000'],
    'TO': ['77020-000'],
  };

  const stateCEPs = testCEPs[state.toUpperCase()] || testCEPs['SP'];
  return stateCEPs[Math.floor(Math.random() * stateCEPs.length)];
}
export const TEST_CEPS = {
  'São Paulo - Centro': '01310-100',
  'São Paulo - Vila Madalena': '05443-000',
  'Rio de Janeiro - Centro': '20040-020',
  'Rio de Janeiro - Copacabana': '22041-040',
  'Belo Horizonte - Centro': '30130-009',
  'Brasília - Asa Norte': '70040-000',
  'Salvador - Centro': '40020-000',
  'Porto Alegre - Centro': '90010-000',
  'Recife - Centro': '50020-000',
  'Fortaleza - Centro': '60020-000',
};

/**
 * Cache for CEP lookups to reduce API calls
 */
class CEPCache {
  private cache = new Map<string, { data: CEPAddress; timestamp: number }>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  get(cep: string): CEPAddress | null {
    const cleanCEP = cep.replace(/\D/g, '');
    const cached = this.cache.get(cleanCEP);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    
    return null;
  }

  set(cep: string, data: CEPAddress): void {
    const cleanCEP = cep.replace(/\D/g, '');
    this.cache.set(cleanCEP, {
      data,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const cepCache = new CEPCache();

/**
 * Enhanced CEP lookup with caching
 */
export async function lookupCEPWithCache(
  cep: string,
  options: CEPLookupOptions = {}
): Promise<CEPValidationResult> {
  const cleanCEP = cep.replace(/\D/g, '');

  // Check cache first
  const cached = cepCache.get(cleanCEP);
  if (cached) {
    const validation = validateCEP(cep);
    return {
      isValid: true,
      formatted: validation.formatted,
      address: cached,
    };
  }

  // Perform lookup
  const result = await lookupCEP(cep, options);

  // Cache successful results
  if (result.isValid && result.address) {
    cepCache.set(cleanCEP, result.address);
  }

  return result;
}
