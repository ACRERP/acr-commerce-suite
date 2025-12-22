import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  Filter, 
  Calendar as CalendarIcon, 
  X, 
  RotateCcw,
  Search,
  Folder
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFinancialCategories } from '@/hooks/useFinancialCategories';

export interface ReportFilters {
  periodStart: Date | null;
  periodEnd: Date | null;
  selectedCategories: string[];
  includePending: boolean;
  includeCancelled: boolean;
  transactionType: 'all' | 'revenue' | 'expense';
  minAmount: number | null;
  maxAmount: number | null;
  searchTerm: string;
}

interface ReportFiltersProps {
  filters: ReportFilters;
  onFiltersChange: (filters: ReportFilters) => void;
  onApply: () => void;
  onReset: () => void;
  isLoading?: boolean;
}

export function ReportFilters({ 
  filters, 
  onFiltersChange, 
  onApply, 
  onReset, 
  isLoading = false 
}: ReportFiltersProps) {
  const { categories, getCategoriesByType } = useFinancialCategories();
  const [showCalendar, setShowCalendar] = useState<'start' | 'end' | null>(null);

  // Get revenue and expense categories
  const revenueCategories = getCategoriesByType('revenue');
  const expenseCategories = getCategoriesByType('expense');

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    const newCategories = checked
      ? [...filters.selectedCategories, categoryId]
      : filters.selectedCategories.filter(id => id !== categoryId);
    
    onFiltersChange({
      ...filters,
      selectedCategories: newCategories
    });
  };

  const handleSelectAllCategories = (type: 'revenue' | 'expense', checked: boolean) => {
    const typeCategories = type === 'revenue' ? revenueCategories : expenseCategories;
    const categoryIds = typeCategories.map(cat => cat.id);
    
    const newCategories = checked
      ? [...filters.selectedCategories, ...categoryIds.filter(id => !filters.selectedCategories.includes(id))]
      : filters.selectedCategories.filter(id => !categoryIds.includes(id));
    
    onFiltersChange({
      ...filters,
      selectedCategories: newCategories
    });
  };

  const hasActiveFilters = () => {
    return (
      filters.periodStart ||
      filters.periodEnd ||
      filters.selectedCategories.length > 0 ||
      !filters.includePending ||
      filters.includeCancelled ||
      filters.transactionType !== 'all' ||
      filters.minAmount !== null ||
      filters.maxAmount !== null ||
      filters.searchTerm.trim() !== ''
    );
  };

  const getSelectedCategoriesCount = () => {
    return filters.selectedCategories.length;
  };

  const getTotalCategoriesCount = () => {
    return categories.length;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros do Relatório
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters() && (
              <Badge variant="secondary" className="text-xs">
                {getSelectedCategoriesCount()}/{getTotalCategoriesCount()} categorias
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              disabled={!hasActiveFilters()}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Limpar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Period Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Data Inicial</Label>
            <Popover open={showCalendar === 'start'} onOpenChange={(open) => setShowCalendar(open ? 'start' : null)}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.periodStart ? (
                    format(filters.periodStart, 'PPP', { locale: ptBR })
                  ) : (
                    'Selecione a data'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.periodStart || undefined}
                  onSelect={(date) => {
                    onFiltersChange({
                      ...filters,
                      periodStart: date
                    });
                    setShowCalendar(null);
                  }}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Data Final</Label>
            <Popover open={showCalendar === 'end'} onOpenChange={(open) => setShowCalendar(open ? 'end' : null)}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.periodEnd ? (
                    format(filters.periodEnd, 'PPP', { locale: ptBR })
                  ) : (
                    'Selecione a data'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.periodEnd || undefined}
                  onSelect={(date) => {
                    onFiltersChange({
                      ...filters,
                      periodEnd: date
                    });
                    setShowCalendar(null);
                  }}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Quick Period Selection */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const now = new Date();
              const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
              const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
              onFiltersChange({
                ...filters,
                periodStart: startOfMonth,
                periodEnd: endOfMonth
              });
            }}
          >
            Mês Atual
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const now = new Date();
              const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
              const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
              onFiltersChange({
                ...filters,
                periodStart: startOfLastMonth,
                periodEnd: endOfLastMonth
              });
            }}
          >
            Mês Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const now = new Date();
              const startOfYear = new Date(now.getFullYear(), 0, 1);
              const endOfYear = new Date(now.getFullYear(), 11, 31);
              onFiltersChange({
                ...filters,
                periodStart: startOfYear,
                periodEnd: endOfYear
              });
            }}
          >
            Ano Atual
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const now = new Date();
              const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
              const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31);
              onFiltersChange({
                ...filters,
                periodStart: startOfLastYear,
                periodEnd: endOfLastYear
              });
            }}
          >
            Ano Anterior
          </Button>
        </div>

        {/* Transaction Type */}
        <div className="space-y-2">
          <Label>Tipo de Transação</Label>
          <Select
            value={filters.transactionType}
            onValueChange={(value: 'all' | 'revenue' | 'expense') =>
              onFiltersChange({ ...filters, transactionType: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Transações</SelectItem>
              <SelectItem value="revenue">Apenas Receitas</SelectItem>
              <SelectItem value="expense">Apenas Despesas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Amount Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Valor Mínimo (opcional)</Label>
            <Input
              type="number"
              placeholder="0,00"
              value={filters.minAmount || ''}
              onChange={(e) => {
                const value = e.target.value ? parseFloat(e.target.value) : null;
                onFiltersChange({ ...filters, minAmount: value });
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Valor Máximo (opcional)</Label>
            <Input
              type="number"
              placeholder="0,00"
              value={filters.maxAmount || ''}
              onChange={(e) => {
                const value = e.target.value ? parseFloat(e.target.value) : null;
                onFiltersChange({ ...filters, maxAmount: value });
              }}
            />
          </div>
        </div>

        {/* Search Term */}
        <div className="space-y-2">
          <Label>Buscar por Descrição</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar transações..."
              value={filters.searchTerm}
              onChange={(e) => onFiltersChange({ ...filters, searchTerm: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        {/* Status Options */}
        <div className="space-y-3">
          <Label>Status das Transações</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-pending"
                checked={filters.includePending}
                onCheckedChange={(checked) =>
                  onFiltersChange({ ...filters, includePending: checked as boolean })
                }
              />
              <Label htmlFor="include-pending" className="text-sm">
                Incluir Pendentes
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-cancelled"
                checked={filters.includeCancelled}
                onCheckedChange={(checked) =>
                  onFiltersChange({ ...filters, includeCancelled: checked as boolean })
                }
              />
              <Label htmlFor="include-cancelled" className="text-sm">
                Incluir Canceladas
              </Label>
            </div>
          </div>
        </div>

        {/* Category Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Folder className="w-4 h-4" />
              Categorias
            </Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectAllCategories('revenue', true)}
                disabled={revenueCategories.length === 0}
              >
                Todas Receitas
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectAllCategories('expense', true)}
                disabled={expenseCategories.length === 0}
              >
                Todas Despesas
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onFiltersChange({ ...filters, selectedCategories: [] })}
                disabled={filters.selectedCategories.length === 0}
              >
                Limpar Seleção
              </Button>
            </div>
          </div>

          {/* Revenue Categories */}
          {revenueCategories.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-green-700">Receitas</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {revenueCategories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`revenue-${category.id}`}
                      checked={filters.selectedCategories.includes(category.id)}
                      onCheckedChange={(checked) =>
                        handleCategoryToggle(category.id, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`revenue-${category.id}`}
                      className="text-sm cursor-pointer flex items-center gap-2"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expense Categories */}
          {expenseCategories.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-red-700">Despesas</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {expenseCategories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`expense-${category.id}`}
                      checked={filters.selectedCategories.includes(category.id)}
                      onCheckedChange={(checked) =>
                        handleCategoryToggle(category.id, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`expense-${category.id}`}
                      className="text-sm cursor-pointer flex items-center gap-2"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Apply Button */}
        <div className="flex justify-end">
          <Button onClick={onApply} disabled={isLoading} className="min-w-32">
            {isLoading ? 'Aplicando...' : 'Aplicar Filtros'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
