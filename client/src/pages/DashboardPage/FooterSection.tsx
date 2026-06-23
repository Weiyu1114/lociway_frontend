import { useDashboard } from './context';
import {
  FileTextIcon,
  FolderIcon,
  MessageSquareIcon,
  DatabaseIcon,
  ExternalLinkIcon,
  ArrowUpRightIcon,
} from 'lucide-react';
import { UniversalLink } from '@lark-apaas/client-toolkit/components/UniversalLink';
import { toApiUrl } from '@/api';

const ADMIN_URL = '/#/admin';

const QUICK_LINKS = [
  {
    label: '业务线总览',
    url: ADMIN_URL,
    icon: FolderIcon,
  },
  {
    label: '项目机会池',
    url: ADMIN_URL,
    icon: FileTextIcon,
  },
  {
    label: '任务推进',
    url: ADMIN_URL,
    icon: MessageSquareIcon,
  },
  {
    label: '资料与模板',
    url: ADMIN_URL,
    icon: DatabaseIcon,
  },
];

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
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
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
              const materialUrl = mat['文件URL'] ? toApiUrl(mat['文件URL']) : ADMIN_URL;

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

                  <h3 className="text-sm font-semibold text-foreground leading-snug mb-2 group-hover:text-primary transition-colors">
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
                    <span>{mat['文件URL'] ? '预览资料' : '进入数据后台'}</span>
                    <ExternalLinkIcon className="w-3 h-3 ml-1" />
                  </div>
                </UniversalLink>
              );
            })}
          </div>
        )}
      </section>

      {/* 底部快捷入口 */}
      <section className="w-full mb-4">
        <div className="flex flex-wrap items-center gap-3">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <UniversalLink
                key={link.label}
                to={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 border border-border text-foreground hover:bg-accent hover:text-accent-foreground rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              >
                <Icon className="w-3.5 h-3.5" />
                {link.label}
              </UniversalLink>
            );
          })}

          <UniversalLink
            to={ADMIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ml-auto"
          >
            打开数据后台
            <ArrowUpRightIcon className="w-3.5 h-3.5" />
          </UniversalLink>
        </div>
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
