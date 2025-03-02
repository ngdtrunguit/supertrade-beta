# Using SQLAlchemy ORM for database abstraction
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

Base = declarative_base()

class Trade(Base):
    __tablename__ = 'trades'
    
    id = Column(Integer, primary_key=True)
    exchange = Column(String)
    symbol = Column(String)
    side = Column(String)  # buy or sell
    price = Column(Float)
    quantity = Column(Float)
    timestamp = Column(DateTime)
    is_simulated = Column(Boolean, default=False)
    user_id = Column(Integer, ForeignKey('users.id'))
    
    user = relationship("User", back_populates="trades")

# Connection setup
DATABASE_URL = "postgresql://username:password@localhost/crypto_bot"
engine = create_engine(DATABASE_URL)
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)