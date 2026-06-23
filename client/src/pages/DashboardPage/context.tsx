import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { toast } from 'sonner';
import dataJson from '@shared/static/lociway_data.json';
import { fetchDashboardData } from '@/api';

export interface IDashboardData {
  meta: {
    base_url: string;
    updated_at: string;
  };
  business: Array<{
    '业务线': string;
    '报价/利润逻辑': string;
    '下一步动作': string;
    '风险边界': string;
    '定位': string;
    '当前阶段': string;
    '本周目标': string;
    '状态': string;
    '负责人': string;
    '商业模式': string;
  }>;
  opportunities: Array<{
    '当前阶段': string;
    '来源人': string;
    '关键风险': string;
    '预计金额': string;
    '业务线': string;
    '负责人': string;
    '状态': string;
    '成交概率': string;
    '下一步动作': string;
    '下一步时间'?: string;
    '客户/合作方': string;
    '机会名称': string;
    '资料链接'?: string;
  }>;
  tasks: Array<{
    '状态': string;
    '截止时间': string;
    '产出物': string;
    '所属项目': string;
    '优先级': string;
    '任务': string;
    '负责人': string;
    '备注': string;
  }>;
  materials: Array<{
    '负责人': string;
    '版本日期': string;
    '备注': string;
    '用途': string;
    '类型': string;
    '资料名称': string;
    '对应业务线': string;
    '文件URL'?: string;
    'AI总结'?: string;
    '行动项'?: string;
  }>;
  meetings?: Array<{
    '会议标题': string;
    '品牌方': string;
    '会议日期': string;
    '参会人': string;
    '文件名': string;
    '文件类型': string;
    '转写状态': string;
    'AI总结': string;
    '关键点': string;
    '行动项': string;
    '风险': string;
    '下一步建议': string;
    '原文摘录': string;
    '文件路径': string;
  }>;
  dashboard: Array<{
    '排序': number;
    '标签': string;
    '模块类型': string;
    '标题': string;
    '内容': string;
    '关联业务线'?: string;
  }>;
}

interface IDashboardContextValue {
  data: IDashboardData;
  loading: boolean;
  refresh: () => Promise<void>;
}

const DashboardContext = createContext<IDashboardContextValue | undefined>(undefined);

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within DashboardProvider');
  }
  return context;
}

interface IDashboardProviderProps {
  children: ReactNode;
}

export function DashboardProvider({ children }: IDashboardProviderProps): React.JSX.Element {
  const [data, setData] = useState<IDashboardData>(dataJson as IDashboardData);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const nextData = await fetchDashboardData();
      setData(nextData);
      toast.success('数据已同步', {
        description: '已从 LociWay 后端读取最新后台数据',
      });
    } catch {
      setData((current) => current ?? (dataJson as IDashboardData));
      toast.error('同步失败，已保留本地快照', {
        description: '请稍后再试，或检查后端服务是否正在启动',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <DashboardContext.Provider value={{ data, loading, refresh }}>
      {children}
    </DashboardContext.Provider>
  );
}
