# models.py
import sqlalchemy
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, JSON, Text, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.sql import func
import os
from datetime import datetime
from passlib.hash import pbkdf2_sha256
from cryptography.fernet import Fernet
import enum
import json
import base64

Base = declarative_base()

class TradeSide(enum.Enum):
    BUY = "buy"
    SELL = "sell"

class AlertStatus(enum.Enum):
    PENDING = "pending"
    TRIGGERED = "triggered"
    ACKNOWLEDGED = "acknowledged"
    EXPIRED = "expired"

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    telegram_id = Column(String(50), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    is_active = Column(Boolean, default=True)
    
    # Relationships
    api_keys = relationship("ApiKey", back_populates="user", cascade="all, delete-orphan")
    trades = relationship("Trade", back_populates="user", cascade="all, delete-orphan")
    preferences = relationship("UserPreference", back_populates="user", uselist=False, cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="user", cascade="all, delete-orphan")
    
    def set_password(self, password):
        self.password_hash = pbkdf2_sha256.hash(password)
        
    def verify_password(self, password):
        return pbkdf2_sha256.verify(password, self.password_hash)

class ApiKey(Base):
    __tablename__ = 'api_keys'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    exchange = Column(String(50), nullable=False)
    api_key_encrypted = Column(Text, nullable=False)
    api_secret_encrypted = Column(Text, nullable=False)
    label = Column(String(100))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    is_active = Column(Boolean, default=True)
    is_test_only = Column(Boolean, default=True)  # Safety flag to restrict to test API endpoints only
    
    # Relationships
    user = relationship("User", back_populates="api_keys")
    
    # Class variable for encryption key
    _encryption_key = None
    
    @classmethod
    def get_encryption_key(cls):
        """Get or generate the encryption key for API credentials"""
        if cls._encryption_key is None:
            # Get key from environment or create a new one
            env_key = os.getenv('API_ENCRYPTION_KEY')
            if env_key:
                key_bytes = base64.urlsafe_b64decode(env_key)
            else:
                # Generate a new key if not found in environment (development only)
                key_bytes = Fernet.generate_key()
                
            cls._encryption_key = key_bytes
        
        return cls._encryption_key
    
    def encrypt_api_credentials(self, api_key, api_secret):
        """Encrypt API credentials before storing in database"""
        key = self.get_encryption_key()
        f = Fernet(key)
        
        self.api_key_encrypted = f.encrypt(api_key.encode()).decode()
        self.api_secret_encrypted = f.encrypt(api_secret.encode()).decode()
    
    def decrypt_api_key(self):
        """Decrypt API key"""
        if not self.api_key_encrypted:
            return None
            
        key = self.get_encryption_key()
        f = Fernet(key)
        
        return f.decrypt(self.api_key_encrypted.encode()).decode()
    
    def decrypt_api_secret(self):
        """Decrypt API secret"""
        if not self.api_secret_encrypted:
            return None
            
        key = self.get_encryption_key()
        f = Fernet(key)
        
        return f.decrypt(self.api_secret_encrypted.encode()).decode()

class UserPreference(Base):
    __tablename__ = 'user_preferences'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), unique=True, nullable=False)
    default_trade_amount = Column(Float, default=100.0)  # Default amount in USD
    risk_level = Column(Integer, default=3)  # 1-5 scale (1: very conservative, 5: aggressive)
    notification_settings = Column(JSON, default=lambda: json.dumps({
        "email": True,
        "telegram": True,
        "trade_execution": True,
        "price_alerts": True,
        "technical_alerts": True
    }))
    default_symbols = Column(JSON, default=lambda: json.dumps([
        "BTCUSDT", "ETHUSDT", "BNBUSDT", "ADAUSDT", "SOLUSDT"
    ]))
    theme = Column(String(20), default="light")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="preferences")
    
    def get_notification_settings(self):
        """Get notification settings as dictionary"""
        if isinstance(self.notification_settings, str):
            return json.loads(self.notification_settings)
        return self.notification_settings
        
    def get_default_symbols(self):
        """Get default symbols as list"""
        if isinstance(self.default_symbols, str):
            return json.loads(self.default_symbols)
        return self.default_symbols

class Trade(Base):
    __tablename__ = 'trades'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    symbol = Column(String(20), nullable=False)
    side = Column(Enum(TradeSide), nullable=False)
    price = Column(Float, nullable=False)
    quantity = Column(Float, nullable=False)
    total_value = Column(Float, nullable=False)  # price * quantity
    fee = Column(Float, default=0.0)
    timestamp = Column(DateTime, default=datetime.utcnow)
    exchange = Column(String(50), default="binance")
    order_id = Column(String(100), nullable=True)  # Exchange order ID for real trades
    is_simulated = Column(Boolean, default=True)
    is_open = Column(Boolean, default=True)  # To track if position is still open
    strategy = Column(String(50), nullable=True)  # Which strategy generated this trade
    notes = Column(Text, nullable=True)  # Optional notes about the trade
    
    # Additional columns for tracking entry/exit points
    entry_indicators = Column(JSON, nullable=True)  # Indicator values at entry
    exit_indicators = Column(JSON, nullable=True)  # Indicator values at exit
    
    # Relationships
    user = relationship("User", back_populates="trades")
    
    def calculate_profit_loss(self, current_price=None):
        """Calculate profit/loss for this trade"""
        if not self.is_open or current_price is None:
            return 0
            
        if self.side == TradeSide.BUY:
            return (current_price - self.price) * self.quantity
        else:
            return (self.price - current_price) * self.quantity

class MarketData(Base):
    __tablename__ = 'market_data'
    
    id = Column(Integer, primary_key=True)
    symbol = Column(String(20), nullable=False)
    timestamp = Column(DateTime, nullable=False)
    open = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    low = Column(Float, nullable=False)
    close = Column(Float, nullable=False)
    volume = Column(Float, nullable=False)
    
    # Composite unique constraint to avoid duplicates
    __table_args__ = (
        sqlalchemy.UniqueConstraint('symbol', 'timestamp', name='uix_symbol_timestamp'),
    )

class Alert(Base):
    __tablename__ = 'alerts'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    symbol = Column(String(20), nullable=False)
    alert_type = Column(String(50), nullable=False)  # price, ema_cross, rsi, etc.
    condition = Column(JSON, nullable=False)  # Condition details as JSON
    message = Column(Text, nullable=False)  # Alert message
    created_at = Column(DateTime, server_default=func.now())
    triggered_at = Column(DateTime, nullable=True)
    status = Column(Enum(AlertStatus), default=AlertStatus.PENDING)
    notify_email = Column(Boolean, default=True)
    notify_telegram = Column(Boolean, default=True)
    
    # Relationship
    user = relationship("User", back_populates="alerts")
    
    def get_condition(self):
        """Get condition as dictionary"""
        if isinstance(self.condition, str):
            return json.loads(self.condition)
        return self.condition
        
    def trigger(self):
        """Mark alert as triggered"""
        self.triggered_at = datetime.utcnow()
        self.status = AlertStatus.TRIGGERED

# Create all tables if they don't exist
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://crypto_user:crypto_password@localhost/crypto_bot")
engine = sqlalchemy.create_engine(DATABASE_URL)
Base.metadata.create_all(engine)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """Database session generator"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()