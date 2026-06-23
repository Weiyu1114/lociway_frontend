import React, { useEffect, useMemo, useState } from 'react';
import {
  createAdminRecord,
  deleteAdminRecord,
  fetchAdminRecords,
  fetchAdminSchema,
  updateAdminRecord,
} from '@/api';
import { ArrowLeftIcon, PlusIcon, RefreshCwIcon, SaveIcon, Trash2Icon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const TABLE_LABELS: Record<string, string> = {
  dashboard: '首页模块',
  business: '业务线',
  opportunities: '机会池',
  tasks: '任务',
  resources: '资料',
};

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

export default function AdminPage() {
  const [schema, setSchema] = useState<Record<string, string[]>>({});
  const [tableKey, setTableKey] = useState('business');
  const [records, setRecords] = useState<AdminRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      const firstId = stringifyValue(nextRecords[0]?._record_id);
      setSelectedId(firstId);
    } catch (error) {
      toast.error('读取数据失败');
      throw error;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSchema()
      .then(() => loadRecords(tableKey))
      .catch(() => toast.error('后台初始化失败'));
  }, []);

  useEffect(() => {
    if (!selectedRecord) {
      setForm(Object.fromEntries(fields.map((field) => [field, ''])));
      return;
    }

    setForm(
      Object.fromEntries(fields.map((field) => [field, stringifyValue(selectedRecord[field])]))
    );
  }, [fields, selectedRecord]);

  async function switchTable(nextTableKey: string) {
    setTableKey(nextTableKey);
    await loadRecords(nextTableKey);
  }

  function startCreate() {
    setSelectedId('');
    setForm(Object.fromEntries(fields.map((field) => [field, ''])));
  }

  async function saveRecord() {
    setSaving(true);
    try {
      if (selectedId) {
        await updateAdminRecord(tableKey, selectedId, form);
        toast.success('已保存修改');
      } else {
        await createAdminRecord(tableKey, form);
        toast.success('已新增记录');
      }
      await loadRecords(tableKey);
    } catch {
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  }

  async function removeRecord() {
    if (!selectedId) return;
    const confirmed = window.confirm('确认删除这条记录吗？');
    if (!confirmed) return;

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

  return (
    <div className="min-h-screen bg-[hsl(210_28%_96%)] text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Link
                to="/"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border hover:bg-accent"
              >
                <ArrowLeftIcon className="h-4 w-4" />
              </Link>
              <h1 className="text-lg font-bold">LociWay 数据后台</h1>
            </div>
            <p className="text-xs text-muted-foreground">
              管理项目总盘数据，保存后前台刷新即可看到最新内容。
            </p>
          </div>

          <button
            onClick={() => loadRecords(tableKey)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent"
          >
            <RefreshCwIcon className="h-4 w-4" />
            刷新
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-5 py-5 lg:grid-cols-[220px_minmax(0,1fr)]">
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

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-bold">{TABLE_LABELS[tableKey] ?? tableKey}</h2>
              <button
                onClick={startCreate}
                className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                新增
              </button>
            </div>

            <div className="max-h-[68vh] overflow-auto">
              {loading ? (
                <div className="p-6 text-sm text-muted-foreground">读取中...</div>
              ) : records.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">暂无记录</div>
              ) : (
                records.map((record) => {
                  const id = stringifyValue(record._record_id);
                  const title = firstText(record, ['标题', '业务线', '机会名称', '任务', '资料名称']);
                  const subtitle = firstText(record, ['状态', '当前阶段', '负责人', '类型']);

                  return (
                    <button
                      key={id}
                      onClick={() => setSelectedId(id)}
                      className={`block w-full border-b border-border px-4 py-3 text-left last:border-b-0 hover:bg-accent ${
                        selectedId === id ? 'bg-[hsl(24_100%_97%)]' : ''
                      }`}
                    >
                      <div className="truncate text-sm font-semibold">{title}</div>
                      <div className="mt-1 truncate text-xs text-muted-foreground">{subtitle}</div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-bold">{selectedId ? '编辑记录' : '新增记录'}</h2>
              {selectedId && (
                <button
                  onClick={removeRecord}
                  disabled={saving}
                  className="inline-flex items-center gap-1 rounded-md border border-[hsl(0_72%_75%)] px-2.5 py-1 text-xs font-medium text-[hsl(0_72%_45%)] hover:bg-[hsl(0_84%_96%)] disabled:opacity-50"
                >
                  <Trash2Icon className="h-3.5 w-3.5" />
                  删除
                </button>
              )}
            </div>

            <div className="max-h-[68vh] space-y-3 overflow-auto p-4">
              {fields.map((field) => {
                const isLong = ['内容', '备注', '下一步动作', '关键风险', '本周目标', '用途'].includes(field);
                return (
                  <label key={field} className="block">
                    <span className="mb-1 block text-xs font-medium text-muted-foreground">
                      {field}
                    </span>
                    {isLong ? (
                      <textarea
                        value={form[field] ?? ''}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, [field]: event.target.value }))
                        }
                        className="min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
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

            <div className="border-t border-border p-4">
              <button
                onClick={saveRecord}
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <SaveIcon className="h-4 w-4" />
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
