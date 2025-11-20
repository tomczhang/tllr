"""
Supabase 服务封装
处理用户认证和数据库操作
"""

from typing import Optional, List, Dict, Any
from supabase import create_client, Client
from app.core.config import settings


class SupabaseService:
    """Supabase 数据库服务"""
    
    def __init__(self):
        # 创建 Supabase 客户端
        # 如果需要代理，请在启动时设置环境变量：
        # export https_proxy=http://127.0.0.1:7890
        # export http_proxy=http://127.0.0.1:7890
        self.client: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_KEY
        )
    
    # ============ 用户相关 ============
    
    def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """获取用户资料"""
        response = self.client.table("profiles").select("*").eq("id", user_id).execute()
        if response.data:
            return response.data[0]
        return None
    
    def create_user_profile(self, user_id: str, username: str, email: str) -> Dict[str, Any]:
        """创建用户资料"""
        data = {
            "id": user_id,
            "username": username,
            "email": email,
            "risk_preference": "moderate"
        }
        response = self.client.table("profiles").insert(data).execute()
        return response.data[0]
    
    # ============ 交易记录相关 ============
    
    def create_transaction(self, user_id: str, transaction_data: dict) -> Dict[str, Any]:
        """创建交易记录"""
        data = {
            "user_id": user_id,
            **transaction_data
        }
        response = self.client.table("transactions").insert(data).execute()
        return response.data[0]
    
    def get_user_transactions(self, user_id: str) -> List[Dict[str, Any]]:
        """获取用户所有交易记录"""
        response = self.client.table("transactions")\
            .select("*")\
            .eq("user_id", user_id)\
            .order("trade_date", desc=True)\
            .execute()
        return response.data
    
    def get_transactions_by_symbol(self, user_id: str, symbol: str) -> List[Dict[str, Any]]:
        """获取特定股票的交易记录"""
        response = self.client.table("transactions")\
            .select("*")\
            .eq("user_id", user_id)\
            .eq("symbol", symbol)\
            .order("trade_date", desc=True)\
            .execute()
        return response.data
    
    # ============ 笔记相关 ============
    
    def create_note(self, user_id: str, note_data: dict) -> Dict[str, Any]:
        """创建笔记"""
        data = {
            "user_id": user_id,
            **note_data
        }
        response = self.client.table("notes").insert(data).execute()
        return response.data[0]
    
    def get_user_notes(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """获取用户笔记"""
        response = self.client.table("notes")\
            .select("*")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)\
            .limit(limit)\
            .execute()
        return response.data
    
    def get_note_by_id(self, note_id: str) -> Optional[Dict[str, Any]]:
        """根据ID获取笔记"""
        response = self.client.table("notes")\
            .select("*")\
            .eq("id", note_id)\
            .execute()
        if response.data:
            return response.data[0]
        return None
    
    def update_note(self, note_id: str, update_data: dict) -> Dict[str, Any]:
        """更新笔记"""
        response = self.client.table("notes")\
            .update(update_data)\
            .eq("id", note_id)\
            .execute()
        return response.data[0]
    
    def delete_note(self, note_id: str) -> bool:
        """删除笔记"""
        self.client.table("notes").delete().eq("id", note_id).execute()
        return True
    
    # ============ 股票信息缓存 ============
    
    def get_stock_info(self, symbol: str) -> Optional[Dict[str, Any]]:
        """获取股票信息缓存"""
        response = self.client.table("stocks")\
            .select("*")\
            .eq("symbol", symbol)\
            .execute()
        if response.data:
            return response.data[0]
        return None
    
    def upsert_stock_info(self, stock_data: dict) -> Dict[str, Any]:
        """更新或插入股票信息"""
        response = self.client.table("stocks")\
            .upsert(stock_data)\
            .execute()
        return response.data[0]

