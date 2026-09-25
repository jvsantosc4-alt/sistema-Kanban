import React from 'react';
import { CRMTask, TaskStatus } from '../types/crm.ts';
import { formatCurrencyBRL, formatDateBR, getPriorityStyles, getStatusMeta } from '../utils/formatters.ts';
import { Edit, Trash2, ExternalLink, Inbox } from 'lucide-react';

interface ListViewProps {
  tasks: CRMTask[];
  onStatusChange: (id: string, newStatus: TaskStatus) => void;
  onEditTask: (task: CRMTask) => void;
  onDeleteTask: (id: string) => void;
  onViewDetails: (task: CRMTask) => void;
  onNewTask: () => void;
}

export const ListView: React.FC<ListViewProps> = ({
  tasks,
  onStatusChange,
  onEditTask,
  onDeleteTask,
  onViewDetails,
  onNewTask,
}) => {
  const statuses: TaskStatus[] = ['Não iniciado', 'Em Andamento', 'Finalizado'];

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-slate-800">Nenhuma tarefa encontrada</h3>
        <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
          Crie sua primeira tarefa ou oportunidade para gerenciar no CRM.
        </p>
        <button
          type="button"
          onClick={onNewTask}
          className="mt-4 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors shadow-xs"
        >
          + Criar Nova Tarefa
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Tarefa / Oportunidade</th>
              <th className="py-3 px-4">Cliente / Contato</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Prioridade</th>
              <th className="py-3 px-4 text-right">Valor (R$)</th>
              <th className="py-3 px-4">Prazo</th>
              <th className="py-3 px-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.map((task) => {
              const priorityStyle = getPriorityStyles(task.priority);
              const meta = getStatusMeta(task.status);

              return (
                <tr key={task.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => onViewDetails(task)}
                      className="font-semibold text-slate-900 hover:text-blue-700 text-left line-clamp-1 cursor-pointer"
                    >
                      {task.title}
                    </button>
                    {task.description && (
                      <span className="text-[11px] text-slate-600 line-clamp-1">
                        {task.description}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    <span className="font-medium text-slate-800">
                      {task.client_name || '—'}
                    </span>
                    {task.client_email && (
                      <span className="block text-[11px] text-slate-600">
                        {task.client_email}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={task.status}
                      onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
                      aria-label="Alterar status da tarefa"
                      className="text-xs font-medium rounded-md px-2 py-1 border border-slate-200 bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900 cursor-pointer"
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${priorityStyle.dot}`} />
                      <span className={priorityStyle.text}>{task.priority}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                    {formatCurrencyBRL(task.deal_value)}
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-slate-600">
                    {formatDateBR(task.due_date) || '—'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => onViewDetails(task)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                        title="Ver detalhes"
                        aria-label="Ver detalhes da tarefa"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditTask(task)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                        title="Editar"
                        aria-label="Editar tarefa"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Deseja excluir a tarefa "${task.title}"?`)) {
                            onDeleteTask(task.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="Excluir"
                        aria-label="Excluir tarefa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
