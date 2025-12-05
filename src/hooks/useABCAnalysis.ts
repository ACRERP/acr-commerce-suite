import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface ABCAnalysis {
  id: string;
  analysis_date: string;
  period_start: string;
  period_end: string;
  product_id: string;
  product_name: string;
  product_sku?: string;
  product_category?: string;
  total_quantity: number;
  total_revenue: number;
  total_cost: number;
  profit_margin: number;
  cumulative_revenue_percentage: number;
  cumulative_quantity_percentage: number;
  abc_class: 'A' | 'B' | 'C';
  rank_position: number;
  total_products: number;
  created_at: string;
  updated_at: string;
  tenant_id: string;
}

export interface ABCAnalysisSummary {
  id: string;
  analysis_date: string;
  period_start: string;
  period_end: string;
  total_products: number;
  total_revenue: number;
  total_quantity: number;
  class_a_products: number;
  class_a_revenue: number;
  class_a_percentage: number;
  class_b_products: number;
  class_b_revenue: number;
  class_b_percentage: number;
  class_c_products: number;
  class_c_revenue: number;
  class_c_percentage: number;
  analysis_config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  tenant_id: string;
}

export interface ABCAnalysisConfig {
  id: string;
  name: string;
  description?: string;
  class_a_threshold: number;
  class_b_threshold: number;
  analysis_type: 'revenue' | 'quantity' | 'profit';
  min_period_days: number;
  exclude_inactive: boolean;
  category_filters?: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
  tenant_id: string;
  is_active: boolean;
  is_default: boolean;
}

export interface ABCRecommendation {
  recommendation_type: string;
  product_id: string;
  product_name: string;
  current_class: string;
  suggested_action: string;
  priority: string;
  reasoning: string;
}

export interface CreateConfigData {
  name: string;
  description?: string;
  class_a_threshold: number;
  class_b_threshold: number;
  analysis_type: ABCAnalysisConfig['analysis_type'];
  min_period_days?: number;
  exclude_inactive?: boolean;
  category_filters?: string[];
  is_default?: boolean;
}

export function useABCAnalysis(analysisDate?: string, abcClass?: string) {
  const queryClient = useQueryClient();

  const {
    data: analysis = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['abc-analysis', analysisDate, abcClass],
    queryFn: async () => {
      let query = supabase
        .from('abc_analysis')
        .select('*')
        .order('rank_position', { ascending: true });

      if (analysisDate) {
        query = query.eq('analysis_date', analysisDate);
      } else {
        query = query.order('analysis_date', { ascending: false }).limit(1);
      }

      if (abcClass && abcClass !== 'all') {
        query = query.eq('abc_class', abcClass);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ABCAnalysis[];
    },
  });

  const performAnalysis = useMutation({
    mutationFn: async ({
      periodStart,
      periodEnd,
      analysisType,
      classAThreshold,
      classBThreshold,
    }: {
      periodStart: string;
      periodEnd: string;
      analysisType?: string;
      classAThreshold?: number;
      classBThreshold?: number;
    }) => {
      const { data, error } = await supabase.rpc('perform_abc_analysis', {
        p_period_start: periodStart,
        p_period_end: periodEnd,
        p_analysis_type: analysisType || 'revenue',
        p_class_a_threshold: classAThreshold || 80.0,
        p_class_b_threshold: classBThreshold || 95.0,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['abc-analysis'] });
      queryClient.invalidateQueries({ queryKey: ['abc-analysis-summary'] });
      queryClient.invalidateQueries({ queryKey: ['abc-recommendations'] });
    },
  });

  return {
    analysis,
    isLoading,
    error,
    performAnalysis: performAnalysis.mutateAsync,
    isPerforming: performAnalysis.isPending,
  };
}

export function useABCAnalysisSummary(analysisDate?: string) {
  const queryClient = useQueryClient();

  const {
    data: summary = null,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['abc-analysis-summary', analysisDate],
    queryFn: async () => {
      let query = supabase
        .from('abc_analysis_summary')
        .select('*')
        .order('analysis_date', { ascending: false });

      if (analysisDate) {
        query = query.eq('analysis_date', analysisDate);
      } else {
        query = query.limit(1);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data.length > 0 ? data[0] as ABCAnalysisSummary : null;
    },
  });

  return {
    summary,
    isLoading,
    error,
  };
}

export function useABCAnalysisConfig() {
  const queryClient = useQueryClient();

  const {
    data: configs = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['abc-analysis-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('abc_analysis_config')
        .select('*')
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ABCAnalysisConfig[];
    },
  });

  const createConfig = useMutation({
    mutationFn: async (configData: CreateConfigData) => {
      const { data, error } = await supabase
        .from('abc_analysis_config')
        .insert(configData)
        .select()
        .single();

      if (error) throw error;
      return data as ABCAnalysisConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['abc-analysis-config'] });
    },
  });

  const updateConfig = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<ABCAnalysisConfig> & { id: string }) => {
      const { data, error } = await supabase
        .from('abc_analysis_config')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ABCAnalysisConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['abc-analysis-config'] });
    },
  });

  const deleteConfig = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('abc_analysis_config')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['abc-analysis-config'] });
    },
  });

  return {
    configs,
    isLoading,
    error,
    createConfig: createConfig.mutateAsync,
    updateConfig: updateConfig.mutateAsync,
    deleteConfig: deleteConfig.mutateAsync,
    isCreating: createConfig.isPending,
    isUpdating: updateConfig.isPending,
    isDeleting: deleteConfig.isPending,
  };
}

export function useABCRecommendations(analysisDate?: string) {
  const queryClient = useQueryClient();

  const {
    data: recommendations = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['abc-recommendations', analysisDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_abc_recommendations', {
        p_analysis_date: analysisDate || new Date().toISOString().split('T')[0],
      });

      if (error) throw error;
      return data as ABCRecommendation[];
    },
  });

  return {
    recommendations,
    isLoading,
    error,
  };
}

export function useABCHistory(limit: number = 12) {
  const queryClient = useQueryClient();

  const {
    data: history = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['abc-history', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('abc_analysis_summary')
        .select('*')
        .order('analysis_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as ABCAnalysisSummary[];
    },
  });

  return {
    history,
    isLoading,
    error,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

export function getABCClassColor(abcClass: string): string {
  const colors = {
    A: 'text-green-600 bg-green-100',
    B: 'text-yellow-600 bg-yellow-100',
    C: 'text-red-600 bg-red-100',
  };
  
  return colors[abcClass as keyof typeof colors] || 'text-gray-600 bg-gray-100';
}

export function getABCClassDescription(abcClass: string): string {
  const descriptions = {
    A: 'Alta relevância - ~80% da receita',
    B: 'Média relevância - ~15% da receita',
    C: 'Baixa relevância - ~5% da receita',
  };
  
  return descriptions[abcClass as keyof typeof descriptions] || '';
}

export function getAnalysisTypeText(type: string): string {
  const texts = {
    revenue: 'Receita',
    quantity: 'Quantidade',
    profit: 'Lucratividade',
  };
  
  return texts[type as keyof typeof texts] || type;
}

export function getRecommendationTypeText(type: string): string {
  const texts = {
    MARGEM_BAIXA: 'Margem Baixa',
    PROMOVER_A: 'Promover para Classe A',
    ANALISAR_C: 'Analisar Classe C',
    DESCONTINUAR: 'Considerar Descontinuação',
    MANUTENCAO: 'Manutenção',
  };
  
  return texts[type as keyof typeof texts] || type;
}

export function getPriorityColor(priority: string): string {
  const colors = {
    ALTA: 'text-red-600 bg-red-100',
    MEDIA: 'text-yellow-600 bg-yellow-100',
    BAIXA: 'text-green-600 bg-green-100',
  };
  
  return colors[priority as keyof typeof colors] || 'text-gray-600 bg-gray-100';
}
