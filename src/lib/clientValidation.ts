import { Client, CreateClientData, UpdateClientData } from './clients';
import { validateCPFCNPJ, ValidationResult, formatCPFCNPJ } from './validation';

export interface ClientValidationResult {
  isValid: boolean;
  errors: Array<{
    field: keyof Client | keyof CreateClientData;
    message: string;
  }>;
  warnings?: Array<{
    field: keyof Client | keyof CreateClientData;
    message: string;
  }>;
}

/**
 * Validates client data for create/update operations
 */
export function validateClientData(
  data: CreateClientData | UpdateClientData,
  options: {
    requireCPF?: boolean;
    requirePhone?: boolean;
    requireAddress?: boolean;
  } = {}
): ClientValidationResult {
  const {
    requireCPF = false,
    requirePhone = false,
    requireAddress = false,
  } = options;

  const errors: Array<{ field: keyof Client | keyof CreateClientData; message: string }> = [];
  const warnings: Array<{ field: keyof Client | keyof CreateClientData; message: string }> = [];

  // Name validation
  if (!data.name || data.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Nome é obrigatório' });
  } else if (data.name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Nome deve ter pelo menos 2 caracteres' });
  } else if (data.name.trim().length > 200) {
    errors.push({ field: 'name', message: 'Nome não pode ter mais de 200 caracteres' });
  }

  // Phone validation
  if (requirePhone && (!data.phone || data.phone.trim().length === 0)) {
    errors.push({ field: 'phone', message: 'Telefone é obrigatório' });
  } else if (data.phone && data.phone.trim().length > 0) {
    const cleanPhone = data.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      errors.push({ field: 'phone', message: 'Telefone deve ter 10 ou 11 dígitos (DDD + número)' });
    }
  }

  // Address validation
  if (requireAddress && (!data.address || data.address.trim().length === 0)) {
    errors.push({ field: 'address', message: 'Endereço é obrigatório' });
  } else if (data.address && data.address.trim().length > 500) {
    errors.push({ field: 'address', message: 'Endereço não pode ter mais de 500 caracteres' });
  }

  // CPF/CNPJ validation
  if (requireCPF && (!data.cpf_cnpj || data.cpf_cnpj.trim().length === 0)) {
    errors.push({ field: 'cpf_cnpj', message: 'CPF/CNPJ é obrigatório' });
  } else if (data.cpf_cnpj && data.cpf_cnpj.trim().length > 0) {
    const cpfCnpjValidation = validateCPFCNPJ(data.cpf_cnpj);
    if (!cpfCnpjValidation.isValid) {
      errors.push({ field: 'cpf_cnpj', message: cpfCnpjValidation.message || 'CPF/CNPJ inválido' });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Sanitizes and formats client data before saving
 */
export function sanitizeClientData(
  data: CreateClientData | UpdateClientData
): CreateClientData | UpdateClientData {
  const sanitized = { ...data };

  // Trim string fields
  if (sanitized.name) {
    sanitized.name = sanitized.name.trim();
  }

  if (sanitized.phone) {
    sanitized.phone = sanitized.phone.trim();
  }

  if (sanitized.address) {
    sanitized.address = sanitized.address.trim();
  }

  if (sanitized.cpf_cnpj) {
    // Format CPF/CNPJ if valid
    const validation = validateCPFCNPJ(sanitized.cpf_cnpj);
    if (validation.isValid && validation.formatted) {
      sanitized.cpf_cnpj = validation.formatted;
    } else {
      // Just clean non-digits if invalid
      sanitized.cpf_cnpj = sanitized.cpf_cnpj.replace(/\D/g, '');
    }
  }

  return sanitized;
}

/**
 * Checks if a client already exists by CPF/CNPJ
 */
export function checkDuplicateClient(
  cpfCnpj: string,
  existingClients: Client[],
  excludeClientId?: number
): { isDuplicate: boolean; existingClient?: Client } {
  if (!cpfCnpj) return { isDuplicate: false };

  const cleanCpfCnpj = cpfCnpj.replace(/\D/g, '');
  
  const duplicate = existingClients.find(client => {
    if (excludeClientId && client.id === excludeClientId) return false;
    
    if (!client.cpf_cnpj) return false;
    
    const cleanExistingCpfCnpj = client.cpf_cnpj.replace(/\D/g, '');
    return cleanExistingCpfCnpj === cleanCpfCnpj;
  });

  return {
    isDuplicate: !!duplicate,
    existingClient: duplicate,
  };
}

/**
 * Validates client data for bulk import
 */
export function validateBulkClientData(
  clients: Array<Partial<CreateClientData>>,
  existingClients: Client[] = []
): Array<{
  index: number;
  client: Partial<CreateClientData>;
  validation: ClientValidationResult;
  duplicate?: Client;
}> {
  return clients.map((client, index) => {
    const validation = validateClientData(client as CreateClientData, {
      requireCPF: true,
      requirePhone: false,
      requireAddress: false,
    });

    // Check for duplicates
    let duplicate: Client | undefined;
    if (client.cpf_cnpj) {
      const duplicateCheck = checkDuplicateClient(client.cpf_cnpj, existingClients);
      if (duplicateCheck.isDuplicate) {
        duplicate = duplicateCheck.existingClient;
        validation.errors.push({
          field: 'cpf_cnpj',
          message: `Cliente duplicado: ${duplicate.name} (ID: ${duplicate.id})`,
        });
      }
    }

    return {
      index,
      client,
      validation,
      duplicate,
    };
  });
}

/**
 * Generates client statistics based on document types
 */
export function getClientDocumentStats(clients: Client[]): {
  total: number;
  withCPF: number;
  withCNPJ: number;
  withoutDocument: number;
  percentageWithDocument: number;
} {
  const total = clients.length;
  const withCPF = clients.filter(client => {
    if (!client.cpf_cnpj) return false;
    return client.cpf_cnpj.replace(/\D/g, '').length === 11;
  }).length;
  const withCNPJ = clients.filter(client => {
    if (!client.cpf_cnpj) return false;
    return client.cpf_cnpj.replace(/\D/g, '').length === 14;
  }).length;
  const withoutDocument = clients.filter(client => !client.cpf_cnpj).length;

  return {
    total,
    withCPF,
    withCNPJ,
    withoutDocument,
    percentageWithDocument: total > 0 ? ((withCPF + withCNPJ) / total) * 100 : 0,
  };
}

/**
 * Searches clients by document (CPF/CNPJ)
 */
export function searchClientsByDocument(
  searchTerm: string,
  clients: Client[]
): Client[] {
  if (!searchTerm) return [];

  const cleanSearchTerm = searchTerm.replace(/\D/g, '');

  return clients.filter(client => {
    if (!client.cpf_cnpj) return false;
    
    const cleanClientDocument = client.cpf_cnpj.replace(/\D/g, '');
    
    // Exact match
    if (cleanClientDocument === cleanSearchTerm) {
      return true;
    }
    
    // Partial match
    if (cleanClientDocument.includes(cleanSearchTerm)) {
      return true;
    }
    
    return false;
  });
}

/**
 * Formats client display name with document
 */
export function formatClientDisplayName(client: Client): string {
  const documentType = client.cpf_cnpj?.replace(/\D/g, '').length === 11 ? 'CPF' : 'CNPJ';
  const formattedDocument = client.cpf_cnpj ? ` (${documentType}: ${client.cpf_cnpj})` : '';
  
  return `${client.name}${formattedDocument}`;
}
