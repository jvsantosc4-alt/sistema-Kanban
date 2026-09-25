import React from 'react';
import { Database, Plus, CheckCircle2, AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { ConnectionState } from '../types/crm.ts';

interface HeaderProps {
  connectionState: ConnectionState;
  onOpenSupabaseModal: (initialTab?: 'connection' | 'policies' | 'auth' | 'audit') => void;
  onOpenNewTaskModal: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  activeView: 'kanban' | 'list';
  onViewChange: (view: 'kanban' | 'list') => void;
}

export const Header: React.FC<HeaderProps> = ({
  connectionState,
  onOpenSupabaseModal,
  onOpenNewTaskModal,
  onRefresh,
  isRefreshing,
  activeView,
  onViewChange,
}) => {
  const getConnectionBadge = () => {
    switch (connectionState) {
      case 'connected':
        return (
          <button
            type="button"
            onClick={() => onOpenSupabaseModal('connection')}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors whitespace-nowrap"
            title="Supabase Conectado e Sincronizado"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden sm:inline">Supabase</span> Conectado
          </button>
        );
      case 'table_missing':
        return (
          <button
            type="button"
            onClick={() => onOpenSupabaseModal('policies')}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors whitespace-nowrap"
            title="Conectado mas falta criar tabela crm_tasks com políticas RLS"
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Criar Tabela SQL (RLS)</span>
          </button>
        );
      case 'testing':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 rounded-md whitespace-nowrap">
            <RefreshCw className="w-3 h-3 animate-spin text-slate-500" />
            <span>Testando...</span>
          </span>
        );
      case 'error':
        return (
          <button
            type="button"
            onClick={() => onOpenSupabaseModal('connection')}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors whitespace-nowrap"
            title="Erro de conexão com o Supabase"
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
            <span>Erro Supabase</span>
          </button>
        );
      case 'disconnected':
      default:
        return (
          <button
            type="button"
            onClick={() => onOpenSupabaseModal('connection')}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors whitespace-nowrap shadow-xs"
            title="Clique para conectar seu projeto Supabase"
          >
            <Database className="w-3.5 h-3.5 text-slate-500" />
            <span>Conectar Supabase</span>
          </button>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <a href="/" className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              K
            </span>
            <span>Kanban CRM</span>
          </a>
        </div>

        {/* Zone 2: Navigation / View switch (Clean Segmented Buttons) */}
        <nav className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-medium">
          <button
            type="button"
            onClick={() => onViewChange('kanban')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeView === 'kanban'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Quadro Kanban
          </button>
          <button
            type="button"
            onClick={() => onViewChange('list')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeView === 'list'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Visualização em Lista
          </button>
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50"
            title="Atualizar dados"
            aria-label="Atualizar dados"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => onOpenSupabaseModal('policies')}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors shadow-2xs whitespace-nowrap"
            title="Ver e configurar Políticas SQL (RLS)"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Políticas SQL</span>
          </button>

          {getConnectionBadge()}

          <button
            type="button"
            onClick={onOpenNewTaskModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors shadow-xs whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Tarefa</span>
          </button>
        </div>
      </div>
    </header>
  );
};
