import React from 'react';
import { CRMTask, TaskStatus } from '../types/crm.ts';
import { formatCurrencyBRL, formatDateBR, isOverdue, getPriorityStyles } from '../utils/formatters.ts';
import { Calendar, User, ArrowRight, ArrowLeft, MoreHorizontal, Edit, Trash2, ExternalLink } from 'lucide-react';

interface TaskCardProps {
  task: CRMTask;
  onStatusChange: (id: string, newStatus: TaskStatus) => void;
  onEdit: (task: CRMTask) => void;
  onDelete: (id: string) => void;
  onViewDetails: (task: CRMTask) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onStatusChange,
  onEdit,
  onDelete,
  onViewDetails,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const priorityStyle = getPriorityStyles(task.priority);
  const overdue = isOverdue(task.due_date, task.status);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="group relative bg-white p-3.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all cursor-grab active:cursor-grabbing select-none"
    >
      {/* Top row: Priority & Actions */}
      <div className="flex items-center justify-between gap-2 text-xs mb-2">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${priorityStyle.dot}`} />
          <span className={`font-medium ${priorityStyle.text}`}>
            {task.priority}
          </span>
          {task.tags && task.tags.length > 0 && (
            <>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500 truncate max-w-[100px]">
                {task.tags[0]}
              </span>
            </>
          )}
        </div>

        {/* Quick Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
            title="Mais opções"
            aria-label="Mais opções"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-6 z-20 w-36 bg-white rounded-md shadow-lg border border-slate-200 py-1 text-xs">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onViewDetails(task);
                  }}
                  className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  <span>Ver Detalhes</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onEdit(task);
                  }}
                  className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Edit className="w-3.5 h-3.5 text-slate-400" />
                  <span>Editar</span>
                </button>
                <div className="h-px bg-slate-100 my-1" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    if (confirm(`Deseja excluir a tarefa "${task.title}"?`)) {
                      onDelete(task.id);
                    }
                  }}
                  className="w-full px-3 py-1.5 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Excluir</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Task Title */}
      <h4
        onClick={() => onViewDetails(task)}
        className="font-semibold text-sm text-slate-900 group-hover:text-slate-700 leading-snug line-clamp-2 cursor-pointer mb-2"
      >
        {task.title}
      </h4>

      {/* Description snippet if any */}
      {task.description && (
        <p className="text-xs text-slate-600 line-clamp-2 mb-2.5 font-normal">
          {task.description}
        </p>
      )}

      {/* Client & Deal Value Row */}
      <div className="flex items-center justify-between text-xs text-slate-600 mb-3 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-1.5 truncate max-w-[140px]" title={task.client_name || 'Sem cliente'}>
          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{task.client_name || 'Cliente não def.'}</span>
        </div>
        {task.deal_value !== undefined && task.deal_value > 0 ? (
          <span className="font-semibold text-slate-900 font-mono tabular-nums">
            {formatCurrencyBRL(task.deal_value)}
          </span>
        ) : (
          <span className="text-slate-400 text-[11px]">R$ 0,00</span>
        )}
      </div>

      {/* Bottom info: Date & Quick Status Shift Controls */}
      <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-100">
        {/* Date / Due */}
        <div className="flex items-center gap-1">
          {task.due_date ? (
            <span
              className={`flex items-center gap-1 text-[11px] font-mono tabular-nums ${
                overdue ? 'text-rose-600 font-semibold' : 'text-slate-500'
              }`}
              title={overdue ? 'Prazo vencido!' : 'Data de vencimento'}
            >
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{formatDateBR(task.due_date)}</span>
              {overdue && <span className="text-rose-600">(! atrasado)</span>}
            </span>
          ) : (
            <span className="text-slate-400 text-[11px]">Sem prazo</span>
          )}
        </div>

        {/* Quick move buttons */}
        <div className="flex items-center gap-1">
          {task.status === 'Não iniciado' && (
            <button
              type="button"
              onClick={() => onStatusChange(task.id, 'Em Andamento')}
              className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
              title="Iniciar tarefa (Mover para Em Andamento)"
            >
              <span>Iniciar</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}

          {task.status === 'Em Andamento' && (
            <>
              <button
                type="button"
                onClick={() => onStatusChange(task.id, 'Não iniciado')}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                title="Voltar para Não iniciado"
              >
                <ArrowLeft className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => onStatusChange(task.id, 'Finalizado')}
                className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors"
                title="Concluir tarefa (Mover para Finalizado)"
              >
                <span>Concluir</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </>
          )}

          {task.status === 'Finalizado' && (
            <button
              type="button"
              onClick={() => onStatusChange(task.id, 'Em Andamento')}
              className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
              title="Reabrir tarefa (Mover para Em Andamento)"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Reabrir</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
