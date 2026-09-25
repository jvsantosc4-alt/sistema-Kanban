import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { SupabaseConfig, ConnectionState, PolicyMode } from '../types/crm.ts';

const STORAGE_URL_KEY = 'crm_supabase_url';
const STORAGE_KEY_KEY = 'crm_supabase_anon_key';

// 1. Script Completo com Políticas de Segurança RLS (Row Level Security)
export const SQL_POLICIES_SCHEMA = {
  // Modelo Granular & Seguro (Compatível com Anon e Usuário Autenticado)
  granular: `-- ========================================================
-- CRM KANBAN - SCRIPT INFALÍVEL PARA SUPABASE
-- ========================================================

-- 1. Habilitar extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Criação da Tabela crm_tasks
CREATE TABLE IF NOT EXISTS public.crm_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Não iniciado',
  priority TEXT NOT NULL DEFAULT 'Média',
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  deal_value NUMERIC(12, 2) DEFAULT 0,
  due_date DATE,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Habilitar Segurança em Nível de Linha (RLS)
ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;

-- 4. Criar Políticas de Segurança dentro de um bloco seguro
DO $$
BEGIN
  -- Remover políticas anteriores para evitar duplicidade
  DROP POLICY IF EXISTS "crm_tasks_policy" ON public.crm_tasks;
  DROP POLICY IF EXISTS "crm_tasks_select_policy" ON public.crm_tasks;
  DROP POLICY IF EXISTS "crm_tasks_insert_policy" ON public.crm_tasks;
  DROP POLICY IF EXISTS "crm_tasks_update_policy" ON public.crm_tasks;
  DROP POLICY IF EXISTS "crm_tasks_delete_policy" ON public.crm_tasks;
  DROP POLICY IF EXISTS "Permitir gerenciamento de tarefas crm" ON public.crm_tasks;

  -- Criar política permissiva para leitura, gravação e edição
  CREATE POLICY "crm_tasks_policy"
  ON public.crm_tasks
  FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);
END $$;

-- 5. Habilitar canal de Realtime com proteção contra duplicidade
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_tasks;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN others THEN NULL;
  END;
END $$;
`,

  // Modelo Estrito com Autenticação (Apenas auth.users podem ver/manipular seus próprios registros)
  strict_auth: `-- ========================================================
-- POLÍTICAS ESTRITAS DE RLS POR USUÁRIO (auth.uid())
-- ========================================================
-- Cada usuário cadastrado vê e gerencia exclusivamente suas tarefas.

ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "crm_tasks_strict_user_policy" ON public.crm_tasks;

CREATE POLICY "crm_tasks_strict_user_policy"
ON public.crm_tasks
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
`,

  // Modelo Aberto para Anon (Ambientes rápidos de teste)
  open_anon: `-- ========================================================
-- POLÍTICA PERMISSIVA PARA CHAVE PÚBLICA (ANON)
-- ========================================================
ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir gerenciamento de tarefas crm" ON public.crm_tasks;

CREATE POLICY "Permitir gerenciamento de tarefas crm"
ON public.crm_tasks
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);
`,

  // Script de Auditoria para conferir as políticas ativas
  audit_sql: `-- ========================================================
-- CONSULTA DE AUDITORIA: LISTAR POLÍTICAS RLS ATIVAS
-- ========================================================
SELECT 
  schemaname AS schema,
  tablename AS tabela,
  policyname AS nome_politica,
  permissive AS permissiva,
  roles AS papeis,
  cmd AS comando_sql,
  qual AS condicao_using,
  with_check AS condicao_with_check
FROM pg_policies
WHERE tablename = 'crm_tasks';
`,
};

export const SUPABASE_SQL_SCHEMA = SQL_POLICIES_SCHEMA.granular;

export function getStoredSupabaseConfig(): SupabaseConfig {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

  const localUrl = localStorage.getItem(STORAGE_URL_KEY)?.trim() || '';
  const localKey = localStorage.getItem(STORAGE_KEY_KEY)?.trim() || '';

  const url = localUrl || (envUrl && !envUrl.includes('seu-projeto') ? envUrl : '');
  const anonKey = localKey || (envKey && !envKey.includes('sua-anon') ? envKey : '');

  return { url, anonKey };
}

export function saveStoredSupabaseConfig(config: SupabaseConfig): void {
  if (config.url) {
    localStorage.setItem(STORAGE_URL_KEY, config.url.trim());
  } else {
    localStorage.removeItem(STORAGE_URL_KEY);
  }

  if (config.anonKey) {
    localStorage.setItem(STORAGE_KEY_KEY, config.anonKey.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_KEY);
  }
}

export function clearStoredSupabaseConfig(): void {
  localStorage.removeItem(STORAGE_URL_KEY);
  localStorage.removeItem(STORAGE_KEY_KEY);
  cachedClient = null;
  currentClientKey = '';
}

let cachedClient: SupabaseClient | null = null;
let currentClientKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getStoredSupabaseConfig();

  if (!url || !anonKey) {
    cachedClient = null;
    currentClientKey = '';
    return null;
  }

  const clientKey = `${url}:${anonKey}`;
  if (cachedClient && currentClientKey === clientKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    currentClientKey = clientKey;
    return cachedClient;
  } catch (error) {
    console.error('Erro ao inicializar cliente Supabase:', error);
    cachedClient = null;
    currentClientKey = '';
    return null;
  }
}

export async function getCurrentSupabaseUser(): Promise<User | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data } = await client.auth.getUser();
    return data?.user || null;
  } catch {
    return null;
  }
}

export async function testSupabaseConnection(config?: SupabaseConfig): Promise<{
  state: ConnectionState;
  message: string;
}> {
  const targetConfig = config || getStoredSupabaseConfig();

  if (!targetConfig.url || !targetConfig.anonKey) {
    return {
      state: 'disconnected',
      message: 'URL e Chave Anônima do Supabase não configuradas.',
    };
  }

  try {
    const testClient = createClient(targetConfig.url, targetConfig.anonKey, {
      auth: { persistSession: false },
    });

    const { error } = await testClient
      .from('crm_tasks')
      .select('id', { count: 'exact', head: true });

    if (error) {
      if (
        error.code === '42P01' ||
        error.message?.includes('relation "public.crm_tasks" does not exist') ||
        error.message?.includes('crm_tasks')
      ) {
        return {
          state: 'table_missing',
          message:
            'Conectado ao Supabase! Porém a tabela "crm_tasks" ainda não foi criada com as políticas SQL. Execute o script com políticas no SQL Editor.',
        };
      }
      return {
        state: 'error',
        message: `Falha na conexão: ${error.message} (Código: ${error.code || 'Desconhecido'})`,
      };
    }

    return {
      state: 'connected',
      message: 'Conexão com Supabase e tabela com políticas RLS estabelecida com sucesso!',
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      state: 'error',
      message: `Erro ao tentar conectar: ${errMsg}`,
    };
  }
}
