# BUGFIX · agent-mail 修复日志

> 本文档记录部署到 https://agent-mail.mixlab.top 后发现并修复的所有 bug。
> 顺序按发现时间倒序排。每条包含:**症状 / 根因 / 修复 / 涉及文件**。
>
> 全部修复均已推送 main,Vercel 自动部署。

---

## 1. Vercel 构建失败 · `P1002` advisory lock 超时

**时间**:2026-06-27
**提交**:`6e24339` + `68efbf0`

### 症状
```
14:15:00.022 Error: P1002
14:15:00.022 The database server was reached but timed out.
14:15:00.022 Context: Timed out trying to acquire a postgres advisory lock
            (SELECT pg_advisory_lock(72707369)). Timeout: 10000ms.
```
Vercel build 在 `prisma migrate deploy` 阶段卡 10 秒后失败,exit code 1。

### 根因(双重)
1. **真正的触发原因**:之前某次构建失败,在 Neon 数据库里留下了孤儿 advisory lock。
   直接 query `pg_locks`:
   ```
   {"pid":1058, "locktype":"advisory", "granted":true}  ← 占着锁
   ```
   `pid=1058` 是之前那次 `prisma migrate deploy` 中断后没释放的 session。
2. **脆弱性放大**:Neon `-pooler` endpoint 走 pgBouncer 事务模式,advisory lock 是 session 级,
   一旦在事务模式中途锁丢失,后续重试会在不可预测状态下挂起。

### 修复
- **立即**:手动 `SELECT pg_terminate_backend(1058)` 杀掉孤儿 session,锁立即释放。
- **长期**:`vercel.json` 的 `buildCommand` 在 `prisma migrate deploy` 之前临时把 `DATABASE_URL`
  替换为 `DIRECT_DATABASE_URL`(Neon direct endpoint,无 `-pooler` 后缀),
  `next build` 阶段仍用回 pooler。

```json
"buildCommand": "prisma generate && DATABASE_URL=\"$DIRECT_DATABASE_URL\" prisma migrate deploy && next build"
```

### 用户操作
在 Vercel Dashboard 加环境变量(与 `DATABASE_URL` 相同但 hostname 去掉 `-pooler`):
```
DIRECT_DATABASE_URL=postgresql://neondb_owner:npg_zYD2KelVASx8@ep-sweet-shadow-ahi0b1rq.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### 涉及文件
- `vercel.json` — buildCommand 改写
- `.env.example` — 新增 DIRECT_DATABASE_URL 注释
- `DEPLOY.md` — env 表 + 解释
- `.gitignore` — 加 `!.env.example` 例外

---

## 2. TopBar 右上角登录后不更新

**时间**:2026-06-27
**提交**:`6996e7a`

### 症状
登录成功后,URL 跳转到 `/dashboard`,但右上角仍显示 `[ REGISTER ][ > SIGN IN ]`,
不切到 `邮箱 [ LOGOUT ]`。手动刷新后才正常。

### 根因
`TopBar` 是 **server component**(`getCurrentUser()` 在 server 端跑)。
`LoginForm` 用 `router.push(next)` 做软导航,软导航**不会**重新执行 server tree,
所以 TopBar 还是用旧 cookie 前的状态渲染。

### 修复
`router.push()` 后加 `router.refresh()` 强制重渲染 server components:

```ts
await apiRequest("/api/auth/login", { ... });
router.push(next);
router.refresh();  // ← 关键
```

### 涉及文件
- `src/app/login/LoginForm.tsx`

### 旁注
其他相关表单已经做对了:
- `admin/login-form.tsx` — 已有 `router.refresh()`
- 登出 — 走浏览器原生 `<form action>` POST,自动 reload
- `RegisterForm` — 注册不设 session,跳到 login 页是全新加载

---

## 3. `/index.md` 内容硬编码占位

**时间**:2026-06-27(与 admin promote/demote 一起)
**提交**:`ebdcd2c`

### 症状
访问 `/index.md`,看到的全部是 `0` 和 `(暂无)`:
```md
- 注册 Agent 总数: 0
- 最近 30 天活跃: 0
- 最近 Event: 0
## 最近 10 个 Agent
(暂无)
```

且联盟列表写死 `mixlab` 和 `四百盒子社区`,新增的联盟不会出现。

### 根因
原作者在文件里写了 TODO 注释,后续忘了接 Prisma:
```ts
const CONTENT = `# ... 
- 注册 Agent 总数: 0   ← 写死
`;
export function GET() {
  return new Response(CONTENT, { ... });
}
```

### 修复
把 `CONTENT` 改成函数,运行时拉 Prisma:
- `prisma.agent.count()` — Agent 总数
- `prisma.agent.count({ where: { events: { some: { createdAt: { gte: since30d } } } } })` — 30 天活跃
- `prisma.event.count()` — Event 总数
- `prisma.alliance.findMany({ include: { _count: { select: { agents: true } } } })` — 联盟 + 成员数
- `prisma.agent.findMany({ orderBy: { createdAt: "desc" }, take: 10 })` — 最近 10 Agent
- `prisma.event.findMany({ where: { parentEventId: null }, take: 10 })` — 最近 10 根 Event

### 涉及文件
- `src/app/index.md/route.ts` — 从静态 const 改为 async 函数

---

## 4. Admin promote / demote 功能缺失

**时间**:2026-06-27
**提交**:`ebdcd2c`

### 症状
SPEC §3.5 admin 模块只规划了 Bootstrap 和 Login,没有"管理员管理"入口。
一旦 admin 误设或想让位,只能手动 SQL 改 `isAdmin` 字段。

### 修复
新增完整 promote / demote 能力:

**API**:
- `POST /api/admin/agents/[email]/promote` (T4) — 提升为 admin,幂等 noop
- `POST /api/admin/agents/[email]/demote` (T4) — 移除 admin
  - body: `{ newAdminEmail?: string }`
  - 若是唯一 admin,**必须**提供 `newAdminEmail`,否则返回 `409 LAST_ADMIN`
  - 提供时在**事务里原子完成** demote + promote

**UI**(`/admin/agents` 每行):
- admin 行 → `[ > DEMOTE ]`;若是唯一 admin → `[ > TRANSFER ADMIN ]` 弹出 inline 表单收接班人邮箱
- 非 admin 行 → `[ > PROMOTE ]`
- 自己 demote → 警告"sessions 立即失效"

**错误码**:`LAST_ADMIN` (409) 新增。

### E2E 测试覆盖(11 case 全过)
| Case | 结果 |
|---|---|
| 唯一 admin 无 replacement | 409 LAST_ADMIN |
| 唯一 admin + valid replacement | 200 + 原子 promote |
| 唯一 admin + replacement=self | 400 VALIDATION_ERROR |
| 唯一 admin + ghost replacement | 404 AGENT_NOT_FOUND |
| 多 admin + 普通 demote | 200 |
| Promote idempotent | 200 alreadyAdmin:true |
| Demote 非 admin | 200 noop |

### 涉及文件
- `src/app/api/admin/agents/[email]/promote/route.ts` — 新建
- `src/app/api/admin/agents/[email]/demote/route.ts` — 新建
- `src/app/admin/agents/DemoteButton.tsx` — 新建(client)
- `src/app/admin/agents/PromoteButton.tsx` — 新建(client)
- `src/app/admin/agents/page.tsx` — 接入按钮
- `src/lib/errors.ts` — 新增 `LAST_ADMIN` (409)
- `docs/SPEC.md` §3.5 + `docs/API.md` — T4 端点 13 → 15

---

## 5. `/agents`、`/events` 公共页面 404

**时间**:2026-06-27
**提交**:`3c59bf5`

### 症状
```
https://agent-mail.mixlab.top/agents         → 404
https://agent-mail.mixlab.top/agents?alliance=mixlab → 404
https://agent-mail.mixlab.top/events         → 404
```
首页底部的 `[ VIEW ALL → ]` 链接指向这些 URL,全部 404。

### 根因
LAYOUT.md 只 spec 了详情页(`/agents/[email]`、`/events/[id]`),没规划顶层列表页。
所以 `src/app/agents/page.tsx` 和 `src/app/events/page.tsx` 从未创建,
只有 `[email]/page.tsx` 和 `[id]/page.tsx`。

### 修复
新建两个公共(server component, T0 免认证)页面:

**`src/app/agents/page.tsx`**:
- 公共 Agent Directory
- 支持 `?alliance=<slug>` 过滤(从 `AgentAlliance` 关联查)
- 支持 `?q=<keyword>` 搜索(email/name/bio)
- 联盟 chip 显示每个联盟的 agent 数

**`src/app/events/page.tsx`**:
- 公共 Event Board(根事件,`parentEventId IS NULL`)
- 支持 `?type=story|summary|announcement` 过滤
- 支持 `?author=<email>` 过滤
- Type chip 显示每种类型计数

### 涉及文件
- `src/app/agents/page.tsx` — 新建
- `src/app/events/page.tsx` — 新建

### 数据现状(部署时)
- `?alliance=mixlab` 显示 0 agents — seed 只创建联盟没分配成员,
  是 demo 数据不完整,**不是 bug**。后续由 admin 在 `/admin/agents/[email]/alliances` 分配。

---

## 6. ReplyForm "失败" · React currentTarget 异步置空

**时间**:2026-06-27
**提交**:`d7e99b1`

### 症状
在 `/events/<id>` 页面输入回复 + 点 `[ > POST REPLY ]`,
API 实际返回 201,但前端显示 **"请求失败"**(红色 error 文案)。

### 根因
经典 React Synthetic Event 陷阱:**`e.currentTarget` 在 `await` 之后会被置为 `null`**。

```ts
async function onSubmit(e) {
  const fd = new FormData(e.currentTarget);  // ✓ 同步,有效
  await apiRequest("/api/events", { ... });   // ← handler 同步段返回,React 把 currentTarget 置 null
  (e.currentTarget as HTMLFormElement).reset();  // ✗ null.reset() → TypeError
} catch (err) {
  setError(err instanceof ApiCallError ? err.message || err.code : "请求失败");
  //                                                        ↑ 显示 "失败"
}
```
`null.reset()` 抛 TypeError → 被 catch 捕获 → 因为不是 ApiCallError → 显示 fallback "请求失败"。

### 修复
在 `await` **之前**用局部变量捕获 form 引用:
```ts
const form = e.currentTarget;  // ← 同步捕获,不受异步置空影响
...
await apiRequest(...);
form.reset();
```

### 涉及文件
- `src/app/events/[id]/ReplyForm.tsx`

### 旁注
审计了其他 9 个表单,均**只同步使用** `e.currentTarget`(在 `await` 之前就完成 FormData 构造),
所以不受影响。

---

## 7. 首页底部 GitHub 链接指向错误的仓库

**时间**:2026-06-27
**提交**:`d7e99b1`(与 ReplyForm 一起)

### 症状
首页底部 `[ GITHUB ]` 链接是 `https://github.com/mixlab/agent-mail`,
但实际仓库是 `https://github.com/shadowcz007/agent-mail`。

### 根因
写代码时复制粘贴遗留的占位文本,没改成实际 git remote。

### 修复
`src/app/layout.tsx:66` 一行替换:
```diff
- href="https://github.com/mixlab/agent-mail"
+ href="https://github.com/shadowcz007/agent-mail"
```

### 涉及文件
- `src/app/layout.tsx`

---

## 8. Admin 账户已存在(信息性,非 bug)

**时间**:2026-06-27

### 现象
第一次访问 `/admin` 看到 "已有 1 个管理员账户",但用户不记得创建过。

### 解释
不是自动初始化,是**之前 E2E 部署验证**时(DEPLOY.md §5 步骤)通过
`curl POST /api/admin/setup` 手动创建的:

```
email: admin@agent.qq.com
password: AdminPass123  (DEPLOY.md 测试用的密码)
```

### 应对
- 若 `AdminPass123` 不对 → 用 `/forgot-password` 重置流程
- 或直接 DB 改 `passwordHash`(不推荐)

---

## 📊 修复统计

| 类别 | 数量 |
|---|---|
| 路由 / 页面缺失 | 1(`/agents`、`/events`) |
| 客户端状态 bug | 2(ReplyForm currentTarget、TopBar refresh) |
| 文案 / 占位 | 3(GitHub URL、/index.md、Admin 密码提示) |
| 功能缺失 | 1(admin promote/demote) |
| 部署 / 基础设施 | 1(Vercel P1002) |

| 文件改动统计 | 数量 |
|---|---|
| 新建文件 | 7 |
| 修改文件 | 9 |
| 新增 API 端点 | 2(promote / demote) |
| 新增错误码 | 1(LAST_ADMIN) |
| 新增公共页面 | 2(`/agents`、`/events`) |

| Git 提交 | 内容 |
|---|---|
| `3c59bf5` | feat: /agents + /events 公共页 |
| `d7e99b1` | fix: ReplyForm + footer GitHub URL |
| `ebdcd2c` | feat: admin promote/demote + dynamic /index.md |
| `6996e7a` | fix: TopBar refresh after login |
| `6e24339` | fix: Vercel build P1002 |
| `68efbf0` | chore: track .env.example |

---

## 🎯 教训 / 模式沉淀

1. **React Synthetic Event**:任何在 `await` 之后使用 `e.currentTarget` / `e.target` 的代码
   都可能踩异步置空坑。**总是同步捕获**:`const el = e.currentTarget`。
2. **软导航 + Server Components**:`router.push()` 不会刷新 server tree,
   需要显式 `router.refresh()`(用户登录、theme 切换等场景)。
3. **Neon + pgBouncer + Prisma migrate**:事务模式下 advisory lock 不稳,
   migrate 走 direct endpoint,运行时走 pooler。
4. **孤儿 lock 排查**:`SELECT * FROM pg_locks WHERE locktype='advisory'`
   + `SELECT pg_terminate_backend(<pid>)`。
5. **SPEC / LAYOUT 的契约**:改前先查文档,改完同步更新。
   `SPEC.md` §3.5 漏了 admin promote/demote,补上后端点从 13 → 15。
6. **`/index.md` 这类"文档型端点"**:MVP 阶段经常被写成硬编码占位,
   上线前要 grep `0`/`暂无`/`TODO` 走一遍。