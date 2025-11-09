-- pgvector 初始化脚本
-- 用于在 PostgreSQL 数据库中启用 pgvector 扩展

-- 1. 启用 pgvector 扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 验证扩展已安装
SELECT * FROM pg_extension WHERE extname = 'vector';

-- 3. （可选）创建向量索引以提升查询性能
-- 注意：只有在表已存在且有数据时才执行以下索引创建语句

-- IVFFlat 索引（适合大规模数据，100-1000 lists）
-- CREATE INDEX IF NOT EXISTS embedding_chunk_ivfflat_idx 
-- ON "EmbeddingChunk" 
-- USING ivfflat (embedding vector_cosine_ops) 
-- WITH (lists = 100);

-- HNSW 索引（查询速度更快，但构建时间较长）
-- CREATE INDEX IF NOT EXISTS embedding_chunk_hnsw_idx 
-- ON "EmbeddingChunk" 
-- USING hnsw (embedding vector_cosine_ops);

-- 4. 向量查询示例（供参考）
/*
-- 余弦相似度查询（值越小越相似，范围 0-2）
SELECT 
  ec.id,
  ec.text,
  cd.title,
  ec.embedding <=> '[0.1, 0.2, ..., 0.5]'::vector as distance,
  1 - (ec.embedding <=> '[0.1, 0.2, ..., 0.5]'::vector) / 2 as similarity
FROM "EmbeddingChunk" ec
JOIN "CorpusDocument" cd ON ec."corpusDocumentId" = cd.id
WHERE cd."workspaceId" = 'your-workspace-id'
ORDER BY ec.embedding <=> '[0.1, 0.2, ..., 0.5]'::vector
LIMIT 10;

-- 内积查询（需要归一化的向量）
SELECT *
FROM "EmbeddingChunk"
ORDER BY embedding <#> '[0.1, 0.2, ...]'::vector
LIMIT 10;

-- 欧氏距离查询
SELECT *
FROM "EmbeddingChunk"
ORDER BY embedding <-> '[0.1, 0.2, ...]'::vector
LIMIT 10;
*/

-- 5. 性能优化建议
/*
-- 设置合适的 work_mem（用于索引构建）
SET work_mem = '1GB';

-- 设置合适的 maintenance_work_mem（用于 VACUUM）
SET maintenance_work_mem = '2GB';

-- 定期 VACUUM 和 ANALYZE
VACUUM ANALYZE "EmbeddingChunk";
*/
