# API 测试示例
# 使用 curl 命令测试各个 API 端点

# 基础 URL
BASE_URL="http://localhost:3000"

# ============================================
# 1. 用户注册
# ============================================
echo "1. 注册新用户..."
curl -X POST "${BASE_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }' | jq

# 保存返回的 token
# TOKEN="eyJhbGci..."

# ============================================
# 2. 用户登录
# ============================================
echo -e "\n2. 用户登录..."
curl -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }' | jq

# ============================================
# 3. 获取当前用户信息
# ============================================
echo -e "\n3. 获取当前用户信息..."
curl -X GET "${BASE_URL}/api/auth/me" \
  -H "Authorization: Bearer ${TOKEN}" | jq

# ============================================
# 4. 创建采集项
# ============================================
echo -e "\n4. 创建采集项..."
curl -X POST "${BASE_URL}/api/captured-items" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/article",
    "title": "Interesting Article",
    "note": "This is a test note",
    "tags": ["tech", "ai"],
    "source": "WEB_APP"
  }' | jq

# ============================================
# 5. 获取采集项列表
# ============================================
echo -e "\n5. 获取采集项列表..."
curl -X GET "${BASE_URL}/api/captured-items?limit=10" \
  -H "Authorization: Bearer ${TOKEN}" | jq

# ============================================
# 6. 连接 Zotero（需要 Pro 计划）
# ============================================
echo -e "\n6. 连接 Zotero..."
curl -X POST "${BASE_URL}/api/zotero/connect" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "My Zotero Library",
    "zoteroUserId": "123456",
    "apiKey": "test-api-key"
  }' | jq

# ============================================
# 7. 同步 Zotero 数据
# ============================================
echo -e "\n7. 同步 Zotero..."
# 需要先从上一步获取 accountId
ACCOUNT_ID="your-account-id"
curl -X POST "${BASE_URL}/api/zotero/sync" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"accountId\": \"${ACCOUNT_ID}\",
    \"createCorpusDocuments\": true
  }" | jq

# ============================================
# 8. RAG 查询（需要 Pro 计划）
# ============================================
echo -e "\n8. RAG 查询..."
curl -X POST "${BASE_URL}/api/rag/query" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What are the latest trends in AI?",
    "topK": 5
  }' | jq

# ============================================
# 9. 创建报告
# ============================================
echo -e "\n9. 创建报告..."
curl -X POST "${BASE_URL}/api/reports" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AI Trends Report",
    "type": "TREND_ANALYSIS",
    "contentMd": "# AI Trends\n\n## Overview\n\nArtificial intelligence continues to evolve...",
    "metaJson": {
      "tags": ["ai", "trends"],
      "period": "2024-Q1"
    }
  }' | jq

# ============================================
# 10. 获取报告列表
# ============================================
echo -e "\n10. 获取报告列表..."
curl -X GET "${BASE_URL}/api/reports?limit=10" \
  -H "Authorization: Bearer ${TOKEN}" | jq

# ============================================
# 提示
# ============================================
echo -e "\n✅ API 测试完成!"
echo "注意: 部分功能需要 Pro 或 Plus 计划才能使用"
echo "请根据返回的 token 替换上面的 TOKEN 变量"
