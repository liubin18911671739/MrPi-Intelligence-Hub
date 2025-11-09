#!/bin/bash

# MrPi Intelligence Hub - 快速启动脚本

echo "🚀 MrPi Intelligence Hub - 快速启动"
echo "=================================="
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未安装 Node.js"
    echo "请访问 https://nodejs.org/ 安装 Node.js"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未安装 npm"
    exit 1
fi

echo "✅ npm 版本: $(npm -v)"

# 检查 PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "⚠️  警告: 未检测到 PostgreSQL"
    echo "请确保已安装 PostgreSQL 并创建数据库"
fi

echo ""
echo "📦 步骤 1: 安装依赖..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi

echo ""
echo "📝 步骤 2: 检查环境变量..."
if [ ! -f .env ]; then
    echo "⚠️  .env 文件不存在，正在从 .env.example 复制..."
    cp .env.example .env
    echo "⚠️  请编辑 .env 文件，填写正确的数据库连接和 API 密钥"
    echo ""
    read -p "按回车键继续..."
fi

echo ""
echo "🗄️  步骤 3: 生成 Prisma Client..."
npx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ Prisma Client 生成失败"
    exit 1
fi

echo ""
echo "🔧 步骤 4: 运行数据库迁移..."
echo "⚠️  请确保数据库已创建并可连接"
read -p "继续执行迁移? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx prisma migrate dev --name init
    
    if [ $? -ne 0 ]; then
        echo "❌ 数据库迁移失败"
        echo "请检查 .env 中的 DATABASE_URL 是否正确"
        exit 1
    fi
else
    echo "⚠️  跳过数据库迁移，请稍后手动执行: npx prisma migrate dev"
fi

echo ""
echo "✅ 初始化完成!"
echo ""
echo "🎉 启动开发服务器..."
echo "=================================="
echo ""
npm run dev
