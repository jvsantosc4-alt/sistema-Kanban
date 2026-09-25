import { TaskPriority, TaskStatus } from '../types/crm.ts';

export function formatCurrencyBRL(value?: number): string {
  if (value === undefined || value === null || isNaN(value)) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDateBR(dateString?: string): string {
  if (!dateString) return '';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('pt-BR');
  } catch {
    return dateString;
  }
}

export function isOverdue(dateString?: string, status?: TaskStatus): boolean {
  if (!dateString || status === 'Finalizado') return false;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [year, month, day] = dateString.split('-').map(Number);
    const dueDate = new Date(year, month - 1, day);
    return dueDate < today;
  } catch {
    return false;
  }
}

export function getPriorityStyles(priority: TaskPriority): {
  bg: string;
  text: string;
  dot: string;
  border: string;
} {
  switch (priority) {
    case 'Urgente':
      return {
        bg: 'bg-rose-50 text-rose-700',
        text: 'text-rose-700',
        dot: 'bg-rose-500',
        border: 'border-rose-200',
      };
    case 'Alta':
      return {
        bg: 'bg-amber-50 text-amber-800',
        text: 'text-amber-800',
        dot: 'bg-amber-500',
        border: 'border-amber-200',
      };
    case 'Média':
      return {
        bg: 'bg-blue-50 text-blue-700',
        text: 'text-blue-700',
        dot: 'bg-blue-500',
        border: 'border-blue-200',
      };
    case 'Baixa':
    default:
      return {
        bg: 'bg-slate-100 text-slate-700',
        text: 'text-slate-700',
        dot: 'bg-slate-400',
        border: 'border-slate-200',
      };
  }
}

export function getStatusMeta(status: TaskStatus): {
  label: TaskStatus;
  accentColor: string;
  badgeBg: string;
  headerBg: string;
  borderHover: string;
  dotColor: string;
} {
  switch (status) {
    case 'Não iniciado':
      return {
        label: 'Não iniciado',
        accentColor: 'text-slate-700',
        badgeBg: 'bg-slate-200 text-slate-800',
        headerBg: 'bg-slate-100/90 border-slate-200',
        borderHover: 'hover:border-slate-300',
        dotColor: 'bg-slate-400',
      };
    case 'Em Andamento':
      return {
        label: 'Em Andamento',
        accentColor: 'text-blue-700',
        badgeBg: 'bg-blue-100 text-blue-800',
        headerBg: 'bg-blue-50/80 border-blue-200',
        borderHover: 'hover:border-blue-300',
        dotColor: 'bg-blue-500',
      };
    case 'Finalizado':
      return {
        label: 'Finalizado',
        accentColor: 'text-emerald-700',
        badgeBg: 'bg-emerald-100 text-emerald-800',
        headerBg: 'bg-emerald-50/80 border-emerald-200',
        borderHover: 'hover:border-emerald-300',
        dotColor: 'bg-emerald-500',
      };
  }
}
