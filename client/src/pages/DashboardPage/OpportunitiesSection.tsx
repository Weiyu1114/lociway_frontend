import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckSquareIcon,
  DownloadIcon,
  EyeIcon,
  FileIcon,
  FileTextIcon,
  FolderIcon,
  Loader2Icon,
  SparklesIcon,
  UploadIcon,
  XIcon,
} from 'lucide-react';
import {
  summarizeAdminAttachment,
  toApiUrl,
  uploadAdminFile,
} from '@/api';
import { useDashboard } from './context';

type Project = NonNullable<ReturnType<typeof useDashboard>['data']['opportunities']>[number];
type Material = NonNullable<ReturnType<typeof useDashboard>['data']['materials']>[number];

interface IAttachment {
  id?: string;
  name?: string;
  type?: string;
  url?: string;
  size?: number;
  excerpt?: string;
  ai_summary?: ISummary;
}

interface ISummary {
  title?: string;
  project?: string;
  generated_at?: string;
  summary?: string;
  key_points?: unknown;
  action_items?: unknown;
  risks?: unknown;
  next_steps?: unknown;
  confidence?: string;
}

interface IProjectFile {
  id: string;
  name: string;
  type: string;
  url: string;
  sourceTable: 'opportunities' | 'resources';
  recordId?: string;
  attachmentId?: string;
  owner?: string;
  materialName?: string;
  excerpt?: string;
  aiSummary?: ISummary;
  rawSummary?: string;
}

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
  const cleanSource = (source ?? '').trim();
  const cleanTarget = (target ?? '').trim();
  if (!cleanSource || !cleanTarget) return false;
  return cleanSource.includes(cleanTarget) || cleanTarget.includes(cleanSource);
}

function parseAttachments(raw: unknown): IAttachment[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as IAttachment[];
  if (typeof raw !== 'string') return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseSummary(raw: unknown): ISummary | undefined {
  if (!raw) return undefined;
  if (typeof raw === 'object') return raw as ISummary;
  if (typeof raw !== 'string') return undefined;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed ? (parsed as ISummary) : undefined;
  } catch {
    return { summary: raw };
  }
}

function isPreviewable(type: string, url: string) {
  const value = `${type} ${url}`.toLowerCase();
  return (
    value.includes('pdf') ||
    value.includes('image/') ||
    value.endsWith('.png') ||
    value.endsWith('.jpg') ||
    value.endsWith('.jpeg') ||
    value.endsWith('.webp') ||
    value.endsWith('.gif') ||
    value.endsWith('.txt') ||
    value.endsWith('.md') ||
    value.endsWith('.csv')
  );
}

function fileKind(type: string, name: string) {
  const value = `${type} ${name}`.toLowerCase();
  if (value.includes('pdf')) return 'PDF';
  if (value.includes('word') || value.endsWith('.doc') || value.endsWith('.docx')) return 'Word';
  if (value.includes('sheet') || value.endsWith('.xls') || value.endsWith('.xlsx')) return '表格';
  if (value.includes('image') || /\.(png|jpe?g|webp|gif)$/.test(value)) return '图片';
  if (value.endsWith('.md')) return 'README';
  return '文件';
}

function formatSummaryItem(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    const item = value as Record<string, unknown>;
    const owner = item.owner ? `${item.owner}：` : '';
    const task = item.task ?? item.content ?? item.title ?? item.summary ?? '';
    const due = item.due_date ? `（${item.due_date}）` : '';
    if (task) return `${owner}${task}${due}`;
    return JSON.stringify(value);
  }
  return String(value);
}

function summaryItems(value?: unknown): string[] {
  if (Array.isArray(value)) return value.map(formatSummaryItem).filter(Boolean);
  const formatted = formatSummaryItem(value);
  return formatted ? [formatted] : [];
}

function buildFiles(project: Project, materials: Material[]): IProjectFile[] {
  const projectName = getProjectName(project);
  const customer = getCustomerName(project);
  const files: IProjectFile[] = [];

  parseAttachments(project['附件列表']).forEach((attachment, index) => {
    const url = toApiUrl(attachment.url);
    files.push({
      id: `opportunities-${project._record_id}-${attachment.id ?? index}`,
      name: attachment.name || project['文件名'] || `${projectName} 附件`,
      type: attachment.type || project['文件类型'] || '',
      url,
      sourceTable: 'opportunities',
      recordId: project._record_id,
      attachmentId: attachment.id,
      owner: project['负责人'],
      excerpt: attachment.excerpt || project['原文摘录'],
      aiSummary: attachment.ai_summary,
      rawSummary: project['AI总结'],
    });
  });

  materials
    .filter(
      (item) =>
        textIncludes(item['所属项目'], projectName) ||
        textIncludes(item['客户名称'], customer) ||
        textIncludes(item['资料名称'], projectName)
    )
    .forEach((material) => {
      const attachments = parseAttachments(material['附件列表']);
      if (attachments.length === 0 && material['文件URL']) {
        files.push({
          id: `resources-${material._record_id}-latest`,
          name: material['资料名称'] || '资料文件',
          type: material['文件类型'] || material['类型'] || '',
          url: toApiUrl(material['文件URL']),
          sourceTable: 'resources',
          recordId: material._record_id,
          owner: material['负责人'],
          materialName: material['资料名称'],
          rawSummary: material['AI总结'],
        });
      }

      attachments.forEach((attachment, index) => {
        files.push({
          id: `resources-${material._record_id}-${attachment.id ?? index}`,
          name: attachment.name || material['资料名称'] || '资料文件',
          type: attachment.type || material['文件类型'] || material['类型'] || '',
          url: toApiUrl(attachment.url),
          sourceTable: 'resources',
          recordId: material._record_id,
          attachmentId: attachment.id,
          owner: material['负责人'],
          materialName: material['资料名称'],
          excerpt: attachment.excerpt,
          aiSummary: attachment.ai_summary,
          rawSummary: material['AI总结'],
        });
      });
    });

  return files;
}

function Skeleton() {
  return (
    <section className="w-full">
      <h2 className="mb-4 text-xl font-extrabold tracking-wide text-foreground md:text-2xl">
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
  const { data, loading, refresh } = useDashboard();
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<IProjectFile | null>(null);
  const [summaryFile, setSummaryFile] = useState<IProjectFile | null>(null);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [summarizingId, setSummarizingId] = useState<string | null>(null);
  const [summaryPercent, setSummaryPercent] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const opportunities = data?.opportunities ?? [];
  const activeProject = activeProjectId
    ? opportunities.find((opp) => opp._record_id === activeProjectId) ?? null
    : null;

  const projectDetail = useMemo(() => {
    if (!activeProject) return null;
    const projectName = getProjectName(activeProject);
    const customer = getCustomerName(activeProject);
    const files = buildFiles(activeProject, data.materials ?? []);
    const tasks = (data.tasks ?? []).filter(
      (task) =>
        textIncludes(task['所属项目'], projectName) ||
        textIncludes(task['备注'], customer)
    );
    return { projectName, customer, files, tasks };
  }, [activeProject, data.materials, data.tasks]);

  useEffect(() => {
    if (!summarizingId) return undefined;
    setSummaryPercent(12);
    const timer = window.setInterval(() => {
      setSummaryPercent((current) => Math.min(current + 8, 88));
    }, 450);
    return () => window.clearInterval(timer);
  }, [summarizingId]);

  if (loading || !data) return <Skeleton />;
  if (opportunities.length === 0) return null;

  const grouped = opportunities.reduce<Record<string, typeof opportunities>>((acc, opp) => {
    const customer = getCustomerName(opp);
    acc[customer] = acc[customer] ?? [];
    acc[customer].push(opp);
    return acc;
  }, {});

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    if (!activeProject?._record_id) return;
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    setUploadPercent(2);
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const payload = new FormData();
      payload.append('file', file);
      payload.append('record_id', activeProject._record_id);
      payload.append('title', getProjectName(activeProject));
      payload.append('analyze', 'false');

      await uploadAdminFile('opportunities', payload, (percent) => {
        const batchBase = Math.round((index / files.length) * 100);
        const batchShare = Math.round(percent / files.length);
        setUploadPercent(Math.min(batchBase + batchShare, 99));
      });
    }

    setUploadPercent(100);
    await refresh();
    window.setTimeout(() => setUploadPercent(null), 900);
    event.target.value = '';
  }

  async function handleSummarize(file: IProjectFile) {
    if (!file.recordId || !file.attachmentId) {
      setSummaryFile(file);
      return;
    }

    setSummarizingId(file.id);
    try {
      const result = await summarizeAdminAttachment(file.sourceTable, file.recordId, file.attachmentId);
      setSummaryPercent(100);
      await refresh();
      setSummaryFile({
        ...file,
        aiSummary: parseSummary(result.attachment?.ai_summary) ?? parseSummary(result.analysis),
      });
    } finally {
      window.setTimeout(() => {
        setSummarizingId(null);
        setSummaryPercent(0);
      }, 600);
    }
  }

  return (
    <section className="w-full">
      <h2 className="mb-4 text-xl font-extrabold tracking-wide text-foreground md:text-2xl">
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
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(217_91%_96%)] text-[hsl(217_91%_45%)]">
                  <FolderIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-xl font-extrabold text-foreground">
                    {customer}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {projects.length} 个项目文件夹
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {projects.map((opp, index) => {
                const files = buildFiles(opp, data.materials ?? []);
                return (
                  <button
                    key={opp._record_id ?? `${customer}-${index}`}
                    onClick={() => setActiveProjectId(opp._record_id ?? null)}
                    className="group block w-full rounded-lg border border-border bg-background p-4 text-left transition-colors hover:bg-[hsl(24_100%_97%)]"
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-2">
                        <FileTextIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="truncate text-base font-extrabold text-foreground">
                            {getProjectName(opp)}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {files.length} 个文件 · {opp['文件夹'] || '资料 / 作战稿件 / 待办'}
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
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {activeProject && projectDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="flex max-h-[90vh] w-full max-w-6xl flex-col rounded-lg bg-card shadow-xl">
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
                onClick={() => setActiveProjectId(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
                aria-label="关闭"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-auto p-6 lg:grid-cols-[1.45fr_0.85fr]">
              <section className="rounded-lg border border-border bg-background p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FileTextIcon className="h-4 w-4 text-primary" />
                    <h4 className="text-lg font-extrabold">项目文件</h4>
                  </div>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleUpload}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                    >
                      <UploadIcon className="h-4 w-4" />
                      上传文件
                    </button>
                  </div>
                </div>

                {uploadPercent !== null && (
                  <div className="mb-4 rounded-lg border border-border bg-card p-3">
                    <div className="mb-2 flex items-center justify-between text-xs font-medium">
                      <span>正在上传</span>
                      <span>{uploadPercent}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${uploadPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {projectDetail.files.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                    {projectDetail.files.map((file) => {
                      const summary = file.aiSummary ?? parseSummary(file.rawSummary);
                      const summarizing = summarizingId === file.id;
                      return (
                        <article key={file.id} className="rounded-lg border border-border bg-card p-3 shadow-sm">
                          <div className="mb-3 flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(217_91%_96%)] text-[hsl(217_91%_45%)]">
                              <FileIcon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold text-foreground">{file.name}</p>
                              <p className="mt-1 truncate text-xs text-muted-foreground">
                                {fileKind(file.type, file.name)}
                                {file.materialName ? ` · ${file.materialName}` : ''}
                                {file.owner ? ` · ${file.owner}` : ''}
                              </p>
                            </div>
                          </div>

                          {summarizing && (
                            <div className="mb-3">
                              <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                                <span>AI 正在总结</span>
                                <span>{summaryPercent}%</span>
                              </div>
                              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full rounded-full bg-[hsl(25_85%_55%)] transition-all"
                                  style={{ width: `${summaryPercent}%` }}
                                />
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setPreviewFile(file)}
                              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-2 text-xs font-semibold hover:bg-accent"
                            >
                              <EyeIcon className="h-3.5 w-3.5" />
                              查看
                            </button>
                            <button
                              onClick={() => (summary ? setSummaryFile(file) : handleSummarize(file))}
                              disabled={summarizing || (!file.attachmentId && !summary)}
                              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-2 text-xs font-semibold hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {summarizing ? (
                                <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <SparklesIcon className="h-3.5 w-3.5" />
                              )}
                              {summary ? '查看AI总结' : 'AI总结'}
                            </button>
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background hover:bg-accent"
                              aria-label="打开原文件"
                            >
                              <DownloadIcon className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
                    <UploadIcon className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-semibold text-foreground">还没有项目文件</p>
                    <p className="mt-1 text-xs text-muted-foreground">点击右上角上传 PDF、Word、录音或作战稿件</p>
                  </div>
                )}
              </section>

              <section className="rounded-lg border border-border bg-background p-4">
                <div className="mb-3 flex items-center gap-2">
                  <CheckSquareIcon className="h-4 w-4 text-primary" />
                  <h4 className="text-lg font-extrabold">项目待办</h4>
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
                  <p className="text-sm text-muted-foreground">暂无关联待办。文件 AI 总结后识别到行动项，会自动同步到个人任务。</p>
                )}
              </section>
            </div>
          </div>
        </div>
      )}

      {previewFile && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-lg bg-card shadow-xl">
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-extrabold">{previewFile.name}</h3>
                <p className="text-xs text-muted-foreground">{fileKind(previewFile.type, previewFile.name)}</p>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
                aria-label="关闭"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-[62vh] overflow-auto bg-background p-4">
              {isPreviewable(previewFile.type, previewFile.url) ? (
                <iframe
                  title={previewFile.name}
                  src={previewFile.url}
                  className="h-[68vh] w-full rounded-md border border-border bg-white"
                />
              ) : (
                <div className="rounded-lg border border-border bg-card p-6">
                  <p className="mb-3 text-sm font-semibold">该格式浏览器无法稳定内嵌预览，下面显示系统提取到的文本摘要。</p>
                  <pre className="max-h-[56vh] whitespace-pre-wrap rounded-md bg-muted p-4 text-sm leading-relaxed text-foreground">
                    {previewFile.excerpt || '暂无可预览文本，可点击右上角原文件按钮打开。'}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {summaryFile && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4">
          <div className="max-h-[88vh] w-full max-w-3xl overflow-auto rounded-lg bg-card shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">AI 总结文稿</p>
                <h3 className="text-xl font-extrabold">{summaryFile.name}</h3>
              </div>
              <button
                onClick={() => setSummaryFile(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
                aria-label="关闭"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 p-5">
              {(() => {
                const summary = summaryFile.aiSummary ?? parseSummary(summaryFile.rawSummary) ?? {};
                return (
                  <>
                    <section className="rounded-lg border border-border bg-background p-4">
                      <h4 className="mb-2 font-bold">1. 核心概要</h4>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                        {summary.summary || '暂无总结内容'}
                      </p>
                    </section>
                    <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="rounded-lg border border-border bg-background p-4">
                        <h4 className="mb-2 font-bold">2. 关键点</h4>
                        <ul className="space-y-1 text-sm text-foreground">
                          {summaryItems(summary.key_points).map((item) => <li key={item}>· {item}</li>)}
                          {summaryItems(summary.key_points).length === 0 && <li>暂无</li>}
                        </ul>
                      </div>
                      <div className="rounded-lg border border-border bg-background p-4">
                        <h4 className="mb-2 font-bold">3. 风险与阻塞</h4>
                        <ul className="space-y-1 text-sm text-foreground">
                          {summaryItems(summary.risks).map((item) => <li key={item}>· {item}</li>)}
                          {summaryItems(summary.risks).length === 0 && <li>暂无明显风险</li>}
                        </ul>
                      </div>
                    </section>
                    <section className="rounded-lg border border-border bg-background p-4">
                      <h4 className="mb-2 font-bold">4. 行动项</h4>
                      <ul className="space-y-1 text-sm text-foreground">
                        {summaryItems(summary.action_items).map((item) => <li key={item}>· {item}</li>)}
                        {summaryItems(summary.action_items).length === 0 && <li>暂无明确行动项</li>}
                      </ul>
                    </section>
                    <section className="rounded-lg border border-border bg-background p-4">
                      <h4 className="mb-2 font-bold">5. 下一步建议</h4>
                      <ul className="space-y-1 text-sm text-foreground">
                        {summaryItems(summary.next_steps).map((item) => <li key={item}>· {item}</li>)}
                        {summaryItems(summary.next_steps).length === 0 && <li>暂无</li>}
                      </ul>
                    </section>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
