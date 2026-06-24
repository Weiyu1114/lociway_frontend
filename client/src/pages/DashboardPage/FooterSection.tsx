import { useDashboard } from './context';
import {
  FileTextIcon,
  FolderIcon,
  MessageSquareIcon,
  DatabaseIcon,
  ExternalLinkIcon,
} from 'lucide-react';
import { UniversalLink } from '@lark-apaas/client-toolkit/components/UniversalLink';

const adminRecordUrl = (table: string, id?: string) => {
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  return `${origin}/#/admin?table=${table}${id ? `&id=${encodeURIComponent(id)}` : ''}`;
};

function getTypeStyle(type: string) {
  switch (type) {
    case '产品文档':
      return {
        bg: 'bg-[hsl(217_91%_96%)]',
        text: 'text-[hsl(217_91%_40%)]',
      };
    case '运营模板':
      return {
        bg: 'bg-[hsl(152_69%_95%)]',
        text: 'text-[hsl(152_69%_32%)]',
      };
    case '沟通模板':
      return {
        bg: 'bg-[hsl(25_95%_96%)]',
        text: 'text-[hsl(25_85%_42%)]',
      };
    case '管理模板':
      return {
        bg: 'bg-[hsl(220_14%_95%)]',
        text: 'text-[hsl(229_16%_47%)]',
      };
    default:
      return { bg: 'bg-muted', text: 'text-muted-foreground' };
  }
}

function getBizLineColor(line: string) {
  if (line?.includes('品牌 CMO') || line?.includes('CMO')) {
    return 'text-[hsl(217_91%_45%)]';
  }
  if (line?.includes('小 b') || line?.includes('分销')) {
    return 'text-[hsl(152_69%_32%)]';
  }
  if (line?.includes('翻新') || line?.includes('二手')) {
    return 'text-[hsl(25_85%_42%)]';
  }
  return 'text-muted-foreground';
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-card rounded-xl shadow-sm p-5 transition-shadow"
        >
          <div className="h-5 w-20 bg-accent rounded-full animate-pulse mb-3" />
          <div className="h-4 w-full bg-accent rounded animate-pulse mb-2" />
          <div className="h-3 w-3/4 bg-accent rounded animate-pulse mb-2" />
          <div className="h-3 w-1/2 bg-accent rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export default function FooterSection() {
  const { data, loading } = useDashboard();

  const materials = data?.materials ?? [];

  return (
    <>
      {/* 资料入口 */}
      <section className="w-full">
        <h2 className="mb-4 text-base font-extrabold tracking-wide text-foreground md:text-lg">
          资料入口
        </h2>
        {loading || !data ? (
          <MaterialsSkeleton />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {materials.map((mat, idx) => {
              const typeStyle = getTypeStyle(mat['类型'] ?? '');
              const Icon = getTypeIcon(mat['类型'] ?? '');
              const bizColor = getBizLineColor(mat['对应业务线'] ?? '');
              const materialUrl = adminRecordUrl('resources', mat._record_id);

              return (
                <UniversalLink
                  key={idx}
                  to={materialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block bg-card rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-4 cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${typeStyle.bg} ${typeStyle.text}`}
                    >
                      {mat['类型'] ?? '—'}
                    </span>
                  </div>

                  <h3 className="mb-2 text-base font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
                    {mat['资料名称'] ?? '未命名资料'}
                  </h3>

                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    {mat['用途'] ?? ''}
                  </p>

                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-medium ${bizColor}`}>
                      {mat['对应业务线'] ?? '—'}
                    </span>
                    <span className="text-muted-foreground">
                      {mat['负责人'] ?? ''}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <span>进入资料详情</span>
                    <ExternalLinkIcon className="w-3 h-3 ml-1" />
                  </div>
                </UniversalLink>
              );
            })}
          </div>
        )}
      </section>

      {/* 底部说明 */}
      <footer className="w-full text-center py-5">
        <p className="text-xs text-muted-foreground">
          数据来源于 LociWay 自建后台，点击刷新可获取最新数据。日常数据维护请在数据后台中操作。
        </p>
      </footer>
    </>
  );
}
