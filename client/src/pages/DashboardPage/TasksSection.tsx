import { useDashboard } from './context';
import { CalendarIcon, ExternalLinkIcon } from 'lucide-react';
import dayjs from 'dayjs';
import { UniversalLink } from '@lark-apaas/client-toolkit/components/UniversalLink';

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
  return 'bg-[hsl(220_14%_95%)] text-[hsl(229_16%_47%)]';
}

function formatDeadline(dateStr: string | undefined): string {
  if (!dateStr) return '日期待定';
  return dayjs(dateStr).format('M月D日');
}

function Skeleton() {
  return (
    <section className="w-full">
      <div className="h-4 w-20 rounded animate-pulse bg-[hsl(24_100%_97%)] mb-4" />
      <div className="bg-card rounded-xl shadow-sm overflow-hidden">
        <div className="bg-[hsl(210_28%_96%)] px-5 py-3 flex gap-4">
          {[16, 12, 10, 10, 12, 10].map((w, i) => (
            <div
              key={i}
              className="h-3 rounded animate-pulse bg-[hsl(24_100%_97%)]"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="px-5 py-4 flex items-center gap-4">
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-3.5 w-3/4 rounded animate-pulse bg-[hsl(24_100%_97%)]" />
              <div className="h-3 w-1/2 rounded animate-pulse bg-[hsl(24_100%_97%)]" />
            </div>
            <div className="h-5 w-20 rounded-full animate-pulse bg-[hsl(24_100%_97%)]" />
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

  const p0Count = data.tasks.filter((t) => t['优先级']?.includes('P0')).length;

  return (
    <section className="w-full">
      <div className="flex items-center gap-2.5 mb-4">
        <h2 className="text-xs font-bold text-[hsl(229_16%_47%)] uppercase tracking-widest">
          本周任务
        </h2>
        {p0Count > 0 && (
          <span className="text-xs font-semibold bg-[hsl(0_84%_96%)] text-[hsl(0_72%_45%)] rounded-full px-2 py-0.5">
            {p0Count} 项紧急
          </span>
        )}
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block bg-card rounded-xl shadow-sm overflow-hidden">
        <div className="bg-[hsl(210_28%_96%)] px-5 py-2 flex items-center gap-4">
          <span className="flex-1 min-w-0 text-xs font-bold text-[hsl(229_16%_47%)] uppercase tracking-wider">
            任务
          </span>
          <span className="w-28 shrink-0 text-xs font-bold text-[hsl(229_16%_47%)] uppercase tracking-wider text-center">
            所属项目
          </span>
          <span className="w-16 shrink-0 text-xs font-bold text-[hsl(229_16%_47%)] uppercase tracking-wider text-center">
            负责人
          </span>
          <span className="w-28 shrink-0 text-xs font-bold text-[hsl(229_16%_47%)] uppercase tracking-wider text-center">
            优先级
          </span>
          <span className="w-20 shrink-0 text-xs font-bold text-[hsl(229_16%_47%)] uppercase tracking-wider text-center">
            截止时间
          </span>
          <span className="w-20 shrink-0 text-xs font-bold text-[hsl(229_16%_47%)] uppercase tracking-wider text-center">
            状态
          </span>
        </div>

        {sortedTasks.map((task, i) => (
          <UniversalLink
            key={i}
            to={adminRecordUrl(task._record_id)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 px-5 py-3 border-b border-border last:border-b-0 hover:bg-[hsl(24_100%_97%)] transition-colors group cursor-pointer"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate group-hover:text-[hsl(25_95%_53%)] transition-colors">
                {task['任务']}
              </p>
              {task['备注'] && (
                <p className="text-xs text-[hsl(229_16%_47%)] mt-0.5 truncate">
                  {task['备注']}
                </p>
              )}
            </div>
            <span className="w-28 shrink-0 text-sm text-[hsl(229_16%_47%)] text-center truncate">
              {task['所属项目']}
            </span>
            <span className="w-16 shrink-0 text-sm text-[hsl(229_16%_47%)] text-center truncate">
              {task['负责人']?.split('/')[0]?.trim()}
            </span>
            <div className="w-28 shrink-0 flex justify-center">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${getPriorityStyle(task['优先级'])}`}
              >
                {task['优先级']}
              </span>
            </div>
            <div className="w-20 shrink-0 flex items-center justify-center gap-1 text-sm text-[hsl(229_16%_47%)]">
              <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{formatDeadline(task['截止时间'])}</span>
            </div>
            <div className="w-20 shrink-0 flex justify-center">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${getStatusStyle(task['状态'])}`}
              >
                {task['状态']}
              </span>
            </div>
            <ExternalLinkIcon className="w-3.5 h-3.5 shrink-0 text-[hsl(229_16%_47%)] opacity-0 group-hover:opacity-60 transition-opacity" />
          </UniversalLink>
        ))}
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-3">
        {sortedTasks.map((task, i) => (
          <UniversalLink
            key={i}
            to={adminRecordUrl(task._record_id)}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-card rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-2 mb-2.5">
              <p className="text-sm font-medium text-foreground flex-1 min-w-0">
                {task['任务']}
              </p>
              <span
                className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusStyle(task['状态'])}`}
              >
                {task['状态']}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${getPriorityStyle(task['优先级'])}`}
              >
                {task['优先级']}
              </span>
              <span className="text-xs text-[hsl(229_16%_47%)] bg-[hsl(220_14%_96%)] rounded-full px-2 py-0.5">
                {task['所属项目']}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-[hsl(229_16%_47%)]">
              <span>负责人: {task['负责人']}</span>
              <span className="flex items-center gap-1">
                <CalendarIcon className="w-3 h-3" />
                {formatDeadline(task['截止时间'])}
              </span>
            </div>

            {task['备注'] && (
              <p className="text-xs text-[hsl(229_16%_47%)] mt-2 pt-2 border-t border-border">
                {task['备注']}
              </p>
            )}

            {task['产出物'] && (
              <p className="text-xs text-[hsl(229_16%_47%)] mt-1.5">
                产出物: {task['产出物']}
              </p>
            )}
          </UniversalLink>
        ))}
      </div>
    </section>
  );
}
