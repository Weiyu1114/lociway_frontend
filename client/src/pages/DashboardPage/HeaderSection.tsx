import { RefreshCwIcon, ExternalLinkIcon } from 'lucide-react';
import { useDashboard } from './context';
import { UniversalLink } from '@lark-apaas/client-toolkit/components/UniversalLink';

function formatUpdatedAt(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}月${day}日 ${hours}:${minutes}`;
  } catch {
    return dateStr;
  }
}

export default function HeaderSection() {
  const { data, loading, refresh } = useDashboard();

  const intro = data?.dashboard?.find((d) => d['模块类型'] === '项目简介');
  const baseUrl = data?.meta?.base_url ?? '';
  const updatedAt = data?.meta?.updated_at
    ? formatUpdatedAt(data.meta.updated_at)
    : '--';

  if (!data && loading) {
    return (
      <header className="w-full bg-gradient-to-r from-[hsl(228_28%_27%)] to-[hsl(228_28%_32%)]">
        <div className="relative max-w-7xl mx-auto px-4 md:px-10 lg:px-16 py-3 flex items-center justify-between">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-5 w-36 rounded-md bg-white/10 animate-pulse" />
            <div className="h-3 w-64 rounded-md bg-white/10 animate-pulse" />
          </div>
          <div className="hidden md:flex items-center gap-2">
            <div className="h-7 w-24 rounded-full bg-white/10 animate-pulse" />
            <div className="h-7 w-20 rounded-md bg-white/10 animate-pulse" />
            <div className="h-7 w-28 rounded-md bg-white/10 animate-pulse" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="w-full bg-gradient-to-r from-[hsl(228_28%_27%)] to-[hsl(228_28%_32%)]">
      <div className="relative max-w-7xl mx-auto px-4 md:px-10 lg:px-16 py-3 flex items-center justify-between gap-4">
        {/* Left: Brand + Description */}
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-white tracking-tight">
            {intro?.['标题'] ?? 'LociWay 乐沩'}
          </h1>
          <p className="text-xs font-light text-white/50 mt-0.5 truncate">
            {intro?.['内容'] ?? '用小核心团队连接外部增长资源网络，帮助出海品牌先判断、再验证、后放大。'}
          </p>
        </div>

        {/* Right: Time + Actions */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {/* Updated time capsule */}
          <span className="hidden sm:inline-flex text-[11px] font-medium text-white/50 bg-white/10 rounded-full px-2.5 py-0.5 items-center">
            更新于 {updatedAt}
          </span>

          {/* Refresh button */}
          <button
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-1 text-xs font-medium text-white bg-white/15 hover:bg-white/25 rounded-md px-2.5 py-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCwIcon
              className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`}
            />
            <span className="hidden md:inline">刷新数据</span>
          </button>

          {/* Open Bitable button */}
          {baseUrl && (
            <UniversalLink
              to={baseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-[hsl(228_28%_27%)] bg-white hover:bg-white/90 rounded-md px-2.5 py-1 transition-colors"
            >
              <ExternalLinkIcon className="w-3 h-3" />
              <span className="hidden md:inline">打开多维表格</span>
            </UniversalLink>
          )}
        </div>
      </div>
    </header>
  );
}
