export type TaskStatus = 'Não iniciado' | 'Em Andamento' | 'Finalizado';

export type TaskPriority = 'Baixa' | 'Média' | 'Alta' | 'Urgente';

export interface CRMTask {
  id: string;
  user_id?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  deal_value?: number; // Valor monetário em Reais (R$)
  due_date?: string; // YYYY-MM-DD
  tags?: string[];
  notes?: string;
  order_index?: number;
  created_at: string;
  updated_at: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export type ConnectionState = 'connected' | 'disconnected' | 'testing' | 'table_missing' | 'error';

export type PolicyMode = 'strict_auth' | 'granular' | 'open_anon';

export interface FilterOptions {
  searchQuery: string;
  priority: 'all' | TaskPriority;
  sortBy: 'date_desc' | 'date_asc' | 'value_desc' | 'value_asc' | 'title';
}
