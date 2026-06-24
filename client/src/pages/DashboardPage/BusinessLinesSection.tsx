import { useState } from 'react';
import { ExternalLinkIcon, XIcon } from 'lucide-react';
import { useDashboard } from './context';

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

function adminRecordUrl(id?: string) {
  return id ? `/#/admin?table=business&id=${encodeURIComponent(id)}` : '/#/admin?table=business';
}

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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border-l-4 border-border bg-card p-5 shadow-sm">
          <div className="mb-4 h-5 w-28 animate-pulse rounded bg-[hsl(24_100%_97%)]" />
          <div className="mb-2.5 h-3.5 animate-pulse rounded bg-[hsl(24_100%_97%)]" />
          <div className="mb-2.5 h-3.5 w-4/5 animate-pulse rounded bg-[hsl(24_100%_97%)]" />
          <div className="h-3.5 w-3/5 animate-pulse rounded bg-[hsl(24_100%_97%)]" />
        </div>
      ))}
    </div>
  );
}

export default function BusinessLinesSection() {
  const { data, loading } = useDashboard();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (loading || !data) {
    return (
      <section className="w-full">
        <h2 className="mb-4 text-base font-extrabold tracking-wide text-foreground md:text-lg">
          业务线总览
        </h2>
        <Skeleton />
      </section>
    );
  }

  const lines = data.business ?? [];
  const activeLine = activeIndex === null ? null : lines[activeIndex];

  return (
    <section className="w-full">
      <h2 className="mb-4 text-base font-extrabold tracking-wide text-foreground md:text-lg">
        业务线总览
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {lines.map((line, idx) => {
          const name = line['业务线'];
          const colors = getLineColor(name);
          const statusColor =
            STATUS_COLORS[line['状态']] ?? 'bg-muted text-muted-foreground';

          return (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`group block rounded-xl border-l-4 bg-card p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${colors.border}`}
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <h3 className={`text-lg font-extrabold ${colors.title}`}>{name}</h3>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}`}
                >
                  {line['状态']}
                </span>
              </div>

              <div className="space-y-2.5">
                <p className="text-sm leading-relaxed text-foreground">
                  <span className="text-muted-foreground">定位：</span>
                  {line['定位']}
                </p>
                <p className="text-sm leading-relaxed text-foreground">
                  <span className="text-muted-foreground">阶段：</span>
                  <span className={`rounded px-1.5 py-0.5 font-medium ${colors.badgeText} ${colors.badgeBg}`}>
                    {line['当前阶段']}
                  </span>
                </p>
                <p className="text-sm leading-relaxed text-foreground">
                  <span className="text-muted-foreground">负责人：</span>
                  {line['负责人']}
                </p>
              </div>

              <div className="mt-4 text-xs font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                点击查看业务线摘要
              </div>
            </button>
          );
        })}
      </div>

      {activeLine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-card shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
              <div>
                <h3 className="text-2xl font-extrabold text-foreground">
                  {activeLine['业务线']}
                </h3>
                <p className="mt-1 text-base text-muted-foreground">
                  {activeLine['定位']}
                </p>
              </div>
              <button
                onClick={() => setActiveIndex(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-2">
              {[
                ['当前阶段', activeLine['当前阶段']],
                ['状态', activeLine['状态']],
                ['负责人', activeLine['负责人']],
                ['商业模式', activeLine['商业模式']],
                ['报价/利润逻辑', activeLine['报价/利润逻辑']],
                ['风险边界', activeLine['风险边界']],
              ].map(([label, value]) => (
                <section key={label} className="rounded-lg border border-border bg-background p-4">
                  <p className="mb-1 text-xs font-semibold text-muted-foreground">{label}</p>
                  <p className="text-sm leading-relaxed text-foreground">{value || '—'}</p>
                </section>
              ))}
              <section className="rounded-lg border border-border bg-background p-4 md:col-span-2">
                <p className="mb-1 text-xs font-semibold text-muted-foreground">本周目标</p>
                <p className="text-sm leading-relaxed text-foreground">
                  {activeLine['本周目标'] || '—'}
                </p>
              </section>
              <section className="rounded-lg border border-border bg-background p-4 md:col-span-2">
                <p className="mb-1 text-xs font-semibold text-muted-foreground">下一步动作</p>
                <p className="text-sm leading-relaxed text-foreground">
                  {activeLine['下一步动作'] || '—'}
                </p>
              </section>
            </div>

            <div className="flex justify-end border-t border-border px-6 py-4">
              <a
                href={adminRecordUrl(activeLine._record_id)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                在后台编辑
                <ExternalLinkIcon className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
