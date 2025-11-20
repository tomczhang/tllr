# 🔧 故障排除指南

## 问题汇总与解决方案

### 1. ❌ 后端依赖冲突

#### 问题 A: email-validator 缺失
```
ImportError: email-validator is not installed
```

**解决**: 
```bash
pip install email-validator>=2.1.0
```

---

#### 问题 B: httpx 版本冲突
```
TypeError: __init__() got an unexpected keyword argument 'proxy'
```

**原因**: 旧版本 `supabase 2.3.0` 不兼容

**解决**:
```bash
pip install --upgrade supabase httpx
pip uninstall -y gotrue supafunc  # 清理旧包
```

---

#### 问题 C: websockets 版本过旧
```
ModuleNotFoundError: No module named 'websockets.asyncio'
```

**解决**:
```bash
pip install --upgrade websockets
```

---

### 2. ❌ 前端依赖缺失

#### 问题: tailwindcss-animate 缺失
```
Cannot find module 'tailwindcss-animate'
```

**解决**:
```bash
cd frontend
npm install -D tailwindcss-animate
```

---

### 3. ❌ Supabase 连接问题

#### 问题: SSL 握手超时或连接重置
```
_ssl.c:1112: The handshake operation timed out
Connection reset by peer
```

**原因**: 
1. Python SSL 版本问题（使用 LibreSSL 而非 OpenSSL）
2. 默认超时时间太短
3. 网络不稳定

**解决**: 
已在 `backend/app/services/supabase_srv.py` 中配置 `ClientOptions`，使用更健壮的连接设置。

**验证连接**:
```bash
cd backend
source venv/bin/activate
python -c "from app.services.supabase_srv import SupabaseService; s = SupabaseService(); print('✅ 连接成功')"
```

---

### 4. ❌ API 405 Method Not Allowed

#### 问题描述
```
GET /api/v1/auth/register HTTP/1.1" 405 Method Not Allowed
```

**原因**: 注册接口需要使用 POST 方法，不是 GET

**正确用法**:
```bash
# 使用 POST 方法
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456","username":"testuser"}'
```

前端代码已正确使用 POST（`useAuth.ts`）。

---

## 📋 诊断命令

### 检查后端状态
```bash
# 1. 检查进程
ps aux | grep uvicorn

# 2. 检查健康接口
curl http://localhost:8000/health

# 3. 测试 Supabase 连接
cd backend && source venv/bin/activate
python -c "from app.services.supabase_srv import SupabaseService; SupabaseService()"

# 4. 查看实时日志
tail -f /tmp/backend.log  # 如果有配置日志文件
```

### 检查前端状态
```bash
# 1. 检查进程
ps aux | grep vite

# 2. 测试前端页面
curl -s http://localhost:5173 | grep "贪婪猎人"

# 3. 检查依赖
cd frontend && npm list tailwindcss-animate
```

### 检查端口占用
```bash
# macOS/Linux
lsof -i :8000   # 后端
lsof -i :5173   # 前端

# 停止占用端口的进程
kill -9 $(lsof -t -i:8000)
```

---

## ✅ 当前工作环境

### 后端版本
```
supabase==2.24.0
httpx==0.28.1
websockets==15.0.1
pydantic==2.12.4
email-validator>=2.1.0
fastapi==0.104.1
uvicorn==0.24.0
```

### 前端版本
```
react: ^18.3.1
vite: ^6.0.3
tailwindcss: ^3.4.18
tailwindcss-animate: latest
```

---

## 🚀 快速修复流程

### 如果后端无法启动
```bash
cd /Users/tomczhang/tllr/backend

# 1. 停止旧进程
pkill -f uvicorn

# 2. 重新安装依赖
source venv/bin/activate
pip install --upgrade -r requirements.txt

# 3. 验证配置
python -c "from app.core.config import settings; print(settings.SUPABASE_URL)"

# 4. 测试导入
python -c "from app.main import app; print('✅ OK')"

# 5. 启动
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 如果前端无法启动
```bash
cd /Users/tomczhang/tllr/frontend

# 1. 停止旧进程
pkill -f vite

# 2. 清理并重装
rm -rf node_modules package-lock.json
npm install

# 3. 启动
npm run dev
```

---

## 🔍 常见错误码

| 错误码 | 含义 | 可能原因 |
|--------|------|----------|
| 405 | Method Not Allowed | 使用了错误的 HTTP 方法 |
| 401 | Unauthorized | Token 无效或过期 |
| 400 | Bad Request | 请求参数错误 |
| 500 | Internal Server Error | 后端代码错误，检查日志 |
| 503 | Service Unavailable | 服务未启动 |
| ECONNREFUSED | 连接被拒绝 | 服务未运行或端口错误 |
| ETIMEDOUT | 超时 | 网络问题或服务响应慢 |

---

## 📞 获取帮助

1. **查看日志**: 终端中的错误信息通常会指明问题
2. **检查配置**: 确保 `.env` 文件中的 Supabase 配置正确
3. **测试网络**: `curl https://zrrmiqzcjkqfyhyyurys.supabase.co`
4. **重启服务**: 使用 `stop-all.sh` 停止所有服务后重新启动

---

**最后更新**: 2025-11-20
**状态**: ✅ 所有已知问题已修复

