# app.py
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, Query, Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from typing import List, Dict, Optional, Any
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import pandas as pd
import os
import json
import jwt
from pydantic import BaseModel, Field

# Import our modules
from models import User, ApiKey, UserPreference, Trade, Alert, get_db
from technical_indicators import TechnicalIndicators
from trading_strategy import TradingStrategy
from market_data_collector import MarketDataCollector
from trading_simulator import TradingSimulator

# Initialize FastAPI app
app = FastAPI(
    title="Crypto Trading Bot API",
    description="API for crypto trading bot with technical indicators and simulation",
    version="1.0.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Add root route
@app.get("/")
async def read_root():
    return FileResponse("static/index.html")


# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-for-development-only")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 12  # 12 hours

# OAuth2 password bearer for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Initialize global components
indicators = TechnicalIndicators()
market_data_collector = MarketDataCollector()
# Start data collector in the background
market_data_collector.start()

# Pydantic models for API
class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    username: str

class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    telegram_id: Optional[str] = None
    created_at: datetime
    is_active: bool

    class Config:
        orm_mode = True

class ApiKeyCreate(BaseModel):
    exchange: str
    api_key: str
    api_secret: str
    label: Optional[str] = None
    is_test_only: bool = True

class ApiKeyResponse(BaseModel):
    id: int
    exchange: str
    label: Optional[str] = None
    created_at: datetime
    is_active: bool
    is_test_only: bool

    class Config:
        orm_mode = True

class UserPreferenceUpdate(BaseModel):
    default_trade_amount: Optional[float] = None
    risk_level: Optional[int] = None
    notification_settings: Optional[Dict[str, bool]] = None
    default_symbols: Optional[List[str]] = None
    theme: Optional[str] = None

class UserPreferenceResponse(BaseModel):
    id: int
    user_id: int
    default_trade_amount: float
    risk_level: int
    notification_settings: Dict[str, bool]
    default_symbols: List[str]
    theme: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class TradeRequest(BaseModel):
    symbol: str
    amount: float
    is_simulated: bool = True

class TradeResponse(BaseModel):
    id: int
    symbol: str
    side: str
    price: float
    quantity: float
    total_value: float
    fee: Optional[float] = None
    timestamp: datetime
    exchange: str
    is_simulated: bool
    is_open: bool
    profit_loss: Optional[float] = None
    profit_loss_pct: Optional[float] = None

    class Config:
        orm_mode = True

class AlertCreate(BaseModel):
    symbol: str
    alert_type: str
    condition: Dict[str, Any]
    message: str
    notify_email: bool = True
    notify_telegram: bool = True

class AlertResponse(BaseModel):
    id: int
    user_id: int
    symbol: str
    alert_type: str
    condition: Dict[str, Any]
    message: str
    created_at: datetime
    triggered_at: Optional[datetime] = None
    status: str
    notify_email: bool
    notify_telegram: bool

    class Config:
        orm_mode = True

class SimulationRequest(BaseModel):
    symbols: List[str]
    starting_capital: float = 10000.0
    risk_level: int = 3
    days: int = 30
    interval: str = "1h"

# Helper functions for authentication
def verify_password(plain_password, hashed_password):
    """Verify password."""
    # This would typically use a hash verification library
    # For this example, we'll just use the User model
    user = User()
    user.password_hash = hashed_password
    return user.verify_password(plain_password)

def get_user(db: Session, username: str):
    """Get user by username."""
    return db.query(User).filter(User.username == username).first()

def authenticate_user(db: Session, username: str, password: str):
    """Authenticate user."""
    user = get_user(db, username)
    if not user:
        return False
    if not verify_password(password, user.password_hash):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Get current user from token."""
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    user = get_user(db, username=username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    """Get current active user."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# API Endpoints
@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login endpoint to get JWT token."""
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "username": user.username
    }

@app.post("/users", response_model=UserResponse)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Create a new user."""
    # Check if username exists
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Check if email exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    new_user = User(
        username=user.username,
        email=user.email
    )
    new_user.set_password(user.password)
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create default preferences
    preferences = UserPreference(user_id=new_user.id)
    db.add(preferences)
    db.commit()
    
    return new_user

@app.get("/users/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """Get current user information."""
    return current_user

@app.post("/api-keys", response_model=ApiKeyResponse)
async def create_api_key(api_key: ApiKeyCreate, 
                        current_user: User = Depends(get_current_active_user),
                        db: Session = Depends(get_db)):
    """Create a new API key for the current user."""
    # Create new API key
    new_api_key = ApiKey(
        user_id=current_user.id,
        exchange=api_key.exchange,
        label=api_key.label,
        is_test_only=api_key.is_test_only
    )
    
    # Encrypt API credentials
    new_api_key.encrypt_api_credentials(api_key.api_key, api_key.api_secret)
    
    db.add(new_api_key)
    db.commit()
    db.refresh(new_api_key)
    
    return new_api_key

@app.get("/api-keys", response_model=List[ApiKeyResponse])
async def get_api_keys(current_user: User = Depends(get_current_active_user),
                      db: Session = Depends(get_db)):
    """Get all API keys for the current user."""
    return db.query(ApiKey).filter(ApiKey.user_id == current_user.id).all()

@app.get("/preferences", response_model=UserPreferenceResponse)
async def get_preferences(current_user: User = Depends(get_current_active_user),
                         db: Session = Depends(get_db)):
    """Get user preferences."""
    preferences = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not preferences:
        # Create default preferences if not exist
        preferences = UserPreference(user_id=current_user.id)
        db.add(preferences)
        db.commit()
        db.refresh(preferences)
    
    return preferences

@app.put("/preferences", response_model=UserPreferenceResponse)
async def update_preferences(preferences: UserPreferenceUpdate,
                            current_user: User = Depends(get_current_active_user),
                            db: Session = Depends(get_db)):
    """Update user preferences."""
    db_preferences = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not db_preferences:
        # Create default preferences if not exist
        db_preferences = UserPreference(user_id=current_user.id)
        db.add(db_preferences)
        db.commit()
        db.refresh(db_preferences)
    
    # Update fields
    if preferences.default_trade_amount is not None:
        db_preferences.default_trade_amount = preferences.default_trade_amount
    
    if preferences.risk_level is not None:
        if preferences.risk_level < 1 or preferences.risk_level > 5:
            raise HTTPException(status_code=400, detail="Risk level must be between 1 and 5")
        db_preferences.risk_level = preferences.risk_level
    
    if preferences.notification_settings is not None:
        db_preferences.notification_settings = json.dumps(preferences.notification_settings)
    
    if preferences.default_symbols is not None:
        db_preferences.default_symbols = json.dumps(preferences.default_symbols)
    
    if preferences.theme is not None:
        db_preferences.theme = preferences.theme
    
    db_preferences.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_preferences)
    
    return db_preferences

@app.get("/market-data/{symbol}")
async def get_market_data(symbol: str, 
                         interval: str = "1h", 
                         limit: int = 100,
                         include_indicators: bool = False):
    """Get market data for a symbol."""
    try:
        # Get market data
        data = market_data_collector.get_klines(symbol, interval=interval, limit=limit)
        
        if data.empty:
            raise HTTPException(status_code=404, detail=f"No data found for {symbol}")
        
        # Calculate indicators if requested
        if include_indicators:
            data, summary = indicators.analyze_market_data(data)
            
            return {
                "market_data": data.to_dict(orient="records"),
                "summary": summary
            }
        
        return {
            "market_data": data.to_dict(orient="records")
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/technical-analysis/{symbol}")
async def get_technical_analysis(symbol: str, 
                               interval: str = "1h", 
                               limit: int = 100):
    """Get technical analysis for a symbol."""
    try:
        # Get market data
        data = market_data_collector.get_klines(symbol, interval=interval, limit=limit)
        
        if data.empty:
            raise HTTPException(status_code=404, detail=f"No data found for {symbol}")
        
        # Calculate indicators
        analyzed_data, summary = indicators.analyze_market_data(data)
        
        # Get alerts
        alerts = indicators.get_alert_conditions(analyzed_data)
        
        return {
            "symbol": symbol,
            "interval": interval,
            "summary": summary,
            "alerts": alerts,
            "last_updated": datetime.now().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/simulate/trade")
async def simulate_trade(trade_request: TradeRequest,
                        current_user: User = Depends(get_current_active_user),
                        db: Session = Depends(get_db)):
    """Simulate a trade."""
    try:
        # Get user preferences
        preferences = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
        if not preferences:
            # Create default preferences if not exist
            preferences = UserPreference(user_id=current_user.id)
            db.add(preferences)
            db.commit()
            db.refresh(preferences)
        
        # Initialize simulator
        simulator = TradingSimulator(
            user_id=current_user.id,
            starting_capital=preferences.default_trade_amount * 10,  # 10x default trade amount
            risk_level=preferences.risk_level,
            data_collector=market_data_collector
        )
        
        # Execute buy trade
        result = simulator.execute_buy(
            symbol=trade_request.symbol,
            amount=trade_request.amount,
            store_in_db=True
        )
        
        if result['status'] != 'success':
            return JSONResponse(status_code=400, content=result)
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/simulate/run", response_model=Dict)
async def run_simulation(sim_request: SimulationRequest,
                        current_user: User = Depends(get_current_active_user)):
    """Run a trading simulation."""
    try:
        # Initialize simulator
        simulator = TradingSimulator(
            user_id=current_user.id,
            starting_capital=sim_request.starting_capital,
            risk_level=sim_request.risk_level,
            data_collector=market_data_collector
        )
        
        # Run simulation
        results = simulator.run_simulation(
            symbols=sim_request.symbols,
            days=sim_request.days,
            interval=sim_request.interval
        )
        
        return results
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/trades", response_model=List[TradeResponse])
async def get_trades(current_user: User = Depends(get_current_active_user),
                     db: Session = Depends(get_db),
                     limit: int = Query(100, ge=1, le=1000),
                     offset: int = Query(0, ge=0),
                     symbol: Optional[str] = None,
                     is_simulated: Optional[bool] = None,
                     is_open: Optional[bool] = None):
    """Get trades for the current user."""
    query = db.query(Trade).filter(Trade.user_id == current_user.id)
    
    # Apply filters
    if symbol:
        query = query.filter(Trade.symbol == symbol)
    
    if is_simulated is not None:
        query = query.filter(Trade.is_simulated == is_simulated)
    
    if is_open is not None:
        query = query.filter(Trade.is_open == is_open)
    
    # Apply pagination
    query = query.order_by(Trade.timestamp.desc()).offset(offset).limit(limit)
    
    return query.all()

@app.post("/alerts", response_model=AlertResponse)
async def create_alert(alert: AlertCreate,
                      current_user: User = Depends(get_current_active_user),
                      db: Session = Depends(get_db)):
    """Create a new alert."""
    new_alert = Alert(
        user_id=current_user.id,
        symbol=alert.symbol,
        alert_type=alert.alert_type,
        condition=json.dumps(alert.condition),
        message=alert.message,
        notify_email=alert.notify_email,
        notify_telegram=alert.notify_telegram
    )
    
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    
    return new_alert

@app.get("/alerts", response_model=List[AlertResponse])
async def get_alerts(current_user: User = Depends(get_current_active_user),
                    db: Session = Depends(get_db),
                    status: Optional[str] = None):
    """Get alerts for the current user."""
    query = db.query(Alert).filter(Alert.user_id == current_user.id)
    
    # Apply status filter
    if status:
        query = query.filter(Alert.status == status)
    
    return query.order_by(Alert.created_at.desc()).all()

@app.get("/market/top-symbols")
async def get_top_symbols():
    """Get top symbols by 24h volume."""
    try:
        top_symbols = market_data_collector.get_top_symbols()
        return {"symbols": top_symbols}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Run on startup."""
    # Start market data collector if not already running
    if not market_data_collector.is_running:
        market_data_collector.start()

@app.on_event("shutdown")
async def shutdown_event():
    """Run on shutdown."""
    # Stop market data collector
    if market_data_collector.is_running:
        market_data_collector.stop()

# Run the app with Uvicorn if called directly
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)