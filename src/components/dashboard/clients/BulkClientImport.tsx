import React, { useCallback, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight,
  Download,
  Eye,
  Users,
  Database,
  CheckSquare
} from 'lucide-react';
import { useBulkClientImport } from '@/hooks/useBulkClientImport';
import { ImportColumnMapping, ImportValidationResult } from '@/lib/clientImportValidator';
import { ParsedImportData } from '@/lib/clientImportParser';

interface BulkClientImportProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BulkClientImport({ isOpen, onClose }: BulkClientImportProps) {
  const {
    importState,
    steps,
    currentStep,
    canProceedToNext,
    validationReport,
    isLoading,
    handleFileUpload,
    updateMapping,
    validateData,
    startImport,
    goToStep,
    nextStep,
    previousStep,
    resetImport,
    downloadTemplateFile,
  } = useBulkClientImport({
    onImportComplete: (results) => {
      setTimeout(() => {
        onClose();
        resetImport();
      }, 2000);
    },
  });

  const [dragActive, setDragActive] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState<ImportColumnMapping>({});

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleFileUpload]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  }, [handleFileUpload]);

  const renderStepContent = () => {
    switch (currentStep.id) {
      case 'upload':
        return <UploadStep dragActive={dragActive} handleDrag={handleDrag} handleDrop={handleDrop} handleFileChange={handleFileChange} downloadTemplateFile={downloadTemplateFile} />;
      
      case 'mapping':
        return <MappingStep 
          parsedData={importState.parsedData}
          mapping={importState.mapping}
          unmappedColumns={importState.unmappedColumns}
          onMappingChange={updateMapping}
        />;
      
      case 'validation':
        return <ValidationStep 
          validationResults={importState.validationResults}
          report={validationReport}
          onValidate={validateData}
        />;
      
      case 'preview':
        return <PreviewStep 
          validationResults={importState.validationResults}
          duplicates={importState.duplicates}
        />;
      
      case 'import':
        return <ImportStep 
          isImporting={importState.isImporting}
          importResults={importState.importResults}
          onStartImport={startImport}
        />;
      
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Importação em Massa de Clientes</CardTitle>
              <CardDescription>
                {currentStep.description}
              </CardDescription>
            </div>
            <Button variant="outline" onClick={onClose}>
              ×
            </Button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between mt-6">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${step.isCompleted ? 'bg-green-500 text-white' : 
                      step.isCurrent ? 'bg-blue-500 text-white' : 
                      'bg-gray-200 text-gray-600'}
                  `}>
                    {step.isCompleted ? <CheckCircle className="w-4 h-4" /> : index + 1}
                  </div>
                  <div className="ml-2 hidden sm:block">
                    <div className={`text-sm font-medium ${step.isCurrent ? 'text-blue-600' : 'text-gray-600'}`}>
                      {step.title}
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 ${step.isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-auto">
          {renderStepContent()}
        </CardContent>

        {/* Navigation Buttons */}
        <div className="p-6 border-t flex items-center justify-between">
          <div className="flex items-center gap-2">
            {importState.currentStep > 0 && (
              <Button variant="outline" onClick={previousStep}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={resetImport}>
              Cancelar
            </Button>
            
            {importState.currentStep < steps.length - 1 && (
              <Button 
                onClick={nextStep}
                disabled={!canProceedToNext || isLoading}
              >
                {currentStep.id === 'validation' ? 'Continuar' : 'Próximo'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            
            {currentStep.id === 'import' && !importState.importResults && (
              <Button 
                onClick={startImport}
                disabled={!canProceedToNext || isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <Database className="w-4 h-4 mr-2" />
                Iniciar Importação
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

// Upload Step Component
function UploadStep({ 
  dragActive, 
  handleDrag, 
  handleDrop, 
  handleFileChange, 
  downloadTemplateFile 
}: {
  dragActive: boolean;
  handleDrag: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  downloadTemplateFile: (format: 'csv' | 'excel' | 'json') => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button 
          variant="outline" 
          onClick={() => downloadTemplateFile('csv')}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Template CSV
        </Button>
        <Button 
          variant="outline" 
          onClick={() => downloadTemplateFile('excel')}
          className="flex items-center gap-2"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Template Excel
        </Button>
        <Button 
          variant="outline" 
          onClick={() => downloadTemplateFile('json')}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Template JSON
        </Button>
      </div>

      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold mb-2">
          Arraste o arquivo aqui ou clique para selecionar
        </h3>
        <p className="text-gray-600 mb-4">
          Formatos suportados: CSV, Excel (.xlsx, .xls), JSON
        </p>
        <input
          type="file"
          accept=".csv,.xlsx,.xls,.json"
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload">
          <Button asChild>
            <span>Selecionar Arquivo</span>
          </Button>
        </label>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Dica</AlertTitle>
        <AlertDescription>
          Use os templates fornecidos para garantir que seu arquivo tenha o formato correto.
          O sistema irá validar automaticamente os dados antes da importação.
        </AlertDescription>
      </Alert>
    </div>
  );
}

// Mapping Step Component
function MappingStep({ 
  parsedData, 
  mapping, 
  unmappedColumns, 
  onMappingChange 
}: {
  parsedData: ParsedImportData | null;
  mapping: ImportColumnMapping;
  unmappedColumns: string[];
  onMappingChange: (mapping: ImportColumnMapping) => void;
}) {
  if (!parsedData) return null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Mapeamento de Colunas</h3>
        <p className="text-gray-600 mb-4">
          Verifique se as colunas do seu arquivo foram mapeadas corretamente.
        </p>
      </div>

      <div className="grid gap-4">
        {parsedData.headers.map((header: string, index: number) => (
          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="font-medium">{header}</span>
            </div>
            <div className="flex items-center gap-2">
              {mapping[header] ? (
                <Badge variant="default">
                  {mapping[header]}
                </Badge>
              ) : (
                <Badge variant="outline">
                  Não mapeado
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>

      {unmappedColumns.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Colunas Não Mapeadas</AlertTitle>
          <AlertDescription>
            {unmappedColumns.length} colunas não foram mapeadas: {unmappedColumns.join(', ')}
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Preview dos Dados</h4>
        <div className="text-sm text-gray-600">
          {parsedData.totalRows} registros encontrados • Mostrando primeiros 5
        </div>
      </div>
    </div>
  );
}

// Validation Step Component
function ValidationStep({ 
  validationResults, 
  report, 
  onValidate 
}: {
  validationResults: ImportValidationResult[];
  report: {
    total: number;
    valid: number;
    invalid: number;
    withWarnings: number;
    errors: string[];
    summary: string;
  } | null;
  onValidate: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Validação dos Dados</h3>
        <p className="text-gray-600 mb-4">
          Verificação automática de erros e inconsistências nos dados.
        </p>
      </div>

      {report && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{report.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{report.valid}</div>
              <div className="text-sm text-gray-600">Válidos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{report.invalid}</div>
              <div className="text-sm text-gray-600">Inválidos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{report.withWarnings}</div>
              <div className="text-sm text-gray-600">Com Avisos</div>
            </CardContent>
          </Card>
        </div>
      )}

      {report?.errors && report.errors.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Principais Erros</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {report.errors.map((error: string, index: number) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Button onClick={onValidate} className="w-full">
        <CheckSquare className="w-4 h-4 mr-2" />
        Validar Dados
      </Button>
    </div>
  );
}

// Preview Step Component
function PreviewStep({ 
  validationResults, 
  duplicates 
}: {
  validationResults: ImportValidationResult[];
  duplicates: number[];
}) {
  const validResults = validationResults.filter(r => r.isValid);
  const invalidResults = validationResults.filter(r => !r.isValid);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Preview dos Dados</h3>
        <p className="text-gray-600 mb-4">
          Revise os dados antes de confirmar a importação.
        </p>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Clientes Válidos ({validResults.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {validResults.slice(0, 5).map((result, index) => (
                <div key={index} className="text-sm p-2 bg-green-50 rounded">
                  <strong>{result.data.name || 'Sem nome'}</strong>
                  {result.data.email && <span className="ml-2 text-gray-600">{result.data.email}</span>}
                </div>
              ))}
              {validResults.length > 5 && (
                <div className="text-sm text-gray-500 text-center">
                  ... e mais {validResults.length - 5} clientes
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {invalidResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                Clientes Inválidos ({invalidResults.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {invalidResults.slice(0, 3).map((result, index) => (
                  <div key={index} className="text-sm p-2 bg-red-50 rounded">
                    <strong>Linha {result.rowNumber}:</strong> {result.errors.join(', ')}
                  </div>
                ))}
                {invalidResults.length > 3 && (
                  <div className="text-sm text-gray-500 text-center">
                    ... e mais {invalidResults.length - 3} erros
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {duplicates.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Clientes Duplicados</AlertTitle>
            <AlertDescription>
              {duplicates.length} clientes já existem no sistema e não serão importados.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}

// Import Step Component
function ImportStep({ 
  isImporting, 
  importResults, 
  onStartImport 
}: {
  isImporting: boolean;
  importResults: {
    success: number;
    failed: number;
    errors: string[];
  } | null;
  onStartImport: () => void;
}) {
  if (isImporting) {
    return (
      <div className="space-y-6 text-center">
        <div className="space-y-4">
          <Database className="w-16 h-16 mx-auto text-blue-500 animate-pulse" />
          <div>
            <h3 className="text-lg font-semibold">Importando Clientes...</h3>
            <p className="text-gray-600">Por favor, aguarde enquanto processamos os dados.</p>
          </div>
          <Progress value={75} className="w-full" />
        </div>
      </div>
    );
  }

  if (importResults) {
    return (
      <div className="space-y-6 text-center">
        <div className="space-y-4">
          <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
          <div>
            <h3 className="text-lg font-semibold">Importação Concluída!</h3>
            <p className="text-gray-600">
              {importResults.success} clientes importados com sucesso
              {importResults.failed > 0 && `, ${importResults.failed} falhas`}
            </p>
          </div>
          
          {importResults.errors.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erros na Importação</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {importResults.errors.map((error: string, index: number) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-4">
        <Database className="w-16 h-16 mx-auto text-gray-400" />
        <div>
          <h3 className="text-lg font-semibold">Pronto para Importar</h3>
          <p className="text-gray-600">
            Clique no botão abaixo para iniciar a importação dos clientes válidos.
          </p>
        </div>
        
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Atenção</AlertTitle>
          <AlertDescription>
            Esta ação irá adicionar novos clientes ao sistema. 
            Verifique novamente os dados antes de confirmar.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
