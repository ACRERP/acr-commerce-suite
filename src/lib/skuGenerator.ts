// Generate SKU (Stock Keeping Unit) for products
export interface SKUOptions {
  category?: string;
  brand?: string;
  name?: string;
  customPrefix?: string;
}

export function generateSKU(options: SKUOptions = {}): string {
  const { category, brand, name, customPrefix } = options;
  
  let prefix = customPrefix || 'PRD';
  
  // Use category prefix if available
  if (category) {
    prefix = category
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 3);
  }
  
  // Use brand prefix if available and no category
  if (!category && brand) {
    prefix = brand
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 3);
  }
  
  // Generate timestamp-based suffix
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // Last 2 digits
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const time = now.getTime().toString().slice(-4); // Last 4 digits of timestamp
  
  // Generate name-based hash if name is provided
  let nameHash = '';
  if (name) {
    const nameClean = name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 4);
    nameHash = nameClean.padEnd(4, 'X').substring(0, 4);
  }
  
  // Combine all parts
  const sku = `${prefix}-${year}${month}${day}-${nameHash}${time}`;
  
  return sku;
}

// Generate SKU based on existing products to avoid duplicates
export async function generateUniqueSKU(
  options: SKUOptions = {},
  existingSKUs: string[] = []
): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const sku = generateSKU(options);
    
    // Check if SKU already exists
    if (!existingSKUs.includes(sku)) {
      return sku;
    }
    
    // Add random suffix to make it unique
    const randomSuffix = Math.random().toString(36).substring(2, 4).toUpperCase();
    const uniqueSKU = `${sku}-${randomSuffix}`;
    
    if (!existingSKUs.includes(uniqueSKU)) {
      return uniqueSKU;
    }
    
    attempts++;
  }
  
  // Fallback: generate with timestamp and random
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PRD-${timestamp}-${random}`;
}

// Validate SKU format
export function validateSKU(sku: string): {
  isValid: boolean;
  error?: string;
} {
  if (!sku || sku.trim().length === 0) {
    return {
      isValid: false,
      error: 'SKU não pode estar vazio'
    };
  }
  
  if (sku.length > 20) {
    return {
      isValid: false,
      error: 'SKU não pode ter mais de 20 caracteres'
    };
  }
  
  // Check for invalid characters
  const validPattern = /^[A-Z0-9\-]+$/;
  if (!validPattern.test(sku.toUpperCase())) {
    return {
      isValid: false,
      error: 'SKU deve conter apenas letras, números e hífens'
    };
  }
  
  return {
    isValid: true
  };
}

// Format SKU for display
export function formatSKU(sku: string): string {
  return sku.toUpperCase().trim();
}

// Extract information from SKU
export function parseSKU(sku: string): {
  prefix?: string;
  date?: string;
  suffix?: string;
} {
  const parts = sku.split('-');
  
  return {
    prefix: parts[0],
    date: parts[1],
    suffix: parts[2]
  };
}
