import React, { useState, useEffect, forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { validateCPFCNPJ, maskCPFCNPJ, getDocumentType, ValidationResult } from '@/lib/validation';
import { AlertCircle, CheckCircle, User, Building } from 'lucide-react';

interface CPFCNPJInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  placeholder?: string;
  required?: boolean;
  validateOnChange?: boolean;
  showValidationIcon?: boolean;
  onValidationChange?: (result: ValidationResult) => void;
  className?: string;
  inputClassName?: string;
}

export const CPFCNPJInput = forwardRef<HTMLInputElement, CPFCNPJInputProps>(
  (
    {
      label,
      placeholder = 'CPF ou CNPJ',
      required = false,
      validateOnChange = true,
      showValidationIcon = true,
      onValidationChange,
      className,
      inputClassName,
      value,
      onChange,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState('');
    const [validation, setValidation] = useState<ValidationResult>({ isValid: true });
    const [isFocused, setIsFocused] = useState(false);

    // Determine which value to use (controlled or uncontrolled)
    const currentValue = value !== undefined ? value : internalValue;

    const documentType = getDocumentType(currentValue);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const maskedValue = maskCPFCNPJ(e.target.value);
      
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
        const validationResult = validateCPFCNPJ(maskedValue);
        setValidation(validationResult);
        onValidationChange?.(validationResult);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);

      // Validate on blur
      if (currentValue) {
        const validationResult = validateCPFCNPJ(currentValue);
        setValidation(validationResult);
        onValidationChange?.(validationResult);
      }

      // Call original onBlur if provided
      onBlur?.(e);
    };

    const handleFocus = () => {
      setIsFocused(true);
    };

    // Get validation icon
    const getValidationIcon = () => {
      if (!showValidationIcon || !currentValue || isFocused) return null;

      if (validation.isValid) {
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      } else {
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      }
    };

    // Get document type icon
    const getDocumentIcon = () => {
      if (documentType === 'cpf') {
        return <User className="h-4 w-4 text-gray-400" />;
      } else if (documentType === 'cnpj') {
        return <Building className="h-4 w-4 text-gray-400" />;
      }
      return null;
    };

    // Get input classes
    const getInputClasses = () => {
      const baseClasses = "pr-10"; // Space for validation icon
      
      if (!showValidationIcon) {
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
          {/* Document type icon */}
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
            {getDocumentIcon()}
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
            maxLength={18} // Max length for formatted CNPJ
          />

          {/* Validation icon */}
          {showValidationIcon && (
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

        {/* Document type hint */}
        {currentValue && documentType !== 'invalid' && isFocused && (
          <div className="text-xs text-gray-500">
            Digitando: {documentType === 'cpf' ? 'CPF' : 'CNPJ'}
          </div>
        )}
      </div>
    );
  }
);

CPFCNPJInput.displayName = 'CPFCNPJInput';

// Quick CPF/CNPJ field for forms
export function CPFCNPJField({
  name,
  control,
  label = "CPF/CNPJ",
  required = false,
  placeholder = "CPF ou CNPJ",
  className,
  ...props
}: {
  name: string;
  control: any; // React Hook Form control - keeping as any since it's a third-party library
  label?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
} & Omit<CPFCNPJInputProps, 'value' | 'onChange' | 'blur'>) {
  // This would be used with React Hook Form
  // For now, we'll return a basic implementation
  return (
    <CPFCNPJInput
      label={label}
      required={required}
      placeholder={placeholder}
      className={className}
      {...props}
    />
  );
}

// CPF-only input component
export const CPFInput = forwardRef<HTMLInputElement, Omit<CPFCNPJInputProps, 'placeholder'>>(
  (props, ref) => {
    return (
      <CPFCNPJInput
        {...props}
        ref={ref}
        placeholder="000.000.000-00"
        maxLength={14}
      />
    );
  }
);

CPFInput.displayName = 'CPFInput';

// CNPJ-only input component
export const CNPJInput = forwardRef<HTMLInputElement, Omit<CPFCNPJInputProps, 'placeholder'>>(
  (props, ref) => {
    return (
      <CPFCNPJInput
        {...props}
        ref={ref}
        placeholder="00.000.000/0000-00"
        maxLength={18}
      />
    );
  }
);

CNPJInput.displayName = 'CNPJInput';
