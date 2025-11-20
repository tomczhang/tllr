"""
股票分析相关 API
提供建仓分析、行情查询等功能
"""

from fastapi import APIRouter, HTTPException, status
from app.schemas.stock import AnalysisResult, StockSearchRequest, StockInfo
from app.services.calculator import GreedyHunterCalculator
from app.services.yfinance_srv import YFinanceService

router = APIRouter()
calculator = GreedyHunterCalculator()
yf_service = YFinanceService()


@router.post("/analyze", response_model=AnalysisResult)
async def analyze_stock(request: StockSearchRequest):
    """
    完整的建仓分析
    返回：S/A/B 评级、安全买入价、金字塔网格策略
    """
    symbol = request.symbol.upper()
    
    # 执行分析
    result = calculator.analyze_stock(symbol)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"无法获取股票 {symbol} 的数据，请检查代码是否正确"
        )
    
    return result


@router.get("/{symbol}/info", response_model=StockInfo)
async def get_stock_info(symbol: str):
    """
    获取股票基础信息
    """
    symbol = symbol.upper()
    
    stock_info = yf_service.get_stock_info(symbol)
    
    if not stock_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"股票 {symbol} 不存在或数据获取失败"
        )
    
    return StockInfo(**stock_info)


@router.get("/{symbol}/price")
async def get_current_price(symbol: str):
    """
    获取当前价格
    """
    symbol = symbol.upper()
    
    price = yf_service.get_current_price(symbol)
    
    if price is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"无法获取股票 {symbol} 的价格"
        )
    
    return {
        "symbol": symbol,
        "price": price
    }


@router.get("/{symbol}/history")
async def get_stock_history(symbol: str, period: str = "1y"):
    """
    获取历史数据
    period: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y
    """
    symbol = symbol.upper()
    
    hist_data = yf_service.get_historical_data(symbol, period=period)
    
    if hist_data is None or hist_data.empty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"无法获取股票 {symbol} 的历史数据"
        )
    
    # 转换为 JSON 格式
    data_dict = hist_data.to_dict(orient="records")
    
    return {
        "symbol": symbol,
        "period": period,
        "data": data_dict
    }


@router.get("/{symbol}/summary")
async def get_stock_summary(symbol: str):
    """
    获取股票数据摘要（快速查看）
    """
    symbol = symbol.upper()
    
    summary = yf_service.get_stock_data_summary(symbol)
    
    if not summary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"无法获取股票 {symbol} 的摘要数据"
        )
    
    return summary

