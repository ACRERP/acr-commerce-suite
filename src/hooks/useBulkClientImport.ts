import { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { 
  parseImportFile, 
  processImportData, 
  ParsedImportData,
  downloadTemplate,
  generateImportTemplate
} from '@/lib/clientImportParser';
import { 
  validateClientImportData,
  findDuplicateClients,
  generateImportReport,
  ImportValidationResult,
  ClientImportData,
  ImportColumnMapping
} from '@/lib/clientImportValidator';
import { Client } from '@/components/dashboard/clients/ClientList';

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
  clients: ClientImportData[];
  validationResults: ImportValidationResult[];
  duplicates: number[];
  existingClients: Client[];
  isImporting: boolean;
  importResults: {
    success: number;
    failed: number;
    errors: string[];
  } | null;
}

export interface UseBulkClientImportOptions {
  onImportComplete?: (results: { success: number; failed: number }) => void;
  onError?: (error: string) => void;
}

export function useBulkClientImport(options: UseBulkClientImportOptions = {}) {
  const [importState, setImportState] = useState<ImportState>({
    currentStep: 0,
    file: null,
    parsedData: null,
    mapping: {},
    unmappedColumns: [],
    clients: [],
    validationResults: [],
    duplicates: [],
    existingClients: [],
    isImporting: false,
    importResults: null,
  });

  const steps: ImportStep[] = [
    {
      id: 'upload',
      title: 'Upload do Arquivo',
      description: 'Selecione o arquivo com os dados dos clientes',
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
      description: 'Importe os clientes para o sistema',
      isCompleted: importState.currentStep > 4,
      isCurrent: importState.currentStep === 4,
    },
  ];

  // Query para buscar clientes existentes
  const { data: existingClients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      // Mock implementation - would fetch from actual API
      return [];
    },
  });

  // Mutation para importar clientes
  const importMutation = useMutation({
    mutationFn: async (clientsToImport: ClientImportData[]) => {
      // Mock implementation - would send to actual API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate some failures
      const successCount = Math.floor(clientsToImport.length * 0.9);
      const failedCount = clientsToImport.length - successCount;
      
      return {
        success: successCount,
        failed: failedCount,
        errors: failedCount > 0 ? ['Erro simulado para demonstração'] : [],
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
        description: `${results.success} clientes importados com sucesso${results.failed > 0 ? `, ${results.failed} falhas` : ''}`,
      });

      options.onImportComplete?.(results);
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
    setImportState(prev => ({ ...prev, file }));

    try {
      const parseResult = await parseImportFile(file);
      
      if (!parseResult.success || !parseResult.data) {
        throw new Error(parseResult.error || 'Erro ao processar arquivo');
      }

      const { clients, mapping, unmappedColumns } = processImportData(parseResult.data);

      setImportState(prev => ({
        ...prev,
        parsedData: parseResult.data,
        clients,
        mapping,
        unmappedColumns,
        existingClients: existingClients,
      }));

      // Avançar para próximo passo
      setImportState(prev => ({ ...prev, currentStep: 1 }));

      toast({
        title: 'Arquivo Processado',
        description: `${parseResult.data.totalRows} registros encontrados`,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao processar arquivo';
      toast({
        title: 'Erro no Arquivo',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [existingClients]);

  const updateMapping = useCallback((newMapping: ImportColumnMapping) => {
    if (!importState.parsedData) return;

    const { clients } = processImportData(importState.parsedData, newMapping);

    setImportState(prev => ({
      ...prev,
      mapping: newMapping,
      clients,
    }));
  }, [importState.parsedData]);

  const validateData = useCallback(() => {
    const validationResults = importState.clients.map((client, index) =>
      validateClientImportData(client, index + 1)
    );

    const { duplicates, unique } = findDuplicateClients(
      validationResults.filter(r => r.isValid).map(r => r.data),
      importState.existingClients
    );

    setImportState(prev => ({
      ...prev,
      validationResults,
      duplicates,
    }));

    // Avançar para próximo passo
    setImportState(prev => ({ ...prev, currentStep: 3 }));

    const report = generateImportReport(validationResults);
    
    toast({
      title: 'Validação Concluída',
      description: report.summary,
    });
  }, [importState.clients, importState.existingClients]);

  const startImport = useCallback(() => {
    const validClients = importState.validationResults
      .filter(r => r.isValid)
      .map(r => r.data);

    if (validClients.length === 0) {
      toast({
        title: 'Nenhum Cliente Válido',
        description: 'Não há clientes válidos para importar',
        variant: 'destructive',
      });
      return;
    }

    setImportState(prev => ({ ...prev, isImporting: true }));
    importMutation.mutate(validClients);
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
      clients: [],
      validationResults: [],
      duplicates: [],
      existingClients: [],
      isImporting: false,
      importResults: null,
    });
  }, []);

  const downloadTemplateFile = useCallback((format: 'csv' | 'excel' | 'json') => {
    downloadTemplate(format);
  }, []);

  const getValidationReport = useCallback(() => {
    if (importState.validationResults.length === 0) return null;
    return generateImportReport(importState.validationResults);
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
    isLoading: importState.isImporting || loadingClients,
    
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
