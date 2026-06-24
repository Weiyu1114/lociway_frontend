import { useDashboard } from './context';
import {
  TrendingUpIcon,
  TargetIcon,
  AlertTriangleIcon,
  WalletIcon,
  FolderOpenIcon,
} from 'lucide-react';

function KpiSkeleton() {
  return (
    <div className="bg-card rounded-xl shadow-sm p-5 transition-shadow">
      <div className="h-3 w-16 bg-accent rounded animate-pulse mb-3" />
      <div className="h-8 w-20 bg-accent rounded animate-pulse mb-2" />
      <div className="h-3 w-24 bg-accent rounded animate-pulse" />
    </div>
  );
}

export default function KpiCardsSection() {
  const { data, loading } = useDashboard();

  if (loading || !data) {
    return (
      <section className="w-full grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <KpiSkeleton key={i} />
        ))}
      </section>
    );
  }

  const { business, opportunities, tasks, materials } = data;

  const activeBusinessCount = (business ?? []).filter(
    (b) => b['状态'] === '进行中'
  ).length;

  const opportunityCount = (opportunities ?? []).length;

  const p0TaskCount = (tasks ?? []).filter(
    (t) => t['优先级'] === 'P0 本周必须'
  ).length;

  const totalPipelineAmount = (opportunities ?? []).reduce((sum, opp) => {
    const raw = opp['预计金额'] ?? '';
    const match = raw.match(/([\d.]+)/);
    if (match) return sum + parseFloat(match[1]);
    return sum;
  }, 0);

  const materialCount = (materials ?? []).length;

  const kpiCards = [
    {
      label: '活跃业务线',
      value: activeBusinessCount,
      suffix: '条',
      supplement: `共 ${(business ?? []).length} 条业务线`,
      icon: TrendingUpIcon,
      accent: 'text-[hsl(152_69%_42%)]',
      iconBg: 'bg-[hsl(152_69%_95%)]',
    },
    {
      label: '当前项目',
      value: opportunityCount,
      suffix: '个',
      supplement: '客户项目推进中',
      icon: TargetIcon,
      accent: 'text-[hsl(217_91%_60%)]',
      iconBg: 'bg-[hsl(217_91%_96%)]',
    },
    {
      label: 'P0 紧急任务',
      value: p0TaskCount,
      suffix: '项',
      supplement: `本周必须完成`,
      icon: AlertTriangleIcon,
      accent: 'text-[hsl(0_72%_45%)]',
      iconBg: 'bg-[hsl(0_84%_96%)]',
    },
    {
      label: '项目预计金额',
      value: totalPipelineAmount > 0 ? `¥${totalPipelineAmount}` : '—',
      suffix: totalPipelineAmount > 0 ? '万' : '',
      supplement: '预计成交金额',
      icon: WalletIcon,
      accent: 'text-[hsl(25_85%_55%)]',
      iconBg: 'bg-[hsl(25_95%_96%)]',
      isCurrency: true,
    },
    {
      label: '资料总数',
      value: materialCount,
      suffix: '份',
      supplement: '产品·运营·沟通·管理',
      icon: FolderOpenIcon,
      accent: 'text-[hsl(228_28%_45%)]',
      iconBg: 'bg-[hsl(215_29%_94%)]',
    },
  ];

  return (
    <section className="w-full grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-5">
      {kpiCards.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.label}
            className="bg-card rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`w-6 h-6 rounded-md ${kpi.iconBg} flex items-center justify-center`}
              >
                <Icon className={`w-3 h-3 ${kpi.accent}`} />
              </div>
              <span className="text-sm text-muted-foreground">{kpi.label}</span>
            </div>

            <div className="flex items-baseline gap-1">
              <span
                className={`text-xl lg:text-2xl font-bold text-foreground ${kpi.isCurrency ? 'font-mono' : ''}`}
              >
                {kpi.value}
              </span>
              {kpi.suffix && (
                <span className="text-sm font-medium text-muted-foreground">
                  {kpi.suffix}
                </span>
              )}
            </div>

            <p className={`text-xs mt-1.5 ${kpi.accent}`}>{kpi.supplement}</p>
          </div>
        );
      })}
    </section>
  );
}
