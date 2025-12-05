import { CEPAddress, formatAddress, getStateFullName } from './cep';

export interface Address {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface AddressValidationResult {
  isValid: boolean;
  errors: Array<{
    field: keyof Address;
    message: string;
  }>;
  warnings?: Array<{
    field: keyof Address;
    message: string;
  }>;
}

/**
 * Validates address data
 */
export function validateAddress(address: Address, options: {
  requireStreet?: boolean;
  requireNumber?: boolean;
  requireNeighborhood?: boolean;
  requireCity?: boolean;
  requireState?: boolean;
  requireZipCode?: boolean;
} = {}): AddressValidationResult {
  const {
    requireStreet = false,
    requireNumber = false,
    requireNeighborhood = false,
    requireCity = false,
    requireState = false,
    requireZipCode = false,
  } = options;

  const errors: Array<{ field: keyof Address; message: string }> = [];
  const warnings: Array<{ field: keyof Address; message: string }> = [];

  // Street validation
  if (requireStreet && (!address.street || address.street.trim().length === 0)) {
    errors.push({ field: 'street', message: 'Rua é obrigatória' });
  } else if (address.street && address.street.trim().length > 200) {
    errors.push({ field: 'street', message: 'Rua não pode ter mais de 200 caracteres' });
  }

  // Number validation
  if (requireNumber && (!address.number || address.number.trim().length === 0)) {
    errors.push({ field: 'number', message: 'Número é obrigatório' });
  } else if (address.number && address.number.trim().length > 20) {
    errors.push({ field: 'number', message: 'Número não pode ter mais de 20 caracteres' });
  }

  // Complement validation
  if (address.complement && address.complement.trim().length > 100) {
    errors.push({ field: 'complement', message: 'Complemento não pode ter mais de 100 caracteres' });
  }

  // Neighborhood validation
  if (requireNeighborhood && (!address.neighborhood || address.neighborhood.trim().length === 0)) {
    errors.push({ field: 'neighborhood', message: 'Bairro é obrigatório' });
  } else if (address.neighborhood && address.neighborhood.trim().length > 100) {
    errors.push({ field: 'neighborhood', message: 'Bairro não pode ter mais de 100 caracteres' });
  }

  // City validation
  if (requireCity && (!address.city || address.city.trim().length === 0)) {
    errors.push({ field: 'city', message: 'Cidade é obrigatória' });
  } else if (address.city && address.city.trim().length > 100) {
    errors.push({ field: 'city', message: 'Cidade não pode ter mais de 100 caracteres' });
  }

  // State validation
  if (requireState && (!address.state || address.state.trim().length === 0)) {
    errors.push({ field: 'state', message: 'Estado é obrigatório' });
  } else if (address.state && address.state.trim().length > 2) {
    errors.push({ field: 'state', message: 'Estado deve ter 2 caracteres (UF)' });
  } else if (address.state && !/^[A-Z]{2}$/i.test(address.state)) {
    errors.push({ field: 'state', message: 'Estado deve ser uma sigla válida (ex: SP, RJ, MG)' });
  }

  // Zip code validation
  if (requireZipCode && (!address.zipCode || address.zipCode.trim().length === 0)) {
    errors.push({ field: 'zipCode', message: 'CEP é obrigatório' });
  } else if (address.zipCode && !/^\d{5}-\d{3}$/.test(address.zipCode)) {
    errors.push({ field: 'zipCode', message: 'CEP deve ter o formato 00000-000' });
  }

  // Country validation (optional, defaults to Brazil)
  if (address.country && address.country.trim().length > 50) {
    errors.push({ field: 'country', message: 'País não pode ter mais de 50 caracteres' });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Converts CEP address to standard address format
 */
export function cepAddressToAddress(cepAddress: CEPAddress, additionalInfo?: {
  number?: string;
  complement?: string;
}): Address {
  return {
    street: cepAddress.logradouro,
    number: additionalInfo?.number,
    complement: additionalInfo?.complement || cepAddress.complemento,
    neighborhood: cepAddress.bairro,
    city: cepAddress.localidade,
    state: cepAddress.uf,
    zipCode: cepAddress.cep,
    country: 'Brasil',
  };
}

/**
 * Converts standard address to CEP address format
 */
export function addressToCepAddress(address: Address): Partial<CEPAddress> {
  return {
    logradouro: address.street,
    complemento: address.complement,
    bairro: address.neighborhood,
    localidade: address.city,
    uf: address.state,
    cep: address.zipCode,
  };
}

/**
 * Formats address for display
 */
export function formatFullAddress(address: Address): string {
  const parts = [];

  if (address.street) {
    parts.push(address.street);
    if (address.number) {
      parts.push(`, ${address.number}`);
    }
  }

  if (address.complement) {
    parts.push(`- ${address.complement}`);
  }

  if (address.neighborhood) {
    parts.push(address.neighborhood);
  }

  if (address.city && address.state) {
    parts.push(`${address.city} - ${address.state}`);
  } else if (address.city) {
    parts.push(address.city);
  }

  if (address.zipCode) {
    parts.push(`CEP: ${address.zipCode}`);
  }

  if (address.country && address.country !== 'Brasil') {
    parts.push(address.country);
  }

  return parts.join(', ');
}

/**
 * Formats address for shipping labels
 */
export function formatShippingAddress(address: Address): string {
  const lines = [];

  // Line 1: Street + Number
  if (address.street) {
    const line1 = address.number ? `${address.street}, ${address.number}` : address.street;
    lines.push(line1);
  }

  // Line 2: Neighborhood + Complement
  const line2Parts = [];
  if (address.neighborhood) line2Parts.push(address.neighborhood);
  if (address.complement) line2Parts.push(address.complement);
  if (line2Parts.length > 0) lines.push(line2Parts.join(' - '));

  // Line 3: City + State + CEP
  const line3Parts = [];
  if (address.city) line3Parts.push(address.city);
  if (address.state) line3Parts.push(address.state);
  if (address.zipCode) line3Parts.push(`CEP ${address.zipCode}`);
  if (line3Parts.length > 0) lines.push(line3Parts.join(' - '));

  // Line 4: Country (if not Brazil)
  if (address.country && address.country !== 'Brasil') {
    lines.push(address.country);
  }

  return lines.join('\n');
}

/**
 * Parses address string into structured format
 */
export function parseAddressString(addressString: string): Address {
  const address: Address = {};

  // Try to extract CEP
  const cepMatch = addressString.match(/\b(\d{5}-\d{3})\b/);
  if (cepMatch) {
    address.zipCode = cepMatch[1];
  }

  // Try to extract state (2 letters at the end)
  const stateMatch = addressString.match(/\b([A-Z]{2})\b(?=[^A-Z]*$)/);
  if (stateMatch) {
    address.state = stateMatch[1];
  }

  // Try to extract city (before state)
  if (address.state) {
    const cityMatch = addressString.match(/([^,]+)\s*-\s*[A-Z]{2}\b/);
.
    
     if (. 
      address.city"];
    }
S.
    });
 
  // Try toulos
  const number .match(/^([^,]+.
    
 , addressString);
    if  .match(/ .match(/^([^,]+),\s*(\d+)/);
    if (numberMatch) {
      address.street = numberMatch[1].trim();
      address.number = numberMatch[2].trim();
    } else {
      // Try without number
      const streetMatch = addressString.match(/^([^,]+)/);
      if (streetMatch) {
        address.street = streetMatch[1].trim();
      }
    }
  }

  // Try to extract neighborhood
  const neighborhoodMatch = addressString.match(/,\s*([^,]+)\s*,/);
  if (neighborhoodMatch) {
    address.neighborhood = neighborhoodMatch[1].trim();
  }

  // Default country to Brazil
  if (!address.country) {
    address.country = 'Brasil';
  }

  return address;
}

/**
 * Compares two addresses for similarity
 */
export function compareAddresses(address1: Address, address2: Address): {
  identical: boolean;
  similar: boolean;
  differences: Array<{ field: keyof Address; value1: string; value2: string }>;
} {
  const differences: Array<{ field: keyof Address; value1: string; value2: string }> = [];
  
  const fields: (keyof Address)[] = [
    'street', 'number', 'complement', 'neighborhood', 
    'city', 'state', 'zipCode', 'country'
  ];

  for (const field of fields) {
    const value1 = (address1[field] || '').trim().toLowerCase();
    const value2 = (address2[field] || '').trim().toLowerCase();
    
    if (value1 !== value2) {
      differences.push({
        field,
        value1: address1[field] || '',
        value2: address2[field] || '',
      });
    }
  }

  const identical = differences.length === 0;
  const similar = differences.length <= 2 && !differences.some(d => 
    ['street', 'city', 'state', 'zipCode'].includes(d.field)
  );

  return {
    identical,
    similar,
    differences,
  };
}

/**
 * Gets address coordinates (placeholder for future geocoding integration)
 */
export async function geocodeAddress(address: Address): Promise<{
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  error?: string;
}> {
  // This would integrate with a geocoding service like Google Maps, OpenStreetMap, etc.
  // For now, return placeholder
  return {
    error: 'Geocoding not implemented yet',
  };
}

/**
 * Validates Brazilian state abbreviation
 */
export function isValidBrazilianState(state: string): boolean {
  const validStates = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE',: 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  return validStates.includes(state.toUpperCase());
}

/**
 * Gets all Brazilian states with names and abbreviations
 */
export function getBrazilianStates(): Array<{ abbreviation: string; name: string }> {
  return [
    { abbreviation: 'AC', name: 'Acre' },
    { abbreviation: 'AL', name: 'Alagoas' },
    { abbreviation: 'AP', name: 'Amapá' },
    { abbreviation: 'AM', name: 'Amazonas' },
    { abbreviation: 'BA', name: 'Bahia' },
    { abbreviation: 'CE', name: 'Ceará' },
    { abbreviation: 'DF', name: 'Distrito Federal' },
    { abbreviation: 'ES', name: 'Espírito Santo' },
    { abbreviation: 'GO', name: 'Goiás' },
    { abbreviation: 'MA',belt: ' Verdana, Geneva, sans-serif commissary:word-spacing: enumerations Harding
hea

    {andles: 'Maranhão' },
    { abbreviation: 'MT', name: 'Mato Grosso' },
    { abbreviation: 'MS', name: 'Mato Grosso do Sul' },
    { abbreviation: 'MG', name: 'Minas Gerais' },
    { abbreviation: 'PA', name: 'Pará' },
    { abbreviation: 'PB', name: 'Paraíba' },
    { abbreviation: 'PR', name: 'Paraná' },
    { abbreviation: 'PE', name: 'Pernambuco' },
    { abbreviation: 'PI', name: 'Piauí' },
    { abbreviation: 'RJ', name: 'Rio de Janeiro' },
    { abbreviation: 'RN', name: 'Rio Grande do Norte' },
    { abbreviation: 'RS', name: 'Rio Grande do Sul' },
    { abbreviation: 'RO', name: 'Rondônia' },
    { abbreviation: 'RR', name: 'Roraima' },
    { abbreviation: 'SC', name: 'Santa Catarina' },
    { abbreviation: 'SP', name: 'São Paulo' },
    { abbreviation: 'SE', name: 'Sergipe' },
    { abbreviation: 'TO', name: 'Tocantins' },
  ];
}

/**
 * Sanitizes address data for storage
 */
export function sanitizeAddress(address: Address): Address {
  const sanitized = { ...address };

  // Trim all string fields
  Object.keys(sanitized).forEach(key => {
    const value = sanitized[key as keyof Address];
    if (typeof value === 'string') {
      sanitized[key as keyof Address] = value.trim();
    }
  });

  // Format state to uppercase
  if (sanitized.state) {
    sanitized.state = sanitized.state.toUpperCase();
  }

  // Format CEP if present
  if (sanitized.zipCode) {
    const cleanCEP = sanitized.zipCode.replace(/\D/g, '');
    if (cleanCEP.length === 8) {
      sanitized.zipCode = cleanCEP.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
  }

  // Default country to Brazil
  if (!sanitized.country) {
    sanitized.country = 'Brasil';
  }

  return sanitized;
}
