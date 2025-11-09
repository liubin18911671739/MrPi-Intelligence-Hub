-- 示例数据插入脚本（可选）
-- 用于快速测试系统功能

-- 注意：这些 SQL 语句仅供参考，实际应通过 API 接口操作数据

-- 1. 创建测试用户（密码已哈希）
-- 原始密码: "password123"
-- 哈希值通过 bcrypt 生成（需在应用层完成）

/*
INSERT INTO "User" (id, email, "passwordHash", name, "createdAt", "updatedAt")
VALUES 
  ('user1', 'test@example.com', '$2b$10$...', 'Test User', NOW(), NOW());

-- 2. 创建工作区
INSERT INTO "Workspace" (id, name, "ownerId", "createdAt", "updatedAt")
VALUES 
  ('workspace1', 'Test Workspace', 'user1', NOW(), NOW());

-- 3. 创建成员关系
INSERT INTO "Membership" (id, "userId", "workspaceId", role, "createdAt")
VALUES 
  ('member1', 'user1', 'workspace1', 'OWNER', NOW());

-- 4. 创建订阅权限（免费计划）
INSERT INTO "Entitlement" (id, "userId", "workspaceId", "planCode", source, status, "startedAt", "createdAt", "updatedAt")
VALUES 
  ('entitlement1', 'user1', 'workspace1', 'FREE', 'MANUAL', 'ACTIVE', NOW(), NOW(), NOW());

-- 5. 创建语料库
INSERT INTO "Corpus" (id, "workspaceId", name, description, type, "createdAt", "updatedAt")
VALUES 
  ('corpus1', 'workspace1', 'Test Corpus', 'A test corpus for demonstration', 'MIXED', NOW(), NOW());

-- 6. 创建测试文档
INSERT INTO "CorpusDocument" (
  id, "workspaceId", "corpusId", "sourceType", title, 
  authors, abstract, content, lang, "createdAt", "updatedAt"
)
VALUES 
  (
    'doc1', 
    'workspace1', 
    'corpus1', 
    'MANUAL',
    'Introduction to AI',
    'John Doe, Jane Smith',
    'This is an introduction to artificial intelligence.',
    'Artificial intelligence (AI) is the simulation of human intelligence processes by machines...',
    'en',
    NOW(),
    NOW()
  );
*/

-- 7. 查询示例

-- 查看用户及其工作区
/*
SELECT 
  u.id as user_id,
  u.email,
  u.name,
  w.id as workspace_id,
  w.name as workspace_name,
  m.role
FROM "User" u
JOIN "Membership" m ON u.id = m."userId"
JOIN "Workspace" w ON m."workspaceId" = w.id;
*/

-- 查看用户的有效订阅
/*
SELECT 
  u.email,
  e."planCode",
  e.status,
  e."startedAt",
  e."expiresAt"
FROM "User" u
JOIN "Entitlement" e ON u.id = e."userId"
WHERE e.status = 'ACTIVE'
  AND (e."expiresAt" IS NULL OR e."expiresAt" > NOW());
*/

-- 查看工作区的文档数量
/*
SELECT 
  w.name as workspace,
  c.name as corpus,
  COUNT(cd.id) as document_count
FROM "Workspace" w
JOIN "Corpus" c ON w.id = c."workspaceId"
LEFT JOIN "CorpusDocument" cd ON c.id = cd."corpusId"
GROUP BY w.id, w.name, c.id, c.name;
*/

-- 查看文档的向量块数量
/*
SELECT 
  cd.title,
  COUNT(ec.id) as chunk_count
FROM "CorpusDocument" cd
LEFT JOIN "EmbeddingChunk" ec ON cd.id = ec."corpusDocumentId"
GROUP BY cd.id, cd.title;
*/
