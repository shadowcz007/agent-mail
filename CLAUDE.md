@AGENTS.md

# agent-mail 项目指引

> 这是 Claude Code 在 `agent-mail` 仓库中工作时的项目级指引。所有架构、API、视觉、界面决策都已沉淀到 `docs/` 下的 4 个文档,**修改或开发前必读**。

---

## 📚 文档索引(必读)

所有项目设计都集中在 [`docs/`](./docs/) 目录下。**不要凭印象改代码,先查文档**。

| 文档 | 何时查阅 |
|---|---|
| [**SPEC.md**](./docs/SPEC.md) | 架构、数据模型、API 端点、安全规范、鉴权分层(改任何代码前) |
| [**DESIGN.md**](./docs/DESIGN.md) | 视觉系统、3 主题(Protocol Registry / Terminal / Studio)的色卡(改样式前) |
| [**LAYOUT.md**](./docs/LAYOUT.md) | 17 个页面的 ASCII 草图、Top Bar 规范、组件约定(新建/改 UI 前) |
| [**API.md**](./docs/API.md) | 30 个 REST 端点的 request/response、错误码、Tier 标注(写/改 API 前) |

### 阅读顺序建议

按以下顺序读,可建立完整心智模型:

1. **SPEC §1–3**(项目愿景 + 架构 + 5 个数据模型 + API 总览)→ 10 分钟
2. **API §TIER 0–4**(5 层鉴权 + 30 端点)→ 10 分钟
3. **LAYOUT §2 + §3**(17 页面概览 + 主要 mockup)→ 15 分钟
4. **DESIGN.md Theme System**(3 主题机制)→ 5 分钟

### 关键约束(影响实现,容易踩坑)

- **鉴权分层**(SPEC §3.7.9):API 分 5 层 T0–T4,每层规则不同,中间件必须严格按 Tier 实现
- **密码**(SPEC §3.7.1):bcrypt cost 12,**绝不返回 `passwordHash`** 字段
- **API Key**(SPEC §3.1 + §3.7.4):**不哈希**,256-bit 随机,只存数据库,Session 端点管理
- **事件写入**(API §TIER 2):`POST /api/events` **只接受 Bearer**,不接受 Session
- **数据主权**:**不存储邮件正文**,邮箱后端依赖 agently-mail CLI

---

## 🎯 项目状态

- ✅ **文档阶段**:完成(SPEC / DESIGN / LAYOUT / API 四件套)
- 🔨 **实现阶段**:启动中(Prisma schema + Next.js API + 中间件 + 17 页面 + 3 主题)
- 📦 **部署阶段**:待开始(Vercel)

详细 API 与页面见 `docs/`。

---

## 🛠 技术栈

- **框架**:Next.js 16(App Router)+ TypeScript
- **样式**:Tailwind CSS v4 + CSS Variables(主题切换)
- **数据库**:PostgreSQL + Prisma(规划)
- **认证**:Session Cookie + Bearer API Key + bcrypt
- **部署**:Vercel

**重要**:`AGENTS.md` 中提到的 Next.js 16 breaking changes 警告需特别留意 — 不要凭训练数据印象写代码,优先查 `node_modules/next/dist/docs/`。

---

## 📁 目录结构速查

```
agent-mail/
├── docs/                  ← 📚 所有设计文档
│   ├── SPEC.md            架构 + API + 数据模型
│   ├── DESIGN.md          视觉系统
│   ├── LAYOUT.md          界面草图
│   └── API.md             API 参考
├── src/app/               ← Next.js App Router 页面
├── public/                ← 静态资源
├── AGENTS.md              ← Next.js 16 警告(已 import)
├── CLAUDE.md              ← 你正在读
└── README.md              ← 项目介绍
```

---

**记住**:这是开放协议项目,所有 API 与数据格式都是公共契约。改之前先查文档,改完同步更新文档。