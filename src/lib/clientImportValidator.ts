import { validateCPFCNPJ, getDocumentType } from './validation';

export interface ClientImportData {
  name?: string;
  email?: string;
  phone?: string;
  cpf_cnpj?: string;
  address?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
  birth_date?: string;
  gender?: string;
  notes?: string;
}

export interface ImportValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  data: ClientImportData;
  rowNumber?: number;
}

export interface ImportColumnMapping {
  [key: string]: keyof ClientImportData;
}

export const DEFAULT_COLUMN_MAPPING: ImportColumnMapping = {
  'nome': 'name',
  'name': 'name',
  'email': 'email',
  'telefone': 'phone',
  'phone': 'phone',
  'cpf': 'cpf_cnpj',
  'cnpj': 'cpf_cnpj',
  'cpf/cnpj': 'cpf_cnpj',
  'cpf_cnpj': 'cpf_cnpj',
  'endereço': 'address',
  'endereco': 'address',
  'address': 'address',
  'número': 'number',
  'numero': 'number',
  'number': 'number',
  'complemento': 'complement',
  'complement': 'complement',
  'bairro': 'neighborhood',
  'neighborhood': 'neighborhood',
  'cidade': 'city',
  'city': 'city',
  'estado': 'state',
  'state': 'state',
  'cep': 'cep',
  'zip': 'cep',
  'zipcode': 'cep',
  'data_nascimento': 'birth_date',
  'birth_date': 'birth_date',
  'nascimento': 'birth_date',
  'gênero': 'gender',
  'genero': 'gender',
  'gender': 'gender',
  'observações': 'notes',
  'observacoes': 'notes',
  'notes': 'notes',
};

export function validateClientImportData(
  data: ClientImportData,
  rowNumber?: number
): ImportValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields validation
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Nome é obrigatório e deve ter pelo menos 2 caracteres');
  }

  if (!data.email && !data.phone && !data.cpf_cnpj) {
    errors.push('Pelo menos um dos campos (email, telefone, CPF/CNPJ) é obrigatório');
  }

  // Email validation
  if (data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push('Email inválido');
    }
  }

  // Phone validation
  if (data.phone) {
    const cleanPhone = data.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      errors.push('Telefone deve ter 10 ou 11 dígitos');
    }
  }

  // CPF/CNPJ validation
  if (data.cpf_cnpj) {
    const cleanDoc = data.cpf_cnpj.replace(/\D/g, '');
    if (!validateCPFCNPJ(cleanDoc)) {
      errors.push('CPF/CNPJ inválido');
    }
  }

  // CEP validation
  if (data.cep) {
    const cleanCep = data.cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      errors.push('CEP deve ter 8 dígitos');
    }
  }

  // Birth date validation
  if (data.birth_date) {
    const birthDate = new Date(data.birth_date);
    const today = new Date();
    const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
    const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());

    if (isNaN(birthDate.getTime())) {
      errors.push('Data de nascimento inválida');
    } else if (birthDate < minDate || birthDate > maxDate) {
      warnings.push('Data de nascimento fora do intervalo esperado (18-120 anos)');
    }
  }

  // Gender validation
  if (data.gender) {
    const validGenders = ['masculino', 'feminino', 'outro', 'male', 'female', 'other', 'm', 'f'];
    if (!validGenders.includes(data.gender.toLowerCase())) {
      warnings.push('Gênero não reconhecido');
    }
  }

  // State validation
  if (data.state) {
    const validStates = [
      'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
      'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
      'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    ];
    if (!validStates.includes(data.state.toUpperCase())) {
      warnings.push('Sigla de estado inválida');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    data,
    rowNumber,
  };
}

export function detectColumnMapping(headers: string[]): ImportColumnMapping {
  const mapping: ImportColumnMapping = {};
  
  headers.forEach(header => {
    const normalizedHeader = header.toLowerCase().trim();
    const mappedField = DEFAULT_COLUMN_MAPPING[normalizedHeader];
    
    if (mappedField) {
      mapping[header] = mappedField;
    }
  });

  return mapping;
}

export function mapRowToClientData(
  row: string[],
  headers: string[],
  mapping: ImportColumnMapping
): ClientImportData {
  const data: ClientImportData = {};

  headers.forEach((header, index) => {
    const mappedField = mapping[header];
    if (mappedField && row[index]) {
      const value = row[index].trim();
      if (value) {
        data[mappedField] = value;
      }
    }
  });

  return data;
}

export function findDuplicateClients(
  clients: ClientImportData[],
  existingClients: Array<{ cpf_cnpj?: string; email?: string; phone?: string }>
): { duplicates: number[]; unique: ClientImportData[] } {
  const duplicates: number[] = [];
  const unique: ClientImportData[] = [];

  clients.forEach((client, index) => {
    const isDuplicate = existingClients.some(existing => {
      if (client.cpf_cnpj && existing.cpf_cnpj) {
        return client.cpf_cnpj.replace(/\D/g, '') === existing.cpf_cnpj.replace(/\D/g, '');
      }
      if (client.email && existing.email) {
        return client.email.toLowerCase() === existing.email.toLowerCase();
      }
      if (client.phone && existing.phone) {
        return client.phone.replace(/\D/g, '') === existing.phone.replace(/\D/g, '');
      }
      return false;
    });

    if (isDuplicate) {
      duplicates.push(index);
    } else {
      unique.push(client);
    }
  });

  return { duplicates, unique };
}

export function generateImportReport(
  results: ImportValidationResult[]
): {
  total: number;
  valid: number;
  invalid: number;
  withWarnings: number;
  errors: string[];
  summary: string;
} {
  const total = results.length;
  const valid = results.filter(r => r.isValid).length;
  const invalid = results.filter(r => !r.isValid).length;
  const withWarnings = results.filter(r => r.warnings.length > 0).length;

  const allErrors = results.flatMap(r => r.errors);
  const errorCounts = allErrors.reduce((acc, error) => {
    acc[error] = (acc[error] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topErrors = Object.entries(errorCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([error, count]) => `${error} (${count}x)`);

  const summary = `Total: ${total} | Válidos: ${valid} | Inválidos: ${invalid} | Com avisos: ${withWarnings}`;

  return {
    total,
    valid,
    invalid,
    withWarnings,
    errors: topErrors,
    summary,
  };
}
