import { FormEvent, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  CalendarIcon,
  CheckIcon,
  PlusIcon,
  SaveIcon,
  XIcon,
} from 'lucide-react';
import { createAdminRecord, updateAdminRecord } from '@/api';
import { useDashboard } from './context';

type Task = NonNullable<ReturnType<typeof useDashboard>['data']['tasks']>[number];

const PRIORITY_ORDER: Record<string, number> = {
  'P0 本周必须': 0,
  'P1 近期推进': 1,
  'P2 暂存': 2,
};
const OWNER_ORDER = ['Rucia', 'Jason', 'Louis'];
const PRIORITY_OPTIONS = ['P0 本周必须', 'P1 近期推进', 'P2 暂存'];
const STATUS_OPTIONS = ['待开始', '进行中', '已完成', '暂缓'];

function emptyTask(): Task {
  return {
    状态: '待开始',
    截止时间: '',
    产出物: '',
    所属项目: '',
    优先级: 'P1 近期推进',
    任务: '',
    负责人: 'Louis',
    备注: '',
  };
}

function getPriorityStyle(priority: string) {
  if (priority.includes('P0'))
    return 'bg-[hsl(0_84%_96%)] text-[hsl(0_72%_45%)]';
  if (priority.includes('P1'))
    return 'bg-[hsl(45_100%_94%)] text-[hsl(40_80%_35%)]';
  return 'bg-[hsl(220_14%_95%)] text-[hsl(229_16%_47%)]';
}

function getStatusStyle(status: string) {
  if (status === '进行中')
    return 'bg-[hsl(217_91%_96%)] text-[hsl(217_91%_40%)]';
  if (status === '已完成')
    return 'bg-[hsl(152_69%_95%)] text-[hsl(152_69%_32%)]';
  return 'bg-[hsl(220_14%_95%)] text-[hsl(229_16%_47%)]';
}

function formatDeadline(dateStr: string | undefined): string {
  if (!dateStr) return '日期待定';
  return dayjs(dateStr).format('M月D日');
}

function ownerNames(raw: string | undefined): string[] {
  if (!raw) return ['未分配'];
  return raw
    .split(/[、/,，\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeOwners(owners: string[]) {
  return OWNER_ORDER.filter((owner) => owners.includes(owner)).join('、');
}

function Skeleton() {
  return (
    <section className="w-full">
      <div className="mb-4 h-5 w-24 animate-pulse rounded bg-[hsl(24_100%_97%)]" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl bg-card p-4 shadow-sm">
            <div className="mb-4 h-5 w-20 animate-pulse rounded bg-[hsl(24_100%_97%)]" />
            {[0, 1].map((j) => (
              <div key={j} className="mb-3 rounded-lg border border-border p-3">
                <div className="mb-2 h-4 w-4/5 animate-pulse rounded bg-[hsl(24_100%_97%)]" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-[hsl(24_100%_97%)]" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function TasksSection() {
  const { data, loading, refresh } = useDashboard();
  const [editorTask, setEditorTask] = useState<Task | null>(null);
  const [saving, setSaving] = useState(false);

  const sortedTasks = useMemo(() => {
    return [...(data?.tasks ?? [])].sort((a, b) => {
      const aOrder = PRIORITY_ORDER[a['优先级']] ?? 99;
      const bOrder = PRIORITY_ORDER[b['优先级']] ?? 99;
      return aOrder - bOrder;
    });
  }, [data?.tasks]);

  const grouped = sortedTasks.reduce<Record<string, typeof sortedTasks>>((acc, task) => {
    ownerNames(task['负责人']).forEach((owner) => {
      acc[owner] = acc[owner] ?? [];
      acc[owner].push(task);
    });
    return acc;
  }, {});

  const owners = [
    ...OWNER_ORDER,
    ...Object.keys(grouped).filter((owner) => !OWNER_ORDER.includes(owner)).sort(),
  ];

  const p0Count = (data?.tasks ?? []).filter((t) => t['优先级']?.includes('P0')).length;

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editorTask?.任务?.trim()) return;

    setSaving(true);
    try {
      const { _record_id, ...fields } = editorTask;
      if (_record_id) {
        await updateAdminRecord('tasks', _record_id, fields);
      } else {
        await createAdminRecord('tasks', fields);
      }
      await refresh();
      setEditorTask(null);
    } finally {
      setSaving(false);
    }
  }

  function updateField(field: keyof Task, value: string) {
    setEditorTask((current) => (current ? { ...current, [field]: value } : current));
  }

  function toggleOwner(owner: string) {
    setEditorTask((current) => {
      if (!current) return current;
      const nextOwners = ownerNames(current['负责人']).filter((name) => name !== '未分配');
      const exists = nextOwners.includes(owner);
      const updated = exists
        ? nextOwners.filter((name) => name !== owner)
        : [...nextOwners, owner];
      return { ...current, 负责人: normalizeOwners(updated) || owner };
    });
  }

  if (loading) return <Skeleton />;
  if (!data?.tasks?.length && !editorTask) {
    return (
      <section className="w-full rounded-xl bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold tracking-wide text-foreground md:text-2xl">
            个人任务看板
          </h2>
          <button
            onClick={() => setEditorTask(emptyTask())}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            <PlusIcon className="h-4 w-4" />
            新增个人任务
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-xl font-extrabold tracking-wide text-foreground md:text-2xl">
          个人任务看板
        </h2>
        {p0Count > 0 && (
          <span className="rounded-full bg-[hsl(0_84%_96%)] px-2.5 py-0.5 text-xs font-semibold text-[hsl(0_72%_45%)]">
            {p0Count} 项 P0
          </span>
        )}
        <button
          onClick={() => setEditorTask(emptyTask())}
          className="ml-auto inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <PlusIcon className="h-4 w-4" />
          新增个人任务
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {owners.map((owner) => (
          <section key={owner} className="min-h-48 rounded-xl bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xl font-extrabold text-foreground">{owner}</h3>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {grouped[owner]?.length ?? 0} 项
              </span>
            </div>

            <div className="space-y-3">
              {(grouped[owner] ?? []).map((task, index) => (
                <button
                  key={`${task._record_id ?? task['任务']}-${index}`}
                  onClick={() => setEditorTask({ ...task })}
                  className="group block w-full rounded-lg border border-border bg-background p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:bg-[hsl(24_100%_97%)] hover:shadow-sm"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <p className="min-w-0 text-sm font-semibold leading-snug text-foreground group-hover:text-[hsl(25_95%_45%)]">
                      {task['任务']}
                    </p>
                    {task['状态'] === '已完成' && (
                      <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(152_69%_32%)]" />
                    )}
                  </div>

                  <div className="mb-2 flex flex-wrap items-center gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${getPriorityStyle(task['优先级'])}`}>
                      {task['优先级']}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${getStatusStyle(task['状态'])}`}>
                      {task['状态']}
                    </span>
                  </div>

                  <p className="mb-2 truncate text-xs text-muted-foreground">
                    {task['所属项目'] || '未绑定项目'}
                  </p>

                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      {formatDeadline(task['截止时间'])}
                    </span>
                    {task['产出物'] && <span className="truncate">{task['产出物']}</span>}
                  </div>

                  {task['备注'] && (
                    <p className="mt-2 border-t border-border pt-2 text-xs leading-relaxed text-muted-foreground">
                      {task['备注']}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      {editorTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <form
            onSubmit={handleSave}
            className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-lg bg-card shadow-xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-5">
              <div>
                <h3 className="text-2xl font-extrabold text-foreground">
                  {editorTask._record_id ? '编辑个人任务' : '新增个人任务'}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">保存后会同步到后端任务表和前台看板</p>
              </div>
              <button
                type="button"
                onClick={() => setEditorTask(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
                aria-label="关闭"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
              <label className="md:col-span-2">
                <span className="mb-1 block text-sm font-semibold">任务</span>
                <input
                  value={editorTask['任务']}
                  onChange={(event) => updateField('任务', event.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  placeholder="例如：整理新衍科技作战稿第一版"
                  required
                />
              </label>

              <label>
                <span className="mb-1 block text-sm font-semibold">所属项目</span>
                <input
                  value={editorTask['所属项目']}
                  onChange={(event) => updateField('所属项目', event.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  placeholder="新衍科技"
                />
              </label>

              <label>
                <span className="mb-1 block text-sm font-semibold">截止时间</span>
                <input
                  type="date"
                  value={editorTask['截止时间']}
                  onChange={(event) => updateField('截止时间', event.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </label>

              <div>
                <span className="mb-1 block text-sm font-semibold">负责人</span>
                <div className="flex flex-wrap gap-2">
                  {OWNER_ORDER.map((owner) => {
                    const checked = ownerNames(editorTask['负责人']).includes(owner);
                    return (
                      <button
                        key={owner}
                        type="button"
                        onClick={() => toggleOwner(owner)}
                        className={`rounded-md border px-3 py-2 text-sm font-semibold transition-colors ${
                          checked
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background hover:bg-accent'
                        }`}
                      >
                        {owner}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label>
                <span className="mb-1 block text-sm font-semibold">优先级</span>
                <select
                  value={editorTask['优先级']}
                  onChange={(event) => updateField('优先级', event.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  {PRIORITY_OPTIONS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-1 block text-sm font-semibold">状态</span>
                <select
                  value={editorTask['状态']}
                  onChange={(event) => updateField('状态', event.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  {STATUS_OPTIONS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-1 block text-sm font-semibold">产出物</span>
                <input
                  value={editorTask['产出物']}
                  onChange={(event) => updateField('产出物', event.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  placeholder="文档、报价表、会议纪要..."
                />
              </label>

              <label className="md:col-span-2">
                <span className="mb-1 block text-sm font-semibold">备注</span>
                <textarea
                  value={editorTask['备注']}
                  onChange={(event) => updateField('备注', event.target.value)}
                  className="min-h-28 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  placeholder="补充背景、依赖、验收标准"
                />
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
              <button
                type="button"
                onClick={() => setEditorTask(null)}
                className="rounded-md border border-border px-4 py-2 text-sm font-semibold hover:bg-accent"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-60"
              >
                <SaveIcon className="h-4 w-4" />
                {saving ? '保存中' : '保存'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
