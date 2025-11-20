"""
认证相关 API
注册、登录（使用 Supabase Auth + Supabase JWT）
"""

from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.user import UserCreate, UserLogin, TokenResponse, UserProfile
from app.services.supabase_srv import SupabaseService
from app.api.deps import get_current_user

router = APIRouter()
supabase_service = SupabaseService()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """
    用户注册
    使用 Supabase Auth 创建用户，直接返回 Supabase JWT
    
    注意：如果 Supabase 启用了邮箱验证，需要先在 Dashboard 中关闭：
    Authentication > Providers > Email > Confirm email (关闭)
    """
    try:
        # 使用 Supabase Auth 注册
        auth_response = supabase_service.client.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
            "options": {
                "data": {
                    "username": user_data.username or user_data.email.split('@')[0]
                }
            }
        })
        
        # 检查是否创建了用户
        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="注册失败，请检查邮箱格式或密码强度"
            )
        
        # 检查是否需要邮箱验证
        if not auth_response.session:
            raise HTTPException(
                status_code=status.HTTP_202_ACCEPTED,
                detail="注册成功！请检查邮箱并点击验证链接完成注册。如需关闭邮箱验证，请在 Supabase Dashboard > Authentication > Providers > Email 中关闭 'Confirm email' 选项。"
            )
        
        user_id = auth_response.user.id
        
        # 获取用户资料（触发器会自动创建）
        profile = supabase_service.get_user_profile(user_id)
        if not profile:
            # 如果触发器失败，手动创建
            profile = supabase_service.create_user_profile(
                user_id=user_id,
                username=user_data.username or user_data.email.split('@')[0],
                email=user_data.email
            )
        
        # 直接返回 Supabase 的 access_token
        return TokenResponse(
            access_token=auth_response.session.access_token,
            token_type="bearer",
            user=UserProfile(**profile)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"注册失败: {str(e)}"
        )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """
    用户登录
    使用 Supabase Auth 验证，返回 Supabase JWT
    """
    try:
        # 使用 Supabase Auth 登录
        auth_response = supabase_service.client.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password
        })
        
        if not auth_response.user or not auth_response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="邮箱或密码错误"
            )
        
        user_id = auth_response.user.id
        
        # 获取用户资料
        profile = supabase_service.get_user_profile(user_id)
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户资料不存在"
            )
        
        # 直接返回 Supabase 的 access_token
        return TokenResponse(
            access_token=auth_response.session.access_token,
            token_type="bearer",
            user=UserProfile(**profile)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"登录失败: {str(e)}"
        )


@router.get("/me", response_model=UserProfile)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """
    获取当前用户信息
    需要 Supabase JWT Token
    """
    return UserProfile(**current_user)

