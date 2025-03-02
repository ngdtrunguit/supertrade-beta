from fastapi import FastAPI, HTTPException, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
import requests
from typing import Optional
import uvicorn
from datetime import datetime

from models import Trade, get_db

app = FastAPI(title="Crypto Trading Bot API")

# Mount the static directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# Root path serves the HTML file
@app.get("/")
async def root():
    return FileResponse("static/index.html")

class TradeRequest(BaseModel):
    symbol: str
    amount: float
    user_id: Optional[int] = None
    is_simulated: bool = True

@app.get("/get_price/{symbol}")
async def get_price(symbol: str):
    try:
        # Normalize the symbol
        symbol = symbol.upper()
        if not symbol.endswith('USDT'):
            symbol = f"{symbol}USDT"
        
        # Use Binance public API to get the price
        response = requests.get(f"https://api.binance.com/api/v3/ticker/price?symbol={symbol}",timeout = 5)
        
        
        if response.status_code != 200:
            raise HTTPException(status_code=404, detail=f"Symbol {symbol} not found")
        
        data = response.json()
        price = float(data['price'])
        
        return {
            "symbol": symbol,
            "price": price,
            "currency": "USDT"
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error fetching price: {str(e)}")

@app.post("/buy")
async def buy(trade_request: TradeRequest, db: Session = Depends(get_db)):
    try:
        symbol = trade_request.symbol.upper()
        if not symbol.endswith('USDT'):
            symbol = f"{symbol}USDT"
        
        # Get current price
        price_data = await get_price(symbol)
        current_price = price_data["price"]
        
        # Calculate quantity based on amount
        quantity = trade_request.amount / current_price
        
        # Create trade record
        trade = Trade(
            symbol=symbol,
            side="buy",
            price=current_price,
            quantity=quantity,
            is_simulated=trade_request.is_simulated,
            user_id=trade_request.user_id,
            timestamp=datetime.utcnow(),
            is_open=True
        )
        
        db.add(trade)
        db.commit()
        db.refresh(trade)
        
        return {
            "status": "success",
            "trade_id": trade.id,
            "symbol": symbol,
            "price": current_price,
            "quantity": quantity,
            "amount": trade_request.amount,
            "timestamp": trade.timestamp
        }
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error executing buy: {str(e)}")

@app.post("/sell")
async def sell(trade_request: TradeRequest, db: Session = Depends(get_db)):
    try:
        symbol = trade_request.symbol.upper()
        if not symbol.endswith('USDT'):
            symbol = f"{symbol}USDT"
        
        # Get current price
        price_data = await get_price(symbol)
        current_price = price_data["price"]
        
        # Calculate quantity based on amount
        quantity = trade_request.amount / current_price
        
        # Create trade record
        trade = Trade(
            symbol=symbol,
            side="sell",
            price=current_price,
            quantity=quantity,
            is_simulated=trade_request.is_simulated,
            user_id=trade_request.user_id,
            timestamp=datetime.utcnow(),
            is_open=False
        )
        
        db.add(trade)
        
        # Close related open positions
        open_positions = db.query(Trade).filter(
            Trade.symbol == symbol,
            Trade.side == "buy",
            Trade.is_open == True
        ).all()
        
        for position in open_positions:
            position.is_open = False
        
        db.commit()
        db.refresh(trade)
        
        return {
            "status": "success",
            "trade_id": trade.id,
            "symbol": symbol,
            "price": current_price,
            "quantity": quantity,
            "amount": trade_request.amount,
            "timestamp": trade.timestamp
        }
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error executing sell: {str(e)}")

@app.get("/status")
async def status(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    try:
        # Get all open positions
        query = db.query(Trade).filter(Trade.is_open == True)
        
        if user_id:
            query = query.filter(Trade.user_id == user_id)
        
        open_positions = query.all()
        positions = []
        
        for position in open_positions:
            # Get current price for this symbol
            current_price_data = await get_price(position.symbol)
            current_price = current_price_data["price"]
            
            # Calculate profit/loss
            pnl_percentage = ((current_price - position.price) / position.price) * 100
            pnl_amount = (current_price - position.price) * position.quantity
            
            positions.append({
                "trade_id": position.id,
                "symbol": position.symbol,
                "entry_price": position.price,
                "current_price": current_price,
                "quantity": position.quantity,
                "value_at_entry": position.price * position.quantity,
                "current_value": current_price * position.quantity,
                "pnl_percentage": pnl_percentage,
                "pnl_amount": pnl_amount,
                "timestamp": position.timestamp,
                "is_simulated": position.is_simulated
            })
        
        total_value = sum(p["current_value"] for p in positions)
        total_invested = sum(p["value_at_entry"] for p in positions)
        overall_pnl = sum(p["pnl_amount"] for p in positions)
        overall_pnl_percentage = 0
        
        if total_invested > 0:
            overall_pnl_percentage = (overall_pnl / total_invested) * 100
        
        return {
            "status": "success",
            "positions": positions,
            "summary": {
                "total_positions": len(positions),
                "total_invested": total_invested,
                "total_current_value": total_value,
                "overall_pnl": overall_pnl,
                "overall_pnl_percentage": overall_pnl_percentage
            }
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error getting status: {str(e)}")
@app.get("/trade-history")
async def trade_history(
    user_id: Optional[int] = None,
    symbol: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get trade history with optional filtering"""
    query = db.query(Trade)
    
    if user_id:
        query = query.filter(Trade.user_id == user_id)
    
    if symbol:
        # Normalize symbol format
        if not symbol.endswith('USDT'):
            symbol = f"{symbol}USDT"
        query = query.filter(Trade.symbol == symbol)
    
    # Get the trades, ordered by timestamp (newest first)
    trades = query.order_by(Trade.timestamp.desc()).limit(limit).all()
    
    return {
        "trades": [
            {
                "id": t.id,
                "symbol": t.symbol,
                "side": t.side,
                "price": t.price,
                "quantity": t.quantity,
                "value": t.price * t.quantity,
                "timestamp": t.timestamp,
                "is_simulated": t.is_simulated,
                "is_open": t.is_open
            }
            for t in trades
        ]
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)