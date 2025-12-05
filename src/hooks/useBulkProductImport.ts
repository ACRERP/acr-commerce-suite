import { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { 
  parseProductImportFile, 
  processProductImportData, 
  ParsedImportData,
  downloadProductTemplate,
  generateProductImportTemplate,
  validateProductFile,
  estimateImportTime
} from '@/lib/productImportParser';
import { 
  validateProductImportData,
  findDuplicateProducts,
  generateProductImportReport,
  ImportValidationResult,
  ProductImportData,
  ImportColumnMapping
} from '@/lib/productImportValidator';

export interface ImportStep {
  id: 'upload' | 'mapping' | 'validation' | 'preview' | 'import';
  title: string;
  description: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

export interface ImportState {
  currentStep: number;
  file: File | null;
  parsedData: ParsedImportData | null;
  mapping: ImportColumnMapping;
  unmappedColumns: string[];
  products: ProductImportData[];
  validationResults: ImportValidationResult[];
  duplicates: number[];
  existingProducts: Array<{ sku?: string; barcode?: string; name?: string }>;
  isImporting: boolean;
  importResults: {
    success: number;
    failed: number;
    errors: string[];
    totalRevenue: number;
    totalCost: number;
  } | null;
  estimatedTime: {
    estimatedTime: number;
    message: string;
  } | null;
}

export interface UseBulkProductImportOptions {
  onImportComplete?: (results: { success: number; failed: number; totalRevenue: number }) => void;
  onError?: (error: string) => void;
}

export function useBulkProductImport(options: UseBulkProductImportOptions = {}) {
  const [importState, setImportState] = useState<ImportState>({
    currentStep: 0,
    file: null,
    parsedData: null,
    mapping: {},
    unmappedColumns: [],
    products: [],
    validationResults: [],
    duplicates: [],
    existingProducts: [],
    isImporting: false,
    importResults: null,
    estimatedTime: null,
  });

  const steps: ImportStep[] = [
    {
      id: 'upload',
      title: 'Upload do Arquivo',
      description: 'Selecione o arquivo com os dados dos produtos',
      isCompleted: importState.currentStep > 0,
      isCurrent: importState.currentStep === 0,
    },
    {
      id: 'mapping',
      title: 'Mapeamento de Colunas',
      description: 'Verifique e ajuste o mapeamento das colunas',
      isCompleted: importState.currentStep > 1,
      isCurrent: importState.currentStep === 1,
    },
    {
      id: 'validation',
      title: 'Validação',
      description: 'Verificação dos dados e identificação de erros',
      isCompleted: importState.currentStep > 2,
      isCurrent: importState.currentStep === 2,
    },
    {
      id: 'preview',
      title: 'Preview',
      description: 'Revise os dados antes da importação',
      isCompleted: importState.currentStep > 3,
      isCurrent: importState.currentStep === 3,
    },
    {
      id: 'import',
      title: 'Importação',
      description: 'Importe os produtos para o sistema',
      isCompleted: importState.currentStep > 4,
      isCurrent: importState.currentStep === 4,
    },
  ];

  // Query para buscar produtos existentes
  const { data: existingProducts = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      // Mock implementation - would fetch from actual API
      return [];
    },
  });

  // Mutation para importar produtos
  const importMutation = useMutation({
    mutationFn: async (productsToImport: ProductImportData[]) => {
      // Mock implementation - would send to actual API
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate some failures
      const successCount = Math.floor(productsToImport.length * 0.85);
      const failedCount = productsToImport.length - successCount;
      
      const totalRevenue = productsToImport.reduce((sum, product) => {
        const price = parseFloat(product.price?.replace(',', '.') || '0');
        return sum + price;
      }, 0);

      const totalCost = productsToImport.reduce((sum, product) => {
        const cost = parseFloat(product.cost?.replace(',', '.') || '0');
        return sum + cost;
      }, 0);
      
      return {
        success: successCount,
        failed: failedCount,
        errors: failedCount > 0 ? ['Erro simulado para demonstração'] : [],
        totalRevenue,
        totalCost,
      };
    },
    onSuccess: (results) => {
      setImportState(prev => ({
        ...prev,
        importResults: results,
        isImporting: false,
      }));
      
      toast({
        title: 'Importação Concluída',
        description: `${results.success} produtos importados com sucesso${results.failed > 0 ? `, ${results.failed} falhas` : ''}`,
      });

      options.onImportComplete?.({
        success: results.success,
        failed: results.failed,
        totalRevenue: results.totalRevenue,
      });
    },
    onError: (error) => {
      setImportState(prev => ({
        ...prev,
        isImporting: false,
      }));

      const errorMessage = error instanceof Error ? error.message : 'Erro na importação';
      toast({
        title: 'Erro na Importação',
        description: errorMessage,
        variant: 'destructive',
      });

      options.onError?.(errorMessage);
    },
  });

  const handleFileUpload = useCallback(async (file: File) => {
    // Validate file first
    const fileValidation = validateProductFile(file);
    if (!fileValidation.isValid) {
      toast({
        title: 'Arquivo Inválido',
        description: fileValidation.errors.join(', '),
        variant: 'destructive',
      });
      return;
    }

    setImportState(prev => ({ ...prev, file }));

    try {
      const parseResult = await parseProductImportFile(file);
      
      if (!parseResult.success || !parseResult.data) {
        throw new Error(parseResult.error || 'Erro ao processar arquivo');
      }

      // Estimate import time
      const timeEstimation = estimateImportTime(file.size, parseResult.data.totalRows);

      const { products, mapping, unmappedColumns } = processProductImportData(parseResult.data);

      setImportState(prev => ({
        ...prev,
        parsedData: parseResult.data,
        products,
        mapping,
        unmappedColumns,
        existingProducts: existingProducts,
        estimatedTime: timeEstimation,
      }));

      // Avançar para próximo passo
      setImportState(prev => ({ ...prev, currentStep: 1 }));

      toast({
        title: 'Arquivo Processado',
        description: `${parseResult.data.totalRows} produtos encontrados • ${timeEstimation.message}`,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao processar arquivo';
      toast({
        title: 'Erro no Arquivo',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [existingProducts]);

  const updateMapping = useCallback((newMapping: ImportColumnMapping) => {
    if (!importState.parsedData) return;

    const { products } = processProductImportData(importState.parsedData, newMapping);

    setImportState(prev => ({
      ...prev,
      mapping: newMapping,
      products,
    }));
  }, [importState.parsedData]);

  const validateData = useCallback(() => {
    const validationResults = importState.products.map((product, index) =>
      validateProductImportData(product, index + 1)
    );

    const { duplicates, unique } = findDuplicateProducts(
      validationResults.filter(r => r.isValid).map(r => r.data),
      importState.existingProducts
    );

    setImportState(prev => ({
      ...prev,
      validationResults,
      duplicates,
    }));

    // Avançar para próximo passo
    setImportState(prev => ({ ...prev, currentStep: 3 }));

    const report = generateProductImportReport(validationResults);
    
    toast({
      title: 'Validação Concluída',
      description: report.summary,
    });
  }, [importState.products, importState.existingProducts]);

  const startImport = useCallback(() => {
    const validProducts = importState.validationResults
      .filter(r => r.isValid)
      .map(r => r.data);

    if (validProducts.length === 0) {
      toast({
        title: 'Nenhum Produto Válido',
        description: 'Não há produtos válidos para importar',
        variant: 'destructive',
      });
      return;
    }

    setImportState(prev => ({ ...prev, isImporting: true }));
    importMutation.mutate(validProducts);
  }, [importState.validationResults, importMutation]);

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setImportState(prev => ({ ...prev, currentStep: stepIndex }));
    }
  }, [steps.length]);

  const nextStep = useCallback(() => {
    if (importState.currentStep < steps.length - 1) {
      setImportState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
    }
  }, [importState.currentStep, steps.length]);

  const previousStep = useCallback(() => {
    if (importState.currentStep > 0) {
      setImportState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }));
    }
  }, [importState.currentStep]);

  const resetImport = useCallback(() => {
    setImportState({
      currentStep: 0,
      file: null,
      parsedData: null,
      mapping: {},
      unmappedColumns: [],
      products: [],
      validationResults: [],
      duplicates: [],
      existingProducts: [],
      isImporting: false,
      importResults: null,
      estimatedTime: null,
    });
  }, []);

  const downloadTemplateFile = useCallback((format: 'csv' | 'excel' | 'json') => {
    downloadProductTemplate(format);
  }, []);

  const getValidationReport = useCallback(() => {
    if (importState.validationResults.length === 0) return null;
    return generateProductImportReport(importState.validationResults);
  }, [importState.validationResults]);

  const canProceedToNext = useCallback(() => {
    switch (importState.currentStep) {
      case 0: // upload
        return importState.file !== null && importState.parsedData !== null;
      case 1: // mapping
        return Object.keys(importState.mapping).length > 0;
      case 2: // validation
        return importState.validationResults.length > 0;
      case 3: // preview
        return importState.validationResults.some(r => r.isValid);
      case 4: // import
        return !importState.isImporting && importState.importResults === null;
      default:
        return false;
    }
  }, [importState]);

  return {
    // State
    importState,
    steps,
    currentStep: steps[importState.currentStep],
    
    // Computed values
    canProceedToNext,
    validationReport: getValidationReport(),
    isLoading: importState.isImporting || loadingProducts,
    
    // Actions
    handleFileUpload,
    updateMapping,
    validateData,
    startImport,
    goToStep,
    nextStep,
    previousStep,
    resetImport,
    downloadTemplateFile,
  };
}
