import { useDashboard } from './context';

function PhaseFocusSkeleton() {
  return (
    <section className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-10">
        <div className="bg-card rounded-xl shadow-sm p-6">
          <div className="h-4 w-20 bg-accent rounded-full mb-4 animate-pulse" />
          <div className="h-6 w-48 bg-muted rounded mb-3 animate-pulse" />
          <div className="h-4 w-full bg-muted rounded mb-2 animate-pulse" />
          <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
        </div>
        <div className="bg-card rounded-xl shadow-sm p-6">
          <div className="h-6 w-40 bg-muted rounded mb-4 animate-pulse" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-3 py-2.5">
              <div className="h-5 w-5 rounded bg-muted animate-pulse shrink-0" />
              <div className="h-4 w-full bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function PhaseFocusSection() {
  const { data, loading } = useDashboard();

  if (loading || !data) return <PhaseFocusSkeleton />;

  const currentPhase = data.dashboard.find((d) => d['模块类型'] === '当前阶段');
  const weeklyFocus = data.dashboard.find((d) => d['模块类型'] === '本周重点');

  if (!currentPhase && !weeklyFocus) return null;

  const focusItems = weeklyFocus?.['内容']
    ?.split('\n')
    .filter(Boolean)
    .map((item) => item.replace(/^\d+\.\s*/, '')) ?? [];

  return (
    <section className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-10">
        {/* 当前阶段 */}
        {currentPhase && (
          <div className="bg-card rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow duration-200">
            <span className="inline-block bg-[hsl(24_100%_97%)] text-[hsl(25_85%_42%)] text-[11px] font-medium rounded-full px-2 py-0.5 mb-2">
              {currentPhase['标签']}
            </span>
            <h3 className="mb-2 text-xl font-extrabold text-foreground">
              {currentPhase['标题']}
            </h3>
            <p className="text-base leading-relaxed text-foreground">
              {currentPhase['内容']}
            </p>
          </div>
        )}

        {/* 本周重点 */}
        {weeklyFocus && (
          <div className="bg-card rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow duration-200">
            <h3 className="mb-3 text-xl font-extrabold text-foreground">
              {weeklyFocus['标题']}
            </h3>
            <ul>
              {focusItems.map((item, idx) => (
                <li
                  key={idx}
                  className={`flex items-start gap-3 py-2 ${
                    idx < focusItems.length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  <span className="text-xs font-bold text-primary shrink-0 w-5 text-center leading-5">
                    {idx + 1}
                  </span>
                  <span className="text-base leading-6 text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
