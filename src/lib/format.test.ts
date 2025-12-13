
import { describe, it, expect } from 'vitest';
import { 
  formatCurrency, 
  formatPhone, 
  formatDocument, 
  formatCEP, 
  formatNumber,
  formatPercentage 
} from './format';

describe('Formatting Utilities', () => {
  describe('formatCurrency', () => {
    it('should format BRL currency correctly', () => {
      expect(formatCurrency(100)).toContain('R$');
      expect(formatCurrency(100).replace(/\s/, ' ')).toBe('R$ 100,00');
      expect(formatCurrency(100.5)).toContain('100,50');
      expect(formatCurrency(0)).toContain('0,00');
    });
  });

  describe('formatPhone', () => {
    it('should format mobile phone', () => {
      expect(formatPhone('11999998888')).toBe('(11) 99999-8888');
    });

    it('should format landline phone', () => {
      expect(formatPhone('1133334444')).toBe('(11) 3333-4444');
    });

    it('should handle dirty input', () => {
      expect(formatPhone('(11) 99999-8888')).toBe('(11) 99999-8888');
      expect(formatPhone('11 99999 8888')).toBe('(11) 99999-8888');
    });

    it('should return original if incomplete', () => {
      expect(formatPhone('123')).toBe('123');
    });
  });

  describe('formatDocument', () => {
    it('should format CPF', () => {
      expect(formatDocument('12345678901')).toBe('123.456.789-01');
    });

    it('should format CNPJ', () => {
      expect(formatDocument('12345678000199')).toBe('12.345.678/0001-99');
    });

    it('should handle dirty input', () => {
      expect(formatDocument('123.456.789-01')).toBe('123.456.789-01');
    });
  });

  describe('formatCEP', () => {
    it('should format CEP', () => {
      expect(formatCEP('12345678')).toBe('12345-678');
    });
  });

  describe('formatNumber', () => {
    it('should format large numbers', () => {
      expect(formatNumber(1000)).toBe('1.0K');
      expect(formatNumber(1500)).toBe('1.5K');
      expect(formatNumber(1000000)).toBe('1.0M');
      expect(formatNumber(2500000)).toBe('2.5M');
    });

    it('should return string for small numbers', () => {
      expect(formatNumber(500)).toBe('500');
    });
  });

  describe('formatPercentage', () => {
      // Note: formatPercentage expects input like 100 for 100%
      it('should format percentage', () => {
          // 100 -> 100%
          // implementation divides by 100: 100/100 = 1, formatted as percent is 100%
          const res = formatPercentage(100);
          expect(res).toContain('%');
          // Exact text might depend on locale spaces
      });
  });
});
