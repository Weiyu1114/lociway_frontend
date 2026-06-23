import React, { useEffect, useMemo, useState } from 'react';
import {
  createAdminRecord,
  deleteAdminRecord,
  fetchAdminRecords,
  fetchAdminSchema,
  toApiUrl,
  uploadAdminFile,
  updateAdminRecord,
} from '@/api';
import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  FileUpIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  SaveIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const TABLE_LABELS: Record<string, string> = {
  dashboard: '首页模块',
  business: '业务线',
  opportunities: '机会池',
  tasks: '任务',
  resources: '资料',
  meetings: '会议记录',
};

const TITLE_FIELDS = ['标题', '业务线', '机会名称', '任务', '资料名称', '会议标题'];
const SUBTITLE_FIELDS = ['状态', '当前阶段', '负责人', '类型', '品牌方', '会议日期'];
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
  return fields.filter((field) => !['原文摘录'].includes(field));
}

export default function AdminPage() {
  const [schema, setSchema] = useState<Record<string, string[]>>({});
  const [tableKey, setTableKey] = useState('business');
  const [records, setRecords] = useState<AdminRecord[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');

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
  }

  async function loadRecords(nextTableKey = tableKey) {
    setLoading(true);
    try {
      const response = await fetchAdminRecords(nextTableKey);
      const nextRecords = response.data as AdminRecord[];
      setRecords(nextRecords);
      setSelectedId((current) => {
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

  useEffect(() => {
    loadSchema()
      .then(() => loadRecords(tableKey))
      .catch(() => toast.error('后台初始化失败'));
  }, []);

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
    setUploadFile(null);
    setUploadTitle('');
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
    } catch {
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  }

  async function removeRecord() {
    if (!selectedId) return;
    if (!window.confirm('确认删除这条记录吗？')) return;

    setSaving(true);
    try {
      await deleteAdminRecord(tableKey, selectedId);
      toast.success('已删除记录');
      await loadRecords(tableKey);
    } catch {
      toast.error('删除失败');
    } finally {
      setSaving(false);
    }
  }

  async function uploadFileForTable() {
    if (!uploadFile) {
      toast.error('请先选择文件');
      return;
    }

    setUploading(true);
    try {
      const payload = new FormData();
      payload.append('file', uploadFile);
      payload.append('record_id', selectedId);
      payload.append('title', uploadTitle || firstText(selectedRecord ?? {}, TITLE_FIELDS));
      const result = await uploadAdminFile(tableKey, payload);
      toast.success('文件已上传并生成 AI 总结', {
        description: `自动创建 ${result.created_tasks.length} 个行动任务`,
      });
      setUploadFile(null);
      setUploadTitle('');
      await loadRecords(tableKey);
    } catch {
      toast.error('上传或 AI 总结失败');
    } finally {
      setUploading(false);
    }
  }

  const recordTitle = selectedRecord ? firstText(selectedRecord, TITLE_FIELDS) : '请选择记录';
  const recordSubtitle = selectedRecord ? firstText(selectedRecord, SUBTITLE_FIELDS) : '';
  const fileUrl = toApiUrl(selectedRecord?.['文件URL']);

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
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-3">
                <h2 className="text-sm font-bold">上传文档并 AI 总结</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  可挂到当前选中记录；不选记录时会创建新记录。PDF 可直接网页预览。
                </p>
              </div>
              <input
                value={uploadTitle}
                onChange={(event) => setUploadTitle(event.target.value)}
                placeholder="标题，可选"
                className="mb-3 h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              />
              <div className="flex flex-col gap-3">
                <input
                  type="file"
                  accept=".pdf,.docx,.txt,.md,.csv,.mp3,.m4a,.wav,.aac,.ogg,.flac,.mp4"
                  onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
                  className="min-h-9 rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                />
                <button
                  onClick={uploadFileForTable}
                  disabled={uploading}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  <FileUpIcon className="h-4 w-4" />
                  {uploading ? 'AI 总结中...' : '上传并总结'}
                </button>
              </div>
            </div>

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
                        onClick={() => setSelectedId(id)}
                        className={`block w-full border-b border-border px-4 py-3 text-left last:border-b-0 hover:bg-accent ${
                          selectedId === id ? 'bg-[hsl(24_100%_97%)]' : ''
                        }`}
                      >
                        <div className="truncate text-sm font-semibold">{title}</div>
                        <div className="mt-1 truncate text-xs text-muted-foreground">
                          {subtitle}
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
                {fileUrl && (
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
                  >
                    <ExternalLinkIcon className="h-3.5 w-3.5" />
                    预览文件
                  </a>
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
              <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-2">
                {displayFields(fields).map((field) => {
                  const value = stringifyValue(selectedRecord[field]);
                  if (!value) return null;
                  const isLarge = ['AI总结', '行动项', '关键点', '风险'].includes(field);
                  return (
                    <section
                      key={field}
                      className={`rounded-lg border border-border bg-background p-4 ${
                        isLarge ? 'lg:col-span-2 min-h-36' : ''
                      }`}
                    >
                      <div className="mb-2 text-xs font-semibold text-muted-foreground">
                        {field}
                      </div>
                      {field === '文件URL' ? (
                        <a
                          href={toApiUrl(value)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                        >
                          打开文件预览
                          <ExternalLinkIcon className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                          {value}
                        </p>
                      )}
                    </section>
                  );
                })}
              </div>
            )}
          </article>
        </section>
      </main>

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
                  <label key={field} className={isLong ? 'md:col-span-2' : ''}>
                    <span className="mb-1 block text-xs font-medium text-muted-foreground">
                      {field}
                    </span>
                    {isLong ? (
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
                  </label>
                );
              })}
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border p-4">
              {editingId ? (
                <button
                  onClick={removeRecord}
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
    </div>
  );
}
