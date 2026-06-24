import dayjs from 'dayjs';
import { CalendarIcon, ExternalLinkIcon, PlusIcon } from 'lucide-react';
import { UniversalLink } from '@lark-apaas/client-toolkit/components/UniversalLink';
import { useDashboard } from './context';

function adminRecordUrl(id?: string) {
  return id ? `/#/admin?table=tasks&id=${encodeURIComponent(id)}` : '/#/admin?table=tasks';
}

const PRIORITY_ORDER: Record<string, number> = {
  'P0 本周必须': 0,
  'P1 近期推进': 1,
  'P2 暂存': 2,
};

function getPriorityStyle(priority: string) {
  if (priority.includes('P0'))
    return 'bg-[hsl(0_84%_96%)] text-[hsl(0_72%_45%)]';
  if (priority.includes('P1'))
    return 'bg-[hsl(45_100%_94%)] text-[hsl(40_80%_35%)]';
  return 'bg-[hsl(220_14%_95%)] text-[hsl(229_16%_47%)]';
}

function getStatusStyle(status: string) {
  if (status === '进行中')
    return 'bg-[hsl(217_91%_96%)] text-[hsl(217_91%_40%)]';
  if (status === '已完成')
    return 'bg-[hsl(152_69%_95%)] text-[hsl(152_69%_32%)]';
  return 'bg-[hsl(220_14%_95%)] text-[hsl(229_16%_47%)]';
}

function formatDeadline(dateStr: string | undefined): string {
  if (!dateStr) return '日期待定';
  return dayjs(dateStr).format('M月D日');
}

function ownerNames(raw: string | undefined): string[] {
  if (!raw) return ['未分配'];
  return raw
    .split(/[、/,，\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function Skeleton() {
  return (
    <section className="w-full">
      <div className="mb-4 h-5 w-24 animate-pulse rounded bg-[hsl(24_100%_97%)]" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl bg-card p-4 shadow-sm">
            <div className="mb-4 h-5 w-20 animate-pulse rounded bg-[hsl(24_100%_97%)]" />
            {[0, 1].map((j) => (
              <div key={j} className="mb-3 rounded-lg border border-border p-3">
                <div className="mb-2 h-4 w-4/5 animate-pulse rounded bg-[hsl(24_100%_97%)]" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-[hsl(24_100%_97%)]" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function TasksSection() {
  const { data, loading } = useDashboard();

  if (loading) return <Skeleton />;
  if (!data?.tasks?.length) return null;

  const sortedTasks = [...data.tasks].sort((a, b) => {
    const aOrder = PRIORITY_ORDER[a['优先级']] ?? 99;
    const bOrder = PRIORITY_ORDER[b['优先级']] ?? 99;
    return aOrder - bOrder;
  });

  const grouped = sortedTasks.reduce<Record<string, typeof sortedTasks>>((acc, task) => {
    ownerNames(task['负责人']).forEach((owner) => {
      acc[owner] = acc[owner] ?? [];
      acc[owner].push(task);
    });
    return acc;
  }, {});

  const owners = Object.keys(grouped).sort((a, b) => {
    const aP0 = grouped[a].filter((task) => task['优先级']?.includes('P0')).length;
    const bP0 = grouped[b].filter((task) => task['优先级']?.includes('P0')).length;
    return bP0 - aP0 || grouped[b].length - grouped[a].length || a.localeCompare(b);
  });

  const p0Count = data.tasks.filter((t) => t['优先级']?.includes('P0')).length;

  return (
    <section className="w-full">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-base font-extrabold tracking-wide text-foreground md:text-lg">
          个人任务看板
        </h2>
        {p0Count > 0 && (
          <span className="rounded-full bg-[hsl(0_84%_96%)] px-2.5 py-0.5 text-xs font-semibold text-[hsl(0_72%_45%)]">
            {p0Count} 项 P0
          </span>
        )}
        <UniversalLink
          to="/#/admin?table=tasks"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-accent"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          新增个人任务
        </UniversalLink>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 2xl:grid-cols-4">
        {owners.map((owner) => (
          <section key={owner} className="min-h-48 rounded-xl bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-foreground">{owner}</h3>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {grouped[owner].length} 项
              </span>
            </div>

            <div className="space-y-3">
              {grouped[owner].map((task, index) => (
                <UniversalLink
                  key={`${task._record_id ?? task['任务']}-${index}`}
                  to={adminRecordUrl(task._record_id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block rounded-lg border border-border bg-background p-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[hsl(24_100%_97%)] hover:shadow-sm"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <p className="min-w-0 text-sm font-semibold leading-snug text-foreground group-hover:text-[hsl(25_95%_45%)]">
                      {task['任务']}
                    </p>
                    <ExternalLinkIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-70" />
                  </div>

                  <div className="mb-2 flex flex-wrap items-center gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${getPriorityStyle(task['优先级'])}`}>
                      {task['优先级']}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${getStatusStyle(task['状态'])}`}>
                      {task['状态']}
                    </span>
                  </div>

                  <p className="mb-2 truncate text-xs text-muted-foreground">
                    {task['所属项目'] || '未绑定项目'}
                  </p>

                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      {formatDeadline(task['截止时间'])}
                    </span>
                    {task['产出物'] && <span className="truncate">{task['产出物']}</span>}
                  </div>

                  {task['备注'] && (
                    <p className="mt-2 border-t border-border pt-2 text-xs leading-relaxed text-muted-foreground">
                      {task['备注']}
                    </p>
                  )}
                </UniversalLink>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
