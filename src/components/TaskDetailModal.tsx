import React from 'react';
import { CRMTask, TaskStatus } from '../types/crm.ts';
import { formatCurrencyBRL, formatDateBR, getPriorityStyles, getStatusMeta, isOverdue } from '../utils/formatters.ts';
import { X, Calendar, User, Mail, Phone, DollarSign, Clock, FileText, Tag, Edit, Trash2 } from 'lucide-react';

interface TaskDetailModalProps {
  task: CRMTask | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (task: CRMTask) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, newStatus: TaskStatus) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  if (!isOpen || !task) return null;

  const priorityStyle = getPriorityStyles(task.priority);
  const statusMeta = getStatusMeta(task.status);
  const overdue = isOverdue(task.due_date, task.status);
  const statuses: TaskStatus[] = ['Não iniciado', 'Em Andamento', 'Finalizado'];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${statusMeta.dotColor}`} />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {task.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(task);
              }}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
              title="Editar Tarefa"
              aria-label="Editar Tarefa"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm(`Deseja excluir a tarefa "${task.title}"?`)) {
                  onDelete(task.id);
                  onClose();
                }
              }}
              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
              title="Excluir Tarefa"
              aria-label="Excluir Tarefa"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Title */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-snug">
              {task.title}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className={`px-2 py-0.5 rounded-md font-medium ${priorityStyle.bg}`}>
                Prioridade {task.priority}
              </span>
              <span>·</span>
              <span className="font-mono tabular-nums">
                Criado em {formatDateBR(task.created_at?.split('T')[0])}
              </span>
            </div>
          </div>

          {/* Quick Status Bar */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Mudar Status:</span>
            <div className="flex items-center gap-1.5">
              {statuses.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onStatusChange(task.id, s)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    task.status === s
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Client & Deal Value Card */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50/80 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px] font-medium uppercase tracking-wider mb-1">
                Cliente / Lead
              </span>
              <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>{task.client_name || 'Não informado'}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px] font-medium uppercase tracking-wider mb-1">
                Valor do Negócio
              </span>
              <div className="flex items-center gap-1 text-slate-900 font-bold font-mono tabular-nums">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>{formatCurrencyBRL(task.deal_value)}</span>
              </div>
            </div>

            {(task.client_email || task.client_phone) && (
              <div className="col-span-2 pt-2 border-t border-slate-200/80 flex flex-wrap gap-4">
                {task.client_email && (
                  <a
                    href={`mailto:${task.client_email}`}
                    className="flex items-center gap-1.5 text-blue-600 hover:underline"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{task.client_email}</span>
                  </a>
                )}
                {task.client_phone && (
                  <a
                    href={`https://wa.me/${task.client_phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-emerald-600 hover:underline"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{task.client_phone} (WhatsApp)</span>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Due date */}
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="font-medium">Data Limite:</span>
            {task.due_date ? (
              <span
                className={`font-mono tabular-nums ${
                  overdue ? 'text-rose-600 font-semibold' : 'text-slate-800'
                }`}
              >
                {formatDateBR(task.due_date)} {overdue && '(Vencido)'}
              </span>
            ) : (
              <span className="text-slate-400">Sem prazo estipulado</span>
            )}
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <Tag className="w-4 h-4 text-slate-400" />
              <div className="flex flex-wrap gap-1.5">
                {task.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {task.description && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-700 block">Descrição:</span>
              <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                {task.description}
              </p>
            </div>
          )}

          {/* Notes */}
          {task.notes && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-700 block">Observações Internas:</span>
              <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed bg-amber-50/50 p-3 rounded-lg border border-amber-100">
                {task.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            ID: {task.id.slice(0, 8)}...
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
