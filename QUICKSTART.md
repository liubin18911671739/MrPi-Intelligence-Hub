# MrPi Intelligence Hub - 项目概览

## 📁 完整项目结构

```
base-api/
├── README.md                           # 主文档
├── QUICKSTART.md                       # 本文件 - 快速上手指南
├── package.json                        # 依赖配置
├── tsconfig.json                       # TypeScript 配置
├── next.config.mjs                     # Next.js 配置
├── tailwind.config.js                  # Tailwind CSS 配置
├── postcss.config.js                   # PostCSS 配置
├── .env.example                        # 环境变量示例
├── .gitignore                          # Git 忽略文件
├── setup.sh                            # 快速启动脚本
├── test-api.sh                         # API 测试脚本
│
├── prisma/
│   ├── schema.prisma                   # 完整数据库模型
│   ├── init-pgvector.sql              # pgvector 初始化
│   └── seed-examples.sql               # 示例数据（可选）
│
└── src/
    ├── app/
    │   ├── layout.tsx                  # 根布局
    │   ├── page.tsx                    # 首页
    │   ├── globals.css                 # 全局样式
    │   └── api/                        # API 路由
    │       ├── auth/
    │       │   ├── register/route.ts   # 用户注册
    │       │   ├── login/route.ts      # 用户登录
    │       │   └── me/route.ts         # 获取当前用户
    │       ├── captured-items/
    │       │   └── route.ts            # 采集项 CRUD
    │       ├── zotero/
    │       │   ├── connect/route.ts    # 连接 Zotero
    │       │   ├── accounts/route.ts   # Zotero 账户列表
    │       │   └── sync/route.ts       # 同步 Zotero 数据
    │       ├── rag/
    │       │   └── query/route.ts      # RAG 查询
    │       └── reports/
    │           ├── route.ts            # 报告列表/创建
    │           └── [id]/route.ts       # 单个报告操作
    │
    └── lib/
        ├── db.ts                       # Prisma 客户端单例
        ├── auth.ts                     # 认证工具（JWT、密码）
        ├── plans.ts                    # 订阅计划逻辑
        ├── permissions.ts              # 权限检查
        ├── zotero.ts                   # Zotero API 集成
        ├── embedding.ts                # 向量生成（OpenAI）
        ├── indexer.ts                  # 文档索引器
        ├── rag.ts                      # RAG 查询实现
        └── logger.ts                   # 日志工具
```

## 🎯 核心功能模块

### 1. 认证与权限 (Auth & Permissions)

**文件**: `src/lib/auth.ts`, `src/lib/plans.ts`, `src/lib/permissions.ts`

- **功能**:
  - JWT token 签发与验证
  - 密码 bcrypt 哈希
  - 基于 Entitlement 的订阅等级判断
  - 功能权限检查（RAG、Zotero、Team 等）

- **API**:
  - `POST /api/auth/register` - 注册
  - `POST /api/auth/login` - 登录
  - `GET /api/auth/me` - 获取当前用户

### 2. 数据采集 (Data Capture)

**文件**: `src/app/api/captured-items/route.ts`

- **功能**:
  - Chrome 插件数据采集
  - Web App 数据采集
  - 支持 URL、标题、笔记、标签

- **API**:
  - `POST /api/captured-items` - 创建采集项
  - `GET /api/captured-items` - 获取列表（分页）

### 3. Zotero 集成 (Zotero Integration)

**文件**: `src/lib/zotero.ts`, `src/app/api/zotero/*`

- **功能**:
  - 连接 Zotero 个人库或群组库
  - 同步学术文献条目
  - 自动创建 CorpusDocument

- **API**:
  - `POST /api/zotero/connect` - 连接账户
  - `GET /api/zotero/accounts` - 账户列表
  - `POST /api/zotero/sync` - 同步数据

### 4. 向量索引 (Embedding & Indexing)

**文件**: `src/lib/embedding.ts`, `src/lib/indexer.ts`

- **功能**:
  - 使用 OpenAI API 生成文本向量
  - 文档自动切块（chunk）
  - 批量索引语料库

- **使用示例**:
```typescript
import { indexCorpusDocument } from '@/lib/indexer';
await indexCorpusDocument('doc-id');
```

### 5. RAG 查询 (RAG Query)

**文件**: `src/lib/rag.ts`, `src/app/api/rag/query/route.ts`

- **功能**:
  - 语义相似度搜索
  - 基于上下文的 AI 问答
  - 引用来源追踪

- **API**:
  - `POST /api/rag/query` - RAG 查询

### 6. 报告管理 (Report Management)

**文件**: `src/app/api/reports/*`

- **功能**:
  - 情报简报生成
  - 产品报告
  - 趋势分析
  - Markdown 格式存储

- **API**:
  - `POST /api/reports` - 创建报告
  - `GET /api/reports` - 报告列表
  - `GET /api/reports/[id]` - 单个报告
  - `DELETE /api/reports/[id]` - 删除报告

## 🗄️ 数据库模型速览

### 核心实体关系

```
User (用户)
  ├── ownedWorkspaces (拥有的工作区)
  ├── memberships (成员关系)
  └── entitlements (订阅权限)

Workspace (工作区)
  ├── owner (所有者)
  ├── members (成员)
  ├── capturedItems (采集项)
  ├── zoteroAccounts (Zotero 账户)
  ├── corpora (语料库)
  └── reports (报告)

Corpus (语料库)
  └── documents (文档)
      └── chunks (向量块)
```

### 订阅等级

| Plan | 优先级 | RAG | Zotero | Team | 语料库 |
|------|--------|-----|--------|------|--------|
| FREE | 0 | ❌ | ❌ | ❌ | 1 |
| EBOOK_ONLY | 1 | ❌ | ❌ | ❌ | 1 |
| PRO_MONTHLY | 2 | ✅ | ✅ | ❌ | 3 |
| PLUS_MONTHLY | 3 | ✅ | ✅ | ✅ | ∞ |

## 🚀 快速开始（10 分钟）

### 第 1 步：克隆或下载项目

```bash
cd base-api
```

### 第 2 步：使用快速启动脚本（推荐）

```bash
chmod +x setup.sh
./setup.sh
```

脚本会自动执行：
- ✅ 检查 Node.js 和 npm
- ✅ 安装依赖
- ✅ 复制 .env.example
- ✅ 生成 Prisma Client
- ✅ 运行数据库迁移
- ✅ 启动开发服务器

### 第 3 步：手动配置（如果不使用脚本）

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，填写数据库连接和 API 密钥

# 3. 初始化数据库
psql -U postgres -c "CREATE DATABASE mrpi_hub;"
psql -U postgres -d mrpi_hub -f prisma/init-pgvector.sql

# 4. 运行迁移
npx prisma migrate dev --name init

# 5. 启动服务
npm run dev
```

### 第 4 步：测试 API

访问 http://localhost:3000 查看首页，或使用测试脚本：

```bash
chmod +x test-api.sh

# 先注册/登录获取 token
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123","name":"Test"}'

# 使用返回的 token 测试其他接口
export TOKEN="eyJhbGci..."
./test-api.sh
```

## 🔧 开发工具

### Prisma Studio

```bash
npx prisma studio
```

在浏览器中可视化管理数据库。

### 数据库重置

```bash
npx prisma migrate reset
```

清空数据库并重新应用迁移。

### 查看日志

开发环境下，所有 Prisma 查询都会打印到控制台。

## 📊 性能优化建议

### 1. 向量索引

数据量超过 10,000 条 chunks 时，务必创建索引：

```sql
CREATE INDEX ON "EmbeddingChunk" 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);
```

### 2. 数据库连接池

在 `schema.prisma` 中配置：

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // 连接池配置
  // ?connection_limit=10&pool_timeout=20
}
```

### 3. 缓存（TODO）

建议使用 Redis 缓存：
- 用户信息
- 工作区配置
- 热门查询结果

## 🔐 安全检查清单

生产部署前请确认：

- [ ] 更改 `JWT_SECRET` 为强密钥（至少 32 字符）
- [ ] 加密存储 Zotero API Key（当前为演示明文）
- [ ] 配置 CORS 白名单
- [ ] 启用 Rate Limiting
- [ ] 使用 HTTPS
- [ ] 定期备份数据库
- [ ] 配置错误监控（如 Sentry）

## 🐛 常见问题

### Q1: Prisma Client 未生成？

```bash
npx prisma generate
```

### Q2: pgvector 扩展未启用？

```bash
psql -U postgres -d mrpi_hub -c "CREATE EXTENSION vector;"
```

### Q3: OpenAI API 调用失败？

检查 `.env` 中 `OPENAI_API_KEY` 是否正确。未配置时会使用模拟向量。

### Q4: 权限不足（403）？

免费计划不支持 RAG 和 Zotero。测试时可以手动修改用户的 Entitlement：

```sql
UPDATE "Entitlement" 
SET "planCode" = 'PRO_MONTHLY' 
WHERE "userId" = 'your-user-id';
```

## 📚 扩展资源

- **Next.js 文档**: https://nextjs.org/docs
- **Prisma 文档**: https://www.prisma.io/docs
- **pgvector 文档**: https://github.com/pgvector/pgvector
- **OpenAI API**: https://platform.openai.com/docs
- **Zotero API**: https://www.zotero.org/support/dev/web_api/v3/basics

## 🤝 贡献与反馈

欢迎提交 Issue 和 Pull Request！

---

**祝您使用愉快！** 🎉
