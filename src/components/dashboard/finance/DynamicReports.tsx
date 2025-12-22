import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  CalendarIcon, 
  Plus, 
  Download, 
  Play, 
  Pause, 
  Trash2, 
  FileText, 
  BarChart3,
  Settings,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  useReportTemplates, 
  useSavedReports, 
  useReportSchedules,
  useReportPreview,
  formatFileSize,
  getReportStatusColor,
  getReportStatusText,
  getFrequencyText
} from '@/hooks/useDynamicReports';

export function DynamicReports() {
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('templates');
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [reportName, setReportName] = useState('');
  const [fileFormat, setFileFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');

  const { templates, isLoading: templatesLoading } = useReportTemplates();
  const { 
    reports, 
    generateReport, 
    downloadReport, 
    deleteReport,
    isGenerating,
    isDownloading 
  } = useSavedReports();
  const { 
    schedules, 
    createSchedule, 
    updateSchedule, 
    deleteSchedule 
  } = useReportSchedules();
  const { preview } = useReportPreview(selectedTemplate || undefined, filters);

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);

  const handleGenerateReport = async () => {
    if (!selectedTemplate) return;
    
    try {
      await generateReport({
        templateId: selectedTemplate,
        filtersValues: filters,
        fileFormat,
        reportName: reportName || undefined,
      });
      
      setIsGenerateDialogOpen(false);
      setSelectedTemplate(null);
      setFilters({});
      setReportName('');
      setFileFormat('pdf');
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const handleDownloadReport = async (reportId: string) => {
    try {
      const report = await downloadReport(reportId);
      
      // Create download link
      if (report.file_url) {
        const link = document.createElement('a');
        link.href = report.file_url;
        link.download = `${report.name}.${report.file_format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const icons = {
      pending: <Clock className="w-3 h-3" />,
      generating: <Play className="w-3 h-3" />,
      completed: <CheckCircle className="w-3 h-3" />,
      failed: <XCircle className="w-3 h-3" />,
      expired: <AlertCircle className="w-3 h-3" />,
    };

    return (
      <Badge variant="outline" className={cn("flex items-center gap-1", getReportStatusColor(status))}>
        {icons[status as keyof typeof icons]}
        {getReportStatusText(status)}
      </Badge>
    );
  };

  const renderFilter = (filter: {
    key: string;
    label: string;
    type: string;
    required?: boolean;
    options?: string[];
    source?: string;
    default_value?: unknown;
  }) => {
    switch (filter.type) {
      case 'text':
        return (
          <Input
            placeholder={filter.label}
            value={(filters[filter.key] as string) || ''}
            onChange={(e) => setFilters({ ...filters, [filter.key]: e.target.value })}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            placeholder={filter.label}
            value={(filters[filter.key] as string) || ''}
            onChange={(e) => setFilters({ ...filters, [filter.key]: parseFloat(e.target.value) || '' })}
          />
        );
      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters[filter.key] && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters[filter.key] ? (
                  format(new Date(filters[filter.key] as string), "dd/MM/yyyy", { locale: ptBR })
                ) : (
                  `Selecione ${filter.label}`
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters[filter.key] ? new Date(filters[filter.key] as string) : undefined}
                onSelect={(date) => 
                  setFilters({ 
                    ...filters, 
                    [filter.key]: date ? date.toISOString().split('T')[0] : undefined 
                  })
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );
      case 'select':
        return (
          <Select
            value={(filters[filter.key] as string) || ''}
            onValueChange={(value) => setFilters({ ...filters, [filter.key]: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              {filter.options?.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={filter.key}
              checked={(filters[filter.key] as boolean) || false}
              onCheckedChange={(checked) => setFilters({ ...filters, [filter.key]: checked })}
            />
            <Label htmlFor={filter.key}>{filter.label}</Label>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Relatórios Dinâmicos</h2>
          <p className="text-muted-foreground">Crie e gerencie relatórios personalizados</p>
        </div>
        <Button onClick={() => setIsGenerateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Gerar Relatório
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Relatórios Gerados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schedules.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Downloads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports.reduce((acc, r) => acc + r.download_count, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
          <TabsTrigger value="schedules">Agendamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Templates de Relatório</CardTitle>
              <CardDescription>Modelos disponíveis para geração de relatórios</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{template.name}</h3>
                          <Badge variant="outline">{template.report_type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {template.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <FileText className="w-3 h-3" />
                          <span>{template.columns_config.length} colunas</span>
                          <Filter className="w-3 h-3" />
                          <span>{template.filters_config.length} filtros</span>
                        </div>
                        <Button
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => {
                            setSelectedTemplate(template.id);
                            setActiveTab('reports');
                            setTimeout(() => setIsGenerateDialogOpen(true), 100);
                          }}
                        >
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Gerar Relatório
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios Gerados</CardTitle>
              <CardDescription>Histórico de relatórios gerados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.map((report) => (
                  <Card key={report.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{report.name}</h3>
                            {getStatusBadge(report.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Template: {report.template?.name || 'N/A'}
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Formato:</span> {report.file_format.toUpperCase()}
                            </div>
                            <div>
                              <span className="font-medium">Gerado:</span> {format(new Date(report.generated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </div>
                            {report.file_size && (
                              <div>
                                <span className="font-medium">Tamanho:</span> {formatFileSize(report.file_size)}
                              </div>
                            )}
                            <div>
                              <span className="font-medium">Downloads:</span> {report.download_count}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {report.status === 'completed' && (
                            <Button
                              size="sm"
                              onClick={() => handleDownloadReport(report.id)}
                              disabled={isDownloading}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Baixar
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteReport(report.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedules">
          <Card>
            <CardHeader>
              <CardTitle>Agendamentos</CardTitle>
              <CardDescription>Relatórios agendados para geração automática</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {schedules.map((schedule) => (
                  <Card key={schedule.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{schedule.name}</h3>
                            <Badge variant={schedule.is_active ? 'default' : 'secondary'}>
                              {schedule.is_active ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Template: {schedule.template?.name || 'N/A'}
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Frequência:</span> {getFrequencyText(schedule.frequency)}
                            </div>
                            <div>
                              <span className="font-medium">Próxima execução:</span> {format(new Date(schedule.next_run_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </div>
                            <div>
                              <span className="font-medium">Destinatários:</span> {schedule.recipients.length}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateSchedule({ 
                              id: schedule.id, 
                              is_active: !schedule.is_active 
                            })}
                          >
                            {schedule.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteSchedule(schedule.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generate Report Dialog */}
      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Gerar Relatório</DialogTitle>
            <DialogDescription>
              Configure os parâmetros para gerar o relatório
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[500px] overflow-y-auto">
            <div className="grid gap-2">
              <Label htmlFor="template">Template</Label>
              <Select
                value={selectedTemplate || ''}
                onValueChange={setSelectedTemplate}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplateData && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="reportName">Nome do Relatório</Label>
                  <Input
                    id="reportName"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    placeholder={selectedTemplateData.name}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="fileFormat">Formato do Arquivo</Label>
                  <Select
                    value={fileFormat}
                    onValueChange={(value: 'pdf' | 'excel' | 'csv') => setFileFormat(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label>Filtros</Label>
                  {selectedTemplateData.filters_config.map((filter) => (
                    <div key={filter.key} className="grid gap-2">
                      <Label>{filter.label}</Label>
                      {renderFilter(filter)}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={handleGenerateReport}
              disabled={!selectedTemplate || isGenerating}
            >
              {isGenerating ? 'Gerando...' : 'Gerar Relatório'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
