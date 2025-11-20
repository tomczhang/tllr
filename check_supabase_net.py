import socket
import ssl
import os
import sys
import time
from urllib.parse import urlparse
import urllib.request

# ================= 配置区域 =================
# 请将下面的 URL 替换为你自己的 Supabase Project URL
# 格式通常是: https://<project_ref>.supabase.co
SUPABASE_URL = "https://zrrmiqzcjkqfyhyyurys.supabase.co" 
# ===========================================

def log(step, message, status="INFO"):
    """格式化输出日志"""
    symbols = {
        "INFO": "ℹ️",
        "SUCCESS": "✅",
        "ERROR": "❌",
        "WARN": "⚠️"
    }
    print(f"{symbols.get(status, '')} [{step}] {message}")

def check_environment_proxies():
    """1. 检查环境变量中的代理设置"""
    log("环境检查", "正在检查系统代理设置...")
    proxies = {
        "http_proxy": os.environ.get("http_proxy"),
        "https_proxy": os.environ.get("https_proxy"),
        "HTTP_PROXY": os.environ.get("HTTP_PROXY"),
        "HTTPS_PROXY": os.environ.get("HTTPS_PROXY"),
    }
    
    has_proxy = False
    for k, v in proxies.items():
        if v:
            log("环境检查", f"发现代理变量: {k}={v}", "WARN")
            has_proxy = True
    
    if not has_proxy:
        log("环境检查", "未发现 Python 环境变量代理 (这可能是导致超时的原因，如果你开了VPN)", "WARN")
    else:
        log("环境检查", "代理已配置，请确保代理软件运行正常", "SUCCESS")

def check_dns(hostname):
    """2. 测试 DNS 解析"""
    log("DNS", f"尝试解析域名: {hostname} ...")
    try:
        ip_address = socket.gethostbyname(hostname)
        log("DNS", f"解析成功: {hostname} -> {ip_address}", "SUCCESS")
        return ip_address
    except socket.gaierror as e:
        log("DNS", f"解析失败: {e}", "ERROR")
        return None

def check_tcp_connection(ip, port, timeout=5):
    """3. 测试 TCP 端口连通性 (Socket)"""
    log("TCP", f"尝试连接 {ip}:{port} (超时设置: {timeout}秒)...")
    start_time = time.time()
    try:
        sock = socket.create_connection((ip, port), timeout=timeout)
        sock.close()
        elapsed = (time.time() - start_time) * 1000
        log("TCP", f"连接成功! 耗时: {elapsed:.2f}ms", "SUCCESS")
        return True
    except socket.timeout:
        log("TCP", "连接超时! (防火墙或网络阻断)", "ERROR")
        return False
    except Exception as e:
        log("TCP", f"连接失败: {e}", "ERROR")
        return False

def check_ssl_handshake(hostname, port, timeout=10):
    """4. 测试 SSL/TLS 握手 (重点)"""
    log("SSL", f"尝试 SSL 握手 {hostname}:{port} (超时设置: {timeout}秒)...")
    
    context = ssl.create_default_context()
    conn = socket.create_connection((hostname, port), timeout=timeout)
    
    try:
        sock = context.wrap_socket(conn, server_hostname=hostname)
        cert = sock.getpeercert()
        sock.close()
        log("SSL", f"握手成功! 证书颁发给: {cert['subject']}", "SUCCESS")
        return True
    except ssl.SSLError as e:
        log("SSL", f"握手失败 (SSL错误): {e}", "ERROR")
        return False
    except socket.timeout:
        log("SSL", "握手超时! (这是你遇到的错误 _ssl.c:1112)", "ERROR")
        return False
    except Exception as e:
        log("SSL", f"其他错误: {e}", "ERROR")
        return False

def check_http_request(url):
    """5. 完整 HTTP 请求测试"""
    log("HTTP", f"发送 GET 请求到: {url} ...")
    try:
        # 尝试请求根路径或 /rest/v1/
        # 注意：Supabase 根路径可能会返回 404，但只要有响应就算通
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=10) as response:
            log("HTTP", f"请求成功! 状态码: {response.getcode()}", "SUCCESS")
    except urllib.error.HTTPError as e:
        # 404 或 401 都说明网络是通的，只是路径或权限问题
        log("HTTP", f"网络连通 (服务器返回错误): {e.code} {e.reason}", "SUCCESS")
    except urllib.error.URLError as e:
        log("HTTP", f"请求失败: {e.reason}", "ERROR")
    except Exception as e:
        log("HTTP", f"请求发生异常: {e}", "ERROR")

def main():
    print("="*50)
    print("   Supabase 网络连通性诊断工具   ")
    print("="*50)
    
    if "your-project-ref" in SUPABASE_URL:
        log("配置", "请先修改脚本中的 SUPABASE_URL 为你自己的地址！", "ERROR")
        return

    parsed = urlparse(SUPABASE_URL)
    hostname = parsed.hostname
    port = 443
    
    # 1. 检查代理
    check_environment_proxies()
    print("-" * 30)

    # 2. DNS
    ip = check_dns(hostname)
    if not ip:
        print("❌ DNS 解析失败，无法继续。")
        return
    print("-" * 30)

    # 3. TCP
    if not check_tcp_connection(ip, port):
        print("❌ TCP 连接失败，可能是 IP 被封锁。")
        return
    print("-" * 30)

    # 4. SSL (这是最可能失败的一步)
    if not check_ssl_handshake(hostname, port):
        print("\n💡 **分析建议**: SSL 握手超时通常意味着 TCP 通了，但加密包被拦截。")
        print("   请尝试在终端设置代理: export https_proxy=http://127.0.0.1:7890 (替换为你的端口)")
        return
    print("-" * 30)

    # 5. HTTP
    check_http_request(SUPABASE_URL)
    
    print("\n✅ 恭喜！所有测试通过，你的 Python 环境应该可以连接 Supabase。")

if __name__ == "__main__":
    main()