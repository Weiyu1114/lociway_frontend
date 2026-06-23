# LociWay 动态项目驾驶舱 - 需求拆解文档

## 产品概述

- **产品类型**: 项目管理驾驶舱/仪表盘
- **场景类型**: <scene_type>prototype-dashboard</scene_type>
- **目标用户**: LociWay 乐沩核心团队成员（Louis、Rucia、Jason），用于快速掌握项目全局状态
- **核心价值**: 一站式查看业务线进展、项目机会、本周任务和资料入口，数据与飞书多维表格同步
- **界面语言**: 中文
- **主题偏好**: 浅色
- **导航模式**: Dashboard Header（品牌标题 + 项目简介副标题）

---

## 页面结构

> **说明**：Dashboard 为单页场景，以下为页面区块结构

**页面文件**: `DashboardPage.tsx`

| 区块名称 | 区块说明 |
|---------|---------|
| Header | 左侧：LociWay 乐沩 logo/标题 + 项目简介（dashboard 中"项目简介"模块内容）；右侧：数据更新时间 + 「🔄 刷新数据」按钮 + 「打开多维表格」按钮 |
| 当前阶段卡片 | 大卡片展示当前阶段标题与内容（dashboard 中"当前阶段"模块） |
| 本周重点 | 列表展示本周重点事项（dashboard 中"本周重点"模块，内容为编号列表） |
| 三条业务线 | 三张横向排列卡片（响应式移动端纵向），颜色规则：品牌 CMO→蓝色系、小 b 分销→绿色系、二手翻新销售→橙色系；点击跳转飞书分表 |
| 重点机会 | 列表形式展示项目机会，含机会名称、业务线、客户、预计金额、成交概率、状态、下一步动作、负责人；状态颜色：重点跟进=红色/粉色，探索=灰色 |
| 本周任务 | 表格/列表展示任务，按优先级排序；优先级标签：P0=红色、P1=黄色、P2=灰色；状态标签：进行中=蓝色、待开始=灰色；截止时间显示相对日期 |
| 资料入口 | 卡片网格展示资料，类型标签颜色：产品文档=蓝色、运营模板=绿色、沟通模板=橙色、管理模板=灰色 |
| 底部快捷入口 | 4 个跳转按钮（业务线总览/项目机会池/任务推进/资料与模板）+ 主按钮「打开多维表格总盘」 |
| 底部说明 | 灰色小字说明数据来源 |

---

## 数据分析

### 数据文件概览
- **文件**: `lociway_data.json`（已存放于 `shared/static/lociway_data.json`）
- **字段**: meta（base_url, updated_at）、business（10字段×3条）、opportunities（13字段×2条）、tasks（8字段×4条）、materials（8字段×4条）、dashboard（6字段×10条）
- **数据量**: 共 23 条业务记录 + 10 条 dashboard 模块记录
- **维度与指标**:
  - 分类维度：业务线（品牌 CMO / 小 b 分销 / 二手翻新销售）、状态、优先级、类型
  - 数值指标：预计金额、成交概率、任务数量、排序

### 指标规划
| 指标名称 | 计算方式 | 数据字段 |
|---------|---------|---------|
| 活跃业务线 | 统计 business 数组中状态为"进行中"的记录数 | business[].状态 |
| 管线机会数 | 统计 opportunities 数组总记录数 | opportunities.length |
| P0 紧急任务 | 统计 tasks 数组中优先级为"P0 本周必须"的记录数 | tasks[].优先级 |
| 管线总金额 | 汇总 opportunities 中有明确金额记录的预计金额 | opportunities[].预计金额 |
| 资料总数 | 统计 materials 数组总记录数 | materials.length |

### 图表规划
| 图表名称 | 图表类型 | 使用字段 | 分析目的 |
|---------|---------|---------|---------|
| 任务优先级分布 | 环形图 | tasks[].优先级 | 直观展示本周任务紧急程度占比 |
| 业务线状态概览 | 横向条形图 | business[].业务线, business[].状态, business[].当前阶段 | 对比三条业务线的推进阶段与状态 |
| 任务状态分布 | 进度环 | tasks[].状态 | 展示进行中 vs 待开始的任务完成进度 |
| 机会管线概览 | 表格卡片 | opportunities 全部字段 | 结构化展示每个机会的关键信息与风险评估 |

---

## AI 洞察方向

- **任务负载集中度**: ` Louis 承担了 3/4 的 P0 任务（3 条中 2 条主负责 + 1 条协同）| 建议关注任务分配均衡性，避免单人瓶颈`
- **管线成熟度风险**: `2 个机会中仅 1 个有明确金额（6.8 万），另一个金额待定且成交概率低-中 | 建议加速 Lucas refurb 资源的初步验证，同时扩大机会池`
- **业务线进展梯度**: `品牌 CMO 已进入"产品化中"，而小 b 分销仍在"探索"、二手翻新在"初聊" | 建议以品牌 CMO 为标杆，将产品化经验复用到其他业务线`

---

## 功能列表

- **Dashboard 整体功能**:
  - **页面目标**: 一站式展示 LociWay 项目全局状态，支持团队快速了解本周重点、业务线进展和任务安排
  - **功能点**:
    - **动态数据加载**: 页面加载时从 API 获取 `lociway_data.json` 数据，支持 Loading 骨架屏和错误重试
    - **手动刷新**: 点击「🔄 刷新数据」按钮重新 fetch 数据并更新所有模块
    - **自动定时刷新**: 每 5 分钟自动重新获取数据，保持信息时效性
    - **业务线色彩编码**: 三条业务线卡片按预设颜色规则（蓝/绿/橙）渲染，状态标签按语义着色
    - **任务优先级排序与着色**: 任务列表按 P0→P1→P2 排序，优先级和状态标签使用对应颜色
    - **外链跳转**: 各模块卡片/列表项点击后在新标签页打开对应飞书多维表格分表链接

---

## 设计约束备忘

| 约束项 | 用户要求 |
|-------|---------|
| 整体背景 | 浅灰或白色（#f8f9fa 或 #ffffff） |
| 卡片样式 | 白色背景、圆角 rounded-xl、轻微阴影 shadow-sm、hover 时 shadow-md |
| 字体 | 简洁无衬线，标题 font-semibold 或 font-bold |
| 间距 | section 之间 py-8 或 py-10 |
| 链接行为 | 所有链接 target="_blank" 新标签页打开 |
| 加载状态 | 骨架屏或 Loading 提示 |
| 错误处理 | API 失败时显示错误提示和重试按钮 |
| 响应式 | 移动端友好，三列卡片在移动端改为纵向排列 |
| 数据硬编码 | ❌ 禁止，必须通过 API 动态获取 |

-------

# UI 设计指南

> **场景类型**: <scene_type>prototype-dashboard</scene_type>（数据可视化设计）
> **确认检查**: 本指南适用于 LociWay 乐沩动态项目驾驶舱仪表盘。单页数据看板，包含业务线管理、机会管线、任务追踪和资料入口。

> ℹ️ Section 1-2 为设计意图与决策上下文。Code agent 实现时以 Section 3 及之后的具体参数为准。

## 1. Design Archetype (设计原型)

### 1.1 内容理解
- **目标用户**: LociWay 核心三人团队（Louis、Rucia、Jason），早期创业阶段，每日快速对齐项目进展
- **核心目的**: 一站式掌握业务线进展、机会管线、本周任务和资料入口，替代在飞书多维表格中反复翻找
- **期望情绪**: 清晰可控、务实高效、团队对齐感
- **数据特性**: 3 条业务线（色彩编码）、2 个管线机会、4 条任务（优先级排序）、4 份资料、5 个 KPI 指标；信息密度中等偏高，以状态追踪为主

### 1.2 设计语言
- **Aesthetic Direction**: 温暖专业的运营指挥台 — 冷灰基底承载信息密度，暖橙点缀传递创业团队的行动力和温度
- **Visual Signature**:
  1. 三条业务线色彩编码（钢蓝 / 翠绿 / 暖橙），左侧 4px 色条作为视觉锚点
  2. KPI 卡片数值使用 `text-3xl font-bold` + header 色突出
  3. 状态/优先级胶囊标签，低饱和背景 + 深色文字，信息密度高但不刺眼
  4. 卡片 hover 时阴影从 `shadow-sm` 升至 `shadow-md`，暗示可交互
  5. 每个 section 标题使用 `text-xs font-bold uppercase tracking-widest` 作为统一节奏标记
- **Emotional Tone**: 务实 · 清晰 — 没有多余装饰，每个像素都在传递项目状态信息
- **Design Style**: Soft Blocks 柔色块 — 早期创业团队需要亲切而不失专业的氛围，`rounded-xl` 圆角 + `shadow-sm` 轻阴影 + 充裕间距创造有序的呼吸感


## 2. Design Principles (设计理念)

1. **信息即装饰** — 不添加纯装饰元素，通过业务线色条、状态胶囊标签、KPI 大数字建立视觉节奏
2. **扫描优先于阅读** — 团队每日快速浏览，关键信息（状态、优先级、金额）必须在 1 秒内被捕获
3. **色彩编码即导航** — 蓝/绿/橙三色贯穿业务线卡片、机会标签、资料类型，形成无需思考的颜色-业务映射
4. **渐进式信息密度** — 顶部 KPI 概览 → 中部结构化卡片 → 底部明细列表，从宏观到微观逐层展开
5. **静默的时效感** — 右上角更新时间戳 + 刷新按钮 + 5 分钟自动刷新，让团队信任数据的鲜活度

## 3. Color System (色彩系统)

> 选用 **EmberSteel** 配色方案。
> **⚠️ 精确色值规则**：以下 HSL 值为精确定义，禁止近似替换或自行调整。

**配色设计理由**：LociWay 是早期创业项目，需要专业但不冰冷的视觉氛围。EmberSteel 的冷灰基底（hsl(210 28% 98%)）承载高信息密度而不显杂乱，暖橙 primary（hsl(25 95% 53%)）传递行动力和创业热情，钢蓝 header（hsl(228 28% 27%)）提供沉稳的信任锚点。

### 3.1 主题颜色

| 角色 | CSS 变量 | Tailwind Class | HSL 值 | 设计说明 |
|-----|---------|----------------|--------|---------|
| bg | `--background` | `bg-background` | hsl(210 28% 98%) | 冷灰基底，减少视觉干扰，承载高密度信息 |
| surface | `--card` | `bg-card` | hsl(0 0% 100%) | 纯白卡片，与冷灰背景形成微妙层次 |
| header | `--header` | `bg-[header]` | hsl(228 28% 27%) | 深钢蓝，Dashboard Header 背景，沉稳锚点 |
| text | `--foreground` | `text-foreground` | hsl(232 32% 26%) | 深蓝灰正文，比纯黑更柔和 |
| textMuted | `--muted-foreground` | `text-muted-foreground` | hsl(229 16% 47%) | 中灰，辅助说明、标签、时间戳 |
| primary | `--primary` | `bg-primary` | hsl(25 95% 53%) | 暖橙，主行动按钮（刷新、打开表格） |
| accent | `--accent` | `bg-accent` | hsl(24 100% 97%) | 极浅暖桃，hover/focus 状态背景、骨架屏 |
| border | `--border` | `border-border` | hsl(215 29% 94%) | 浅灰蓝边框，卡片与分隔线 |

> **Token 速查**: `primary` = 主交互行动（刷新按钮、打开表格按钮）；`accent` = hover/focus 状态反馈 + 骨架屏占位；`muted` = 静态非交互区域（说明文字、时间戳、次要标签）

### 3.2 业务线与语义颜色

> 用户指定了业务线色彩编码和状态标签规则，以下为精确定义。

**业务线色彩编码**：

| 业务线 | 色条/边框 | 标题文字 | 浅背景（标签/高亮） |
|-------|----------|---------|-----------------|
| 品牌 CMO | hsl(217 91% 60%) | hsl(217 91% 45%) | hsl(217 91% 96%) |
| 小 b 分销 | hsl(152 69% 42%) | hsl(152 69% 32%) | hsl(152 69% 95%) |
| 二手翻新销售 | hsl(25 95% 53%) | hsl(25 85% 42%) | hsl(25 95% 96%) |

**状态标签颜色**：

| 状态 | 背景 | 文字 | 适用场景 |
|-----|------|------|---------|
| 进行中 | hsl(217 91% 96%) | hsl(217 91% 40%) | 业务线状态、任务状态 |
| 待沟通 | hsl(25 95% 96%) | hsl(25 85% 42%) | 业务线状态 |
| 探索 | hsl(220 14% 95%) | hsl(229 16% 47%) | 业务线状态、机会状态 |
| 待开始 | hsl(220 14% 95%) | hsl(229 16% 47%) | 任务状态 |
| 重点跟进 | hsl(0 84% 96%) | hsl(0 72% 45%) | 机会状态 |

**优先级标签颜色**：

| 优先级 | 背景 | 文字 |
|-------|------|------|
| P0 本周必须 | hsl(0 84% 96%) | hsl(0 72% 45%) |
| P1 近期推进 | hsl(45 100% 94%) | hsl(40 80% 35%) |
| P2 暂存 | hsl(220 14% 95%) | hsl(229 16% 47%) |

**资料类型标签颜色**：

| 类型 | 背景 | 文字 |
|-----|------|------|
| 产品文档 | hsl(217 91% 96%) | hsl(217 91% 40%) |
| 运营模板 | hsl(152 69% 95%) | hsl(152 69% 32%) |
| 沟通模板 | hsl(25 95% 96%) | hsl(25 85% 42%) |
| 管理模板 | hsl(220 14% 95%) | hsl(229 16% 47%) |

### 3.3 图表配色

| 用途 | 颜色 | 说明 |
|-----|-----|-----|
| 系列色 1 | hsl(228 28% 45%) | 钢蓝，与 header 色同源，用于主数据系列 |
| 系列色 2 | hsl(25 85% 55%) | 暖橙，与 primary 同源，用于次要系列 |
| 系列色 3 | hsl(152 55% 45%) | 翠绿，与小 b 分销色同源，用于第三系列 |
| 上升/正向 | hsl(142 71% 45%) | 固定语义色 |
| 下降/负向 | hsl(0 72% 51%) | 固定语义色 |

## 4. Typography (字体排版)
- **Heading**: -apple-system, BlinkMacSystemFont, "PingFang SC", "Noto Sans SC", "Segoe UI", system-ui, sans-serif
- **Body**: -apple-system, BlinkMacSystemFont, "PingFang SC", "Noto Sans SC", "Segoe UI", system-ui, sans-serif
- **数字专用**: "SF Mono", "Cascadia Code", "Roboto Mono", "Menlo", monospace（用于 KPI 数值和金额）
- **字体导入**: 使用系统字体栈，禁止引入 Google Fonts

## 5. Page Structure (页面结构)

> **重要**：Dashboard 是单页场景，不需要独立的 Layout 组件、Sidebar 或 Topbar 导航。以下是完整的页面结构，Header 是页面的一部分，直接输出即可。

### 5.1 页面骨架

```html
<body class="min-h-screen bg-[hsl(210_28%_98%)]">
  <!-- Dashboard Header: 通栏，深钢蓝渐变 -->
  <header class="w-full relative overflow-hidden bg-gradient-to-r from-[hsl(228_28%_27%)] to-[hsl(228_28%_32%)]">
    <div class="relative max-w-[1400px] mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
      <div>
        <h1 class="text-xl font-extrabold text-white tracking-tight">LociWay 乐沩</h1>
        <p class="text-sm font-light text-white/70 mt-0.5">用小核心团队连接外部增长资源网络，帮助出海品牌先判断、再验证、后放大。</p>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-xs font-medium text-white/60 bg-white/10 rounded-full px-3 py-1">更新于 [meta.updated_at]</span>
        <button class="text-sm font-medium text-white bg-white/15 hover:bg-white/25 rounded-lg px-3 py-1.5 transition-colors">🔄 刷新数据</button>
        <a href="[meta.base_url]" target="_blank" class="text-sm font-medium text-[hsl(228_28%_27%)] bg-white hover:bg-white/90 rounded-lg px-3 py-1.5 transition-colors">打开多维表格</a>
      </div>
    </div>
  </header>

  <main class="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8">

    <!-- KPI 指标卡片区 -->
    <section class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <!-- 5 个 KPI Card: 活跃业务线 / 管线机会数 / P0紧急任务 / 管线总金额 / 资料总数 -->
    </section>

    <!-- 当前阶段 + 本周重点（双栏） -->
    <section class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 当前阶段大卡片 -->
      <!-- 本周重点列表卡片 -->
    </section>

    <!-- 三条业务线 -->
    <section class="mb-8">
      <h2 class="text-xs font-bold text-[hsl(229_16%_47%)] uppercase tracking-widest mb-4">业务线总览</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- 3 张业务线卡片，左侧 4px 色条 -->
      </div>
    </section>

    <!-- 重点机会 -->
    <section class="mb-8">
      <h2 class="text-xs font-bold text-[hsl(229_16%_47%)] uppercase tracking-widest mb-4">重点机会</h2>
      <!-- 机会列表卡片 -->
    </section>

    <!-- 本周任务 -->
    <section class="mb-8">
      <h2 class="text-xs font-bold text-[hsl(229_16%_47%)] uppercase tracking-widest mb-4">本周任务</h2>
      <!-- 任务表格卡片 -->
    </section>

    <!-- 资料入口 -->
    <section class="mb-8">
      <h2 class="text-xs font-bold text-[hsl(229_16%_47%)] uppercase tracking-widest mb-4">资料入口</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- 4 张资料卡片 -->
      </div>
    </section>

    <!-- AI 洞察 -->
    <section class="mb-8">
      <!-- AI 洞察卡片，左侧 3px primary 色边框 -->
    </section>

    <!-- 底部快捷入口 -->
    <section class="mb-6">
      <div class="flex flex-wrap items-center gap-3">
        <!-- 4 个 outline 按钮 + 1 个 primary 主按钮 -->
      </div>
    </section>

    <!-- 底部说明 -->
    <footer class="text-center py-4">
      <p class="text-xs text-[hsl(229_16%_47%)]">数据来源于飞书多维表格，点击刷新可获取最新数据。日常数据维护请在飞书多维表格中操作。</p>
    </footer>
  </main>
</body>
```

### 5.2 关键样式参数

| 元素 | 样式 | 说明 |
|-----|-----|-----|
| 页面背景 | `bg-[hsl(210_28%_98%)]` | EmberSteel bg 色，冷灰基底 |
| 内容容器 | `max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8` | 7 个内容区块，需 1400px 宽度容纳 |
| Header 区域 | `w-full bg-gradient-to-r from-[hsl(228_28%_27%)] to-[hsl(228_28%_32%)]`，内部 `relative max-w-[1400px] mx-auto px-4 md:px-6 py-4 flex items-center justify-between` | 通栏全宽，微渐变增加层次，标题 `font-extrabold tracking-tight` + 副标题 `font-light`，右侧元数据胶囊 + 操作按钮 |
| Section 标题 | `text-xs font-bold text-[hsl(229_16%_47%)] uppercase tracking-widest mb-4` | 统一的 section 节奏标记 |
| 卡片间距 | `gap-4` ~ `gap-6` | 卡片之间间距 |
| 区块间距 | `mb-8` | section 之间间距 |

### 5.3 导航规则

- ❌ **禁止** 添加 Sidebar
- ❌ **禁止** 添加 Topbar 导航（Header 已包含品牌标题和操作按钮）
- ❌ **禁止** 使用 `sticky` 或 `fixed` 定位 Header（单页无需固定）
- ✅ Header 右侧包含：更新时间胶囊 + 刷新按钮 + 打开多维表格按钮

## 6. Components (组件指南)

### Dashboard Header
- **通栏**: `w-full`，无圆角，内部内容与内容容器同宽（`max-w-[1400px] mx-auto`）
- **背景方案**: 深钢蓝微渐变 `bg-gradient-to-r from-[hsl(228_28%_27%)] to-[hsl(228_28%_32%)]`，无额外装饰层
- **布局**: Flex，标题区左对齐，右侧操作区
- **标题**: `text-xl`，`font-extrabold` + `tracking-tight`，`text-white`
- **副标题**: `text-sm`，`font-light`，`text-white/70`，与标题形成明显字重反差
- **更新时间**: `text-xs font-medium`，`text-white/60`，胶囊样式 `bg-white/10 rounded-full px-3 py-1`
- **刷新按钮**: `text-sm font-medium`，`text-white`，`bg-white/15 hover:bg-white/25 rounded-lg px-3 py-1.5`
- **打开表格按钮**: `text-sm font-medium`，`text-[hsl(228_28%_27%)]`，`bg-white hover:bg-white/90 rounded-lg px-3 py-1.5`

### Header 设计原则
- **打破扁平感**: 使用 `from-[hsl(228_28%_27%)] to-[hsl(228_28%_32%)]` 微渐变，避免纯色平铺
- **强调视觉对比**: 标题 `font-extrabold` vs 副标题 `font-light`，白色 vs 白色/70%
- **结构化元数据**: 更新时间用胶囊标签、操作按钮用圆角矩形，右对齐排列

### 指标卡片 (KPI Card)
- **数值**: `text-2xl` ~ `text-3xl` `font-bold`，使用 `text-foreground`，金额类加 `font-mono`
- **标签**: `text-sm`，使用 `text-muted-foreground`
- **趋势/补充**: `text-xs`，语义色（如 P0 任务数用 `text-[hsl(0_72%_45%)]`）
- **背景**: `bg-card`
- **圆角**: `rounded-xl`
- **内边距**: `p-5`
- **阴影**: `shadow-sm`
- **Hover**: `hover:shadow-md transition-shadow`
- **布局**: `grid grid-cols-2 md:grid-cols-5 gap-4`

### 当前阶段卡片
- **背景**: `bg-card`，圆角 `rounded-xl`，阴影 `shadow-sm`
- **内边距**: `p-6`
- **标题**: `text-lg font-bold text-foreground`
- **内容**: `text-base text-foreground leading-relaxed`
- **标签**: 左上角可选 accent 色小标签 `bg-[hsl(24_100%_97%)] text-[hsl(25_85%_42%)] text-xs font-medium rounded-full px-2.5 py-0.5`

### 本周重点卡片
- **背景**: `bg-card`，圆角 `rounded-xl`，阴影 `shadow-sm`
- **内边距**: `p-6`
- **标题**: `text-lg font-bold text-foreground`
- **列表项**: `flex items-start gap-3 py-2`，编号使用 `text-sm font-bold text-primary`，内容使用 `text-sm text-foreground`
- **分隔线**: 列表项之间 `border-b border-border`（最后一项无）

### 业务线卡片
- **背景**: `bg-card`，圆角 `rounded-xl`，阴影 `shadow-sm`
- **左边框**: `border-l-4`，颜色按业务线：品牌 CMO `border-[hsl(217_91%_60%)]`，小 b 分销 `border-[hsl(152_69%_42%)]`，二手翻新 `border-[hsl(25_95%_53%)]`
- **内边距**: `p-5`
- **Hover**: `hover:shadow-md transition-shadow cursor-pointer`
- **标题**: `text-base font-bold`，颜色按业务线（见语义颜色表）
- **字段**: 定位（`text-sm text-muted-foreground`）、当前阶段、负责人、本周目标（`text-sm text-foreground`）
- **状态标签**: 胶囊样式，颜色见语义颜色表
- **可点击**: 整卡跳转飞书分表，`target="_blank"`

### 重点机会列表
- **容器**: `bg-card rounded-xl shadow-sm p-6`
- **每条机会**: `flex flex-wrap items-center gap-3 py-3 border-b border-border`（最后一条无 border）
- **机会名称**: `text-sm font-semibold text-foreground`
- **业务线标签**: 使用对应业务线浅背景色 + 文字色（见语义颜色表）
- **金额**: `text-sm font-bold font-mono text-foreground`
- **状态标签**: 胶囊样式 `rounded-full px-2.5 py-0.5 text-xs font-medium`，颜色见语义颜色表
- **Hover**: `hover:bg-[hsl(24_100%_97%)] transition-colors cursor-pointer`
- **可点击**: 整行跳转飞书分表

### 本周任务表格
- **容器**: `bg-card rounded-xl shadow-sm overflow-hidden`
- **表头**: `bg-[hsl(210_28%_96%)] px-5 py-3`，文字 `text-xs font-bold text-muted-foreground uppercase tracking-wider`
- **表格行**: `px-5 py-3 border-b border-border`，`hover:bg-[hsl(24_100%_97%)] transition-colors`
- **任务名**: `text-sm font-medium text-foreground`
- **优先级标签**: 胶囊样式，颜色见优先级颜色表
- **状态标签**: 胶囊样式，颜色见状态颜色表
- **截止时间**: `text-sm text-muted-foreground`，显示为相对日期（如"6月27日"）
- **可点击**: 整行跳转飞书分表

### 资料入口卡片
- **背景**: `bg-card`，圆角 `rounded-xl`，阴影 `shadow-sm`
- **内边距**: `p-5`
- **Hover**: `hover:shadow-md transition-shadow cursor-pointer`
- **资料名称**: `text-sm font-semibold text-foreground`
- **类型标签**: 胶囊样式，颜色见资料类型颜色表
- **其他字段**: `text-xs text-muted-foreground`（对应业务线、用途、负责人）
- **可点击**: 整卡跳转飞书分表

### AI 洞察块
- **容器**: `bg-card rounded-xl shadow-sm`，左侧 3px 边框 `border-l-[3px] border-primary`
- **内边距**: `p-5`
- **图标**: 💡 或 📊 emoji，`text-lg`
- **洞察标题**: `text-sm font-bold text-foreground`
- **数据支撑**: `text-sm text-foreground`
- **建议**: `text-sm text-muted-foreground`
- **多条洞察**: 之间用 `border-b border-border` 分隔

### 底部快捷入口
- **Outline 按钮**: `border border-border text-foreground hover:bg-accent hover:text-accent-foreground rounded-lg px-4 py-2 text-sm font-medium transition-colors`
- **Primary 主按钮**（打开多维表格总盘）: `bg-primary text-white hover:bg-primary/90 rounded-lg px-4 py-2 text-sm font-medium transition-colors`
- **布局**: `flex flex-wrap items-center gap-3`

### 骨架屏 (Skeleton)
- **占位块**: `bg-[hsl(24_100%_97%)] rounded-lg animate-pulse`
- **KPI 骨架**: 模拟数值行 + 标签行
- **卡片骨架**: 模拟标题行 + 2-3 行内容行
- **表格骨架**: 模拟表头行 + 3-4 行数据行

### 错误状态
- **容器**: `bg-card rounded-xl shadow-sm p-8 text-center`
- **图标**: ⚠️ emoji 或 SVG
- **提示文字**: `text-base font-medium text-foreground`
- **重试按钮**: 使用 Primary 按钮样式

## 7. Visual Effects (视觉效果)

- **圆角**: `rounded-xl (12px)` 全局卡片统一；胶囊标签 `rounded-full`；按钮 `rounded-lg (8px)`
- **阴影**: `shadow-sm` 默认卡片状态；`shadow-md` hover 状态；Header 无阴影
- **间距**: 卡片间 `gap-4`；区块间 `mb-8 (32px)`；卡片内 `p-5` ~ `p-6`；KPI 区 `gap-4`
- **装饰手法**: 业务线卡片左侧 4px 色条（三种颜色对应三条业务线）；AI 洞察块左侧 3px primary 色边框；section 标题使用 `uppercase tracking-widest` 小号大写字风格作为节奏标记

## 8. Flexibility Note (灵活性说明)

> **Dashboard 通常为单页或少量页面**，核心参数在设计指南生成时已确定。
>
> **允许的微调范围**（code agent 可自行判断）：
> - 响应式断点适配（移动端边距可减小，三列卡片改为单列）
> - KPI 卡片列数：移动端 2 列，桌面端 5 列
> - 当前阶段 + 本周重点：移动端单列堆叠，桌面端双栏
> - 资料卡片：移动端 1 列 → 平板 2 列 → 桌面 4 列
> - 任务表格：移动端可改为卡片列表形式，隐藏次要列
> - AI 洞察条数：根据实际洞察内容决定（2-4 条）
> - 底部快捷入口按钮：移动端可换行排列
>
> **禁止的随意变更**：
> - ❌ 添加 Sidebar/Topbar
> - ❌ 不同区块使用不同的圆角/阴影风格
> - ❌ 修改业务线色彩编码（蓝/绿/橙为用户指定）
> - ❌ 图表配色与整体配色不协调
> - ❌ 使用 Tailwind 预设色板（如 `bg-blue-500`）替代设计系统颜色

## 9. Constraints (禁止事项)
> 通用约束参见「通用约束」。以下为 Dashboard 特有：
- ❌ 未经用户要求添加 Sidebar / Topbar
- ❌ 捏造数据：禁止使用 Math.random() 生成、凭空编造数值、或虚构不存在的指标，所有数据必须来自 `lociway_data.json`
- ❌ 硬编码数据：所有业务线、机会、任务、资料数据必须通过 API 动态获取，禁止写入前端代码
- ❌ 修改业务线颜色映射：品牌 CMO = 蓝色系，小 b 分销 = 绿色系，二手翻新销售 = 橙色系（用户强制指定）
- ❌ 使用 `sticky` / `fixed` 定位 Header（单页 Dashboard 无需固定导航）
- ❌ 链接在当前页打开：所有跳转飞书的链接必须 `target="_blank"`