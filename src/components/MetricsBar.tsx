import React from 'react';
import { CRMTask } from '../types/crm.ts';
import { formatCurrencyBRL } from '../utils/formatters.ts';
import { CircleDot, Clock, CheckCircle2, TrendingUp } from 'lucide-react';

interface MetricsBarProps {
  tasks: CRMTask[];
}

export const MetricsBar: React.FC<MetricsBarProps> = ({ tasks }) => {
  const totalCount = tasks.length;
  const totalValue = tasks.reduce((acc, t) => acc + (t.deal_value || 0), 0);

  const notStartedTasks = tasks.filter((t) => t.status === 'Não iniciado');
  const inProgressTasks = tasks.filter((t) => t.status === 'Em Andamento');
  const finishedTasks = tasks.filter((t) => t.status === 'Finalizado');

  const notStartedVal = notStartedTasks.reduce((acc, t) => acc + (t.deal_value || 0), 0);
  const inProgressVal = inProgressTasks.reduce((acc, t) => acc + (t.deal_value || 0), 0);
  const finishedVal = finishedTasks.reduce((acc, t) => acc + (t.deal_value || 0), 0);

  const completionRate = totalCount > 0 ? Math.round((finishedTasks.length / totalCount) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Total Pipeline */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Pipeline Total</span>
          <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <span className="text-xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
            {formatCurrencyBRL(totalValue)}
          </span>
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            {totalCount} {totalCount === 1 ? 'tarefa' : 'tarefas'}
          </span>
        </div>
      </div>

      {/* Não Iniciado */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>Não iniciado</span>
          </span>
          <CircleDot className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <span className="text-xl font-bold tracking-tight text-slate-800 font-mono tabular-nums">
            {notStartedTasks.length}
          </span>
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            {formatCurrencyBRL(notStartedVal)}
          </span>
        </div>
      </div>

      {/* Em Andamento */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Em Andamento</span>
          </span>
          <Clock className="w-3.5 h-3.5 text-blue-500" />
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <span className="text-xl font-bold tracking-tight text-blue-700 font-mono tabular-nums">
            {inProgressTasks.length}
          </span>
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            {formatCurrencyBRL(inProgressVal)}
          </span>
        </div>
      </div>

      {/* Finalizado */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Finalizado</span>
          </span>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <span className="text-xl font-bold tracking-tight text-emerald-700 font-mono tabular-nums">
            {finishedTasks.length}
          </span>
          <span className="text-xs text-emerald-700 font-mono tabular-nums font-semibold">
            {completionRate}% conv.
          </span>
        </div>
      </div>
    </div>
  );
};
