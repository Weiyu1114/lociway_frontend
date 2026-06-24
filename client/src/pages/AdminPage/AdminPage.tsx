import React, { useEffect, useMemo, useState } from 'react';
import {
  createAdminRecord,
  deleteAdminRecord,
  fetchAdminRecords,
  fetchAdminSchema,
  reorderAdminRecords,
  summarizeAdminAttachment,
  toApiUrl,
  uploadAdminFile,
  updateAdminRecord,
} from '@/api';
import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  BotIcon,
  FileIcon,
  FileTextIcon,
  FileUpIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  GripVerticalIcon,
  SaveIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const TABLE_LABELS: Record<string, string> = {
  dashboard: '首页模块',
  business: '业务线',
  opportunities: '当前项目',
  tasks: '个人任务',
  resources: '资料',
  meetings: '会议记录',
};

const TITLE_FIELDS = ['标题', '业务线', '项目名称', '机会名称', '任务', '资料名称', '会议标题'];
const SUBTITLE_FIELDS = ['客户名称', '状态', '当前阶段', '负责人', '类型', '品牌方', '会议日期'];
const LONG_FIELDS = new Set([
  '内容',
  '备注',
  '下一步动作',
  '关键风险',
  '本周目标',
  '用途',
  'AI总结',
  '行动项',
  '关键点',
  '风险',
  '原文摘录',
]);
const TASK_OWNERS = ['Rucia', 'Jason', 'Louis'];
function fieldOptions(tableKey: string, field: string) {
  if (tableKey === 'business' && field === '优先级') return ['P0', 'P1', 'P2'];
  const options: Record<string, string[]> = {
    状态: ['待开始', '进行中', '已完成', '暂停'],
    优先级: ['P0 本周必须', 'P1 近期推进', 'P2 暂存'],
  };
  return options[field];
}

type AdminRecord = Record<string, unknown> & { _record_id?: string };

function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

function firstText(record: AdminRecord, fields: string[]): string {
  for (const field of fields) {
    const value = stringifyValue(record[field]);
    if (value) return value;
  }
  return '未命名记录';
}

function displayFields(fields: string[]) {
  return fields.filter((field) => !['原文摘录', '文件名', '文件类型', '文件URL', '附件列表'].includes(field));
}

function recordTerms(tableKey: string, record: AdminRecord) {
  const baseFields: Record<string, string[]> = {
    business: ['业务线', '定位'],
    opportunities: ['项目名称', '机会名称', '客户名称', '客户/合作方', '业务线'],
    tasks: ['任务', '所属项目', '负责人'],
    resources: ['资料名称', '对应业务线', '类型'],
    meetings: ['会议标题', '品牌方', '参会人'],
    dashboard: ['标题', '关联业务线'],
  };
  return (baseFields[tableKey] ?? TITLE_FIELDS)
    .map((field) => stringifyValue(record[field]).trim())
    .filter((value) => value.length >= 2);
}

function hasTermOverlap(a: string[], b: string[]) {
  return a.some((left) =>
    b.some((right) => left.includes(right) || right.includes(left))
  );
}

function canInlinePreview(fileUrl: string, fileType: string) {
  const value = `${fileUrl} ${fileType}`.toLowerCase();
  return ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.txt', '.md', '.csv'].some((ext) =>
    value.includes(ext)
  );
}

type Attachment = {
  id?: string;
  name?: string;
  type?: string;
  url?: string;
  size?: number;
  uploaded_at?: string;
  excerpt?: string;
  ai_summary?: Record<string, unknown>;
};

function parseAttachmentList(value: unknown): Attachment[] {
  if (Array.isArray(value)) return value.filter((item): item is Attachment => typeof item === 'object' && item !== null);
  if (!value) return [];
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed)
      ? parsed.filter((item): item is Attachment => typeof item === 'object' && item !== null)
      : [];
  } catch {
    return [];
  }
}

function formatFileSize(size: unknown) {
  const bytes = Number(size);
  if (!Number.isFinite(bytes) || bytes <= 0) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fileKind(name = '', type = '') {
  const value = `${name} ${type}`.toLowerCase();
  if (value.includes('.pdf') || value.includes('pdf')) return { label: 'PDF', tone: 'text-[hsl(0_72%_45%)] bg-[hsl(0_84%_96%)]' };
  if (value.includes('.doc') || value.includes('docx')) return { label: 'Word', tone: 'text-[hsl(217_91%_45%)] bg-[hsl(217_91%_96%)]' };
  if (value.includes('.md')) return { label: 'README', tone: 'text-[hsl(152_69%_32%)] bg-[hsl(152_69%_95%)]' };
  if (value.includes('text') || value.includes('.txt') || value.includes('.csv')) return { label: 'Text', tone: 'text-[hsl(25_85%_42%)] bg-[hsl(25_95%_96%)]' };
  return { label: 'File', tone: 'text-muted-foreground bg-muted' };
}

function isDateField(field: string) {
  return field.includes('日期') || field.includes('时间') || field.includes('截止');
}

function isPeopleField(field: string) {
  return field.includes('负责人') || field.includes('参会人') || field.includes('来源人');
}

function isBrandField(field: string) {
  return field.includes('品牌方') || field.includes('客户名称') || field.includes('客户/合作方');
}

export default function AdminPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [schema, setSchema] = useState<Record<string, string[]>>({});
  const [tableKey, setTableKey] = useState('business');
  const [records, setRecords] = useState<AdminRecord[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [draggingId, setDraggingId] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryAttachment, setSummaryAttachment] = useState<Attachment | null>(null);
  const [summarizingAttachmentId, setSummarizingAttachmentId] = useState('');
  const [allRecords, setAllRecords] = useState<Record<string, AdminRecord[]>>({});

  const fields = schema[tableKey] ?? [];
  const selectedRecord = useMemo(
    () => records.find((record) => record._record_id === selectedId),
    [records, selectedId]
  );

  async function loadSchema() {
    const nextSchema = await fetchAdminSchema();
    setSchema(nextSchema.tables);
    if (!nextSchema.tables[tableKey]) {
      setTableKey(Object.keys(nextSchema.tables)[0] ?? 'business');
    }
    return nextSchema.tables;
  }

  function adminPath(nextTableKey: string, id = '') {
    return `/admin?table=${encodeURIComponent(nextTableKey)}${id ? `&id=${encodeURIComponent(id)}` : ''}`;
  }

  async function loadRecords(nextTableKey = tableKey, preferredId = '') {
    setLoading(true);
    try {
      const response = await fetchAdminRecords(nextTableKey);
      const nextRecords = response.data as AdminRecord[];
      setRecords(nextRecords);
      setSelectedId((current) => {
        if (preferredId && nextRecords.some((record) => stringifyValue(record._record_id) === preferredId)) {
          return preferredId;
        }
        if (nextRecords.some((record) => stringifyValue(record._record_id) === current)) {
          return current;
        }
        return stringifyValue(nextRecords[0]?._record_id);
      });
    } catch {
      toast.error('读取数据失败');
    } finally {
      setLoading(false);
    }
  }

  async function loadAllRecords(tableKeys: string[]) {
    const entries = await Promise.all(
      tableKeys.map(async (key) => {
        const response = await fetchAdminRecords(key);
        return [key, response.data as AdminRecord[]] as const;
      })
    );
    setAllRecords(Object.fromEntries(entries));
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const initialTable = params.get('table') || tableKey;
    const initialId = params.get('id') || '';
    loadSchema()
      .then((tables) => {
        setTableKey(initialTable);
        return Promise.all([
          loadRecords(initialTable, initialId),
          loadAllRecords(Object.keys(tables)),
        ]);
      })
      .catch(() => toast.error('后台初始化失败'));
  }, [location.search]);

  function openEditor(record?: AdminRecord) {
    setForm(
      Object.fromEntries(
        fields.map((field) => [field, stringifyValue(record ? record[field] : '')])
      )
    );
    const nextEditingId = stringifyValue(record?._record_id);
    setEditingId(nextEditingId);
    if (nextEditingId) setSelectedId(nextEditingId);
    setEditorOpen(true);
  }

  async function switchTable(nextTableKey: string) {
    setTableKey(nextTableKey);
    setUploadFiles([]);
    setUploadProgress(0);
    setUploadOpen(false);
    navigate(adminPath(nextTableKey));
    await loadRecords(nextTableKey);
  }

  async function saveRecord() {
    setSaving(true);
    try {
      if (editingId) {
        await updateAdminRecord(tableKey, editingId, form);
        toast.success('已保存修改');
      } else {
        await createAdminRecord(tableKey, form);
        toast.success('已新增记录');
      }
      setEditorOpen(false);
      await loadRecords(tableKey);
      await loadAllRecords(Object.keys(schema));
    } catch {
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  }

  async function removeRecord() {
    if (!selectedId) return;

    setSaving(true);
    try {
      await deleteAdminRecord(tableKey, selectedId);
      toast.success('已删除记录');
      setDeleteConfirmOpen(false);
      await loadRecords(tableKey);
      await loadAllRecords(Object.keys(schema));
    } catch {
      toast.error('删除失败');
    } finally {
      setSaving(false);
    }
  }

  async function uploadFileForTable() {
    if (uploadFiles.length === 0) {
      toast.error('请先选择文件');
      return;
    }
    if (!selectedRecord || !selectedId) {
      toast.error('请先选择一条数据');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      const payload = new FormData();
      for (const [index, file] of uploadFiles.entries()) {
        payload.delete('file');
        payload.delete('record_id');
        payload.delete('title');
        payload.append('file', file);
        payload.append('record_id', selectedId);
        payload.append('title', firstText(selectedRecord ?? {}, TITLE_FIELDS));
        await uploadAdminFile(tableKey, payload, (percent) => {
          setUploadProgress(Math.round(((index + percent / 100) / uploadFiles.length) * 100));
        });
      }
      toast.success('文件已上传', {
        description: `已保存 ${uploadFiles.length} 个附件，需要 AI 总结时再点击 AI 总结`,
      });
      setUploadFiles([]);
      setUploadOpen(false);
      await loadRecords(tableKey, selectedId);
      await loadAllRecords(Object.keys(schema));
    } catch {
      toast.error('上传失败');
    } finally {
      setUploading(false);
    }
  }

  async function summarizeAttachment(attachment: Attachment) {
    if (!selectedId || !attachment.id) return;
    setSummarizingAttachmentId(attachment.id);
    try {
      const result = await summarizeAdminAttachment(tableKey, selectedId, attachment.id);
      const createdCount = Array.isArray((result as { created_tasks?: unknown[] }).created_tasks)
        ? (result as { created_tasks?: unknown[] }).created_tasks?.length ?? 0
        : 0;
      toast.success('附件 AI 总结已生成', {
        description: createdCount > 0 ? `已自动生成 ${createdCount} 条个人任务` : '未识别到明确行动项',
      });
      await loadRecords(tableKey, selectedId);
      await loadAllRecords(Object.keys(schema));
      setSummaryAttachment(result.attachment as Attachment);
      setSummaryOpen(true);
    } catch {
      toast.error('附件 AI 总结失败，请确认文件可解析');
    } finally {
      setSummarizingAttachmentId('');
    }
  }

  async function reorderRecords(targetId: string) {
    if (!draggingId || draggingId === targetId) return;
    const current = records.map((record) => stringifyValue(record._record_id));
    const fromIndex = current.indexOf(draggingId);
    const toIndex = current.indexOf(targetId);
    if (fromIndex < 0 || toIndex < 0) return;
    const nextRecords = [...records];
    const [moved] = nextRecords.splice(fromIndex, 1);
    nextRecords.splice(toIndex, 0, moved);
    setRecords(nextRecords.map((record, index) => ({ ...record, 排序: index + 1 })));
    try {
      await reorderAdminRecords(tableKey, nextRecords.map((record) => stringifyValue(record._record_id)));
      await loadAllRecords(Object.keys(schema));
      toast.success('排序已保存');
    } catch {
      toast.error('排序保存失败');
      await loadRecords(tableKey, selectedId);
    }
  }

  const recordTitle = selectedRecord ? firstText(selectedRecord, TITLE_FIELDS) : '请选择记录';
  const recordSubtitle = selectedRecord ? firstText(selectedRecord, SUBTITLE_FIELDS) : '';
  const attachmentList = useMemo(
    () => parseAttachmentList(selectedRecord?.['附件列表']),
    [selectedRecord]
  );
  const latestAttachment = attachmentList.at(-1);
  const fileUrl = toApiUrl(previewAttachment?.url || latestAttachment?.url || selectedRecord?.['文件URL']);
  const fileType = stringifyValue(previewAttachment?.type || latestAttachment?.type || selectedRecord?.['文件类型']);
  const inlinePreview = canInlinePreview(fileUrl, fileType);
  const relatedGroups = useMemo(() => {
    if (!selectedRecord) return [];
    const currentTerms = recordTerms(tableKey, selectedRecord);
    return Object.entries(allRecords)
      .filter(([key]) => key !== tableKey)
      .map(([key, items]) => ({
        key,
        label: TABLE_LABELS[key] ?? key,
        items: items
          .filter((record) => stringifyValue(record._record_id) !== selectedId)
          .filter((record) => hasTermOverlap(currentTerms, recordTerms(key, record)))
          .slice(0, 5),
      }))
      .filter((group) => group.items.length > 0);
  }, [allRecords, selectedId, selectedRecord, tableKey]);
  const brandOptions = useMemo(() => {
    const values = new Set<string>();
    Object.values(allRecords).flat().forEach((record) => {
      ['品牌方', '客户名称', '客户/合作方'].forEach((field) => {
        const value = stringifyValue(record[field]).trim();
        if (value) values.add(value);
      });
    });
    return Array.from(values).sort();
  }, [allRecords]);

  return (
    <div className="min-h-screen bg-[hsl(210_28%_96%)] text-foreground">
      <header className="border-b border-border bg-card">
        <div className="flex w-full items-center justify-between gap-4 px-6 py-5">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Link
                to="/"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-accent"
              >
                <ArrowLeftIcon className="h-4 w-4" />
              </Link>
              <h1 className="text-2xl font-bold">LociWay 数据后台</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              查看内容、上传文件、生成 AI 总结和行动项；点击编辑按钮才会修改数据。
            </p>
          </div>

          <button
            onClick={() => loadRecords(tableKey)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            <RefreshCwIcon className="h-4 w-4" />
            刷新
          </button>
        </div>
      </header>

      <main className="grid w-full grid-cols-1 gap-5 px-5 py-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="rounded-lg border border-border bg-card p-2">
          {Object.keys(schema).map((key) => (
            <button
              key={key}
              onClick={() => switchTable(key)}
              className={`mb-1 block w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                tableKey === key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-accent'
              }`}
            >
              {TABLE_LABELS[key] ?? key}
            </button>
          ))}
        </aside>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[390px_minmax(0,1fr)]">
          <div className="space-y-5">
            <div className="rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h2 className="text-sm font-bold">{TABLE_LABELS[tableKey] ?? tableKey}</h2>
                <button
                  onClick={() => {
                    setSelectedId('');
                    openEditor();
                  }}
                  className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  新增
                </button>
              </div>

              <div className="max-h-[62vh] overflow-auto">
                {loading ? (
                  <div className="p-6 text-sm text-muted-foreground">读取中...</div>
                ) : records.length === 0 ? (
                  <div className="p-6 text-sm text-muted-foreground">暂无记录</div>
                ) : (
                  records.map((record) => {
                    const id = stringifyValue(record._record_id);
                    const title = firstText(record, TITLE_FIELDS);
                    const subtitle = firstText(record, SUBTITLE_FIELDS);

                    return (
                      <button
                        key={id}
                        draggable
                        onDragStart={() => setDraggingId(id)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => reorderRecords(id)}
                        onDragEnd={() => setDraggingId('')}
                        onClick={() => {
                          setSelectedId(id);
                          setUploadOpen(false);
                          setUploadFiles([]);
                          setPreviewAttachment(null);
                          setUploadProgress(0);
                          navigate(adminPath(tableKey, id));
                        }}
                        className={`flex w-full items-center gap-2 border-b border-border px-4 py-3 text-left last:border-b-0 hover:bg-accent ${
                          selectedId === id ? 'bg-[hsl(24_100%_97%)]' : ''
                        }`}
                      >
                        <GripVerticalIcon className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold">{title}</div>
                          <div className="mt-1 truncate text-xs text-muted-foreground">
                            {subtitle}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <article className="rounded-lg border border-border bg-card">
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div className="min-w-0">
                <h2 className="truncate text-xl font-bold">{recordTitle}</h2>
                {recordSubtitle && (
                  <p className="mt-1 text-sm text-muted-foreground">{recordSubtitle}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {selectedRecord && (
                  <>
                    <button
                      onClick={() => setUploadOpen((current) => !current)}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
                    >
                      <PlusIcon className="h-3.5 w-3.5" />
                      上传文档
                    </button>
                  </>
                )}
                {fileUrl && (
                  <button
                    onClick={() => {
                      setPreviewAttachment(latestAttachment ?? null);
                      setPreviewOpen(true);
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
                  >
                    <ExternalLinkIcon className="h-3.5 w-3.5" />
                    预览文件
                  </button>
                )}
                {selectedRecord && (
                  <button
                    onClick={() => openEditor(selectedRecord)}
                    className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    <PencilIcon className="h-3.5 w-3.5" />
                    编辑
                  </button>
                )}
              </div>
            </div>

            {!selectedRecord ? (
              <div className="p-8 text-sm text-muted-foreground">请选择左侧记录查看详情。</div>
            ) : (
              <>
                {uploadOpen && (
                  <div className="border-b border-border bg-[hsl(210_28%_98%)] px-5 py-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                      <label className="flex min-h-12 flex-1 cursor-pointer items-center gap-3 rounded-md border border-dashed border-border bg-card px-4 py-3 hover:bg-accent">
                        <FileUpIcon className="h-4 w-4 text-muted-foreground" />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {uploadFiles.length > 0
                              ? uploadFiles.map((file) => file.name).join('、')
                              : '选择要挂到这条数据里的文件'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            可一次选择多个；PDF 可直接预览，Word/README 会展示提取文本
                          </div>
                        </div>
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(event) => {
                            setUploadFiles(Array.from(event.target.files ?? []));
                            setUploadProgress(0);
                          }}
                        />
                      </label>
                      <button
                        onClick={uploadFileForTable}
                        disabled={uploading}
                        className="inline-flex h-12 items-center justify-center gap-1 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {uploading ? `上传中 ${uploadProgress}%` : '确认上传'}
                      </button>
                    </div>
                    {(uploading || uploadProgress > 0) && (
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {attachmentList.length > 0 && (
                  <div className="border-b border-border px-5 py-5">
                    <h3 className="mb-3 text-base font-bold text-foreground">附件</h3>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {attachmentList.map((attachment, index) => {
                        const kind = fileKind(attachment.name, attachment.type);
                        const attachmentUrl = toApiUrl(attachment.url);
                        const Icon = kind.label === 'File' ? FileIcon : FileTextIcon;
                        return (
                          <section
                            key={attachment.id ?? `${attachment.name}-${index}`}
                            className="group rounded-lg border border-border bg-background p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                          >
                            <div className="mb-3 flex items-start gap-3">
                              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${kind.tone}`}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-foreground">
                                  {attachment.name || '未命名文件'}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {kind.label}
                                  {formatFileSize(attachment.size) ? ` · ${formatFileSize(attachment.size)}` : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setPreviewAttachment(attachment);
                                  setPreviewOpen(true);
                                }}
                                className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                              >
                                查看
                              </button>
                              <button
                                onClick={() => {
                                  if (attachment.ai_summary) {
                                    setSummaryAttachment(attachment);
                                    setSummaryOpen(true);
                                  } else {
                                    summarizeAttachment(attachment);
                                  }
                                }}
                                disabled={summarizingAttachmentId === attachment.id}
                                className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-60"
                              >
                                <BotIcon className="h-3.5 w-3.5" />
                                {summarizingAttachmentId === attachment.id
                                  ? '总结中'
                                  : attachment.ai_summary
                                    ? '查看AI总结'
                                    : 'AI总结'}
                              </button>
                              {attachmentUrl && (
                                <a
                                  href={attachmentUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
                                >
                                  原文件
                                  <ExternalLinkIcon className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </div>
                          </section>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-2">
                  {displayFields(fields).map((field) => {
                    const value = stringifyValue(selectedRecord[field]);
                    if (!value) return null;
                    const isLarge = ['AI总结', '行动项', '关键点', '风险'].includes(field);
                    return (
                      <section
                        key={field}
                        className={`rounded-lg border border-border bg-background p-4 ${
                          isLarge ? 'min-h-48 lg:col-span-2' : ''
                        }`}
                      >
                        <div className="mb-2 text-xs font-semibold text-muted-foreground">
                          {field}
                        </div>
                        {field === '文件URL' ? (
                          <button
                            onClick={() => setPreviewOpen(true)}
                            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                          >
                            查看附件
                            <ExternalLinkIcon className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                            {value}
                          </p>
                        )}
                      </section>
                    );
                  })}
                </div>

                {relatedGroups.length > 0 && (
                  <div className="border-t border-border px-5 py-5">
                    <h3 className="mb-3 text-base font-bold text-foreground">关联内容</h3>
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                      {relatedGroups.map((group) => (
                        <section
                          key={group.key}
                          className="rounded-lg border border-border bg-background p-4"
                        >
                          <div className="mb-2 text-xs font-semibold text-muted-foreground">
                            {group.label}
                          </div>
                          <div className="space-y-2">
                            {group.items.map((record) => {
                              const id = stringifyValue(record._record_id);
                              return (
                                <button
                                  key={id}
                                  onClick={() => {
                                    setTableKey(group.key);
                                    setUploadOpen(false);
                                    setUploadFiles([]);
                                    setPreviewAttachment(null);
                                    setUploadProgress(0);
                                    navigate(adminPath(group.key, id));
                                  }}
                                  className="block w-full rounded-md border border-border bg-card px-3 py-2 text-left hover:bg-accent"
                                >
                                  <div className="truncate text-sm font-semibold">
                                    {firstText(record, TITLE_FIELDS)}
                                  </div>
                                  <div className="mt-0.5 truncate text-xs text-muted-foreground">
                                    {firstText(record, SUBTITLE_FIELDS)}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </section>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </article>
        </section>
      </main>

      {previewOpen && fileUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex h-[88vh] w-full max-w-5xl flex-col rounded-lg bg-card shadow-xl">
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold">{recordTitle}</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {inlinePreview ? '文件预览' : '已提取文本'}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
                >
                  打开原文件
                  <ExternalLinkIcon className="h-3.5 w-3.5" />
                </a>
                <button
                  onClick={() => setPreviewOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 bg-background">
              {inlinePreview ? (
                <iframe
                  title="文件预览"
                  src={fileUrl}
                  className="h-full w-full border-0"
                />
              ) : (
                <div className="h-full overflow-auto p-5">
                  <pre className="whitespace-pre-wrap break-words rounded-lg border border-border bg-card p-4 text-sm leading-relaxed">
                    {stringifyValue(selectedRecord?.['原文摘录']) || '暂无可预览文本，可点击右上角打开原文件。'}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {summaryOpen && summaryAttachment?.ai_summary && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[88vh] w-full max-w-4xl flex-col rounded-lg bg-card shadow-xl">
            <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
              <div className="min-w-0">
                <h2 className="truncate text-xl font-extrabold">
                  {stringifyValue(summaryAttachment.ai_summary.title) || 'AI 总结文稿'}
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {summaryAttachment.name} · {stringifyValue(summaryAttachment.ai_summary.generated_at).slice(0, 10)}
                </p>
              </div>
              <button
                onClick={() => setSummaryOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 overflow-auto p-6">
              <section className="rounded-lg border border-border bg-background p-4">
                <p className="mb-2 text-xs font-bold text-muted-foreground">一页结论</p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {stringifyValue(summaryAttachment.ai_summary.summary) || '暂无总结'}
                </p>
              </section>

              {[
                ['关键判断', summaryAttachment.ai_summary.key_points],
                ['行动项', summaryAttachment.ai_summary.action_items],
                ['风险提醒', summaryAttachment.ai_summary.risks],
              ].map(([label, value]) => {
                const items = Array.isArray(value) ? value : stringifyValue(value).split('\n').filter(Boolean);
                return (
                  <section key={String(label)} className="rounded-lg border border-border bg-background p-4">
                    <p className="mb-2 text-xs font-bold text-muted-foreground">{String(label)}</p>
                    {items.length > 0 ? (
                      <ul className="space-y-2">
                        {items.map((item, index) => (
                          <li key={index} className="text-sm leading-relaxed">
                            {typeof item === 'object'
                              ? `${stringifyValue((item as Record<string, unknown>).owner) || '待定'}：${stringifyValue((item as Record<string, unknown>).task)}`
                              : String(item)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">暂无</p>
                    )}
                  </section>
                );
              })}

              <section className="rounded-lg border border-border bg-background p-4">
                <p className="mb-2 text-xs font-bold text-muted-foreground">下一步建议</p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {stringifyValue(summaryAttachment.ai_summary.next_steps) || '暂无'}
                </p>
              </section>
            </div>
          </div>
        </div>
      )}

      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="flex max-h-[88vh] w-full max-w-3xl flex-col rounded-lg bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-lg font-bold">{editingId ? '编辑记录' : '新增记录'}</h2>
              <button
                onClick={() => setEditorOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="grid flex-1 grid-cols-1 gap-4 overflow-auto p-5 md:grid-cols-2">
              {fields.map((field) => {
                const isLong = LONG_FIELDS.has(field);
                return (
                  <div key={field} className={isLong ? 'md:col-span-2' : ''}>
                    <span className="mb-1 block text-xs font-medium text-muted-foreground">
                      {field}
                    </span>
                    {isPeopleField(field) ? (
                      <div className="flex min-h-10 flex-wrap items-center gap-3 rounded-md border border-border bg-background px-3 py-2">
                        {TASK_OWNERS.map((owner) => {
                          const selected = (form[field] ?? '').split(/[、/,，\s]+/).includes(owner);
                          return (
                            <label key={owner} className="inline-flex items-center gap-1.5 text-sm">
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={(event) => {
                                  const current = new Set((form[field] ?? '').split(/[、/,，\s]+/).filter(Boolean));
                                  if (event.target.checked) current.add(owner);
                                  else current.delete(owner);
                                  setForm((value) => ({
                                    ...value,
                                    [field]: Array.from(current).join(' / '),
                                  }));
                                }}
                              />
                              {owner}
                            </label>
                          );
                        })}
                      </div>
                    ) : isDateField(field) ? (
                      <input
                        type="date"
                        value={(form[field] ?? '').slice(0, 10)}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, [field]: event.target.value }))
                        }
                        className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                      />
                    ) : isBrandField(field) ? (
                      <>
                        <input
                          list={`brand-options-${field}`}
                          value={form[field] ?? ''}
                          onChange={(event) =>
                            setForm((current) => ({ ...current, [field]: event.target.value }))
                          }
                          className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                        />
                        <datalist id={`brand-options-${field}`}>
                          {brandOptions.map((option) => (
                            <option key={option} value={option} />
                          ))}
                        </datalist>
                      </>
                    ) : fieldOptions(tableKey, field) ? (
                      <select
                        value={form[field] ?? ''}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, [field]: event.target.value }))
                        }
                        className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                      >
                        <option value="">请选择</option>
                        {fieldOptions(tableKey, field)?.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : isLong ? (
                      <textarea
                        value={form[field] ?? ''}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, [field]: event.target.value }))
                        }
                        className="min-h-28 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                      />
                    ) : (
                      <input
                        value={form[field] ?? ''}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, [field]: event.target.value }))
                        }
                        className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border p-4">
              {editingId ? (
                <button
                  onClick={() => setDeleteConfirmOpen(true)}
                  disabled={saving}
                  className="inline-flex items-center gap-1 rounded-md border border-[hsl(0_72%_75%)] px-3 py-2 text-sm font-medium text-[hsl(0_72%_45%)] hover:bg-[hsl(0_84%_96%)] disabled:opacity-50"
                >
                  <Trash2Icon className="h-4 w-4" />
                  删除
                </button>
              ) : (
                <span />
              )}
              <button
                onClick={saveRecord}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <SaveIcon className="h-4 w-4" />
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-md rounded-lg bg-card shadow-xl">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-lg font-bold">确认删除这条记录？</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                删除后无法从当前后台恢复，关联内容不会自动删除。
              </p>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent"
              >
                取消
              </button>
              <button
                onClick={removeRecord}
                disabled={saving}
                className="rounded-md bg-[hsl(0_72%_45%)] px-3 py-2 text-sm font-medium text-white hover:bg-[hsl(0_72%_40%)] disabled:opacity-50"
              >
                {saving ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
