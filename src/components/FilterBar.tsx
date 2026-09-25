import React from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';
import { FilterOptions, TaskPriority } from '../types/crm.ts';

interface FilterBarProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  totalTasksCount: number;
  filteredTasksCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  totalTasksCount,
  filteredTasksCount,
}) => {
  const priorities: { label: string; value: 'all' | TaskPriority }[] = [
    { label: 'Todas as Prioridades', value: 'all' },
    { label: 'Urgente', value: 'Urgente' },
    { label: 'Alta', value: 'Alta' },
    { label: 'Média', value: 'Média' },
    { label: 'Baixa', value: 'Baixa' },
  ];

  const sortOptions = [
    { label: 'Mais Recentes', value: 'date_desc' },
    { label: 'Mais Antigas', value: 'date_asc' },
    { label: 'Maior Valor (R$)', value: 'value_desc' },
    { label: 'Menor Valor (R$)', value: 'value_asc' },
    { label: 'Título (A-Z)', value: 'title' },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200">
      {/* Search input */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={filters.searchQuery}
          onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
          placeholder="Buscar por tarefa, cliente ou descrição..."
          className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
        />
        {filters.searchQuery && (
          <button
            type="button"
            onClick={() => onFilterChange({ ...filters, searchQuery: '' })}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
          >
            ×
          </button>
        )}
      </div>

      {/* Selects: Priority filter & Sort */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filters.priority}
            onChange={(e) =>
              onFilterChange({ ...filters, priority: e.target.value as FilterOptions['priority'] })
            }
            className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
          >
            {priorities.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filters.sortBy}
            onChange={(e) =>
              onFilterChange({ ...filters, sortBy: e.target.value as FilterOptions['sortBy'] })
            }
            className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
          >
            {sortOptions.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {totalTasksCount > 0 && filteredTasksCount !== totalTasksCount && (
          <span className="text-xs text-slate-500 font-mono tabular-nums pl-1">
            {filteredTasksCount} de {totalTasksCount}
          </span>
        )}
      </div>
    </div>
  );
};
