import { FileTextIcon } from 'lucide-react';
import { useDashboard } from './context';

function compactText(text: string, max = 180) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function formatActionItems(raw: string): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) =>
          typeof item === 'object'
            ? `${item.owner ?? 'Louis'}：${item.task ?? ''}`
            : String(item)
        )
        .filter(Boolean);
    }
  } catch {
    // Plain text fallback.
  }
  return raw.split('\n').filter(Boolean);
}

export default function MeetingSummariesSection() {
  const { data, loading } = useDashboard();
  const meetings = data?.meetings ?? [];

  if (loading || meetings.length === 0) return null;

  const latestMeetings = meetings.slice(-3).reverse();

  return (
    <section className="w-full">
      <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
        会议 AI 总结
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {latestMeetings.map((meeting, index) => {
          const actions = formatActionItems(meeting['行动项'] ?? '').slice(0, 3);
          return (
            <div
              key={`${meeting['会议标题']}-${index}`}
              className="bg-card rounded-xl shadow-sm p-4 border-l-[3px] border-primary"
            >
              <div className="flex items-start gap-2 mb-3">
                <div className="mt-0.5 h-7 w-7 rounded-md bg-[hsl(217_91%_96%)] flex items-center justify-center">
                  <FileTextIcon className="h-4 w-4 text-[hsl(217_91%_45%)]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-foreground truncate">
                    {meeting['会议标题'] || '未命名会议'}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground truncate">
                    {meeting['品牌方'] || '品牌方待定'} · {meeting['会议日期'] || '日期待定'}
                  </p>
                </div>
              </div>

              <p className="text-sm text-foreground leading-relaxed">
                {compactText(meeting['AI总结'] ?? '暂无 AI 总结')}
              </p>

              {actions.length > 0 && (
                <div className="mt-3 border-t border-border pt-3">
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">行动项</p>
                  <ul className="space-y-1.5">
                    {actions.map((item, idx) => (
                      <li key={idx} className="text-xs text-foreground leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
