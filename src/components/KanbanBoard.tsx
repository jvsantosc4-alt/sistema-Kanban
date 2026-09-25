import React, { useState } from 'react';
import { CRMTask, TaskStatus } from '../types/crm.ts';
import { TaskCard } from './TaskCard.tsx';
import { formatCurrencyBRL, getStatusMeta } from '../utils/formatters.ts';
import { Plus, Inbox } from 'lucide-react';

interface KanbanBoardProps {
  tasks: CRMTask[];
  onStatusChange: (id: string, newStatus: TaskStatus) => void;
  onEditTask: (task: CRMTask) => void;
  onDeleteTask: (id: string) => void;
  onViewDetails: (task: CRMTask) => void;
  onAddTaskInStatus: (status: TaskStatus) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onStatusChange,
  onEditTask,
  onDeleteTask,
  onViewDetails,
  onAddTaskInStatus,
}) => {
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const columns: TaskStatus[] = ['Não iniciado', 'Em Andamento', 'Finalizado'];

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleDragLeave = (e: React.DragEvent, status: TaskStatus) => {
    if (dragOverColumn === status) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onStatusChange(taskId, newStatus);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
      {columns.map((status) => {
        const columnTasks = tasks.filter((t) => t.status === status);
        const columnValue = columnTasks.reduce((acc, t) => acc + (t.deal_value || 0), 0);
        const meta = getStatusMeta(status);
        const isDraggingOver = dragOverColumn === status;

        return (
          <div
            key={status}
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={(e) => handleDragLeave(e, status)}
            onDrop={(e) => handleDrop(e, status)}
            className={`flex flex-col bg-slate-100/70 rounded-xl border transition-colors min-h-[520px] ${
              isDraggingOver
                ? 'border-slate-500 bg-slate-200/50 ring-2 ring-slate-900/10'
                : 'border-slate-200/80'
            }`}
          >
            {/* Column Header */}
            <div className="p-3.5 border-b border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${meta.dotColor}`} />
                <h3 className="font-semibold text-sm text-slate-800">{status}</h3>
                <span className="text-xs font-mono tabular-nums text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md">
                  {columnTasks.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono tabular-nums text-slate-500 font-medium">
                  {formatCurrencyBRL(columnValue)}
                </span>
                <button
                  type="button"
                  onClick={() => onAddTaskInStatus(status)}
                  className="p-1 text-slate-400 hover:text-slate-800 hover:bg-white rounded transition-colors"
                  title={`Adicionar tarefa em ${status}`}
                  aria-label={`Adicionar tarefa em ${status}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tasks Container */}
            <div className="p-3 flex-1 flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-290px)]">
              {columnTasks.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 text-center text-slate-500 border border-dashed border-slate-300 rounded-lg bg-white/40">
                  <Inbox className="w-8 h-8 text-slate-300 mb-2 stroke-[1.5]" />
                  <p className="text-xs font-medium text-slate-600">Nenhuma tarefa</p>
                  <p className="text-[11px] text-slate-600 mt-1 max-w-[200px]">
                    Nenhuma tarefa manual foi criada ou movida para este status.
                  </p>
                  <button
                    type="button"
                    onClick={() => onAddTaskInStatus(status)}
                    className="mt-3 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md shadow-2xs transition-colors"
                  >
                    + Criar Tarefa
                  </button>
                </div>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={onStatusChange}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                    onViewDetails={onViewDetails}
                  />
                ))
              )}
            </div>

            {/* Bottom quick add button */}
            <div className="p-2 border-t border-slate-200/60">
              <button
                type="button"
                onClick={() => onAddTaskInStatus(status)}
                className="w-full py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Tarefa</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
