import { CalendarDaysIcon, ExternalLinkIcon } from 'lucide-react';
import { toApiUrl } from '@/api';
import { useDashboard } from './context';

function adminRecordUrl(id?: string) {
  return id ? `/#/admin?table=meetings&id=${encodeURIComponent(id)}` : '/#/admin?table=meetings';
}

function formatActionItems(raw: string): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) =>
          typeof item === 'object'
            ? `${item.owner ?? 'Louis'}：${item.task ?? ''}${item.due_date ? `（${item.due_date}）` : ''}`
            : String(item)
        )
        .filter(Boolean);
    }
  } catch {
    // Plain text fallback.
  }
  return raw.split('\n').filter(Boolean);
}

function splitDate(dateText: string) {
  const date = dateText ? new Date(dateText) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return { month: '待定', day: '--' };
  }
  return {
    month: `${date.getMonth() + 1}月`,
    day: String(date.getDate()).padStart(2, '0'),
  };
}

export default function MeetingSummariesSection() {
  const { data, loading } = useDashboard();
  const meetings = [...(data?.meetings ?? [])].reverse();

  if (loading || meetings.length === 0) return null;

  return (
    <section className="w-full">
      <div className="mb-4 flex items-center gap-2">
        <CalendarDaysIcon className="h-4 w-4 text-primary" />
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          会议纪要日历
        </h2>
      </div>

      <div className="space-y-4">
        {meetings.map((meeting, index) => {
          const actions = formatActionItems(meeting['行动项'] ?? '');
          const date = splitDate(meeting['会议日期'] ?? '');
          const fileUrl = toApiUrl(meeting['文件URL']);
          const detailUrl = adminRecordUrl(meeting._record_id);

          return (
            <article
              key={`${meeting['会议标题']}-${index}`}
              className="grid grid-cols-[82px_minmax(0,1fr)] gap-4 rounded-xl bg-card p-4 shadow-sm"
            >
              <div className="flex h-24 flex-col items-center justify-center rounded-lg border border-border bg-[hsl(217_91%_96%)]">
                <span className="text-xs font-semibold text-[hsl(217_91%_45%)]">
                  {date.month}
                </span>
                <span className="text-2xl font-bold text-[hsl(217_91%_35%)]">
                  {date.day}
                </span>
              </div>

              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold text-foreground">
                      {meeting['会议标题'] || '未命名会议'}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {meeting['品牌方'] || '品牌方待定'} · {meeting['参会人'] || '参会人待定'}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {fileUrl && (
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-accent"
                      >
                        预览文件
                        <ExternalLinkIcon className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <a
                      href={detailUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-accent"
                    >
                      查看详情
                      <ExternalLinkIcon className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                  <section className="min-h-28 rounded-lg border border-border bg-background p-3">
                    <p className="mb-2 text-xs font-semibold text-muted-foreground">概要</p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {meeting['AI总结'] || '暂无 AI 总结'}
                    </p>
                  </section>

                  <section className="min-h-28 rounded-lg border border-border bg-background p-3">
                    <p className="mb-2 text-xs font-semibold text-muted-foreground">行动项</p>
                    {actions.length > 0 ? (
                      <ul className="space-y-1.5">
                        {actions.map((item, idx) => (
                          <li key={idx} className="text-sm leading-relaxed">
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">暂无行动项</p>
                    )}
                  </section>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
