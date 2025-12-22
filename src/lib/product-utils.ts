
/**
 * Gera um código EAN-13 válido com dígito verificador.
 * O prefixo 789 é do Brasil, mas usaremos um prefixo interno (200-299) para produtos in-store
 * para evitar colisão com produtos reais, ou deixamos aleatório se for apenas dummy.
 * Para uso real, a empresa deveria ter um prefixo GS1.
 * Aqui geraremos um "Internal Use" EAN começando com 2 (prefixo reservado para uso interno em varíavel de peso, mas comum em sistemas internos).
 */
export const generateEAN13 = (): string => {
  // Prefixo 2 + 11 dígitos aleatórios
  let code = "2";
  for (let i = 0; i < 11; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }

  // Calcular dígito verificador
  const checksum = calculateEAN13Checksum(code);
  return code + checksum;
};

/**
 * Calcula o dígito verificador de um código EAN-13 (sem o último dígito).
 */
const calculateEAN13Checksum = (code: string): number => {
  if (code.length !== 12) {
    throw new Error("O código deve ter 12 dígitos para calcular o checksum EAN-13");
  }

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(code[i]);
    // Posições ímpares (0, 2, 4...) peso 1. Posições pares (1, 3, 5...) peso 3.
    // Como string é 0-indexed:
    // Index 0 (1º dígito) -> Peso 1
    // Index 1 (2º dígito) -> Peso 3
    const weight = i % 2 === 0 ? 1 : 3;
    sum += digit * weight;
  }

  const remainder = sum % 10;
  const checkDigit = remainder === 0 ? 0 : 10 - remainder;

  return checkDigit;
};

/**
 * Gera um SKU aleatório simples (ex: PROD-1234)
 */
export const generateSKU = (prefix: string = "PROD"): string => {
  const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const randomChar = chars.charAt(Math.floor(Math.random() * chars.length)) + chars.charAt(Math.floor(Math.random() * chars.length));
  
  return `${prefix}-${randomChar}${randomPart}`;
};
