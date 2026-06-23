import { logger } from '@lark-apaas/client-toolkit/logger';
import type { IDashboardData } from '@/pages/DashboardPage/context';


const DEFAULT_API_BASE = 'https://lociway-backend.onrender.com';
const API_BASE =
  import.meta.env.VITE_LOCIWAY_API_BASE?.replace(/\/$/, '') ?? DEFAULT_API_BASE;
const FEISHU_BASE_URL =
  'https://ccn83sh9qhvs.feishu.cn/base/QrB6bQyyraZtbzsxFcucwis0nod';

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
        base_url: FEISHU_BASE_URL,
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
