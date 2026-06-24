import { useMemo, useState } from 'react';
import { CheckSquareIcon, FileTextIcon, FolderIcon, XIcon } from 'lucide-react';
import { useDashboard } from './context';

type Project = NonNullable<ReturnType<typeof useDashboard>['data']['opportunities']>[number];

function getCustomerName(opp: Project) {
  return opp['客户名称'] || opp['客户/合作方'] || '未归档客户';
}

function getProjectName(opp: Project) {
  return opp['项目名称'] || opp['机会名称'] || '未命名项目';
}

function getStatusStyle(status: string) {
  if (status === '重点跟进') return 'bg-[hsl(0_84%_96%)] text-[hsl(0_72%_45%)]';
  if (status === '进行中') return 'bg-[hsl(217_91%_96%)] text-[hsl(217_91%_40%)]';
  return 'bg-[hsl(220_14%_95%)] text-[hsl(229_16%_47%)]';
}

function textIncludes(source: string | undefined, target: string) {
  return (source ?? '').includes(target) || target.includes(source ?? '__never__');
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
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  const projectDetail = useMemo(() => {
    if (!activeProject) return null;
    const projectName = getProjectName(activeProject);
    const customer = getCustomerName(activeProject);
    const files = (data.materials ?? []).filter((item) =>
      textIncludes(item['所属项目'], projectName) ||
      textIncludes(item['客户名称'], customer) ||
      textIncludes(item['资料名称'], projectName)
    );
    const tasks = (data.tasks ?? []).filter((task) =>
      textIncludes(task['所属项目'], projectName) ||
      textIncludes(task['备注'], customer)
    );
    return { projectName, customer, files, tasks };
  }, [activeProject, data.materials, data.tasks]);

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
                <button
                  key={opp._record_id ?? `${customer}-${index}`}
                  onClick={() => setActiveProject(opp)}
                  className="group block w-full rounded-lg border border-border bg-background p-4 text-left transition-colors hover:bg-[hsl(24_100%_97%)]"
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-2">
                      <FileTextIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-foreground">
                          {getProjectName(opp)}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {opp['文件夹'] || '资料 / 作战稿件 / 待办'}
                        </p>
                      </div>
                    </div>
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
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      {activeProject && projectDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="flex max-h-[88vh] w-full max-w-4xl flex-col rounded-lg bg-card shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-5">
              <div>
                <h3 className="text-2xl font-extrabold text-foreground">
                  {projectDetail.projectName}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {projectDetail.customer} · {activeProject['当前阶段'] || '阶段待定'}
                </p>
              </div>
              <button
                onClick={() => setActiveProject(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-auto p-6 lg:grid-cols-2">
              <section className="rounded-lg border border-border bg-background p-4">
                <div className="mb-3 flex items-center gap-2">
                  <FileTextIcon className="h-4 w-4 text-primary" />
                  <h4 className="font-bold">项目文件</h4>
                </div>
                {projectDetail.files.length > 0 ? (
                  <div className="space-y-2">
                    {projectDetail.files.map((file) => (
                      <div key={file._record_id ?? file['资料名称']} className="rounded-md border border-border bg-card p-3">
                        <p className="text-sm font-semibold">{file['资料名称']}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {file['类型'] || '资料'} · {file['负责人'] || '负责人待定'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">暂无关联文件</p>
                )}
              </section>

              <section className="rounded-lg border border-border bg-background p-4">
                <div className="mb-3 flex items-center gap-2">
                  <CheckSquareIcon className="h-4 w-4 text-primary" />
                  <h4 className="font-bold">项目待办</h4>
                </div>
                {projectDetail.tasks.length > 0 ? (
                  <div className="space-y-2">
                    {projectDetail.tasks.map((task) => (
                      <div key={task._record_id ?? task['任务']} className="rounded-md border border-border bg-card p-3">
                        <p className="text-sm font-semibold">{task['任务']}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {task['负责人'] || '未分配'} · {task['状态'] || '待开始'} · {task['截止时间'] || '日期待定'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">暂无关联待办</p>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
