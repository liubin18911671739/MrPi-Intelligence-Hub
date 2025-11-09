# MrPi Intelligence Hub

**MrPi Intelligence Hub (Mr.π Intelligence Hub)** 是一个统一的中台 API 系统，用于服务 Chrome 插件、Zotero 集成、Web App、微信小程序等多端应用。

## 🎯 项目特点

- **统一账号体系**：User / Workspace / Membership 管理
- **订阅权限控制**：基于 Entitlement 的多级订阅系统（Free / Pro / Plus / EBook）
- **多源数据采集**：
  - Chrome 插件采集
  - Zotero 学术文献同步
  - Web App / 小程序数据
- **智能语料库**：多源数据标准化为 CorpusDocuments，支持向量索引
- **RAG 查询**：基于 pgvector 的语义检索和 AI 问答
- **报告生成**：情报简报、产品报告、趋势分析

## 📋 技术栈

- **框架**：Next.js 14+ (App Router)
- **语言**：TypeScript
- **数据库**：PostgreSQL + Prisma ORM
- **向量存储**：pgvector
- **认证**：JWT + bcrypt
- **AI**：OpenAI API (Embeddings + Chat)

## 🚀 快速开始

### 1. 环境要求

- Node.js 18+
- PostgreSQL 14+ (需支持 pgvector 扩展)
- npm/yarn/pnpm

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env`，并填写配置：

```bash
cp .env.example .env
```

编辑 `.env`：

```env
# 数据库连接（必填）
DATABASE_URL="postgresql://user:password@localhost:5432/mrpi_hub?schema=public"

# JWT 密钥（必填，生产环境请使用强密钥）
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# OpenAI API Key（可选，用于 Embedding 和 RAG）
OPENAI_API_KEY="sk-your-openai-api-key"

# 应用配置
NODE_ENV="development"
NEXT_PUBLIC_API_URL="http://localhost:3000"

# Zotero Mock 模式（开发用）
USE_ZOTERO_MOCK="true"
```

### 4. 初始化数据库

#### 4.1 启用 pgvector 扩展

连接到 PostgreSQL 数据库并执行：

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

或使用提供的 SQL 文件：

```bash
psql -U your_username -d mrpi_hub -f prisma/init-pgvector.sql
```

#### 4.2 运行 Prisma 迁移

```bash
npx prisma migrate dev --name init
```

#### 4.3 生成 Prisma Client

```bash
npx prisma generate
```

### 5. 启动开发服务器

```bash
npm run dev
```

服务器将在 `http://localhost:3000` 启动。

## 📡 API 文档

### 认证 API

#### 注册

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

响应：

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "...", "email": "...", "name": "..." },
  "workspace": { "id": "...", "name": "...", "role": "OWNER" },
  "plan": "FREE",
  "features": {
    "rag": false,
    "zotero": false,
    "team": false,
    "maxCorpus": 1,
    "advancedReports": false
  }
}
```

#### 登录

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### 获取当前用户信息

```http
GET /api/auth/me
Authorization: Bearer <token>
```

### CapturedItems API

#### 创建采集项（Chrome 插件调用）

```http
POST /api/captured-items
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://example.com/article",
  "title": "Example Article",
  "note": "My notes",
  "tags": ["tech", "ai"],
  "source": "CHROME_EXTENSION"
}
```

#### 获取采集项列表

```http
GET /api/captured-items?limit=20&offset=0
Authorization: Bearer <token>
```

### Zotero 集成 API

#### 连接 Zotero 账户

```http
POST /api/zotero/connect
Authorization: Bearer <token>
Content-Type: application/json

{
  "label": "My Zotero Library",
  "zoteroUserId": "123456",
  "apiKey": "your-zotero-api-key"
}
```

#### 获取 Zotero 账户列表

```http
GET /api/zotero/accounts
Authorization: Bearer <token>
```

#### 同步 Zotero 数据

```http
POST /api/zotero/sync
Authorization: Bearer <token>
Content-Type: application/json

{
  "accountId": "account-id",
  "createCorpusDocuments": true,
  "corpusId": "optional-corpus-id"
}
```

### RAG 查询 API

```http
POST /api/rag/query
Authorization: Bearer <token>
Content-Type: application/json

{
  "question": "What are the latest trends in AI?",
  "corpusIds": ["corpus-id-1", "corpus-id-2"],
  "topK": 5
}
```

响应：

```json
{
  "success": true,
  "data": {
    "question": "What are the latest trends in AI?",
    "answer": "Based on the documents...",
    "citations": [
      {
        "docId": "doc-id",
        "title": "Document Title",
        "snippet": "Relevant excerpt...",
        "similarity": 0.85
      }
    ]
  }
}
```

### 报告 API

#### 创建报告

```http
POST /api/reports
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "AI Market Report Q1 2024",
  "type": "PRODUCT_REPORT",
  "contentMd": "# Report Content\n\n...",
  "metaJson": { "quarter": "Q1", "year": 2024 }
}
```

#### 获取报告列表

```http
GET /api/reports?limit=20&offset=0&type=PRODUCT_REPORT
Authorization: Bearer <token>
```

#### 获取单个报告

```http
GET /api/reports/{id}
Authorization: Bearer <token>
```

#### 删除报告

```http
DELETE /api/reports/{id}
Authorization: Bearer <token>
```

## 🗄️ 数据库架构

### 核心表

- **User**: 用户账户
- **Workspace**: 工作区
- **Membership**: 用户-工作区关系
- **Entitlement**: 订阅权限
- **CapturedItem**: 采集的内容
- **ZoteroAccount / ZoteroItem**: Zotero 集成
- **Corpus / CorpusDocument**: 语料库
- **EmbeddingChunk**: 向量索引
- **Idea / Task / Report**: 想法、任务、报告

详细模型定义见 `prisma/schema.prisma`。

## 🔧 使用 pgvector

### 安装 pgvector

```bash
# macOS (Homebrew)
brew install pgvector

# Ubuntu/Debian
sudo apt install postgresql-14-pgvector

# 或从源码编译
git clone https://github.com/pgvector/pgvector.git
cd pgvector
make
make install
```

### 启用扩展

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 修改 Prisma Schema（可选）

如果要使用原生 pgvector 类型，修改 `EmbeddingChunk` 模型：

```prisma
model EmbeddingChunk {
  // ...
  embedding Unsupported("vector(1536)")
  // ...
}
```

### 创建向量索引（优化性能）

```sql
-- IVFFlat 索引（适合大规模数据）
CREATE INDEX ON "EmbeddingChunk" 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- HNSW 索引（查询速度更快）
CREATE INDEX ON "EmbeddingChunk" 
USING hnsw (embedding vector_cosine_ops);
```

### 向量查询示例

```sql
-- 余弦相似度查询
SELECT 
  ec.*,
  cd.title,
  1 - (ec.embedding <=> '[0.1, 0.2, ...]'::vector) as similarity
FROM "EmbeddingChunk" ec
JOIN "CorpusDocument" cd ON ec."corpusDocumentId" = cd.id
WHERE cd."workspaceId" = 'workspace-id'
ORDER BY ec.embedding <=> '[0.1, 0.2, ...]'::vector
LIMIT 10;
```

## 📦 项目结构

```
/
├── package.json              # 依赖配置
├── tsconfig.json             # TypeScript 配置
├── next.config.mjs           # Next.js 配置
├── .env.example              # 环境变量示例
├── prisma/
│   ├── schema.prisma         # 数据库模型
│   └── init-pgvector.sql     # pgvector 初始化脚本
├── src/
│   ├── app/
│   │   └── api/              # API 路由
│   │       ├── auth/         # 认证接口
│   │       ├── captured-items/ # 采集接口
│   │       ├── zotero/       # Zotero 集成
│   │       ├── rag/          # RAG 查询
│   │       └── reports/      # 报告接口
│   └── lib/
│       ├── db.ts             # Prisma 客户端
│       ├── auth.ts           # 认证工具
│       ├── plans.ts          # 订阅计划
│       ├── permissions.ts    # 权限检查
│       ├── zotero.ts         # Zotero API
│       ├── embedding.ts      # 向量生成
│       ├── indexer.ts        # 文档索引
│       ├── rag.ts            # RAG 查询
│       └── logger.ts         # 日志工具
└── README.md
```

## 🔐 权限控制

### 订阅等级

| Plan | RAG | Zotero | Team | 语料库数量 | 高级报告 |
|------|-----|--------|------|-----------|---------|
| FREE | ❌ | ❌ | ❌ | 1 | ❌ |
| EBOOK_ONLY | ❌ | ❌ | ❌ | 1 | ❌ |
| PRO_MONTHLY | ✅ | ✅ | ❌ | 3 | ✅ |
| PLUS_MONTHLY | ✅ | ✅ | ✅ | 无限 | ✅ |

### 工作区角色

- **OWNER**: 工作区所有者（完全权限）
- **ADMIN**: 管理员（管理权限）
- **MEMBER**: 成员（基础权限）

## 🧪 开发与测试

### 数据库管理

```bash
# 打开 Prisma Studio
npx prisma studio

# 重置数据库
npx prisma migrate reset

# 查看数据库状态
npx prisma migrate status
```

### 代码检查

```bash
# TypeScript 类型检查
npm run build

# Lint
npm run lint
```

## 🚢 部署

### Vercel 部署

1. 将项目推送到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量（DATABASE_URL, JWT_SECRET, OPENAI_API_KEY）
4. 部署

### 数据库托管

推荐使用：
- [Supabase](https://supabase.com/)（支持 pgvector）
- [Neon](https://neon.tech/)（Postgres with pgvector）
- [Railway](https://railway.app/)

### 环境变量配置

在部署平台中配置以下环境变量：

```
DATABASE_URL=your-production-database-url
JWT_SECRET=your-strong-secret-key
OPENAI_API_KEY=your-openai-key
NODE_ENV=production
```

## 📝 注意事项

### 安全性

- **JWT_SECRET**: 生产环境务必使用强密钥（至少 32 字符）
- **API Key**: Zotero API Key 应加密存储（当前演示版为明文）
- **CORS**: 根据实际需求配置跨域策略
- **Rate Limiting**: 生产环境建议添加请求频率限制

### 性能优化

- **向量索引**: 大规模数据时务必创建 pgvector 索引
- **数据库连接池**: 配置合适的连接池大小
- **缓存**: 考虑添加 Redis 缓存热点数据
- **CDN**: 静态资源使用 CDN 加速

### 扩展建议

1. **文件存储**: 集成 S3/OSS 存储附件和图片
2. **队列系统**: 使用 Bull/BullMQ 处理异步任务（如大批量索引）
3. **监控**: 集成 Sentry 错误追踪和性能监控
4. **日志**: 使用 Winston 或 Pino 进行结构化日志
5. **测试**: 添加单元测试和集成测试

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可

MIT License

## 📞 支持

如有问题，请提交 GitHub Issue 或联系开发团队。

---

**Made with ❤️ by MrPi Team**
# MrPi-Intelligence-Hub
