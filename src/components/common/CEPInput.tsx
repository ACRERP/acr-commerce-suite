import React, { useState, useEffect, forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CEPAddress, validateCEP, lookupCEPWithCache, maskCEP, CEPValidationResult } from '@/lib/cep';
import { AlertCircle, CheckCircle, Search, MapPin, Loader2 } from 'lucide-react';

interface CEPInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  placeholder?: string;
  required?: boolean;
  validateOnChange?: boolean;
  showValidationIcon?: boolean;
  onValidationChange?: (result: CEPValidationResult) => void;
  onAddressFound?: (address: CEPAddress) => void;
  onLookupStart?: () => void;
  onLookupEnd?: () => void;
  className?: string;
  inputClassName?: string;
  showLookupButton?: boolean;
  lookupButtonText?: string;
  autoLookup?: boolean;
  lookupDelay?: number;
}

export const CEPInput = forwardRef<HTMLInputElement, CEPInputProps>(
  (
    {
      label,
      placeholder = '00000-000',
      required = false,
      validateOnChange = true,
      showValidationIcon = true,
      onValidationChange,
      onAddressFound,
      onLookupStart,
      onLookupEnd,
      className,
      inputClassName,
      showLookupButton = true,
      lookupButtonText = 'Buscar',
      autoLookup = true,
      lookupDelay = 1000,
      value,
      onChange,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState('');
    const [validation, setValidation] = useState<CEPValidationResult>({ isValid: true });
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [lookupTimeout, setLookupTimeout] = useState<NodeJS.Timeout | null>(null);

    // Determine which value to use (controlled or uncontrolled)
    const currentValue = value !== undefined ? value : internalValue;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const maskedValue = maskCEP(e.target.value);
      
      if (value === undefined) {
        setInternalValue(maskedValue);
      }

      // Call original onChange if provided
      if (onChange) {
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: maskedValue
          }
        };
        onChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
      }

      // Validate on change if enabled
      if (validateOnChange && maskedValue) {
        const validationResult = validateCEP(maskedValue);
        setValidation(validationResult);
        onValidationChange?.(validationResult);
      }

      // Auto-lookup if enabled and CEP is complete
      if (autoLookup && maskedValue.replace(/\D/g, '').length === 8) {
        if (lookupTimeout) {
          clearTimeout(lookupTimeout);
        }

        const timeout = setTimeout(() => {
          handleLookup(maskedValue);
        }, lookupDelay);

        setLookupTimeout(timeout);
      }
    };

    const handleLookup = async (cepValue?: string) => {
      const cepToLookup = cepValue || currentValue;
      
      if (!cepToLookup || cepToLookup.replace(/\D/g, '').length !== 8) {
        return;
      }

      setIsLookingUp(true);
      onLookupStart?.();

      try {
        const result = await lookupCEPWithCache(cepToLookup);
        
        setValidation(result);
        onValidationChange?.(result);

        if (result.isValid && result.address) {
          onAddressFound?.(result.address);
        }
      } catch (error) {
        const errorResult: CEPValidationResult = {
          isValid: false,
          message: error instanceof Error ? error.message : 'Erro na consulta',
        };
        setValidation(errorResult);
        onValidationChange?.(errorResult);
      } finally {
        setIsLookingUp(false);
        onLookupEnd?.();
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);

      // Validate on blur
      if (currentValue) {
        const validationResult = validateCEP(currentValue);
        setValidation(validationResult);
        onValidationChange?.(validationResult);
      }

      // Call original onBlur if provided
      onBlur?.(e);
    };

    const handleFocus = () => {
      setIsFocused(true);
    };

    const handleManualLookup = () => {
      handleLookup();
    };

    // Cleanup timeout on unmount
    useEffect(() => {
      return () => {
        if (lookupTimeout) {
          clearTimeout(lookupTimeout);
        }
      };
    }, [lookupTimeout]);

    // Get validation icon
    const getValidationIcon = () => {
      if (!showValidationIcon || !currentValue || isFocused) return null;

      if (isLookingUp) {
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      }

      if (validation.isValid) {
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      } else {
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      }
    };

    // Get input classes
    const getInputClasses = () => {
      const baseClasses = showLookupButton ? "pr-20" : "pr-10"; // Space for button or icon
      
      if (!showValidationIcon && !showLookupButton) {
        return cn(baseClasses, inputClassName);
      }

      if (validation.isValid) {
        return cn(baseClasses, "border-green-500 focus:border-green-500", inputClassName);
      } else if (!validation.isValid && currentValue && !isFocused) {
        return cn(baseClasses, "border-red-500 focus:border-red-500", inputClassName);
      }

      return cn(baseClasses, inputClassName);
    };

    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <Label className="text-sm font-medium">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        
        <div className="relative">
          {/* CEP icon */}
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
            <MapPin className="h-4 w-4 text-gray-400" />
          </div>

          {/* Input */}
          <Input
            {...props}
            ref={ref}
            type="text"
            value={currentValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            placeholder={placeholder}
            className={cn("pl-10", getInputClasses())}
            maxLength={9} // Max length for formatted CEP
            disabled={isLookingUp}
          />

          {/* Lookup button */}
          {showLookupButton && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleManualLookup}
              disabled={isLookingUp || currentValue.replace(/\D/g, '').length !== 8}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 px-2 text-xs"
            >
              {isLookingUp ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Search className="h-3 w-3" />
              )}
            </Button>
          )}

          {/* Validation icon (when no lookup button) */}
          {showValidationIcon && !showLookupButton && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10">
              {getValidationIcon()}
            </div>
          )}
        </div>

        {/* Validation message */}
        {validation.message && !validation.isValid && !isFocused && currentValue && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{validation.message}</span>
          </div>
        )}

        {/* Address preview */}
        {validation.address && validation.isValid && (
          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
            <div className="font-medium mb-1">Endereço encontrado:</div>
            <div className="space-y-1">
              <div>{validation.address.logradouro}</div>
              {validation.address.complemento && (
                <div>Complemento: {validation.address.complemento}</div>
              )}
              <div>{validation.address.bairro}</div>
              <div>{validation.address.localidade} - {validation.address.uf}</div>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isLookingUp && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Consultando CEP...</span>
          </div>
        )}
      </div>
    );
  }
);

CEPInput.displayName = 'CEPInput';

// Quick CEP field for forms
export function CEPField({
  name,
  control,
  label = "CEP",
  required = false,
  placeholder = "00000-000",
  className,
  ...props
}: {
  name: string;
  control: any; // React Hook Form control - keeping as any since it's a third-party library
  label?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
} & Omit<CEPInputProps, 'value' | 'onChange' | 'onBlur'>) {
  // This would be used with React Hook Form
  // For now, we'll return a basic implementation
  return (
    <CEPInput
      label={label}
      required={required}
      placeholder={placeholder}
      className={className}
      {...props}
    />
  );
}

// Address display component
export function AddressDisplay({ 
  address, 
  showComplement = true,
  className 
}: { 
  address: CEPAddress;
  showComplement?: boolean;
  className?: string;
}) {
  if (!address) return null;

  return (
    <div className={cn("text-sm space-y-1", className)}>
      <div className="font-medium">{address.logradouro}</div>
      {showComplement && address.complemento && (
        <div className="text-gray-600">Complemento: {address.complemento}</div>
      )}
      <div className="text-gray-600">{address.bairro}</div>
      <div className="text-gray-600">
        {address.localidade} - {address.uf}
      </div>
    </div>
  );
}
