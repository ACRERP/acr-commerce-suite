import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  report_type: 'sales' | 'financial' | 'inventory' | 'customer' | 'product' | 'custom';
  data_source: 'sales' | 'invoices' | 'products' | 'clients' | 'financial_transactions' | 'inventory';
  query_definition: Record<string, unknown>;
  filters_config: ReportFilter[];
  columns_config: ReportColumn[];
  group_by_config?: Record<string, unknown>;
  sort_config?: Record<string, unknown>;
  chart_config?: Record<string, unknown>;
  is_active: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  tenant_id: string;
}

export interface ReportFilter {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean';
  required?: boolean;
  options?: string[];
  source?: string;
  default_value?: unknown;
}

export interface ReportColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'currency' | 'badge' | 'link';
  width?: number;
  sortable?: boolean;
  format?: string;
}

export interface SavedReport {
  id: string;
  template_id: string;
  name: string;
  description?: string;
  filters_values: Record<string, unknown>;
  generated_at: string;
  expires_at?: string;
  file_url?: string;
  file_format: 'pdf' | 'excel' | 'csv';
  file_size?: number;
  status: 'pending' | 'generating' | 'completed' | 'failed' | 'expired';
  error_message?: string;
  download_count: number;
  last_downloaded_at?: string;
  created_at: string;
  created_by: string;
  tenant_id: string;
  template?: ReportTemplate;
}

export interface ReportSchedule {
  id: string;
  template_id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  schedule_config: Record<string, unknown>;
  next_run_at: string;
  last_run_at?: string;
  is_active: boolean;
  recipients: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
  tenant_id: string;
  template?: ReportTemplate;
}

export interface CreateTemplateData {
  name: string;
  description?: string;
  report_type: ReportTemplate['report_type'];
  data_source: ReportTemplate['data_source'];
  query_definition: Record<string, unknown>;
  filters_config: ReportFilter[];
  columns_config: ReportColumn[];
  group_by_config?: Record<string, unknown>;
  sort_config?: Record<string, unknown>;
  chart_config?: Record<string, unknown>;
  is_public?: boolean;
}

export function useReportTemplates() {
  const queryClient = useQueryClient();

  const {
    data: templates = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['report-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as ReportTemplate[];
    },
  });

  const createTemplate = useMutation({
    mutationFn: async (templateData: CreateTemplateData) => {
      const { data, error } = await supabase
        .from('report_templates')
        .insert(templateData)
        .select()
        .single();

      if (error) throw error;
      return data as ReportTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<ReportTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from('report_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ReportTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('report_templates')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
    },
  });

  return {
    templates,
    isLoading,
    error,
    createTemplate: createTemplate.mutateAsync,
    updateTemplate: updateTemplate.mutateAsync,
    deleteTemplate: deleteTemplate.mutateAsync,
    isCreating: createTemplate.isPending,
    isUpdating: updateTemplate.isPending,
    isDeleting: deleteTemplate.isPending,
  };
}

export function useSavedReports() {
  const queryClient = useQueryClient();

  const {
    data: reports = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['saved-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_reports')
        .select(`
          *,
          template:report_templates(name, description, report_type)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SavedReport[];
    },
  });

  const generateReport = useMutation({
    mutationFn: async ({
      templateId,
      filtersValues,
      fileFormat,
      reportName,
    }: {
      templateId: string;
      filtersValues: Record<string, unknown>;
      fileFormat: 'pdf' | 'excel' | 'csv';
      reportName?: string;
    }) => {
      const { data, error } = await supabase.rpc('generate_report', {
        p_template_id: templateId,
        p_filters_values: filtersValues,
        p_file_format: fileFormat,
        p_report_name: reportName,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-reports'] });
    },
  });

  const downloadReport = useMutation({
    mutationFn: async (id: string) => {
      // Get report details
      const { data: report, error: fetchError } = await supabase
        .from('saved_reports')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Update download count
      await supabase
        .from('saved_reports')
        .update({ 
          download_count: report.download_count + 1,
          last_downloaded_at: new Date().toISOString()
        })
        .eq('id', id);

      // Log access
      await supabase
        .from('report_access_log')
        .insert({
          report_id: id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          action: 'downloaded',
        });

      return report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-reports'] });
    },
  });

  const deleteReport = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('saved_reports')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-reports'] });
    },
  });

  return {
    reports,
    isLoading,
    error,
    generateReport: generateReport.mutateAsync,
    downloadReport: downloadReport.mutateAsync,
    deleteReport: deleteReport.mutateAsync,
    isGenerating: generateReport.isPending,
    isDownloading: downloadReport.isPending,
    isDeleting: deleteReport.isPending,
  };
}

export function useReportSchedules() {
  const queryClient = useQueryClient();

  const {
    data: schedules = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['report-schedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report_schedules')
        .select(`
          *,
          template:report_templates(name, description, report_type)
        `)
        .order('next_run_at', { ascending: true });

      if (error) throw error;
      return data as ReportSchedule[];
    },
  });

  const createSchedule = useMutation({
    mutationFn: async (scheduleData: Omit<ReportSchedule, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'tenant_id' | 'template'>) => {
      const { data, error } = await supabase
        .from('report_schedules')
        .insert(scheduleData)
        .select(`
          *,
          template:report_templates(name, description, report_type)
        `)
        .single();

      if (error) throw error;
      return data as ReportSchedule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-schedules'] });
    },
  });

  const updateSchedule = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<ReportSchedule> & { id: string }) => {
      const { data, error } = await supabase
        .from('report_schedules')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          template:report_templates(name, description, report_type)
        `)
        .single();

      if (error) throw error;
      return data as ReportSchedule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-schedules'] });
    },
  });

  const deleteSchedule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('report_schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-schedules'] });
    },
  });

  return {
    schedules,
    isLoading,
    error,
    createSchedule: createSchedule.mutateAsync,
    updateSchedule: updateSchedule.mutateAsync,
    deleteSchedule: deleteSchedule.mutateAsync,
    isCreating: createSchedule.isPending,
    isUpdating: updateSchedule.isPending,
    isDeleting: deleteSchedule.isPending,
  };
}

export function useReportPreview(templateId?: string, filtersValues: Record<string, unknown> = {}) {
  const queryClient = useQueryClient();

  const {
    data: preview = null,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['report-preview', templateId, filtersValues],
    queryFn: async () => {
      if (!templateId) return null;
      
      // This would call an Edge Function to generate preview data
      const { data, error } = await supabase.functions.invoke('preview-report', {
        body: { templateId, filtersValues, limit: 100 }
      });

      if (error) throw error;
      return data;
    },
    enabled: !!templateId,
  });

  return {
    preview,
    isLoading,
    error,
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getReportStatusColor(status: string): string {
  const colors = {
    pending: 'text-yellow-600',
    generating: 'text-blue-600',
    completed: 'text-green-600',
    failed: 'text-red-600',
    expired: 'text-gray-600',
  };
  
  return colors[status as keyof typeof colors] || 'text-gray-600';
}

export function getReportStatusText(status: string): string {
  const texts = {
    pending: 'Pendente',
    generating: 'Gerando',
    completed: 'Concluído',
    failed: 'Falhou',
    expired: 'Expirado',
  };
  
  return texts[status as keyof typeof texts] || status;
}

export function getFrequencyText(frequency: string): string {
  const texts = {
    daily: 'Diário',
    weekly: 'Semanal',
    monthly: 'Mensal',
    quarterly: 'Trimestral',
    yearly: 'Anual',
  };
  
  return texts[frequency as keyof typeof texts] || frequency;
}
