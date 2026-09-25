import React, { useState, useEffect } from 'react';
import { SupabaseConfig, ConnectionState, PolicyMode } from '../types/crm.ts';
import {
  saveStoredSupabaseConfig,
  clearStoredSupabaseConfig,
  testSupabaseConnection,
  getSupabaseClient,
  SQL_POLICIES_SCHEMA,
} from '../lib/supabase.ts';
import { syncLocalToSupabase } from '../services/crmService.ts';
import {
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  UploadCloud,
  ShieldCheck,
  Terminal,
  ExternalLink,
  UserCheck,
  Lock,
  Unlock,
  Key,
  Info,
  LogOut,
  Mail,
} from 'lucide-react';
import { User } from '@supabase/supabase-js';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SupabaseConfig;
  connectionState: ConnectionState;
  onConfigUpdated: (newConfig: SupabaseConfig, newState: ConnectionState) => void;
  onTasksSynced: () => void;
  initialTab?: 'connection' | 'policies' | 'auth' | 'audit';
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  config,
  connectionState,
  onConfigUpdated,
  onTasksSynced,
  initialTab = 'connection',
}) => {
  const [activeTab, setActiveTab] = useState<'connection' | 'policies' | 'auth' | 'audit'>(initialTab);
  const [url, setUrl] = useState(config.url || '');
  const [anonKey, setAnonKey] = useState(config.anonKey || '');
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [testResult, setTestResult] = useState<{ state: ConnectionState; message: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Policy selector
  const [selectedPolicyMode, setSelectedPolicyMode] = useState<PolicyMode>('granular');

  // Supabase Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync state when props change
  useEffect(() => {
    setUrl(config.url || '');
    setAnonKey(config.anonKey || '');
    if (isOpen) {
      setActiveTab(initialTab);
      checkUserAuth();
    }
  }, [config, isOpen, initialTab]);

  const checkUserAuth = async () => {
    const client = getSupabaseClient();
    if (!client) {
      setCurrentUser(null);
      return;
    }
    try {
      const { data } = await client.auth.getUser();
      setCurrentUser(data?.user || null);
    } catch {
      setCurrentUser(null);
    }
  };

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setTestResult(null);
    setSyncMessage(null);

    const newConfig: SupabaseConfig = {
      url: url.trim(),
      anonKey: anonKey.trim(),
    };

    saveStoredSupabaseConfig(newConfig);

    const result = await testSupabaseConnection(newConfig);
    setTestResult(result);
    setIsTesting(false);
    onConfigUpdated(newConfig, result.state);
    checkUserAuth();
  };

  const handleDisconnect = () => {
    clearStoredSupabaseConfig();
    setUrl('');
    setAnonKey('');
    setTestResult(null);
    setSyncMessage(null);
    setCurrentUser(null);
    onConfigUpdated({ url: '', anonKey: '' }, 'disconnected');
  };

  const handleSyncLocal = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const { syncedCount, error } = await syncLocalToSupabase();
      if (error) {
        setSyncMessage(`Erro ao sincronizar: ${error}`);
      } else {
        setSyncMessage(`${syncedCount} tarefa(s) sincronizada(s) com sucesso para o Supabase!`);
        onTasksSynced();
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setSyncMessage(`Falha: ${msg}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Auth actions
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = getSupabaseClient();
    if (!client) {
      setAuthMessage({ type: 'error', text: 'Configure a URL e Anon Key primeiro.' });
      return;
    }

    setAuthLoading(true);
    setAuthMessage(null);

    try {
      if (authMode === 'signin') {
        const { data, error } = await client.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword,
        });
        if (error) throw error;
        setCurrentUser(data.user);
        setAuthMessage({ type: 'success', text: `Autenticado com sucesso como ${data.user.email}!` });
      } else {
        const { data, error } = await client.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
        });
        if (error) throw error;
        setCurrentUser(data.user);
        setAuthMessage({
          type: 'success',
          text: 'Cadastro realizado! Se o Supabase exigir confirmação de e-mail, verifique sua caixa de entrada.',
        });
      }
      onTasksSynced();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setAuthMessage({ type: 'error', text: msg });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut();
      setCurrentUser(null);
      setAuthMessage({ type: 'success', text: 'Sessão encerrada com sucesso.' });
      onTasksSynced();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-900 flex items-center gap-2">
                <span>Supabase & Políticas SQL (RLS)</span>
                {connectionState === 'connected' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </h3>
              <p className="text-xs text-slate-500">
                Gerencie banco de dados, tabelas e políticas de segurança em nível de linha (Row Level Security)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 flex items-center gap-1 bg-white text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('policies')}
            className={`py-3 px-3.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'policies'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Políticas SQL (RLS)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('connection')}
            className={`py-3 px-3.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'connection'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4 text-slate-500" />
            <span>Conexão Supabase</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('auth')}
            className={`py-3 px-3.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'auth'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span>Usuário & Auth ({currentUser ? 'Logado' : 'Anon'})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-3.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-4 h-4 text-indigo-600" />
            <span>Auditoria (pg_policies)</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 space-y-5 max-h-[76vh] overflow-y-auto">
          {/* TAB 1: POLÍTICAS SQL (RLS) */}
          {activeTab === 'policies' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <h4 className="font-semibold text-slate-900 text-sm">
                      O que é o uso político do SQL (Row Level Security - RLS)?
                    </h4>
                    <p className="text-slate-600 mt-1 leading-relaxed">
                      No PostgreSQL / Supabase, o <strong>Row Level Security (RLS)</strong> permite que cada comando SQL
                      (<code>SELECT</code>, <code>INSERT</code>, <code>UPDATE</code>, <code>DELETE</code>) seja filtrado
                      automaticamente pelo banco de dados através de <strong>Políticas de Segurança (Policies)</strong>.
                      Isso garante que um usuário só consiga ver ou alterar as linhas autorizadas pelas cláusulas
                      <code>USING(...)</code> e <code>WITH CHECK(...)</code>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Policy Mode Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-2">
                  Escolha o Modelo de Política SQL para seu Banco:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedPolicyMode('granular')}
                    className={`p-3 text-left rounded-lg border text-xs transition-all ${
                      selectedPolicyMode === 'granular'
                        ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600 text-emerald-950 font-medium'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Políticas Granulares</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      Políticas separadas para SELECT, INSERT, UPDATE e DELETE. Suporta usuários autenticados e anônimos.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPolicyMode('strict_auth')}
                    className={`p-3 text-left rounded-lg border text-xs transition-all ${
                      selectedPolicyMode === 'strict_auth'
                        ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600 text-blue-950 font-medium'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <Key className="w-3.5 h-3.5 text-blue-600" />
                      <span>Estrito por Usuário</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      Isolamento total com <code>auth.uid() = user_id</code>. Cada vendedor só acessa suas próprias tarefas.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPolicyMode('open_anon')}
                    className={`p-3 text-left rounded-lg border text-xs transition-all ${
                      selectedPolicyMode === 'open_anon'
                        ? 'border-amber-600 bg-amber-50/70 ring-1 ring-amber-600 text-amber-950 font-medium'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <Unlock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Políticas Públicas</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      Permissiva para chave Anon da aplicação, permitindo manipulação direta sem login obrigatório.
                    </p>
                  </button>
                </div>
              </div>

              {/* Policy Code Block */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                    <Terminal className="w-4 h-4 text-slate-500" />
                    <span>
                      {selectedPolicyMode === 'granular' && 'Script SQL: Tabela Completa com Políticas Granulares RLS'}
                      {selectedPolicyMode === 'strict_auth' && 'Script SQL: Política Estrita de Isolamento de Usuário'}
                      {selectedPolicyMode === 'open_anon' && 'Script SQL: Política Aberta para Chave Anon'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        selectedPolicyMode === 'granular'
                          ? SQL_POLICIES_SCHEMA.granular
                          : selectedPolicyMode === 'strict_auth'
                          ? SQL_POLICIES_SCHEMA.strict_auth
                          : SQL_POLICIES_SCHEMA.open_anon,
                        'policy_sql'
                      )
                    }
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded transition-colors shadow-2xs"
                  >
                    {copiedKey === 'policy_sql' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700 font-semibold">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar Código SQL</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-3 bg-slate-900 text-slate-100 text-[11px] font-mono overflow-x-auto max-h-64 leading-relaxed">
                  <code>
                    {selectedPolicyMode === 'granular' && SQL_POLICIES_SCHEMA.granular}
                    {selectedPolicyMode === 'strict_auth' && SQL_POLICIES_SCHEMA.strict_auth}
                    {selectedPolicyMode === 'open_anon' && SQL_POLICIES_SCHEMA.open_anon}
                  </code>
                </pre>

                <div className="p-3 bg-slate-50 text-[11px] text-slate-600 flex items-center justify-between border-t border-slate-200">
                  <span>
                    Cole e execute no <strong>SQL Editor</strong> do painel Supabase.
                  </span>
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-slate-900 font-semibold hover:underline shrink-0"
                  >
                    <span>Abrir SQL Editor no Supabase</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Clauses Explanations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
                    <Info className="w-3.5 h-3.5 text-blue-500" />
                    <span>Cláusula USING (...)</span>
                  </div>
                  <p className="text-slate-600 leading-normal">
                    Filtra quais registros existentes no banco de dados estão visíveis para leitura (SELECT) ou qualificação
                    para UPDATE e DELETE. Ex: <code>USING (auth.uid() = user_id)</code>.
                  </p>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
                    <Info className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Cláusula WITH CHECK (...)</span>
                  </div>
                  <p className="text-slate-600 leading-normal">
                    Valida o novo registro sendo inserido (INSERT) ou o novo estado após alteração (UPDATE). Impede que um
                    usuário grave dados em nome de outro.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONEXÃO SUPABASE */}
          {activeTab === 'connection' && (
            <div className="space-y-4">
              {/* Status banner */}
              <div className="p-3.5 rounded-lg border flex items-start gap-3 bg-slate-50 border-slate-200">
                {connectionState === 'connected' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : connectionState === 'table_missing' ? (
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                ) : connectionState === 'error' ? (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                ) : (
                  <Database className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                )}

                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">
                      {connectionState === 'connected' && 'Supabase Conectado & Ativo'}
                      {connectionState === 'table_missing' && 'Conectado! Tabela crm_tasks não encontrada'}
                      {connectionState === 'error' && 'Erro de Comunicação'}
                      {connectionState === 'disconnected' && 'Aguardando Credenciais'}
                      {connectionState === 'testing' && 'Verificando Conexão...'}
                    </span>
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                        connectionState === 'connected'
                          ? 'bg-emerald-100 text-emerald-800'
                          : connectionState === 'table_missing'
                          ? 'bg-amber-100 text-amber-800'
                          : connectionState === 'error'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {connectionState === 'connected' ? 'Pronto para salvar' : 'Pendente'}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1">
                    {testResult?.message ||
                      (connectionState === 'connected'
                        ? 'Todas as tarefas criadas, editadas ou com status alterado são sincronizadas instantaneamente no seu banco PostgreSQL Supabase.'
                        : 'Insira as credenciais do seu projeto Supabase abaixo para salvar suas tarefas.')}
                  </p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleTestAndSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Project URL do Supabase
                  </label>
                  <input
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://seu-projeto.supabase.co"
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-slate-900 bg-white"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Encontrado em: Supabase Dashboard &gt; Project Settings &gt; Data API &gt; URL
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Project API Key (Anon / Public)
                  </label>
                  <input
                    type="password"
                    required
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-slate-900 bg-white"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Chave anônima pública (anon key) do seu projeto Supabase.
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  {config.url && (
                    <button
                      type="button"
                      onClick={handleDisconnect}
                      className="text-xs text-rose-600 hover:text-rose-800 hover:underline"
                    >
                      Desconectar Supabase
                    </button>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={isTesting || !url || !anonKey}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors shadow-xs disabled:opacity-50"
                    >
                      {isTesting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Testando Conexão...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Salvar e Conectar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>

              {/* Sync Section */}
              {connectionState === 'connected' && (
                <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-lg flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-semibold text-emerald-950 block">
                      Sincronizar Tarefas Locais
                    </span>
                    <span className="text-emerald-700">
                      {syncMessage || 'Envie todas as tarefas criadas localmente para a tabela no Supabase.'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSyncLocal}
                    disabled={isSyncing}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-900 bg-white hover:bg-emerald-100 border border-emerald-300 rounded-md transition-colors shrink-0 disabled:opacity-50"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: USUÁRIO & AUTH */}
          {activeTab === 'auth' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-start gap-3">
                  <UserCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">
                      Autenticação Supabase e Políticas por Usuário (auth.uid())
                    </h4>
                    <p className="text-slate-600 mt-1 leading-relaxed">
                      Ao fazer login ou cadastro, as tarefas criadas recebem automaticamente seu <code>user_id</code>.
                      Nas políticas de segurança (RLS), o PostgreSQL valida se <code>auth.uid() = user_id</code>,
                      garantindo que outros usuários não consigam acessar suas tarefas no banco.
                    </p>
                  </div>
                </div>
              </div>

              {currentUser ? (
                /* Authenticated User Panel */
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Usuário Autenticado
                    </span>
                    <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-800 rounded">
                      Ativo
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold text-slate-900">{currentUser.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
                      <span>UUID (auth.uid()):</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-800">{currentUser.id}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      Suas ações no Kanban respeitarão as políticas RLS configuradas.
                    </span>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sair da Conta</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Sign in / Sign up form */
                <form onSubmit={handleAuthSubmit} className="p-4 bg-white border border-slate-200 rounded-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-semibold text-xs text-slate-800">
                      {authMode === 'signin' ? 'Acessar Conta de Usuário' : 'Criar Nova Conta no Supabase'}
                    </span>
                    <div className="flex items-center gap-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setAuthMode('signin')}
                        className={`px-2 py-1 rounded ${
                          authMode === 'signin' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Entrar
                      </button>
                      <button
                        type="button"
                        onClick={() => setAuthMode('signup')}
                        className={`px-2 py-1 rounded ${
                          authMode === 'signup' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Cadastrar
                      </button>
                    </div>
                  </div>

                  {authMessage && (
                    <div
                      className={`p-3 text-xs rounded-md border ${
                        authMessage.type === 'success'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      {authMessage.text}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">E-mail</label>
                      <input
                        type="email"
                        required
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Senha</label>
                      <input
                        type="password"
                        required
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">
                      Permite autenticar para testar políticas com isolamento de <code>auth.uid()</code>.
                    </span>
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors shadow-xs disabled:opacity-50"
                    >
                      {authLoading ? 'Processando...' : authMode === 'signin' ? 'Entrar' : 'Cadastrar'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 4: AUDITORIA DE POLÍTICAS (pg_policies) */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-start gap-3">
                  <Terminal className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">
                      Auditoria de Políticas RLS no PostgreSQL (pg_policies)
                    </h4>
                    <p className="text-slate-600 mt-1 leading-relaxed">
                      Para inspecionar quais políticas foram aplicadas à tabela <code>crm_tasks</code> no banco de dados,
                      execute a consulta abaixo no <strong>SQL Editor</strong> do seu Supabase. Ela retorna o nome da
                      política, papéis autorizados, comando SQL (ALL, SELECT, INSERT, etc.) e as regras
                      <code>USING</code> e <code>WITH CHECK</code>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">
                    Query SQL de Inspeção (pg_policies)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(SQL_POLICIES_SCHEMA.audit_sql, 'audit_sql')}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded transition-colors shadow-2xs"
                  >
                    {copiedKey === 'audit_sql' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700 font-semibold">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar Query</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-3 bg-slate-900 text-slate-100 text-[11px] font-mono overflow-x-auto leading-relaxed">
                  <code>{SQL_POLICIES_SCHEMA.audit_sql}</code>
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>RLS (Row Level Security) habilitado na tabela crm_tasks</span>
          </div>
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
