# Supabase 配置指南

## 📋 必需配置

### 1. 关闭邮箱验证（重要！）

为了让注册功能正常工作，需要关闭邮箱验证：

1. 访问 [Supabase Dashboard](https://app.supabase.com/)
2. 选择你的项目
3. 进入 **Authentication** > **Providers** > **Email**
4. 找到 **Confirm email** 选项
5. **关闭** 这个选项
6. 点击 **Save** 保存

<img width="600" alt="关闭邮箱验证" src="https://supabase.com/docs/img/guides/auth/disable-email-confirmation.png">

### 为什么要关闭？

- ✅ **开发阶段**：方便快速测试，不需要验证邮箱
- ✅ **简化流程**：用户注册后立即可以登录
- ⚠️ **生产环境**：建议开启邮箱验证以防止恶意注册

---

## 🌐 网络配置（国内用户）

如果你在国内，可能需要配置代理才能访问 Supabase：

### 方法 1: 修改启动脚本（推荐）

编辑 `backend/start-backend.sh`：

```bash
# 设置代理（根据你的代理端口调整）
export https_proxy=http://127.0.0.1:7890
export http_proxy=http://127.0.0.1:7890
```

### 方法 2: 手动启动时设置

```bash
cd backend
export https_proxy=http://127.0.0.1:7890
export http_proxy=http://127.0.0.1:7890
source venv/bin/activate
uvicorn app.main:app --reload
```

### 方法 3: 配置全局代理

```bash
# 添加到 ~/.zshrc 或 ~/.bashrc
export https_proxy=http://127.0.0.1:7890
export http_proxy=http://127.0.0.1:7890
```

---

## 🔑 获取 Supabase 凭证

### 1. Project URL
```
https://<your-project-ref>.supabase.co
```

在 **Settings** > **API** 中找到 **Project URL**

### 2. anon / public key
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

在 **Settings** > **API** 中找到 **Project API keys** > **anon public**

### 3. service_role key (仅后端使用)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

在 **Settings** > **API** 中找到 **Project API keys** > **service_role**

⚠️ **注意**: `service_role` 密钥拥有完全权限，不要泄露或在前端使用！

---

## 📝 配置 .env 文件

### 后端 `.env` (`backend/.env`)

```env
# Supabase 配置
SUPABASE_URL=https://zrrmiqzcjkqfyhyyurys.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# CORS 配置
BACKEND_CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# 开发环境
ENVIRONMENT=development
DEBUG=true

# OpenAI (Phase 2，可选)
OPENAI_API_KEY=
```

### 前端 `.env` (`frontend/.env`)

```env
# API 地址
VITE_API_URL=http://localhost:8000/api/v1

# Supabase 配置（仅用于前端直连，可选）
VITE_SUPABASE_URL=https://zrrmiqzcjkqfyhyyurys.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## ✅ 验证配置

### 测试后端连接

```bash
cd backend
source venv/bin/activate

# 如果需要代理
export https_proxy=http://127.0.0.1:7890
export http_proxy=http://127.0.0.1:7890

# 测试连接
python -c "
from app.services.supabase_srv import SupabaseService
s = SupabaseService()
result = s.client.table('profiles').select('id').limit(1).execute()
print('✅ Supabase 连接成功！')
"
```

### 测试注册功能

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPassword123!","username":"testuser"}'
```

**期望结果**:
- ✅ 如果关闭了邮箱验证：返回 201 Created + access_token
- ⚠️ 如果开启了邮箱验证：返回 202 Accepted + 提示验证邮箱

---

## 🔧 常见问题

### ❌ SSL 握手超时
```
_ssl.c:1112: The handshake operation timed out
```

**解决**: 配置代理（参见上面的网络配置）

### ❌ 注册后没有返回 token
```
detail: "注册成功！请检查邮箱..."
```

**解决**: 在 Supabase Dashboard 中关闭邮箱验证（参见第 1 步）

### ❌ 密码太弱
```
detail: "注册失败，请检查邮箱格式或密码强度"
```

**解决**: Supabase 默认要求密码至少 6 位。建议使用更强的密码（大小写+数字+符号）

### ❌ 邮箱已存在
```
detail: "User already registered"
```

**解决**: 更换邮箱或在 Supabase Dashboard 中删除已有用户

---

## 📚 相关文档

- [Supabase Auth 文档](https://supabase.com/docs/guides/auth)
- [Supabase Python 客户端](https://github.com/supabase-community/supabase-py)
- [Row Level Security (RLS)](https://supabase.com/docs/guides/database/postgres/row-level-security)

---

**最后更新**: 2025-11-20

