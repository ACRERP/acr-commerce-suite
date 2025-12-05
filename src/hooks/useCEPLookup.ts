import { useState, useCallback, useEffect } from 'react';
import { CEPAddress, validateCEP, lookupCEPWithCache, maskCEP, CEPValidationResult } from '@/lib/cep';

export interface UseCEPLookupOptions {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  autoLookup?: boolean;
  lookupDelay?: number;
  cacheEnabled?: boolean;
  required?: boolean;
  timeout?: number;
  retries?: number;
}

export interface UseCEPLookupReturn {
  value: string;
  setValue: (value: string) => void;
  isValid: boolean;
  validationMessage?: string;
  formattedValue?: string;
  address?: CEPAddress;
  isValidating: boolean;
  isValidated: boolean;
  validate: () => CEPValidationResult;
  reset: () => void;
  clearAddress: () => void;
  handleInputChange: (value: string) => string;
  handleBlur: () => void;
  lookup: () => Promise<CEPValidationResult>;
}

export function useCEPLookup(
  initialValue: string = '',
  options: UseCEPLookupOptions = {}
): UseCEPLookupReturn {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    autoLookup = true,
    lookupDelay = 1000,
    cacheEnabled = true,
    required = false,
    timeout = 10000,
    retries = 3,
  } = options;

  const [value, setValue] = useState(initialValue);
  const [validation, setValidation] = useState<CEPValidationResult>({ isValid: true });
  const [isValidating, setIsValidating] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [lookupTimeout, setLookupTimeout] = useState<NodeJS.Timeout | null>(null);

  const validate = useCallback((): CEPValidationResult => {
    setIsValidating(true);

    try {
      if (!value || value.trim() === '') {
        const result = required 
          ? { isValid: false, message: 'CEP é obrigatório' }
          : { isValid: true };
        setValidation(result);
        setIsValidating(false);
        return result;
      }

      const result = validateCEP(value);
      setValidation(result);
      setIsValidating(false);
      setIsValidated(true);
      return result;
    } catch (error) {
      const errorResult = { isValid: false, message: 'Erro na validação' };
      setValidation(errorResult);
      setIsValidating(false);
      return errorResult;
    }
  }, [value, required]);

  const lookup = useCallback(async (): Promise<CEPValidationResult> => {
    const cleanValue = value.replace(/\D/g, '');
    
    if (cleanValue.length !== 8) {
      const result = { isValid: false, message: 'CEP deve ter 8 dígitos' };
      setValidation(result);
      return result;
    }

    setIsValidating(true);

    try {
      const result = cacheEnabled 
        ? await lookupCEPWithCache(value, { timeout, retries })
        : await lookupCEPWithCache(value, { timeout, retries });

      setValidation(result);
      setIsValidated(true);
      setIsValidating(false);
      return result;
    } catch (error) {
      const errorResult = { 
        isValid: false, 
        message: error instanceof Error ? error.message : 'Erro na consulta do CEP' 
      };
      setValidation(errorResult);
      setIsValidating(false);
      return errorResult;
    }
  }, [value, cacheEnabled, timeout, retries]);

  const handleInputChange = useCallback((inputValue: string): string => {
    const maskedValue = maskCEP(inputValue);
    setValue(maskedValue);

    if (validateOnChange) {
      // Debounce validation for better UX
      if (lookupTimeout) {
        clearTimeout(lookupTimeout);
      }

      const timeout = setTimeout(() => {
        validate();
      }, 300);

      setLookupTimeout(timeout);
    }

    // Auto-lookup if enabled and CEP is complete
    if (autoLookup && maskedValue.replace(/\D/g, '').length === 8) {
      if (lookupTimeout) {
        clearTimeout(lookupTimeout);
      }

      const lookupTimeoutId = setTimeout(() => {
        lookup();
      }, lookupDelay);

      setLookupTimeout(lookupTimeoutId);
    }

    return maskedValue;
  }, [validateOnChange, autoLookup, lookupDelay, validate, lookup, lookupTimeout]);

  const handleBlur = useCallback(() => {
    if (validateOnBlur) {
      validate();
    }
  }, [validateOnBlur, validate]);

  const reset = useCallback(() => {
    setValue('');
    setValidation({ isValid: true });
    setIsValidating(false);
    setIsValidated(false);
    if (lookupTimeout) {
      clearTimeout(lookupTimeout);
      setLookupTimeout(null);
    }
  }, [lookupTimeout]);

  const clearAddress = useCallback(() => {
    setValidation(prev => ({ ...prev, address: undefined }));
    setIsValidated(false);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (lookupTimeout) {
        clearTimeout(lookupTimeout);
      }
    };
  }, [lookupTimeout]);

  return {
    value,
    setValue,
    isValid: validation.isValid,
    validationMessage: validation.message,
    formattedValue: validation.formatted,
    address: validation.address,
    isValidating,
    isValidated,
    validate,
    reset,
    clearAddress,
    handleInputChange,
    handleBlur,
    lookup,
  };
}

// Hook for multiple CEP lookups (bulk operations)
export function useBulkCEPLookup() {
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [results, setResults] = useState<Map<string, CEPValidationResult>>(new Map());

  const lookupMultiple = useCallback(async (ceps: string[]): Promise<Map<string, CEPValidationResult>> => {
    setIsLookingUp(true);
    const resultsMap = new Map<string, CEPValidationResult>();

    try {
      // Lookup CEPs in parallel with concurrency limit
      const concurrencyLimit = 5;
      const chunks = [];
      
      for (let i = 0; i < ceps.length; i += concurrencyLimit) {
        chunks.push(ceps.slice(i, i + concurrencyLimit));
      }

      for (const chunk of chunks) {
        const promises = chunk.map(async (cep) => {
          try {
            const result = await lookupCEPWithCache(cep);
            return { cep, result };
          } catch (error) {
            const errorResult: CEPValidationResult = {
              isValid: false,
              message: error instanceof Error ? error.message : 'Erro na consulta',
            };
            return { cep, result: errorResult };
          }
        });

        const chunkResults = await Promise.all(promises);
        chunkResults.forEach(({ cep, result }) => {
          resultsMap.set(cep, result);
        });
      }

      setResults(resultsMap);
      return resultsMap;
    } finally {
      setIsLookingUp(false);
    }
  }, []);

  const getValidCEPs = useCallback((ceps: string[]): string[] => {
    return ceps.filter(cep => {
      const result = results.get(cep);
      return result?.isValid;
    });
  }, [results]);

  const getInvalidCEPs = useCallback((ceps: string[]): Array<{ cep: string; error?: string }> => {
    return ceps
      .map(cep => {
        const result = results.get(cep);
        return {
          cep,
          isValid: result?.isValid || false,
          error: result?.message,
        };
      })
      .filter(item => !item.isValid);
  }, [results]);

  return {
    lookupMultiple,
    isLookingUp,
    results,
    getValidCEPs,
    getInvalidCEPs,
  };
}

// Hook for CEP statistics
export function useCEPStatistics() {
  const [statistics, setStatistics] = useState({
    totalLookups: 0,
    successfulLookups: 0,
    failedLookups: 0,
    averageLookupTime: 0,
    mostCommonStates: new Map<string, number>(),
  });

  const recordLookup = useCallback((result: CEPValidationResult, lookupTime: number) => {
    setStatistics(prev => {
      const newStats = { ...prev };
      newStats.totalLookups++;

      if (result.isValid) {
        newStats.successfulLookups++;
        
        // Track state statistics
        if (result.address?.uf) {
          const state = result.address.uf;
          const currentCount = newStats.mostCommonStates.get(state) || 0;
          newStats.mostCommonStates.set(state, currentCount + 1);
        }
      } else {
        newStats.failedLookups++;
      }

      // Update average lookup time
      newStats.averageLookupTime = 
        (prev.averageLookupTime * (prev.totalLookups - 1) + lookupTime) / prev.totalLookups;

      return newStats;
    });
  }, []);

  const resetStatistics = useCallback(() => {
    setStatistics({
      totalLookups: 0,
      successfulLookups: 0,
      failedLookups: 0,
      averageLookupTime: 0,
      mostCommonStates: new Map(),
    });
  }, []);

  return {
    statistics,
    recordLookup,
    resetStatistics,
  };
}
