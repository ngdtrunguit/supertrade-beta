from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, create_engine, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import os
from datetime import datetime

Base = declarative_base()

class Trade(Base):
    __tablename__ = 'trades'
    
    id = Column(Integer, primary_key=True)
    symbol = Column(String, nullable=False)
    side = Column(String, nullable=False)  # 'buy' or 'sell'
    price = Column(Float, nullable=False)
    quantity = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    is_simulated = Column(Boolean, default=True)
    user_id = Column(Integer, nullable=True)
    is_open = Column(Boolean, default=True)  # To track if position is still open
    
# Setup database connection - using SQLite for simplicity in testing
#DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./crypto_trades.db")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://crypto_user:password@localhost/crypto_bot")
engine = create_engine(DATABASE_URL)
Base.metadata.create_all(engine)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()