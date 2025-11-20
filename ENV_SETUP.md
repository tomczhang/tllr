# 环境变量配置指南（已更新为 Supabase JWT）

## 🎉 重要更新

项目已调整为使用 **Supabase JWT**，配置更简单了！

## 📝 需要创建的文件

### 1. 根目录 `.env`（Docker Compose 使用）

```bash
# 在项目根目录创建
touch /Users/tomczhang/tllr/.env
```

**内容：**
```env
# Supabase 配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key

# OpenAI (Phase 2 可选)
OPENAI_API_KEY=sk-xxx
```

### 2. 后端 `.env`（本地开发使用）

```bash
# 在 backend 目录创建
touch /Users/tomczhang/tllr/backend/.env
```

**内容：**
```env
# Supabase 配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key

# 应用配置
ENVIRONMENT=development
DEBUG=True
BACKEND_CORS_ORIGINS=["http://localhost:5173", "http://localhost:3000"]

# OpenAI (Phase 2)
OPENAI_API_KEY=your-openai-api-key
```

### 3. 前端 `.env`（本地开发使用）

```bash
# 在 frontend 目录创建
touch /Users/tomczhang/tllr/frontend/.env
```

**内容：**
```env
# API 地址
VITE_API_URL=http://localhost:8000/api/v1

# 应用配置
VITE_APP_NAME=贪婪猎人投资平台
```

## 🔑 获取 Supabase 配置

### 步骤 1: 登录 Supabase

访问 https://app.supabase.com 并选择你的项目

### 步骤 2: 获取配置信息

1. 点击左侧 **⚙️ Settings**
2. 点击 **API**
3. 复制以下信息：

```
┌─────────────────────────────────────┐
│ Configuration                        │
├─────────────────────────────────────┤
│ Project URL                          │
│ https://xxxxx.supabase.co  [Copy]   │
├─────────────────────────────────────┤
│ Project API keys                     │
├─────────────────────────────────────┤
│ anon public                          │
│ eyJhbGc... [Copy]                   │
├─────────────────────────────────────┤
│ service_role ⚠️                      │
│ eyJhbGc... [Copy] [Reveal]          │
└─────────────────────────────────────┘
```

对应关系：
- **Project URL** → `SUPABASE_URL`
- **anon public** → `SUPABASE_KEY`
- **service_role** → `SUPABASE_SERVICE_KEY` （点 Reveal 显示）

## ✅ 快速创建所有文件

在项目根目录执行：

```bash
cd /Users/tomczhang/tllr

# 1. 创建根目录 .env
cat > .env << 'EOF'
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key
OPENAI_API_KEY=sk-xxx
EOF

# 2. 创建后端 .env
cat > backend/.env << 'EOF'
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key
ENVIRONMENT=development
DEBUG=True
BACKEND_CORS_ORIGINS=["http://localhost:5173", "http://localhost:3000"]
OPENAI_API_KEY=your-openai-api-key
EOF

# 3. 创建前端 .env
cat > frontend/.env << 'EOF'
VITE_API_URL=http://localhost:8000/api/v1
VITE_APP_NAME=贪婪猎人投资平台
EOF

echo "✅ 所有 .env 文件创建完成！"
echo "⚠️  记得替换为你的真实 Supabase 配置"
```

## 📋 验证配置

### 测试后端配置

```bash
cd backend
python -c "from app.core.config import settings; print('✅ Supabase URL:', settings.SUPABASE_URL)"
```

### 测试前端配置

```bash
cd frontend
echo $VITE_API_URL
# 或者直接启动看是否报错
npm run dev
```

## ⚠️ 重要说明

### 1. 不再需要的配置

以下配置**已删除**，不需要设置：
- ❌ `SECRET_KEY` - 不再自己生成 JWT
- ❌ `ALGORITHM` - 由 Supabase 管理
- ❌ `ACCESS_TOKEN_EXPIRE_MINUTES` - 由 Supabase 管理

### 2. JWT 现在由 Supabase 管理

- ✅ 登录/注册返回 Supabase 的 `access_token`
- ✅ Token 验证通过 Supabase API
- ✅ 自动支持 token 刷新和撤销

### 3. JWT Secret/Signing Keys

你在 Supabase 设置的 **JWT Secret** 或 **JWT Signing Keys** 不需要配置到 `.env` 中，它由 Supabase 内部管理。

## 🔐 安全建议

1. **永远不要提交 .env 到 Git**（已在 .gitignore 中）
2. **service_role key 权限极高**，只能在后端使用
3. **生产环境**：
   - 使用环境变量注入，不要使用 .env 文件
   - 启用 Supabase JWT Signing Keys（更安全）
   - 设置合适的 CORS 源

## 🎯 下一步

配置完成后：

```bash
# 使用 Docker 启动
docker-compose up --build

# 或本地开发
# 后端
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload

# 前端（新终端）
cd frontend && npm install && npm run dev
```

## 🆘 故障排查

### 问题 1: 配置加载失败

```python
# 检查环境变量是否正确
python -c "from app.core.config import settings; print(settings.model_dump())"
```

### 问题 2: Token 验证失败

- 确认 Supabase URL 正确
- 确认 anon/service_role key 正确
- 检查 token 是否过期

### 问题 3: CORS 错误

在 `backend/.env` 中添加前端地址：
```env
BACKEND_CORS_ORIGINS=["http://localhost:5173"]
```

完整文档见：`docs/AUTH_ARCHITECTURE.md`

