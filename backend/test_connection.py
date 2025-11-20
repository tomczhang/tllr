import os
import sys
os.environ['HTTPX_TIMEOUT'] = '60'

from app.services.supabase_srv import SupabaseService
import time

print("🔄 测试 Supabase Auth 注册...")
print(f"Supabase URL: {os.getenv('SUPABASE_URL', 'Not set')}")
print()

try:
    service = SupabaseService()
    print("✅ 客户端创建成功")
    
    # 测试注册
    test_email = f"test{int(time.time())}@example.com"
    test_password = "Test123456"
    
    print(f"📧 测试邮箱: {test_email}")
    print("⏳ 正在注册（可能需要几秒钟）...")
    
    start = time.time()
    response = service.client.auth.sign_up({
        "email": test_email,
        "password": test_password
    })
    elapsed = time.time() - start
    
    print(f"✅ 注册成功！耗时: {elapsed:.2f}秒")
    print(f"   User ID: {response.user.id if response.user else 'None'}")
    
except Exception as e:
    print(f"❌ 失败: {str(e)}")
    sys.exit(1)
