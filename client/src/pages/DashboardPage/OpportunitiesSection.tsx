import { ExternalLinkIcon, FolderIcon, FileTextIcon } from 'lucide-react';
import { UniversalLink } from '@lark-apaas/client-toolkit/components/UniversalLink';
import { useDashboard } from './context';

function adminRecordUrl(id?: string) {
  return id
    ? `/#/admin?table=opportunities&id=${encodeURIComponent(id)}`
    : '/#/admin?table=opportunities';
}

function getCustomerName(opp: Record<string, string | undefined>) {
  return opp['客户名称'] || opp['客户/合作方'] || '未归档客户';
}

function getProjectName(opp: Record<string, string | undefined>) {
  return opp['项目名称'] || opp['机会名称'] || '未命名项目';
}

function getStatusStyle(status: string) {
  if (status === '重点跟进') return 'bg-[hsl(0_84%_96%)] text-[hsl(0_72%_45%)]';
  if (status === '进行中') return 'bg-[hsl(217_91%_96%)] text-[hsl(217_91%_40%)]';
  return 'bg-[hsl(220_14%_95%)] text-[hsl(229_16%_47%)]';
}

function Skeleton() {
  return (
    <section className="w-full">
      <h2 className="mb-4 text-base font-extrabold tracking-wide text-foreground md:text-lg">
        当前项目
      </h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-xl bg-card p-5 shadow-sm">
            <div className="mb-4 h-5 w-32 animate-pulse rounded bg-muted" />
            <div className="h-16 animate-pulse rounded-lg bg-muted" />
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

  const grouped = opportunities.reduce<Record<string, typeof opportunities>>((acc, opp) => {
    const customer = getCustomerName(opp);
    acc[customer] = acc[customer] ?? [];
    acc[customer].push(opp);
    return acc;
  }, {});

  return (
    <section className="w-full">
      <h2 className="mb-4 text-base font-extrabold tracking-wide text-foreground md:text-lg">
        当前项目
      </h2>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Object.entries(grouped).map(([customer, projects]) => (
          <section
            key={customer}
            className="rounded-xl bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsl(217_91%_96%)] text-[hsl(217_91%_45%)]">
                  <FolderIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-extrabold text-foreground">
                    {customer}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {projects.length} 个项目文件夹
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {projects.map((opp, index) => (
                <UniversalLink
                  key={opp._record_id ?? `${customer}-${index}`}
                  to={adminRecordUrl(opp._record_id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block rounded-lg border border-border bg-background p-4 transition-colors hover:bg-[hsl(24_100%_97%)]"
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-2">
                      <FileTextIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-foreground">
                          {getProjectName(opp)}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {opp['文件夹'] || '资料 / 作战稿件 / 会议纪要'}
                        </p>
                      </div>
                    </div>
                    <ExternalLinkIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-80" />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`rounded-full px-2 py-0.5 font-medium ${getStatusStyle(opp['状态'] ?? '')}`}>
                      {opp['状态'] ?? '待推进'}
                    </span>
                    <span className="text-muted-foreground">
                      {opp['当前阶段'] ?? '阶段待定'}
                    </span>
                    <span className="text-muted-foreground">
                      {opp['负责人'] ?? '负责人待定'}
                    </span>
                  </div>
                </UniversalLink>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
