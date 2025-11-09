// src/app/page.tsx
// 应用首页

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-indigo-900 mb-4">
            🌐 MrPi Intelligence Hub
          </h1>
          <p className="text-xl text-gray-700">
            统一服务多端的中台与 API 系统
          </p>
        </header>

        <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            📡 API 端点
          </h2>
          <div className="space-y-3">
            <APIEndpoint method="POST" path="/api/auth/register" desc="用户注册" />
            <APIEndpoint method="POST" path="/api/auth/login" desc="用户登录" />
            <APIEndpoint method="GET" path="/api/auth/me" desc="获取当前用户信息" />
            <APIEndpoint method="POST" path="/api/captured-items" desc="创建采集项" />
            <APIEndpoint method="GET" path="/api/captured-items" desc="获取采集项列表" />
            <APIEndpoint method="POST" path="/api/zotero/connect" desc="连接 Zotero" />
            <APIEndpoint method="GET" path="/api/zotero/accounts" desc="Zotero 账户列表" />
            <APIEndpoint method="POST" path="/api/zotero/sync" desc="同步 Zotero 数据" />
            <APIEndpoint method="POST" path="/api/rag/query" desc="RAG 查询" />
            <APIEndpoint method="POST" path="/api/reports" desc="创建报告" />
            <APIEndpoint method="GET" path="/api/reports" desc="获取报告列表" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            🎯 核心功能
          </h2>
          <ul className="space-y-2 text-gray-700">
            <li>✅ 统一账号体系（User / Workspace / Membership）</li>
            <li>✅ 订阅权限管理（Free / Pro / Plus）</li>
            <li>✅ Chrome 插件数据采集</li>
            <li>✅ Zotero 学术文献集成</li>
            <li>✅ 多源语料库构建</li>
            <li>✅ 向量索引（pgvector）</li>
            <li>✅ RAG 智能问答</li>
            <li>✅ 报告生成与管理</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            📚 快速开始
          </h2>
          <div className="bg-gray-50 rounded p-4 font-mono text-sm">
            <div className="mb-2">
              <span className="text-gray-500"># 1. 安装依赖</span>
              <br />
              <span className="text-indigo-600">npm install</span>
            </div>
            <div className="mb-2">
              <span className="text-gray-500"># 2. 配置环境变量</span>
              <br />
              <span className="text-indigo-600">cp .env.example .env</span>
            </div>
            <div className="mb-2">
              <span className="text-gray-500"># 3. 初始化数据库</span>
              <br />
              <span className="text-indigo-600">npx prisma migrate dev</span>
            </div>
            <div>
              <span className="text-gray-500"># 4. 启动服务</span>
              <br />
              <span className="text-indigo-600">npm run dev</span>
            </div>
          </div>
        </div>

        <footer className="text-center mt-12 text-gray-600">
          <p>📖 详细文档请查看 README.md</p>
          <p className="mt-2">Made with ❤️ by MrPi Team</p>
        </footer>
      </div>
    </main>
  );
}

function APIEndpoint({ method, path, desc }: { method: string; path: string; desc: string }) {
  const methodColors: Record<string, string> = {
    GET: 'bg-green-100 text-green-700',
    POST: 'bg-blue-100 text-blue-700',
    PUT: 'bg-yellow-100 text-yellow-700',
    DELETE: 'bg-red-100 text-red-700',
  };

  return (
    <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded transition">
      <span className={`px-3 py-1 rounded font-semibold text-xs ${methodColors[method]}`}>
        {method}
      </span>
      <code className="text-sm text-gray-800 font-mono flex-1">{path}</code>
      <span className="text-sm text-gray-600">{desc}</span>
    </div>
  );
}
