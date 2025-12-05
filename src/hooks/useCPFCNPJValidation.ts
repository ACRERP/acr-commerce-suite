import { useState, useCallback } from 'react';
import { validateCPFCNPJ, validateCPF, validateCNPJ, formatCPFCNPJ, maskCPFCNPJ, getDocumentType, ValidationResult } from '@/lib/validation';

export interface UseCPFCNPJValidationOptions {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  required?: boolean;
  allowEmpty?: boolean;
}

export interface UseCPFCNPJValidationReturn {
  value: string;
  setValue: (value: string) => void;
  isValid: boolean;
  validationMessage?: string;
  formattedValue?: string;
  documentType: 'cpf' | 'cnpj' | 'invalid';
  isValidating: boolean;
  validate: () => ValidationResult;
  reset: () => void;
  handleInputChange: (value: string) => string;
  handleBlur: () => void;
}

export function useCPFCNPJValidation(
  initialValue: string = '',
  options: UseCPFCNPJValidationOptions = {}
): UseCPFCNPJValidationReturn {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    required = false,
    allowEmpty = true,
  } = options;

  const [value, setValue] = useState(initialValue);
  const [validation, setValidation] = useState<ValidationResult>({ isValid: true });
  const [isValidating, setIsValidating] = useState(false);

  const documentType = getDocumentType(value);

  const validate = useCallback((): ValidationResult => {
    setIsValidating(true);

    try {
      if (!value || value.trim() === '') {
        const result = required 
          ? { isValid: false, message: 'Documento é obrigatório' }
          : { isValid: true };
        setValidation(result);
        setIsValidating(false);
        return result;
      }

      const result = validateCPFCNPJ(value);
      
      if (!allowEmpty && !result.isValid) {
        setValidation({ isValid: false, message: result.message || 'Documento inválido' });
      } else {
        setValidation(result);
      }

      setIsValidating(false);
      return result;
    } catch (error) {
      const errorResult = { isValid: false, message: 'Erro na validação' };
      setValidation(errorResult);
      setIsValidating(false);
      return errorResult;
    }
  }, [value, required, allowEmpty]);

  const handleInputChange = useCallback((inputValue: string): string => {
    const maskedValue = maskCPFCNPJ(inputValue);
    setValue(maskedValue);

    if (validateOnChange) {
      // Debounce validation for better UX
      setTimeout(() => {
        validate();
      }, 300);
    }

    return maskedValue;
  }, [validateOnChange, validate]);

  const handleBlur = useCallback(() => {
    if (validateOnBlur) {
      validate();
    }
  }, [validateOnBlur, validate]);

  const reset = useCallback(() => {
    setValue('');
    setValidation({ isValid: true });
    setIsValidating(false);
  }, []);

  return {
    value,
    setValue,
    isValid: validation.isValid,
    validationMessage: validation.message,
    formattedValue: validation.formatted,
    documentType,
    isValidating,
    validate,
    reset,
    handleInputChange,
    handleBlur,
  };
}

// Hook for CPF-only validation
export function useCPFValidation(
  initialValue: string = '',
  options: Omit<UseCPFCNPJValidationOptions, 'allowEmpty'> = {}
): UseCPFCNPJValidationReturn {
  const [value, setValue] = useState(initialValue);
  const [validation, setValidation] = useState<ValidationResult>({ isValid: true });
  const [isValidating, setIsValidating] = useState(false);

  const { validateOnChange = true, validateOnBlur = true, required = false } = options;

  const validate = useCallback((): ValidationResult => {
    setIsValidating(true);

    try {
      if (!value || value.trim() === '') {
        const result = required 
          ? { isValid: false, message: 'CPF é obrigatório' }
          : { isValid: true };
        setValidation(result);
        setIsValidating(false);
        return result;
      }

      const result = validateCPF(value);
      setValidation(result);
      setIsValidating(false);
      return result;
    } catch (error) {
      const errorResult = { isValid: false, message: 'Erro na validação do CPF' };
      setValidation(errorResult);
      setIsValidating(false);
      return errorResult;
    }
  }, [value, required]);

  const handleInputChange = useCallback((inputValue: string): string => {
    // CPF-specific masking
    const cleanValue = inputValue.replace(/\D/g, '').slice(0, 11);
    const maskedValue = cleanValue
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');

    setValue(maskedValue);

    if (validateOnChange) {
      setTimeout(() => {
        validate();
      }, 300);
    }

    return maskedValue;
  }, [validateOnChange, validate]);

  const handleBlur = useCallback(() => {
    if (validateOnBlur) {
      validate();
    }
  }, [validateOnBlur, validate]);

  const reset = useCallback(() => {
    setValue('');
    setValidation({ isValid: true });
    setIsValidating(false);
  }, []);

  return {
    value,
    setValue,
    isValid: validation.isValid,
    validationMessage: validation.message,
    formattedValue: validation.formatted,
    documentType: value.length === 11 ? 'cpf' : 'invalid',
    isValidating,
    validate,
    reset,
    handleInputChange,
    handleBlur,
  };
}

// Hook for CNPJ-only validation
export function useCNPJValidation(
  initialValue: string = '',
  options: Omit<UseCPFCNPJValidationOptions, 'allowEmpty'> = {}
): UseCPFCNPJValidationReturn {
  const [value, setValue] = useState(initialValue);
  const [validation, setValidation] = useState<ValidationResult>({ isValid: true });
  const [isValidating, setIsValidating] = useState(false);

  const { validateOnChange = true, validateOnBlur = true, required = false } = options;

  const validate = useCallback((): ValidationResult => {
    setIsValidating(true);

    try {
      if (!value || value.trim() === '') {
        const result = required 
          ? { isValid: false, message: 'CNPJ é obrigatório' }
          : { isValid: true };
        setValidation(result);
        setIsValidating(false);
        return result;
      }

      const result = validateCNPJ(value);
      setValidation(result);
      setIsValidating(false);
      return result;
    } catch (error) {
      const errorResult = { isValid: false, message: 'Erro na validação do CNPJ' };
      setValidation(errorResult);
      setIsValidating(false);
      return errorResult;
    }
  }, [value, required]);

  const handleInputChange = useCallback((inputValue: string): string => {
    // CNPJ-specific masking
    const cleanValue = inputValue.replace(/\D/g, '').slice(0, 14);
    const maskedValue = cleanValue
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');

    setValue(maskedValue);

    if (validateOnChange) {
      setTimeout(() => {
        validate();
      }, 300);
    }

    return maskedValue;
  }, [validateOnChange, validate]);

  const handleBlur = useCallback(() => {
    if (validateOnBlur) {
      validate();
    }
  }, [validateOnBlur, validate]);

  const reset = useCallback(() => {
    setValue('');
    setValidation({ isValid: true });
    setIsValidating(false);
  }, []);

  return {
    value,
    setValue,
    isValid: validation.isValid,
    validationMessage: validation.message,
    formattedValue: validation.formatted,
    documentType: value.length === 14 ? 'cnpj' : 'invalid',
    isValidating,
    validate,
    reset,
    handleInputChange,
    handleBlur,
  };
}

// Utility hook for bulk validation
export function useBulkCPFCNPJValidation() {
  const validateMultiple = useCallback((documents: string[]): ValidationResult[] => {
    return documents.map(doc => validateCPFCNPJ(doc));
  }, []);

  const getValidDocuments = useCallback((documents: string[]): string[] => {
    return documents.filter(doc => validateCPFCNPJ(doc).isValid);
  }, []);

  const getInvalidDocuments = useCallback((documents: string[]): Array<{ document: string; error?: string }> => {
    return documents
      .map(doc => {
        const validation = validateCPFCNPJ(doc);
        return {
          document: doc,
          isValid: validation.isValid,
          error: validation.message,
        };
      })
      .filter(result => !result.isValid);
  }, []);

  return {
    validateMultiple,
    getValidDocuments,
    getInvalidDocuments,
  };
}
