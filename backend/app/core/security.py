"""
安全相关功能
注意：JWT 现在由 Supabase 管理，这里保留工具函数供未来扩展使用
"""

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    验证密码
    （保留此函数以备未来需要本地密码验证时使用）
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    加密密码
    （保留此函数以备未来需要本地密码存储时使用）
    """
    return pwd_context.hash(password)

