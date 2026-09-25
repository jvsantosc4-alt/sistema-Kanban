/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CRMTask, TaskStatus, ConnectionState, FilterOptions, SupabaseConfig } from './types/crm.ts';
import {
  fetchAllTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from './services/crmService.ts';
import {
  getStoredSupabaseConfig,
  testSupabaseConnection,
  getSupabaseClient,
} from './lib/supabase.ts';
import { Header } from './components/Header.tsx';
import { MetricsBar } from './components/MetricsBar.tsx';
import { FilterBar } from './components/FilterBar.tsx';
import { KanbanBoard } from './components/KanbanBoard.tsx';
import { ListView } from './components/ListView.tsx';
import { TaskModal } from './components/TaskModal.tsx';
import { TaskDetailModal } from './components/TaskDetailModal.tsx';
import { SupabaseModal } from './components/SupabaseModal.tsx';
import { TableMissingBanner } from './components/TableMissingBanner.tsx';
import { Plus, Database, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function App() {
  const [tasks, setTasks] = useState<CRMTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeView, setActiveView] = useState<'kanban' | 'list'>('kanban');

  // Supabase state
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(getStoredSupabaseConfig());
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [supabaseModalTab, setSupabaseModalTab] = useState<'connection' | 'policies' | 'auth' | 'audit'>('connection');

  // Task modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<CRMTask | null>(null);
  const [selectedStatusForNewTask, setSelectedStatusForNewTask] = useState<TaskStatus>('Não iniciado');
  const [detailTask, setDetailTask] = useState<CRMTask | null>(null);

  // Filters state
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    priority: 'all',
    sortBy: 'date_desc',
  });

  // Notification / Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3500);
  }, []);

  // Check Supabase connection on load
  const verifyConnection = useCallback(async () => {
    const config = getStoredSupabaseConfig();
    setSupabaseConfig(config);

    if (config.url && config.anonKey) {
      setConnectionState('testing');
      const test = await testSupabaseConnection(config);
      setConnectionState(test.state);
    } else {
      setConnectionState('disconnected');
    }
  }, []);

  // Load tasks from Supabase or local storage
  const loadTasks = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    try {
      const res = await fetchAllTasks();
      setTasks(res.tasks);
      if (
        res.error &&
        (res.error.includes('42P01') ||
          res.error.includes('relation "public.crm_tasks" does not exist') ||
          res.error.includes('crm_tasks'))
      ) {
        setConnectionState('table_missing');
      }
    } catch (e) {
      console.error('Falha ao carregar tarefas:', e);
    } finally {
      setIsLoading(false);
      if (showIndicator) setIsRefreshing(false);
    }
  }, []);

  // Initialize
  useEffect(() => {
    verifyConnection();
    loadTasks();
  }, [verifyConnection, loadTasks]);

  // Realtime subscription when Supabase is connected
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || connectionState !== 'connected') return;

    try {
      const channel = supabase
        .channel('crm_tasks_realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'crm_tasks' },
          () => {
            loadTasks();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (e) {
      console.warn('Realtime subscription não pôde ser ativado:', e);
    }
  }, [connectionState, loadTasks]);

  // Handle status update (drag or quick click)
  const handleStatusChange = async (id: string, newStatus: TaskStatus) => {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus, updated_at: new Date().toISOString() } : t))
    );

    if (detailTask && detailTask.id === id) {
      setDetailTask((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    const res = await updateTaskStatus(id, newStatus);
    if (!res.success && res.error) {
      showToast(`Aviso: salvo no cache local (${res.error})`);
    } else {
      showToast(`Status atualizado para "${newStatus}"`);
    }
  };

  // Handle save (create or update)
  const handleSaveTask = async (
    taskData: Omit<CRMTask, 'id' | 'created_at' | 'updated_at'>
  ) => {
    if (editingTask) {
      // Update existing
      await updateTask(editingTask.id, taskData);
      setTasks((prev) =>
        prev.map((t) => (t.id === editingTask.id ? { ...t, ...taskData } : t))
      );
      showToast('Tarefa atualizada com sucesso!');
      setEditingTask(null);
    } else {
      // Create new manual task
      const result = await createTask(taskData);
      setTasks((prev) => [result.task, ...prev]);
      if (result.savedInSupabase) {
        showToast('Tarefa salva no Supabase com sucesso!');
      } else {
        if (
          result.error &&
          (result.error.includes('42P01') ||
            result.error.includes('relation "public.crm_tasks" does not exist') ||
            result.error.includes('crm_tasks'))
        ) {
          setConnectionState('table_missing');
          showToast('Aviso: Tabela crm_tasks não existe no Supabase (Erro 42P01).');
        } else {
          showToast('Tarefa criada e salva no sistema!');
        }
      }
    }
  };

  // Handle delete
  const handleDeleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (detailTask?.id === id) {
      setDetailTask(null);
    }
    await deleteTask(id);
    showToast('Tarefa excluída.');
  };

  // Quick open task creation modal for a specific column
  const handleOpenNewTaskForStatus = (status: TaskStatus) => {
    setSelectedStatusForNewTask(status);
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        // Search query filter
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase();
          const matchTitle = task.title.toLowerCase().includes(q);
          const matchClient = (task.client_name || '').toLowerCase().includes(q);
          const matchDesc = (task.description || '').toLowerCase().includes(q);
          const matchTag = (task.tags || []).some((tag) => tag.toLowerCase().includes(q));
          if (!matchTitle && !matchClient && !matchDesc && !matchTag) {
            return false;
          }
        }

        // Priority filter
        if (filters.priority !== 'all') {
          if (task.priority !== filters.priority) return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (filters.sortBy) {
          case 'date_desc':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case 'date_asc':
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          case 'value_desc':
            return (b.deal_value || 0) - (a.deal_value || 0);
          case 'value_asc':
            return (a.deal_value || 0) - (b.deal_value || 0);
          case 'title':
            return a.title.localeCompare(b.title);
          default:
            return 0;
        }
      });
  }, [tasks, filters]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <Header
        connectionState={connectionState}
        onOpenSupabaseModal={(tab = 'connection') => {
          setSupabaseModalTab(tab);
          setIsSupabaseModalOpen(true);
        }}
        onOpenNewTaskModal={() => {
          setSelectedStatusForNewTask('Não iniciado');
          setEditingTask(null);
          setIsTaskModalOpen(true);
        }}
        onRefresh={() => {
          verifyConnection();
          loadTasks(true);
        }}
        isRefreshing={isRefreshing}
        activeView={activeView}
        onViewChange={setActiveView}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* Banner for Error 42P01: Table Missing */}
        {connectionState === 'table_missing' && (
          <TableMissingBanner
            onRecheck={async () => {
              await verifyConnection();
              await loadTasks(true);
            }}
            isChecking={isRefreshing}
          />
        )}

        {/* Supabase Connection Banner if disconnected */}
        {connectionState === 'disconnected' && (
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5 sm:mt-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-slate-900 block text-sm">
                  Segurança RLS e Conexão Supabase Prontas
                </span>
                <span className="text-slate-600">
                  O sistema possui scripts de Políticas SQL (Row Level Security) pré-configurados com isolamento por usuário (auth.uid()) e suporte anônimo.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setSupabaseModalTab('policies');
                  setIsSupabaseModalOpen(true);
                }}
                className="px-3.5 py-1.5 font-medium text-xs text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors shrink-0 shadow-2xs"
              >
                Ver Políticas SQL
              </button>
              <button
                type="button"
                onClick={() => {
                  setSupabaseModalTab('connection');
                  setIsSupabaseModalOpen(true);
                }}
                className="px-3.5 py-1.5 font-medium text-xs text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-md transition-colors shrink-0 shadow-2xs"
              >
                Configurar Supabase
              </button>
            </div>
          </div>
        )}

        {/* Metrics Bar */}
        <MetricsBar tasks={tasks} />

        {/* Filters & Search */}
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          totalTasksCount={tasks.length}
          filteredTasksCount={filteredTasks.length}
        />

        {/* View Content (Kanban or List) */}
        {isLoading ? (
          <div className="py-24 text-center text-slate-400 text-xs">
            Carregando tarefas do CRM...
          </div>
        ) : tasks.length === 0 ? (
          /* Clean Initial Empty State - No model/dummy data as requested */
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-xl mx-auto shadow-2xs">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto mb-4">
              <Plus className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-900 mb-1">
              Quadro Kanban vazio
            </h2>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Você pode criar suas tarefas e oportunidades manualmente agora mesmo. Organize seu funil pelos status: <strong>Não iniciado</strong>, <strong>Em Andamento</strong> e <strong>Finalizado</strong>.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedStatusForNewTask('Não iniciado');
                  setEditingTask(null);
                  setIsTaskModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Criar Primeira Tarefa</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSupabaseModalTab('policies');
                  setIsSupabaseModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors shadow-2xs"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Políticas SQL (RLS)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSupabaseModalTab('connection');
                  setIsSupabaseModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors shadow-2xs"
              >
                <Database className="w-4 h-4 text-blue-600" />
                <span>Configurar Supabase</span>
              </button>
            </div>
          </div>
        ) : activeView === 'kanban' ? (
          <KanbanBoard
            tasks={filteredTasks}
            onStatusChange={handleStatusChange}
            onEditTask={(task) => {
              setEditingTask(task);
              setIsTaskModalOpen(true);
            }}
            onDeleteTask={handleDeleteTask}
            onViewDetails={(task) => setDetailTask(task)}
            onAddTaskInStatus={handleOpenNewTaskForStatus}
          />
        ) : (
          <ListView
            tasks={filteredTasks}
            onStatusChange={handleStatusChange}
            onEditTask={(task) => {
              setEditingTask(task);
              setIsTaskModalOpen(true);
            }}
            onDeleteTask={handleDeleteTask}
            onViewDetails={(task) => setDetailTask(task)}
            onNewTask={() => {
              setSelectedStatusForNewTask('Não iniciado');
              setEditingTask(null);
              setIsTaskModalOpen(true);
            }}
          />
        )}
      </main>

      {/* Task Create / Edit Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        initialTask={editingTask}
        defaultStatus={selectedStatusForNewTask}
      />

      {/* Task Details Modal */}
      <TaskDetailModal
        task={detailTask}
        isOpen={!!detailTask}
        onClose={() => setDetailTask(null)}
        onEdit={(task) => {
          setDetailTask(null);
          setEditingTask(task);
          setIsTaskModalOpen(true);
        }}
        onDelete={handleDeleteTask}
        onStatusChange={handleStatusChange}
      />

      {/* Supabase Integration Modal */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        initialTab={supabaseModalTab}
        config={supabaseConfig}
        connectionState={connectionState}
        onConfigUpdated={(newCfg, newState) => {
          setSupabaseConfig(newCfg);
          setConnectionState(newState);
          if (newState === 'connected') {
            loadTasks();
            showToast('Conectado ao Supabase com sucesso!');
          }
        }}
        onTasksSynced={() => {
          loadTasks();
          showToast('Tarefas sincronizadas!');
        }}
      />
    </div>
  );
}
