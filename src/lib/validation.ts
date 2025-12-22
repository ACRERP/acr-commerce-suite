// CPF/CNPJ Validation Utilities

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  formatted?: string;
}

/**
 * Validates Brazilian CPF (Cadastro de Pessoas Físicas)
 * @param cpf CPF string (can be formatted or unformatted)
 * @returns ValidationResult with validation status and message
 */
export function validateCPF(cpf: string): ValidationResult {
  if (!cpf) {
    return { isValid: false, message: 'CPF é obrigatório' };
  }

  // Remove all non-numeric characters
  const cleanCPF = cpf.replace(/\D/g, '');

  // Check if it has 11 digits
  if (cleanCPF.length !== 11) {
    return { isValid: false, message: 'CPF deve ter 11 dígitos' };
  }

  // Check if all digits are the same (invalid CPFs)
  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    return { isValid: false, message: 'CPF inválido' };
  }

  // Calculate first verification digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  const firstDigit = remainder === 10 || remainder === 11 ? 0 : remainder;

  if (firstDigit !== parseInt(cleanCPF.charAt(9))) {
    return { isValid: false, message: 'CPF inválido' };
  }

  // Calculate second verification digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  const secondDigit = remainder === 10 || remainder === 11 ? 0 : remainder;

  if (secondDigit !== parseInt(cleanCPF.charAt(10))) {
    return { isValid: false, message: 'CPF inválido' };
  }

  // Format CPF
  const formatted = cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

  return { isValid: true, formatted };
}

/**
 * Validates Brazilian CNPJ (Cadastro Nacional da Pessoa Jurídica)
 * @param cnpj CNPJ string (can be formatted or unformatted)
 * @returns ValidationResult with validation status and message
 */
export function validateCNPJ(cnpj: string): ValidationResult {
  if (!cnpj) {
    return { isValid: false, message: 'CNPJ é obrigatório' };
  }

  // Remove all non-numeric characters
  const cleanCNPJ = cnpj.replace(/\D/g, '');

  // Check if it has 14 digits
  if (cleanCNPJ.length !== 14) {
    return { isValid: false, message: 'CNPJ deve ter 14 dígitos' };
  }

  // Check if all digits are the same (invalid CNPJs)
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) {
    return { isValid: false, message: 'CNPJ inválido' };
  }

  // Calculate first verification digit
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i];
  }
  let remainder = sum % 11;
  const firstDigit = remainder < 2 ? 0 : 11 - remainder;

  if (firstDigit !== parseInt(cleanCNPJ.charAt(12))) {
    return { isValid: false, message: 'CNPJ inválido' };
  }

  // Calculate second verification digit
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i];
  }
  remainder = sum % 11;
  const secondDigit = remainder < 2 ? 0 : 11 - remainder;

  if (secondDigit !== parseInt(cleanCNPJ.charAt(13))) {
    return { isValid: false, message: 'CNPJ inválido' };
  }

  // Format CNPJ
  const formatted = cleanCNPJ.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');

  return { isValid: true, formatted };
}

/**
 * Validates either CPF or CNPJ based on length
 * @param document Document string (CPF or CNPJ)
 * @returns ValidationResult with validation status and message
 */
export function validateCPFCNPJ(document: string): ValidationResult {
  if (!document) {
    return { isValid: false, message: 'Documento é obrigatório' };
  }

  const cleanDoc = document.replace(/\D/g, '');

  if (cleanDoc.length === 11) {
    return validateCPF(document);
  } else if (cleanDoc.length === 14) {
    return validateCNPJ(document);
  } else {
    return { isValid: false, message: 'Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos' };
  }
}

/**
 * Formats CPF or CNPJ string
 * @param document Document string (CPF or CNPJ)
 * @returns Formatted document string
 */
export function formatCPFCNPJ(document: string): string {
  if (!document) return '';

  const cleanDoc = document.replace(/\D/g, '');

  if (cleanDoc.length === 11) {
    return cleanDoc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (cleanDoc.length === 14) {
    return cleanDoc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }

  return document; // Return original if invalid length
}

/**
 * Checks if document is CPF (11 digits) or CNPJ (14 digits)
 * @param document Document string
 * @returns 'cpf', 'cnpj', or 'invalid'
 */
export function getDocumentType(document: string): 'cpf' | 'cnpj' | 'invalid' {
  if (!document) return 'invalid';

  const cleanDoc = document.replace(/\D/g, '');

  if (cleanDoc.length === 11) {
    return 'cpf';
  } else if (cleanDoc.length === 14) {
    return 'cnpj';
  }

  return 'invalid';
}

/**
 * Masks CPF or CNPJ input during typing
 * @param value Input value
 * @returns Masked value
 */
export function maskCPFCNPJ(value: string): string {
  if (!value) return '';

  const cleanValue = value.replace(/\D/g, '');

  if (cleanValue.length <= 11) {
    // CPF mask
    return cleanValue
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  } else {
    // CNPJ mask
    return cleanValue
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  }
}

/**
 * Generates test CPFs for development (NOT FOR PRODUCTION USE)
 * @returns Valid test CPF
 */
export function generateTestCPF(): string {
  // Generate 9 random digits
  let cpf = '';
  for (let i = 0; i < 9; i++) {
    cpf += Math.floor(Math.random() * 10).toString();
  }

  // Calculate first verification digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  const firstDigit = remainder === 10 || remainder === 11 ? 0 : remainder;
  cpf += firstDigit;

  // Calculate second verification digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  const secondDigit = remainder === 10 || remainder === 11 ? 0 : remainder;
  cpf += secondDigit;

  return formatCPFCNPJ(cpf);
}

/**
 * Generates test CNPJs for development (NOT FOR PRODUCTION USE)
 * @returns Valid test CNPJ
 */
export function generateTestCNPJ(): string {
  // Generate 12 random digits
  let cnpj = '';
  for (let i = 0; i < 12; i++) {
    cnpj += Math.floor(Math.random() * 10).toString();
  }

  // Calculate first verification digit
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpj.charAt(i)) * weights1[i];
  }
  let remainder = sum % 11;
  const firstDigit = remainder < 2 ? 0 : 11 - remainder;
  cnpj += firstDigit;

  // Calculate second verification digit
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cnpj.charAt(i)) * weights2[i];
  }
  remainder = sum % 11;
  const secondDigit = remainder < 2 ? 0 : 11 - remainder;
  cnpj += secondDigit;

  return formatCPFCNPJ(cnpj);
}

// Common valid test documents for development
export const TEST_DOCUMENTS = {
  cpf: [
    '123.456.789-09',
    '111.444.777-35',
    '222.333.444-55',
    '333.222.111-00',
    '444.555.666-88'
  ],
  cnpj: [
    '12.345.678/0001-95',
    '11.222.333/0001-81',
    '22.333.444/0001-08',
    '33.444.555/0001-67',
    '44.555.666/0001-99'
  ]
};
