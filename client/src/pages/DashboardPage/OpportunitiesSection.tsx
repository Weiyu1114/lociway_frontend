import { ExternalLinkIcon } from 'lucide-react';
import { useDashboard } from './context';
import { UniversalLink } from '@lark-apaas/client-toolkit/components/UniversalLink';

function adminRecordUrl(id?: string) {
  return id
    ? `/#/admin?table=opportunities&id=${encodeURIComponent(id)}`
    : '/#/admin?table=opportunities';
}

function getBusinessLineColor(line: string) {
  if (line.includes('品牌 CMO')) {
    return {
      bg: 'bg-[hsl(217_91%_96%)]',
      text: 'text-[hsl(217_91%_45%)]',
    };
  }
  if (line.includes('小 b 分销')) {
    return {
      bg: 'bg-[hsl(152_69%_95%)]',
      text: 'text-[hsl(152_69%_32%)]',
    };
  }
  if (line.includes('二手翻新')) {
    return {
      bg: 'bg-[hsl(25_95%_96%)]',
      text: 'text-[hsl(25_85%_42%)]',
    };
  }
  return {
    bg: 'bg-[hsl(220_14%_95%)]',
    text: 'text-[hsl(229_16%_47%)]',
  };
}

function getStatusStyle(status: string) {
  if (status === '重点跟进') {
    return {
      bg: 'bg-[hsl(0_84%_96%)]',
      text: 'text-[hsl(0_72%_45%)]',
    };
  }
  if (status === '探索') {
    return {
      bg: 'bg-[hsl(220_14%_95%)]',
      text: 'text-[hsl(229_16%_47%)]',
    };
  }
  return {
    bg: 'bg-[hsl(220_14%_95%)]',
    text: 'text-[hsl(229_16%_47%)]',
  };
}

function getProbabilityColor(prob: string) {
  if (prob === '高') return 'text-[hsl(152_69%_32%)]';
  if (prob === '中') return 'text-[hsl(38_92%_40%)]';
  return 'text-[hsl(229_16%_47%)]';
}

function Skeleton() {
  return (
    <section className="w-full">
      <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
        重点机会
      </h2>
      <div className="bg-card rounded-xl shadow-sm p-6 space-y-4">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="flex flex-wrap items-center gap-3 py-3 border-b border-border last:border-b-0"
          >
            <div className="h-5 w-32 bg-muted rounded animate-pulse" />
            <div className="h-5 w-20 bg-muted rounded-full animate-pulse" />
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            <div className="h-5 w-16 bg-muted rounded animate-pulse" />
            <div className="h-5 w-16 bg-muted rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function OpportunitiesSection() {
  const { data, loading } = useDashboard();

  if (loading || !data) return <Skeleton />;

  const opportunities = data?.opportunities ?? [];
  if (opportunities.length === 0) return null;

  return (
    <section className="w-full">
      <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
        重点机会
      </h2>
      <div className="bg-card rounded-xl shadow-sm overflow-hidden">
        {opportunities.map((opp, index) => {
          const bizColor = getBusinessLineColor(opp['业务线'] ?? '');
          const statusStyle = getStatusStyle(opp['状态'] ?? '');
          const probColor = getProbabilityColor(opp['成交概率'] ?? '');
          const hasAmount =
            opp['预计金额'] && opp['预计金额'] !== '待定';

          return (
            <UniversalLink
              key={opp['机会名称'] ?? index}
              to={adminRecordUrl(opp._record_id)}
              target="_blank"
              rel="noopener noreferrer"
              className={`
                flex flex-wrap items-center gap-x-3 gap-y-1.5 px-5 py-3
                border-b border-border last:border-b-0
                hover:bg-accent transition-colors cursor-pointer group
              `}
            >
              {/* 机会名称 */}
              <span className="text-sm font-semibold text-foreground min-w-0 shrink-0">
                {opp['机会名称'] ?? '未命名机会'}
              </span>

              {/* 业务线标签 */}
              <span
                className={`
                  inline-flex items-center rounded-full px-2 py-0.5
                  text-[11px] font-medium shrink-0
                  ${bizColor.bg} ${bizColor.text}
                `}
              >
                {opp['业务线'] ?? '—'}
              </span>

              {/* 客户/合作方 */}
              <span className="text-sm text-muted-foreground min-w-0 shrink-0">
                {opp['客户/合作方'] ?? '—'}
              </span>

              {/* 预计金额 */}
              <span
                className={`
                  text-sm font-bold font-mono shrink-0
                  ${hasAmount ? 'text-foreground' : 'text-muted-foreground'}
                `}
              >
                {opp['预计金额'] ?? '待定'}
              </span>

              {/* 成交概率 */}
              <span
                className={`text-xs font-medium shrink-0 ${probColor}`}
              >
                概率: {opp['成交概率'] ?? '—'}
              </span>

              {/* 状态标签 */}
              <span
                className={`
                  inline-flex items-center rounded-full px-2 py-0.5
                  text-[11px] font-medium shrink-0
                  ${statusStyle.bg} ${statusStyle.text}
                `}
              >
                {opp['状态'] ?? '—'}
              </span>

              {/* 当前阶段 */}
              <span className="text-xs text-muted-foreground shrink-0">
                {opp['当前阶段'] ?? '—'}
              </span>

              {/* 弹性占位 + 右侧信息 */}
              <span className="flex-1 min-w-0" />

              {/* 下一步动作 + 负责人 */}
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-muted-foreground hidden md:inline max-w-48 truncate">
                  {opp['下一步动作'] ?? ''}
                </span>
                <span className="text-xs text-muted-foreground hidden lg:inline">
                  {opp['负责人'] ?? '—'}
                </span>
                <ExternalLinkIcon className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </UniversalLink>
          );
        })}
      </div>
    </section>
  );
}
