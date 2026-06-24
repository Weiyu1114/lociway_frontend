import { logger } from '@lark-apaas/client-toolkit/logger';
import type { IDashboardData } from '@/pages/DashboardPage/context';


const DEFAULT_API_BASE = 'https://lociway-backend.onrender.com';
const API_BASE =
  import.meta.env.VITE_LOCIWAY_API_BASE?.replace(/\/$/, '') ?? DEFAULT_API_BASE;
const ADMIN_URL =
  typeof window === 'undefined' ? '/#/admin' : `${window.location.origin}/#/admin`;

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
    const [dashboard, business, opportunities, tasks, materials, meetings] =
      await Promise.all([
        requestData<IDashboardData['dashboard'][number]>('/api/dashboard'),
        requestData<IDashboardData['business'][number]>('/api/business'),
        requestData<IDashboardData['opportunities'][number]>('/api/opportunities'),
        requestData<IDashboardData['tasks'][number]>('/api/tasks'),
        requestData<IDashboardData['materials'][number]>('/api/resources'),
        requestData<NonNullable<IDashboardData['meetings']>[number]>('/api/meetings'),
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
      meetings,
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

export async function uploadMeetingFile(formData: FormData): Promise<{
  meeting: Record<string, unknown>;
  analysis: Record<string, unknown>;
  created_tasks: Array<Record<string, unknown>>;
}> {
  const response = await fetch(`${API_BASE}/api/meetings/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`会议文件上传失败：${response.status}`);
  }

  return (await response.json()) as {
    meeting: Record<string, unknown>;
    analysis: Record<string, unknown>;
    created_tasks: Array<Record<string, unknown>>;
  };
}

export function toApiUrl(pathOrUrl: unknown): string {
  const value = String(pathOrUrl ?? '');
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `${API_BASE}${value.startsWith('/') ? value : `/${value}`}`;
}

export async function uploadAdminFile(
  tableKey: string,
  formData: FormData,
  onProgress?: (percent: number) => void
): Promise<{
  record: Record<string, unknown>;
  analysis: Record<string, unknown>;
  created_tasks: Array<Record<string, unknown>>;
}> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/api/admin/${tableKey}/upload`);
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(`文件上传失败：${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error('文件上传失败'));
    xhr.send(formData);
  });
}

export async function summarizeAdminRecord(
  tableKey: string,
  recordId: string
): Promise<{
  record: Record<string, unknown>;
  analysis: Record<string, unknown>;
  created_tasks: Array<Record<string, unknown>>;
}> {
  return requestJson<{
    record: Record<string, unknown>;
    analysis: Record<string, unknown>;
    created_tasks: Array<Record<string, unknown>>;
  }>(`/api/admin/${tableKey}/${recordId}/summarize`, {
    method: 'POST',
  });
}

export async function summarizeAdminAttachment(
  tableKey: string,
  recordId: string,
  attachmentId: string
): Promise<{
  record: Record<string, unknown>;
  attachment: Record<string, unknown>;
  analysis: Record<string, unknown>;
}> {
  return requestJson<{
    record: Record<string, unknown>;
    attachment: Record<string, unknown>;
    analysis: Record<string, unknown>;
  }>(`/api/admin/${tableKey}/${recordId}/attachments/${attachmentId}/summarize`, {
    method: 'POST',
  });
}
