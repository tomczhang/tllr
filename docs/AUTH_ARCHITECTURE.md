# 认证架构说明

## 🔐 认证流程（使用 Supabase JWT）

### 设计理念

我们完全采用 Supabase 的认证系统，不自己生成 JWT。这样做的好处：

1. ✅ **安全性更高**：Supabase JWT 由 Supabase 的 JWT Secret 签名，更安全
2. ✅ **功能完整**：自动支持 token 刷新、撤销、过期管理
3. ✅ **减少维护**：不需要自己实现 JWT 逻辑
4. ✅ **与 Supabase 生态集成**：可以直接使用 Supabase RLS（行级安全）

### 认证流程图

```
┌─────────┐
│  用户   │
└────┬────┘
     │
     │ 1. 登录/注册
     ↓
┌─────────────────┐
│  后端 FastAPI   │
└────┬────────────┘
     │
     │ 2. 调用 Supabase Auth API
     ↓
┌─────────────────┐
│ Supabase Auth   │
└────┬────────────┘
     │
     │ 3. 验证成功，返回 JWT (access_token + refresh_token)
     ↓
┌─────────────────┐
│  后端 FastAPI   │
└────┬────────────┘
     │
     │ 4. 返回 Supabase JWT 给前端
     ↓
┌─────────┐
│  前端   │
└────┬────┘
     │
     │ 5. 存储 token，后续请求带上 Authorization: Bearer <token>
     ↓
┌─────────────────┐
│  后端 API       │
└────┬────────────┘
     │
     │ 6. 调用 supabase.auth.get_user(token) 验证
     ↓
┌─────────────────┐
│ Supabase Auth   │
└────┬────────────┘
     │
     │ 7. 返回用户信息
     ↓
┌─────────────────┐
│  后端处理请求   │
└─────────────────┘
```

## 🔑 JWT 内容

### Supabase JWT 结构

```json
{
  "aud": "authenticated",
  "exp": 1234567890,
  "sub": "user-uuid",
  "email": "user@example.com",
  "phone": "",
  "app_metadata": {},
  "user_metadata": {
    "username": "用户名"
  },
  "role": "authenticated",
  "aal": "aal1",
  "amr": [{"method": "password", "timestamp": 1234567890}],
  "session_id": "session-uuid"
}
```

### JWT 签名

- **算法**：HS256（默认）或 RS256（推荐生产环境）
- **密钥**：Supabase 项目的 JWT Secret 或 JWT Signing Keys
- **过期时间**：默认 1 小时（可在 Supabase 控制台配置）

## 📝 环境变量

### 需要的配置

```env
# Supabase 配置
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJ...  # anon key，用于客户端
SUPABASE_SERVICE_KEY=eyJ...  # service_role key，用于服务端

# 不再需要这些（已删除）
# SECRET_KEY=xxx
# ALGORITHM=HS256
# ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## 🚀 API 使用示例

### 1. 注册

```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "username": "张三"
}

# 响应
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "张三"
  }
}
```

### 2. 登录

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

# 响应（同注册）
```

### 3. 访问受保护的 API

```bash
GET /api/v1/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 响应
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "张三",
  "risk_preference": "moderate",
  "created_at": "2024-01-01T00:00:00Z"
}
```

## 🔄 Token 刷新（未来）

Supabase 自动提供 refresh_token，可以实现：

```python
# 未来可以添加刷新接口
@router.post("/refresh")
async def refresh_token(refresh_token: str):
    response = supabase_service.client.auth.refresh_session(refresh_token)
    return {
        "access_token": response.session.access_token,
        "refresh_token": response.session.refresh_token
    }
```

## 🛡️ 安全特性

### 1. Row Level Security (RLS)

Supabase JWT 中包含 user_id，可以在数据库层面实现权限控制：

```sql
-- 用户只能查看自己的数据
CREATE POLICY "用户查看自己的笔记" ON notes
  FOR SELECT USING (auth.uid() = user_id);
```

### 2. Token 验证

```python
# 在 deps.py 中
user_response = supabase_service.client.auth.get_user(token)
```

Supabase 会验证：
- ✅ 签名是否正确
- ✅ Token 是否过期
- ✅ Token 是否被撤销

### 3. 自动过期

Token 默认 1 小时过期，前端需要：
- 处理 401 错误
- 使用 refresh_token 刷新
- 或重新登录

## 📊 对比：旧架构 vs 新架构

| 项目 | 旧架构（自定义 JWT） | 新架构（Supabase JWT） |
|------|---------------------|----------------------|
| JWT 生成 | 后端自己生成 | Supabase 生成 |
| JWT 验证 | 使用 python-jose | 调用 Supabase API |
| JWT 密钥 | 自定义 SECRET_KEY | Supabase JWT Secret |
| Token 刷新 | 需自己实现 | Supabase 自动支持 |
| Token 撤销 | 需自己实现 | Supabase 自动支持 |
| RLS 支持 | ❌ | ✅ |
| 复杂度 | 高 | 低 |

## 🎯 迁移影响

### 后端变化

1. ✅ `auth.py` - 返回 Supabase token
2. ✅ `deps.py` - 使用 Supabase 验证
3. ✅ `config.py` - 移除 JWT 相关配置
4. ✅ `security.py` - 移除 JWT 生成逻辑
5. ✅ `requirements.txt` - 移除 python-jose

### 前端变化

❌ **无需修改！** 前端使用方式完全一样：
- 登录后存储 `access_token`
- 请求时带上 `Authorization: Bearer <token>`

## ⚠️ 注意事项

1. **JWT Secret 变更**：如果你在 Supabase 修改了 JWT Secret，所有现有 token 会失效
2. **过期时间**：默认 1 小时，可在 Supabase Dashboard → Authentication → Settings 中修改
3. **Service Role Key**：非常敏感，只能在后端使用，不要暴露给前端

## 🔗 相关文档

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase JWT](https://supabase.com/docs/guides/auth/jwts)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

