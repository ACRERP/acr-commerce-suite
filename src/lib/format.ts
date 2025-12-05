// Format currency values
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Format date and time
export interface FormatDateTimeOptions {
  dateOnly?: boolean;
  timeOnly?: boolean;
  short?: boolean;
}

export function formatDateTime(dateString: string, options: FormatDateTimeOptions = {}): string {
  const date = new Date(dateString);
  
  if (options.dateOnly) {
    return date.toLocaleDateString('pt-BR');
  }
  
  if (options.timeOnly) {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  if (options.short) {
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Format phone numbers
export function formatPhone(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's a mobile or landline
  if (cleaned.length === 11) {
    // Mobile: (XX) XXXXX-XXXX
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 10) {
    // Landline: (XX) XXXX-XXXX
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  // Return original if format doesn't match
  return phone;
}

// Format CPF/CNPJ
export function formatDocument(doc: string): string {
  // Remove all non-numeric characters
  const cleaned = doc.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    // CPF: XXX.XXX.XXX-XX
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (cleaned.length === 14) {
    // CNPJ: XX.XXX.XXX/XXXX-XX
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  
  // Return original if format doesn't match
  return doc;
}

// Format CEP
export function formatCEP(cep: string): string {
  // Remove all non-numeric characters
  const cleaned = cep.replace(/\D/g, '');
  
  if (cleaned.length === 8) {
    // CEP: XXXXX-XXX
    return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
  
  // Return original if format doesn't match
  return cep;
}

// Format large numbers with abbreviations
export function formatNumber(value: number): string {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  } else if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  }
  return value.toString();
}

// Format percentage
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}
