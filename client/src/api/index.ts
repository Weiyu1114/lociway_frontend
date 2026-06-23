import { logger } from '@lark-apaas/client-toolkit/logger';
import type { IDashboardData } from '@/pages/DashboardPage/context';


const DEFAULT_API_BASE = 'https://lociway-backend.onrender.com';
const API_BASE =
  import.meta.env.VITE_LOCIWAY_API_BASE?.replace(/\/$/, '') ?? DEFAULT_API_BASE;
const ADMIN_URL =
  typeof window === 'undefined' ? '/admin' : `${window.location.origin}/admin`;

async function requestData<T>(path: string): Promise<T[]> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`${path} 请求失败：${response.status}`);
  }

  const payload = (await response.json()) as { data?: T[] };
  return payload.data ?? [];
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`${path} 请求失败：${response.status}`);
  }

  return (await response.json()) as T;
}

export async function fetchDashboardData(): Promise<IDashboardData> {
  try {
    const [dashboard, business, opportunities, tasks, materials] =
      await Promise.all([
        requestData<IDashboardData['dashboard'][number]>('/api/dashboard'),
        requestData<IDashboardData['business'][number]>('/api/business'),
        requestData<IDashboardData['opportunities'][number]>('/api/opportunities'),
        requestData<IDashboardData['tasks'][number]>('/api/tasks'),
        requestData<IDashboardData['materials'][number]>('/api/resources'),
      ]);

    return {
      meta: {
        base_url: ADMIN_URL,
        updated_at: new Date().toISOString(),
      },
      dashboard,
      business,
      opportunities,
      tasks,
      materials,
    };
  } catch (error) {
    logger.error('获取 LociWay 仪表盘数据失败', error);
    throw error;
  }
}

export interface IAdminSchemaResponse {
  tables: Record<string, string[]>;
}

export interface IAdminListResponse {
  data: Array<Record<string, unknown>>;
}

export interface IAdminRecordResponse {
  data: Record<string, unknown>;
}

export async function fetchAdminSchema(): Promise<IAdminSchemaResponse> {
  return requestJson<IAdminSchemaResponse>('/api/admin/schema');
}

export async function fetchAdminRecords(tableKey: string): Promise<IAdminListResponse> {
  return requestJson<IAdminListResponse>(`/api/admin/${tableKey}`);
}

export async function createAdminRecord(
  tableKey: string,
  fields: Record<string, unknown>
): Promise<IAdminRecordResponse> {
  return requestJson<IAdminRecordResponse>(`/api/admin/${tableKey}`, {
    method: 'POST',
    body: JSON.stringify(fields),
  });
}

export async function updateAdminRecord(
  tableKey: string,
  recordId: string,
  fields: Record<string, unknown>
): Promise<IAdminRecordResponse> {
  return requestJson<IAdminRecordResponse>(`/api/admin/${tableKey}/${recordId}`, {
    method: 'PUT',
    body: JSON.stringify(fields),
  });
}

export async function deleteAdminRecord(
  tableKey: string,
  recordId: string
): Promise<void> {
  await requestJson<{ ok: boolean }>(`/api/admin/${tableKey}/${recordId}`, {
    method: 'DELETE',
  });
}
