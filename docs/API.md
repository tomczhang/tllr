# API 文档

## 基础信息

- **Base URL**: `http://localhost:8000/api/v1`
- **认证方式**: Bearer Token (JWT)
- **Content-Type**: `application/json`

## 认证相关

### 注册

```
POST /auth/register
```

**请求体:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "username"  // 可选
}
```

**响应:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "risk_preference": "moderate",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### 登录

```
POST /auth/login
```

**请求体:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应:** 同注册接口

## 股票分析

### 完整建仓分析

```
POST /stocks/analyze
```

**请求头:**
```
Authorization: Bearer <token>
```

**请求体:**
```json
{
  "symbol": "AAPL"
}
```

**响应:**
```json
{
  "symbol": "AAPL",
  "stock_info": {
    "symbol": "AAPL",
    "company_name": "Apple Inc.",
    "current_price": 180.5
  },
  "current_price": 180.5,
  "overall_score": "A",
  "score_details": [
    {
      "score": "A",
      "reason": "价格处于中低位",
      "points": 8
    }
  ],
  "max_drawdown": 0.35,
  "max_drawdown_date": "2022-12-28",
  "safe_buy_price": 150.25,
  "discount_rate": 0.168,
  "pyramid_strategy": [
    {
      "level": 1,
      "price": 150.25,
      "percentage": 5,
      "description": "✅ 已达成（可以买入）"
    }
  ],
  "recommendation": "🟢 推荐：A级标的，价格合理",
  "risk_warning": "✅ 风险可控"
}
```

### 获取股票信息

```
GET /stocks/{symbol}/info
```

### 获取当前价格

```
GET /stocks/{symbol}/price
```

### 获取历史数据

```
GET /stocks/{symbol}/history?period=1y
```

**参数:**
- `period`: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y

## 持仓管理

### 获取持仓概览

```
GET /portfolio/overview
```

**响应:**
```json
{
  "total_positions": 5,
  "total_market_value": 100000,
  "total_cost": 90000,
  "total_pnl": 10000,
  "total_pnl_percent": 11.11,
  "positions": [...],
  "sector_allocation": {
    "美股": 60,
    "A股": 40
  },
  "top_holdings": [...]
}
```

### 获取持仓列表

```
GET /portfolio/positions
```

### 记录交易

```
POST /portfolio/transactions
```

**请求体:**
```json
{
  "symbol": "AAPL",
  "type": "BUY",
  "price": 150.5,
  "quantity": 100,
  "trade_date": "2024-01-01T00:00:00Z",
  "note_content": "这是一笔价值投资"  // 可选
}
```

### 获取交易记录

```
GET /portfolio/transactions
GET /portfolio/transactions/{symbol}
```

## 投资笔记

### 创建笔记

```
POST /notes/
```

**请求体:**
```json
{
  "content": "今天看到苹果发布新品...",
  "symbol": "AAPL",  // 可选
  "tags": ["观察", "科技股"]  // 可选
}
```

### 获取笔记列表

```
GET /notes/?limit=50
```

### 获取单条笔记

```
GET /notes/{note_id}
```

### 更新笔记

```
PUT /notes/{note_id}
```

### 删除笔记

```
DELETE /notes/{note_id}
```

## 错误码

- `200`: 成功
- `201`: 创建成功
- `400`: 请求参数错误
- `401`: 未认证或 Token 过期
- `403`: 无权限
- `404`: 资源不存在
- `500`: 服务器内部错误

