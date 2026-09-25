import React, { useState } from 'react';
import { AlertCircle, Copy, Check, ExternalLink, RefreshCw, Terminal, CheckCircle2 } from 'lucide-react';
import { SQL_POLICIES_SCHEMA } from '../lib/supabase.ts';

interface TableMissingBannerProps {
  onRecheck: () => void;
  isChecking: boolean;
}

export const TableMissingBanner: React.FC<TableMissingBannerProps> = ({
  onRecheck,
  isChecking,
}) => {
  const [copied, setCopied] = useState(false);
  const [showSql, setShowSql] = useState(false);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_POLICIES_SCHEMA.granular);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-4 sm:p-5 text-slate-900 shadow-xs">
      <div className="flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
          <AlertCircle className="w-5 h-5" />
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-amber-950">
                Ação Necessária no Supabase: Criar a tabela crm_tasks
              </h3>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-amber-200/80 text-amber-900 font-semibold">
                Erro 42P01: relation &quot;public.crm_tasks&quot; does not exist
              </span>
            </div>
            <p className="text-xs text-amber-900/80 mt-1 leading-relaxed">
              O seu aplicativo já está conectado ao Supabase, mas a tabela <strong>crm_tasks</strong> com as políticas de segurança (RLS) ainda precisa ser criada. Basta rodar o comando SQL abaixo uma única vez no editor do seu Supabase.
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="bg-white/80 border border-amber-200 p-2.5 rounded-lg flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                1
              </span>
              <span className="text-slate-800">Clique em <strong>Copiar SQL</strong> abaixo.</span>
            </div>

            <div className="bg-white/80 border border-amber-200 p-2.5 rounded-lg flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                2
              </span>
              <span className="text-slate-800">Cole no <strong>SQL Editor</strong> e clique em <strong>Run</strong> (sem texto selecionado).</span>
            </div>

            <div className="bg-white/80 border border-amber-200 p-2.5 rounded-lg flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                3
              </span>
              <span className="text-slate-800">Clique em <strong>Já executei, testar</strong>.</span>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopySql}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Script Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Script SQL (Pronto)</span>
                </>
              )}
            </button>

            <a
              href="https://supabase.com/dashboard/project/_/sql/new"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-800 hover:text-slate-950 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors shadow-2xs"
            >
              <span>Abrir SQL Editor no Supabase</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </a>

            <button
              type="button"
              onClick={onRecheck}
              disabled={isChecking}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-md transition-colors shadow-2xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? 'Verificando...' : 'Já executei, testar agora!'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSql(!showSql)}
              className="text-xs text-amber-900 underline hover:text-amber-950 ml-auto py-1"
            >
              {showSql ? 'Ocultar código SQL' : 'Visualizar código SQL'}
            </button>
          </div>

          {/* Collapsible SQL preview */}
          {showSql && (
            <div className="border border-amber-300 rounded-lg overflow-hidden mt-3 animate-in fade-in duration-150">
              <div className="px-3 py-1.5 bg-amber-100/70 border-b border-amber-200 flex items-center justify-between text-xs text-amber-950 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-amber-700" />
                  <span>Código SQL completo com Políticas RLS</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="text-[11px] text-slate-700 bg-white hover:bg-slate-100 px-2 py-0.5 rounded border border-slate-200"
                >
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <pre className="p-3 bg-slate-900 text-slate-100 text-[11px] font-mono overflow-x-auto max-h-56 leading-relaxed">
                <code>{SQL_POLICIES_SCHEMA.granular}</code>
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
