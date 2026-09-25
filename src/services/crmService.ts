import { CRMTask, TaskStatus } from '../types/crm.ts';
import { getSupabaseClient } from '../lib/supabase.ts';

const LOCAL_STORAGE_KEY = 'crm_manual_tasks_data';

// Helper to get local tasks - ALWAYS starts empty unless user manually added tasks
export function getLocalTasks(): CRMTask[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Erro ao ler tarefas locais:', e);
    return [];
  }
}

// Helper to save tasks to local storage
export function setLocalTasks(tasks: CRMTask[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error('Erro ao gravar tarefas locais:', e);
  }
}

// Fetch all tasks from Supabase or fallback to LocalStorage
export async function fetchAllTasks(): Promise<{ tasks: CRMTask[]; source: 'supabase' | 'local'; error?: string }> {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('crm_tasks')
        .select('*')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

      if (!error && data) {
        const mapped: CRMTask[] = data.map((item) => ({
          id: item.id,
          user_id: item.user_id || undefined,
          title: item.title,
          description: item.description || '',
          status: item.status as TaskStatus,
          priority: item.priority || 'Média',
          client_name: item.client_name || '',
          client_email: item.client_email || '',
          client_phone: item.client_phone || '',
          deal_value: Number(item.deal_value || 0),
          due_date: item.due_date || '',
          tags: Array.isArray(item.tags) ? item.tags : [],
          notes: item.notes || '',
          order_index: item.order_index ?? 0,
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString(),
        }));

        // Keep local storage updated as a backup
        setLocalTasks(mapped);
        return { tasks: mapped, source: 'supabase' };
      } else if (error) {
        console.warn('Erro ao consultar Supabase, utilizando cache local:', error.message);
        return { tasks: getLocalTasks(), source: 'local', error: error.message };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('Exceção ao buscar do Supabase:', msg);
      return { tasks: getLocalTasks(), source: 'local', error: msg };
    }
  }

  // If no Supabase configured, return local tasks
  return { tasks: getLocalTasks(), source: 'local' };
}

// Create a new task manually
export async function createTask(
  taskData: Omit<CRMTask, 'id' | 'created_at' | 'updated_at'>
): Promise<{ task: CRMTask; savedInSupabase: boolean; error?: string }> {
  const now = new Date().toISOString();
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const newTask: CRMTask = {
    ...taskData,
    id,
    created_at: now,
    updated_at: now,
  };

  const supabase = getSupabaseClient();
  let savedInSupabase = false;
  let supabaseError: string | undefined;

  if (supabase) {
    try {
      // Obter usuário autenticado atual se existir, para cumprir a política auth.uid() = user_id
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData?.user?.id || newTask.user_id || null;
      if (currentUserId) {
        newTask.user_id = currentUserId;
      }

      const { data, error } = await supabase
        .from('crm_tasks')
        .insert([
          {
            id: newTask.id,
            user_id: currentUserId,
            title: newTask.title,
            description: newTask.description || null,
            status: newTask.status,
            priority: newTask.priority,
            client_name: newTask.client_name || null,
            client_email: newTask.client_email || null,
            client_phone: newTask.client_phone || null,
            deal_value: newTask.deal_value || 0,
            due_date: newTask.due_date || null,
            tags: newTask.tags || [],
            notes: newTask.notes || null,
            order_index: newTask.order_index ?? 0,
          },
        ])
        .select()
        .single();

      if (!error && data) {
        savedInSupabase = true;
      } else if (error) {
        supabaseError = error.message;
        console.error('Erro ao inserir no Supabase:', error.message);
      }
    } catch (e: unknown) {
      supabaseError = e instanceof Error ? e.message : String(e);
      console.error('Falha de rede ao salvar no Supabase:', supabaseError);
    }
  }

  // Always update local cache so the UI never loses state
  const current = getLocalTasks();
  setLocalTasks([newTask, ...current]);

  return { task: newTask, savedInSupabase, error: supabaseError };
}

// Update task details
export async function updateTask(
  id: string,
  updates: Partial<CRMTask>
): Promise<{ success: boolean; error?: string }> {
  const now = new Date().toISOString();
  const supabase = getSupabaseClient();
  let supabaseError: string | undefined;

  if (supabase) {
    try {
      const dbUpdates: Record<string, unknown> = {
        updated_at: now,
      };

      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description || null;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
      if (updates.client_name !== undefined) dbUpdates.client_name = updates.client_name || null;
      if (updates.client_email !== undefined) dbUpdates.client_email = updates.client_email || null;
      if (updates.client_phone !== undefined) dbUpdates.client_phone = updates.client_phone || null;
      if (updates.deal_value !== undefined) dbUpdates.deal_value = updates.deal_value || 0;
      if (updates.due_date !== undefined) dbUpdates.due_date = updates.due_date || null;
      if (updates.tags !== undefined) dbUpdates.tags = updates.tags || [];
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes || null;
      if (updates.order_index !== undefined) dbUpdates.order_index = updates.order_index;

      const { error } = await supabase
        .from('crm_tasks')
        .update(dbUpdates)
        .eq('id', id);

      if (error) {
        supabaseError = error.message;
        console.error('Erro ao atualizar tarefa no Supabase:', error.message);
      }
    } catch (e: unknown) {
      supabaseError = e instanceof Error ? e.message : String(e);
      console.error('Falha de conexão ao atualizar no Supabase:', supabaseError);
    }
  }

  // Update local storage
  const current = getLocalTasks();
  const updated = current.map((t) => (t.id === id ? { ...t, ...updates, updated_at: now } : t));
  setLocalTasks(updated);

  return { success: !supabaseError, error: supabaseError };
}

// Update task status specifically (for Kanban movement)
export async function updateTaskStatus(
  id: string,
  newStatus: TaskStatus
): Promise<{ success: boolean; error?: string }> {
  return updateTask(id, { status: newStatus });
}

// Delete a task
export async function deleteTask(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  let supabaseError: string | undefined;

  if (supabase) {
    try {
      const { error } = await supabase
        .from('crm_tasks')
        .delete()
        .eq('id', id);

      if (error) {
        supabaseError = error.message;
        console.error('Erro ao deletar no Supabase:', error.message);
      }
    } catch (e: unknown) {
      supabaseError = e instanceof Error ? e.message : String(e);
      console.error('Falha ao deletar do Supabase:', supabaseError);
    }
  }

  // Update local storage
  const current = getLocalTasks();
  const filtered = current.filter((t) => t.id !== id);
  setLocalTasks(filtered);

  return { success: !supabaseError, error: supabaseError };
}

// Bulk sync local tasks into Supabase
export async function syncLocalToSupabase(): Promise<{ syncedCount: number; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { syncedCount: 0, error: 'Supabase não está configurado.' };
  }

  const localTasks = getLocalTasks();
  if (localTasks.length === 0) {
    return { syncedCount: 0 };
  }

  try {
    const { data: authData } = await supabase.auth.getUser();
    const currentUserId = authData?.user?.id || null;

    const payload = localTasks.map((t) => ({
      id: t.id,
      user_id: t.user_id || currentUserId,
      title: t.title,
      description: t.description || null,
      status: t.status,
      priority: t.priority,
      client_name: t.client_name || null,
      client_email: t.client_email || null,
      client_phone: t.client_phone || null,
      deal_value: t.deal_value || 0,
      due_date: t.due_date || null,
      tags: t.tags || [],
      notes: t.notes || null,
      order_index: t.order_index ?? 0,
      created_at: t.created_at,
      updated_at: t.updated_at,
    }));

    const { error } = await supabase
      .from('crm_tasks')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      return { syncedCount: 0, error: error.message };
    }

    return { syncedCount: localTasks.length };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { syncedCount: 0, error: msg };
  }
}
