import { useState } from 'react';
import {
  DatabaseIcon,
  FileTextIcon,
  FolderIcon,
  MessageSquareIcon,
  XIcon,
} from 'lucide-react';
import { useDashboard } from './context';

type Material = ReturnType<typeof useDashboard>['data']['materials'][number];

function getTypeStyle(type: string) {
  switch (type) {
    case '产品文档':
      return 'bg-[hsl(217_91%_96%)] text-[hsl(217_91%_40%)]';
    case '运营模板':
      return 'bg-[hsl(152_69%_95%)] text-[hsl(152_69%_32%)]';
    case '沟通模板':
      return 'bg-[hsl(25_95%_96%)] text-[hsl(25_85%_42%)]';
    case '管理模板':
      return 'bg-[hsl(220_14%_95%)] text-[hsl(229_16%_47%)]';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case '产品文档':
      return FileTextIcon;
    case '运营模板':
      return FolderIcon;
    case '沟通模板':
      return MessageSquareIcon;
    default:
      return DatabaseIcon;
  }
}

function MaterialsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl bg-card p-5 shadow-sm">
          <div className="mb-3 h-5 w-20 animate-pulse rounded-full bg-accent" />
          <div className="mb-2 h-4 w-full animate-pulse rounded bg-accent" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-accent" />
        </div>
      ))}
    </div>
  );
}

export default function FooterSection() {
  const { data, loading } = useDashboard();
  const [activeMaterial, setActiveMaterial] = useState<Material | null>(null);

  const materials = data?.materials ?? [];
  const grouped = materials.reduce<Record<string, Material[]>>((acc, item) => {
    const type = item['类型'] || '其他资料';
    acc[type] = acc[type] ?? [];
    acc[type].push(item);
    return acc;
  }, {});

  return (
    <>
      <section className="w-full">
        <h2 className="mb-4 text-base font-extrabold tracking-wide text-foreground md:text-lg">
          资料入口
        </h2>
        {loading || !data ? (
          <MaterialsSkeleton />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            {Object.entries(grouped).map(([type, items]) => {
              const Icon = getTypeIcon(type);
              return (
                <section
                  key={type}
                  className="rounded-xl bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold">{type}</h3>
                      <p className="text-xs text-muted-foreground">{items.length} 份</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {items.map((mat) => (
                      <button
                        key={mat._record_id ?? mat['资料名称']}
                        onClick={() => setActiveMaterial(mat)}
                        className="block w-full rounded-lg border border-border bg-background p-3 text-left transition-colors hover:bg-[hsl(24_100%_97%)]"
                      >
                        <p className="truncate text-sm font-semibold">{mat['资料名称']}</p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {mat['所属项目'] || mat['对应业务线'] || '未归档'}
                        </p>
                      </button>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </section>

      {activeMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-card shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-5">
              <div>
                <span className={`mb-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getTypeStyle(activeMaterial['类型'] ?? '')}`}>
                  {activeMaterial['类型'] || '资料'}
                </span>
                <h3 className="text-2xl font-extrabold">{activeMaterial['资料名称']}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {activeMaterial['所属项目'] || activeMaterial['客户名称'] || activeMaterial['对应业务线'] || '未归档'}
                </p>
              </div>
              <button
                onClick={() => setActiveMaterial(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
              <section className="rounded-lg border border-border bg-background p-4 md:col-span-2">
                <p className="mb-2 text-xs font-bold text-muted-foreground">用途</p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {activeMaterial['用途'] || '暂无说明'}
                </p>
              </section>
              <section className="rounded-lg border border-border bg-background p-4">
                <p className="mb-2 text-xs font-bold text-muted-foreground">负责人</p>
                <p className="text-sm">{activeMaterial['负责人'] || '未分配'}</p>
              </section>
              <section className="rounded-lg border border-border bg-background p-4">
                <p className="mb-2 text-xs font-bold text-muted-foreground">版本日期</p>
                <p className="text-sm">{activeMaterial['版本日期'] || '待定'}</p>
              </section>
              {activeMaterial['AI总结'] && (
                <section className="rounded-lg border border-border bg-background p-4 md:col-span-2">
                  <p className="mb-2 text-xs font-bold text-muted-foreground">AI 摘要</p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {activeMaterial['AI总结']}
                  </p>
                </section>
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="w-full py-5 text-center">
        <p className="text-xs text-muted-foreground">
          数据来源于 LociWay 自建后台，点击刷新可获取最新数据。
        </p>
      </footer>
    </>
  );
}
