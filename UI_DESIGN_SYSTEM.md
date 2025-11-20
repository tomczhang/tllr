# 🎯 贪婪猎人 (Greedy Hunter) UI 设计系统

## 📋 设计理念

**核心关键词**：
- 🌑 **沉浸式暗黑** (Immersive Dark)
- 📊 **数据驱动** (Data-Driven)
- 💼 **专业金融** (Professional Financial)
- 🚀 **现代科技感** (Tech-Modern)

**视觉隐喻**：类似彭博终端 (Bloomberg Terminal) 或现代加密货币交易所界面，强调数据清晰度和操作精确感。

---

## 🎨 色彩系统 (Color Palette)

### 背景色系统

```css
/* 全局背景 (Main Background) */
bg-slate-900      /* #0f172a - 极深蓝灰色，页面主底色 */

/* 模块背景 (Card/Panel Background) */
bg-slate-800      /* #1e293b - 卡片、侧边栏、面板 */
bg-slate-800/50   /* 半透明玻璃效果 */

/* 深层背景 (Input/Inner Panels) */
bg-slate-900      /* 输入框内部或二级容器 */
```

### 文字色系统

```css
/* 主标题/高亮数值 */
text-white        /* #ffffff - 最重要信息 */

/* 正文/标签 */
text-slate-300    /* #cbd5e1 - 表单标签、普通文本 */

/* 次要信息/提示 */
text-slate-400    /* #94a3b8 - 副标题、图标、辅助说明 */
text-slate-500    /* #64748b - 更弱的辅助文本 */
```

### 功能/状态色

```css
/* 成功/买入/贪婪时刻 */
text-emerald-500  /* #10b981 - 安全价格、买入信号 */
bg-emerald-600    /* 按钮背景 */

/* 危险/卖出/警告 */
text-red-400      /* #f87171 - 最大回撤、太贵信号 */
bg-red-500        /* 警告背景 */

/* 信息/科技感 */
text-blue-400     /* #60a5fa - 链接、选中状态、科技图标 */

/* 强调/特殊 */
text-purple-300   /* #d8b4fe - 评分、策略步骤、特殊高亮 */
```

---

## 📝 排版系统 (Typography)

### 字体家族

```css
/* 主字体 */
font-family: 'Inter', -apple-system, sans-serif;

/* 数字/代码 */
font-family: 'SF Mono', 'Monaco', 'Roboto Mono', monospace;
```

### 字号层级

| 用途 | Class | Size |
|------|-------|------|
| 巨型数值 | `text-4xl` / `text-5xl` | 36px / 48px |
| 页面标题 | `text-2xl` | 24px |
| 卡片标题 | `text-xs uppercase tracking-wider` | 12px |
| 正文/表格 | `text-sm` | 14px |
| 辅助文本 | `text-xs` | 12px |

### 使用原则

- **数字**：始终使用 `font-mono` 确保对齐
- **标题**：使用 `font-bold` + `tracking-tight`
- **卡片标题**：`uppercase` + `tracking-wider` 营造专业感

---

## 🧩 组件样式指南

### 1. 玻璃面板卡片

```tsx
<div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 hover:bg-slate-800 transition-all">
  {/* 内容 */}
</div>
```

**特点**：
- 半透明背景 (`/50`)
- 极细边框 (`border-slate-700`)
- 12px 圆角 (`rounded-xl`)
- 悬停变亮效果

**或使用工具类**：
```tsx
<div className="card-glass">
  {/* 内容 */}
</div>
```

### 2. 数据卡片

```tsx
<div className="card-data">
  <div className="card-data-header">
    <TrendingUp className="w-4 h-4 text-emerald-400" />
    总市值
  </div>
  <div className="card-data-value">
    $150,250.00
  </div>
  <span className="badge-success">+12.5%</span>
</div>
```

### 3. 输入框

```tsx
<div className="relative">
  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
  <input
    type="email"
    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
    placeholder="your@email.com"
  />
</div>
```

**或使用工具类**：
```tsx
<input className="input-dark" />
```

### 4. 按钮系统

```tsx
{/* 主按钮 */}
<button className="btn-primary">
  创建账号
</button>

{/* 次要按钮 */}
<button className="btn-secondary">
  取消
</button>

{/* 危险按钮 */}
<button className="btn-danger">
  删除
</button>

{/* 幽灵按钮 */}
<button className="btn-ghost">
  查看更多
</button>
```

### 5. 标签/徽章

```tsx
<span className="badge-success">+12.5%</span>
<span className="badge-danger">-5.2%</span>
<span className="badge-info">信息</span>
<span className="badge-neutral">默认</span>
<span className="badge-accent">强调</span>
```

### 6. 数据表格

```tsx
<table className="w-full">
  <thead>
    <tr>
      <th className="table-header text-left px-6">股票代码</th>
      <th className="table-header text-right px-6">当前价格</th>
    </tr>
  </thead>
  <tbody>
    <tr className="table-row">
      <td className="table-cell font-mono font-bold text-white">AAPL</td>
      <td className="table-cell text-right font-mono">$150.25</td>
    </tr>
  </tbody>
</table>
```

---

## ✨ 特殊视觉效果

### 光晕效果 (Glow)

**成功光晕（绿色）**：
```tsx
<div className="glow-wrapper glow-success border-emerald-500/50 shadow-glow-emerald">
  <div className="text-3xl font-bold text-emerald-400">
    贪婪时刻
  </div>
</div>
```

**危险光晕（红色）**：
```tsx
<div className="glow-wrapper glow-danger border-red-500/50 shadow-glow-red">
  <div className="text-3xl font-bold text-red-400">
    太贵了
  </div>
</div>
```

### 按钮光晕

```tsx
<button className="bg-emerald-600 hover:bg-emerald-500 shadow-lg hover:shadow-emerald-500/20 transition-all active:scale-95">
  立即购买
</button>
```

### 边框发光

```css
/* Emerald 边框发光 */
.border-glow-emerald {
  border: 1px solid rgba(16, 185, 129, 0.5);
  box-shadow: 0 0 30px rgba(16, 185, 129, 0.1);
}

/* Red 边框发光 */
.border-glow-red {
  border: 1px solid rgba(248, 113, 113, 0.5);
  box-shadow: 0 0 30px rgba(248, 113, 113, 0.1);
}
```

---

## 🎭 图标系统

**库**：Lucide React

**尺寸**：
- 小：`w-4 h-4` (16px)
- 中：`w-5 h-5` (20px)
- 大：`w-6 h-6` (24px)

**颜色**：
```tsx
<Activity className="w-5 h-5 text-emerald-400" />  {/* 成功 */}
<AlertCircle className="w-5 h-5 text-red-400" />   {/* 危险 */}
<Info className="w-5 h-5 text-blue-400" />         {/* 信息 */}
<Settings className="w-5 h-5 text-slate-500" />    {/* 默认 */}
```

---

## 📐 布局系统

### 侧边栏布局

```tsx
<div className="flex h-screen">
  {/* 侧边栏 */}
  <aside className="w-80 bg-slate-800 border-r border-slate-700 p-6">
    {/* 输入控件 */}
  </aside>
  
  {/* 主内容 */}
  <main className="flex-1 bg-slate-900 p-8 overflow-y-auto">
    {/* 数据展示 */}
  </main>
</div>
```

### 卡片网格

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <div className="card-data">...</div>
  <div className="card-data">...</div>
  <div className="card-data">...</div>
  <div className="card-data">...</div>
</div>
```

---

## 🛠️ 快速开始

### 1. 安装依赖

```bash
npm install tailwindcss tailwindcss-animate lucide-react
```

### 2. 引入全局样式

```tsx
// main.tsx
import './styles/globals.css'
```

### 3. 使用组件

所有样式类已在 `globals.css` 的 `@layer components` 中定义，可以直接使用：

```tsx
<div className="card-glass">
  <div className="card-data-header">标题</div>
  <div className="card-data-value">$150.25</div>
  <span className="badge-success">+12%</span>
</div>
```

### 4. 查看完整示例

访问 `/showcase` 路由查看 `UIShowcase.tsx` 中的完整组件示例。

---

## 📚 工具类速查

| 功能 | 类名 | 说明 |
|------|------|------|
| 玻璃卡片 | `card-glass` | 半透明玻璃面板 |
| 数据卡片 | `card-data` | 展示核心数值 |
| 主按钮 | `btn-primary` | 绿色主操作按钮 |
| 次按钮 | `btn-secondary` | 灰色次要按钮 |
| 危险按钮 | `btn-danger` | 红色警告按钮 |
| 成功标签 | `badge-success` | 绿色成功徽章 |
| 危险标签 | `badge-danger` | 红色危险徽章 |
| 信息标签 | `badge-info` | 蓝色信息徽章 |
| 输入框 | `input-dark` | 暗黑风格输入 |
| 表格头 | `table-header` | 数据表格表头 |
| 表格行 | `table-row` | 数据表格行 |
| Section 标题 | `section-title` | 区块标题 |
| 成功光晕 | `glow-success` | 绿色背景光晕 |
| 危险光晕 | `glow-danger` | 红色背景光晕 |

---

## 🎯 设计原则

1. **保持一致性**：所有卡片使用相同的圆角、边框、间距
2. **数字用等宽**：价格、数量、百分比都使用 `font-mono`
3. **强调层次**：重要信息用 `white`，次要用 `slate-300/400`
4. **光晕点缀**：只在核心结果卡片使用光晕效果
5. **动画克制**：过渡动画保持在 200-300ms
6. **响应式优先**：所有组件支持移动端

---

## 📖 参考资源

- [Tailwind CSS 文档](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)
- [shadcn/ui](https://ui.shadcn.com)
- [Inter 字体](https://rsms.me/inter/)

---

**版本**: v1.0  
**更新日期**: 2025-11-20  
**维护团队**: 贪婪猎人开发组
