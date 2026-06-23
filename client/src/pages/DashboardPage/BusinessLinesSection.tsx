import { useDashboard } from './context';
import { ExternalLinkIcon } from 'lucide-react';
import { UniversalLink } from '@lark-apaas/client-toolkit/components/UniversalLink';

const FEISHU_BUSINESS_URL =
  'https://ccn83sh9qhvs.feishu.cn/base/QrB6bQyyraZtbzsxFcucwis0nod?table=tblvnkWCgwXyvD';

interface IBusinessLineColor {
  border: string;
  title: string;
  badgeBg: string;
  badgeText: string;
}

const BUSINESS_LINE_COLORS: Record<string, IBusinessLineColor> = {
  '品牌 CMO': {
    border: 'border-[hsl(217_91%_60%)]',
    title: 'text-[hsl(217_91%_45%)]',
    badgeBg: 'bg-[hsl(217_91%_96%)]',
    badgeText: 'text-[hsl(217_91%_45%)]',
  },
  '小 b 分销': {
    border: 'border-[hsl(152_69%_42%)]',
    title: 'text-[hsl(152_69%_32%)]',
    badgeBg: 'bg-[hsl(152_69%_95%)]',
    badgeText: 'text-[hsl(152_69%_32%)]',
  },
  '二手翻新销售': {
    border: 'border-[hsl(25_95%_53%)]',
    title: 'text-[hsl(25_85%_42%)]',
    badgeBg: 'bg-[hsl(25_95%_96%)]',
    badgeText: 'text-[hsl(25_85%_42%)]',
  },
};

const STATUS_COLORS: Record<string, string> = {
  进行中: 'bg-[hsl(217_91%_96%)] text-[hsl(217_91%_40%)]',
  待沟通: 'bg-[hsl(25_95%_96%)] text-[hsl(25_85%_42%)]',
  探索: 'bg-[hsl(220_14%_95%)] text-[hsl(229_16%_47%)]',
  初聊: 'bg-[hsl(220_14%_95%)] text-[hsl(229_16%_47%)]',
};

function getLineColor(name: string): IBusinessLineColor {
  return (
    BUSINESS_LINE_COLORS[name] ?? {
      border: 'border-border',
      title: 'text-foreground',
      badgeBg: 'bg-muted',
      badgeText: 'text-muted-foreground',
    }
  );
}

function Skeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="bg-card rounded-xl p-5 shadow-sm border-l-4 border-border"
        >
          <div className="h-5 w-28 bg-[hsl(24_100%_97%)] rounded animate-pulse mb-4" />
          <div className="h-3.5 bg-[hsl(24_100%_97%)] rounded animate-pulse mb-2.5" />
          <div className="h-3.5 w-4/5 bg-[hsl(24_100%_97%)] rounded animate-pulse mb-2.5" />
          <div className="h-3.5 w-3/5 bg-[hsl(24_100%_97%)] rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export default function BusinessLinesSection() {
  const { data, loading } = useDashboard();

  if (loading || !data) {
    return (
      <section className="w-full">
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
          业务线总览
        </h2>
        <Skeleton />
      </section>
    );
  }

  const lines = data.business ?? [];

  return (
    <section className="w-full">
      <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
        业务线总览
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {lines.map((line, idx) => {
          const name = line['业务线'];
          const colors = getLineColor(name);
          const statusColor =
            STATUS_COLORS[line['状态']] ??
            'bg-muted text-muted-foreground';

          return (
            <UniversalLink
              key={idx}
              to={FEISHU_BUSINESS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`group block bg-card rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border-l-4 p-4 cursor-pointer ${colors.border}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className={`text-sm font-bold ${colors.title}`}>
                  {name}
                </h3>
                <span
                  className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}`}
                >
                  {line['状态']}
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-xs text-muted-foreground">定位：</span>
                  <span className="text-sm text-foreground">
                    {line['定位']}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">阶段：</span>
                  <span
                    className={`text-sm font-medium ${colors.badgeText} ${colors.badgeBg} rounded px-1.5 py-0.5`}
                  >
                    {line['当前阶段']}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">
                    负责人：
                  </span>
                  <span className="text-sm text-foreground">
                    {line['负责人']}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">
                    本周目标：
                  </span>
                  <span className="text-sm text-foreground leading-relaxed">
                    {line['本周目标']}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <span>查看飞书表格</span>
                <ExternalLinkIcon className="w-3 h-3 ml-1" />
              </div>
            </UniversalLink>
          );
        })}
      </div>
    </section>
  );
}
