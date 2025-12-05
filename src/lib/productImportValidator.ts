export interface ProductImportData {
  name?: string;
  description?: string;
  sku?: string;
  barcode?: string;
  category?: string;
  price?: string;
  cost?: string;
  stock?: string;
  min_stock?: string;
  unit?: string;
  weight?: string;
  dimensions?: string;
  brand?: string;
  supplier?: string;
  ncm?: string;
  cest?: string;
  cfop?: string;
  icms_rate?: string;
  pis_rate?: string;
  cofins_rate?: string;
  active?: string;
  notes?: string;
}

export interface ImportValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  data: ProductImportData;
  rowNumber?: number;
}

export interface ImportColumnMapping {
  [key: string]: keyof ProductImportData;
}

export const DEFAULT_PRODUCT_COLUMN_MAPPING: ImportColumnMapping = {
  'nome': 'name',
  'name': 'name',
  'descrição': 'description',
  'descricao': 'description',
  'description': 'description',
  'sku': 'sku',
  'código': 'sku',
  'codigo': 'sku',
  'ean': 'barcode',
  'barcode': 'barcode',
  'código_barras': 'barcode',
  'categoria': 'category',
  'category': 'category',
  'preço': 'price',
  'preco': 'price',
  'price': 'price',
  'valor': 'price',
  'custo': 'cost',
  'cost': 'cost',
  'estoque': 'stock',
  'stock': 'stock',
  'estoque_minimo': 'min_stock',
  'min_stock': 'min_stock',
  'unidade': 'unit',
  'unit': 'unit',
  'peso': 'weight',
  'weight': 'weight',
  'dimensões': 'dimensions',
  'dimensoes': 'dimensions',
  'dimensions': 'dimensions',
  'marca': 'brand',
  'brand': 'brand',
  'fornecedor': 'supplier',
  'supplier': 'supplier',
  'ncm': 'ncm',
  'cest': 'cest',
  'cfop': 'cfop',
  'aliquota_icms': 'icms_rate',
  'icms_rate': 'icms_rate',
  'aliquota_pis': 'pis_rate',
  'pis_rate': 'pis_rate',
  'aliquota_cofins': 'cofins_rate',
  'cofins_rate': 'cofins_rate',
  'ativo': 'active',
  'active': 'active',
  'observações': 'notes',
  'observacoes': 'notes',
  'notes': 'notes',
};

export function validateProductImportData(
  data: ProductImportData,
  rowNumber?: number
): ImportValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields validation
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Nome é obrigatório e deve ter pelo menos 2 caracteres');
  }

  if (!data.sku || data.sku.trim().length < 2) {
    errors.push('SKU é obrigatório e deve ter pelo menos 2 caracteres');
  }

  // Price validation
  if (data.price) {
    const price = parseFloat(data.price.replace(',', '.'));
    if (isNaN(price) || price <= 0) {
      errors.push('Preço deve ser um número válido maior que 0');
    } else if (price > 999999.99) {
      warnings.push('Preço muito alto, verifique se está correto');
    }
  } else {
    errors.push('Preço é obrigatório');
  }

  // Cost validation
  if (data.cost) {
    const cost = parseFloat(data.cost.replace(',', '.'));
    if (isNaN(cost) || cost < 0) {
      errors.push('Custo deve ser um número válido maior ou igual a 0');
    } else if (data.price) {
      const price = parseFloat(data.price.replace(',', '.'));
      if (cost > price) {
        warnings.push('Custo maior que preço de venda, verifique margem');
      }
    }
  }

  // Stock validation
  if (data.stock) {
    const stock = parseInt(data.stock);
    if (isNaN(stock) || stock < 0) {
      errors.push('Estoque deve ser um número inteiro maior ou igual a 0');
    } else if (stock > 999999) {
      warnings.push('Estoque muito alto, verifique se está correto');
    }
  }

  // Min stock validation
  if (data.min_stock) {
    const minStock = parseInt(data.min_stock);
    if (isNaN(minStock) || minStock < 0) {
      errors.push('Estoque mínimo deve ser um número inteiro maior ou igual a 0');
    } else if (data.stock) {
      const stock = parseInt(data.stock);
      if (minStock > stock) {
        warnings.push('Estoque mínimo maior que estoque atual');
      }
    }
  }

  // Weight validation
  if (data.weight) {
    const weight = parseFloat(data.weight.replace(',', '.'));
    if (isNaN(weight) || weight <= 0) {
      errors.push('Peso deve ser um número válido maior que 0');
    } else if (weight > 1000) {
      warnings.push('Peso muito alto (maior que 1000kg), verifique unidade');
    }
  }

  // Unit validation
  if (data.unit) {
    const validUnits = ['un', 'kg', 'g', 'l', 'ml', 'm', 'cm', 'mm', 'caixa', 'pacote', 'par', 'dúzia'];
    if (!validUnits.includes(data.unit.toLowerCase())) {
      warnings.push('Unidade não reconhecida, unidades comuns: un, kg, g, l, ml, m, cm, mm');
    }
  }

  // NCM validation
  if (data.ncm) {
    const cleanNcm = data.ncm.replace(/\D/g, '');
    if (cleanNcm.length !== 8) {
      errors.push('NCM deve ter 8 dígitos');
    }
  }

  // Tax rates validation
  ['icms_rate', 'pis_rate', 'cofins_rate'].forEach(rateField => {
    const rate = data[rateField as keyof ProductImportData];
    if (rate) {
      const rateValue = parseFloat(rate.replace(',', '.'));
      if (isNaN(rateValue) || rateValue < 0 || rateValue > 100) {
        errors.push(`${rateField.replace('_', ' ')} deve ser um número entre 0 e 100`);
      }
    }
  });

  // Active field validation
  if (data.active) {
    const activeValue = data.active.toLowerCase();
    if (!['sim', 'não', 'nao', 'yes', 'no', 'true', 'false', '1', '0'].includes(activeValue)) {
      warnings.push('Campo "ativo" deve ser sim/não, true/false ou 1/0');
    }
  }

  // Category validation
  if (data.category && data.category.length > 50) {
    warnings.push('Nome da categoria muito longo, deve ter menos de 50 caracteres');
  }

  // Brand validation
  if (data.brand && data.brand.length > 50) {
    warnings.push('Nome da marca muito longo, deve ter menos de 50 caracteres');
  }

  // Description validation
  if (data.description && data.description.length > 500) {
    warnings.push('Descrição muito longa, deve ter menos de 500 caracteres');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    data,
    rowNumber,
  };
}

export function detectProductColumnMapping(headers: string[]): ImportColumnMapping {
  const mapping: ImportColumnMapping = {};
  
  headers.forEach(header => {
    const normalizedHeader = header.toLowerCase().trim();
    const mappedField = DEFAULT_PRODUCT_COLUMN_MAPPING[normalizedHeader];
    
    if (mappedField) {
      mapping[header] = mappedField;
    }
  });

  return mapping;
}

export function mapRowToProductData(
  row: string[],
  headers: string[],
  mapping: ImportColumnMapping
): ProductImportData {
  const data: ProductImportData = {};

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

export function findDuplicateProducts(
  products: ProductImportData[],
  existingProducts: Array<{ sku?: string; barcode?: string; name?: string }>
): { duplicates: number[]; unique: ProductImportData[] } {
  const duplicates: number[] = [];
  const unique: ProductImportData[] = [];

  products.forEach((product, index) => {
    const isDuplicate = existingProducts.some(existing => {
      if (product.sku && existing.sku) {
        return product.sku.toLowerCase() === existing.sku.toLowerCase();
      }
      if (product.barcode && existing.barcode) {
        return product.barcode.replace(/\D/g, '') === existing.barcode.replace(/\D/g, '');
      }
      if (product.name && existing.name) {
        return product.name.toLowerCase() === existing.name.toLowerCase();
      }
      return false;
    });

    if (isDuplicate) {
      duplicates.push(index);
    } else {
      unique.push(product);
    }
  });

  return { duplicates, unique };
}

export function generateProductImportReport(
  results: ImportValidationResult[]
): {
  total: number;
  valid: number;
  invalid: number;
  withWarnings: number;
  errors: string[];
  summary: string;
  estimatedRevenue: number;
  totalCost: number;
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

  // Calculate estimated revenue and cost
  const validResults = results.filter(r => r.isValid);
  const estimatedRevenue = validResults.reduce((sum, result) => {
    const price = parseFloat(result.data.price?.replace(',', '.') || '0');
    return sum + price;
  }, 0);

  const totalCost = validResults.reduce((sum, result) => {
    const cost = parseFloat(result.data.cost?.replace(',', '.') || '0');
    return sum + cost;
  }, 0);

  const summary = `Total: ${total} | Válidos: ${valid} | Inválidos: ${invalid} | Com avisos: ${withWarnings}`;

  return {
    total,
    valid,
    invalid,
    withWarnings,
    errors: topErrors,
    summary,
    estimatedRevenue,
    totalCost,
  };
}

export function generateProductSKU(name: string, category?: string): string {
  // Generate SKU based on name and category
  const nameCode = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 6);
  
  const categoryCode = category
    ? category.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 3)
    : 'GEN';
  
  const randomCode = Math.random().toString(36).substring(2, 5).toUpperCase();
  
  return `${categoryCode}-${nameCode}-${randomCode}`;
}

export function validateBarcode(barcode: string): boolean {
  // Basic barcode validation (EAN-13, UPC-A, etc.)
  const cleanBarcode = barcode.replace(/\D/g, '');
  
  // EAN-13 (13 digits)
  if (cleanBarcode.length === 13) {
    return validateEAN13(cleanBarcode);
  }
  
  // UPC-A (12 digits)
  if (cleanBarcode.length === 12) {
    return validateUPCA(cleanBarcode);
  }
  
  // Code 128 (variable length, but typically 6-20 digits)
  if (cleanBarcode.length >= 6 && cleanBarcode.length <= 20) {
    return true; // Basic validation for Code 128
  }
  
  return false;
}

function validateEAN13(barcode: string): boolean {
  const digits = barcode.split('').map(Number);
  const checkDigit = digits.pop();
  
  const sum = digits.reduce((acc, digit, index) => {
    return acc + digit * (index % 2 === 0 ? 1 : 3);
  }, 0);
  
  const calculatedCheck = (10 - (sum % 10)) % 10;
  
  return checkDigit === calculatedCheck;
}

function validateUPCA(barcode: string): boolean {
  const digits = barcode.split('').map(Number);
  const checkDigit = digits.pop();
  
  const sum = digits.reduce((acc, digit, index) => {
    return acc + digit * (index % 2 === 0 ? 3 : 1);
  }, 0);
  
  const calculatedCheck = (10 - (sum % 10)) % 10;
  
  return checkDigit === calculatedCheck;
}
