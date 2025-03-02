# market_data_collector.py
import os
import time
import logging
import pandas as pd
import numpy as np
import threading
import schedule
import requests
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from binance.client import Client
from binance.exceptions import BinanceAPIException
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from models import MarketData, get_db
from sqlalchemy import select, exists
from sqlalchemy.sql import text


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class MarketDataCollector:
    """
    Collects and stores market data for the top cryptocurrencies by volume.
    """
    
    def __init__(self, api_key: Optional[str] = None, api_secret: Optional[str] = None):
        """
        Initialize the market data collector.
        
        Args:
            api_key: Binance API key (optional)
            api_secret: Binance API secret (optional)
        """
        self.api_key = api_key or os.environ.get('BINANCE_API_KEY')
        self.api_secret = api_secret or os.environ.get('BINANCE_API_SECRET')
        
        # Initialize Binance client if API credentials are provided
        self.client = None
        if self.api_key and self.api_secret:
            self.client = Client(self.api_key, self.api_secret)
        
        # Default settings
        self.excluded_base_assets = ['BTC', 'ETH', 'BNB', 'USDC', 'XRP']
        self.quote_asset = 'USDT'
        self.top_n_symbols = 15
        self.update_interval_minutes = 60  # Update market data hourly
        self.update_symbols_interval_hours = 24  # Update top symbols daily
        
        # Initialize storage
        self.active_symbols = []
        self.is_running = False
        self.scheduler_thread = None
        
    def get_top_symbols(self) -> List[str]:
        """
        Get the top N symbols by 24h volume, excluding specified base assets.
        
        Returns:
            List of symbol strings (e.g., ['ADAUSDT', 'SOLUSDT', ...])
        """
        try:
            # Use Binance client if available
            if self.client:
                # Get 24h ticker information
                tickers = self.client.get_ticker()
                
                # Filter for USDT pairs and exclude specified base assets
                filtered_tickers = [
                    ticker for ticker in tickers
                    if ticker['symbol'].endswith(self.quote_asset) and
                    not any(ticker['symbol'].startswith(excluded) for excluded in self.excluded_base_assets)
                ]
                
                # Sort by 24h volume (descending)
                sorted_tickers = sorted(
                    filtered_tickers,
                    key=lambda x: float(x['volume']) * float(x['lastPrice']),
                    reverse=True
                )
                
                # Return top N symbols
                return [ticker['symbol'] for ticker in sorted_tickers[:self.top_n_symbols]]
            else:
                # Fallback to public API
                logger.info("Using public API to fetch top symbols")
                response = requests.get('https://api.binance.com/api/v3/ticker/24hr', timeout=10)
                tickers = response.json()
                
                # Filter and sort same as above
                filtered_tickers = [
                    ticker for ticker in tickers
                    if ticker['symbol'].endswith(self.quote_asset) and
                    not any(ticker['symbol'].startswith(excluded) for excluded in self.excluded_base_assets)
                ]
                
                sorted_tickers = sorted(
                    filtered_tickers,
                    key=lambda x: float(x['volume']) * float(x['lastPrice']),
                    reverse=True
                )
                
                return [ticker['symbol'] for ticker in sorted_tickers[:self.top_n_symbols]]
                
        except Exception as e:
            logger.error(f"Error getting top symbols: {str(e)}")
            # Return a default list of popular symbols if API fails
            return [
                'ADAUSDT', 'SOLUSDT', 'DOTUSDT', 'AVAXUSDT', 'MATICUSDT',
                'LINKUSDT', 'UNIUSDT', 'SHIBUSDT', 'XRPUSDT', 'DOGEUSDT',
                'LTCUSDT', 'ATOMUSDT', 'NEARUSDT', 'ALGOUSDT', 'FILUSDT'
            ]
                
    def get_klines(self, symbol: str, interval: str = Client.KLINE_INTERVAL_1HOUR, 
                  limit: int = 1000) -> pd.DataFrame:
        """
        Get candlestick data for a symbol with specified interval.
        
        Args:
            symbol: Trading pair symbol (e.g., 'BTCUSDT')
            interval: Kline interval (default: 1 hour)
            limit: Number of records to fetch (default: 1000)
            
        Returns:
            DataFrame with OHLCV data
        """
        try:
            if self.client:
                # Use authenticated client
                klines = self.client.get_klines(symbol=symbol, interval=interval, limit=limit)
            else:
                # Use public API
                url = f"https://api.binance.com/api/v3/klines?symbol={symbol}&interval={interval}&limit={limit}"
                response = requests.get(url, timeout=10)
                klines = response.json()
                
            # Parse the response
            data = []
            for k in klines:
                data.append({
                    'timestamp': datetime.fromtimestamp(k[0] / 1000),
                    'open': float(k[1]),
                    'high': float(k[2]),
                    'low': float(k[3]),
                    'close': float(k[4]),
                    'volume': float(k[5]),
                    'close_time': datetime.fromtimestamp(k[6] / 1000),
                    'quote_asset_volume': float(k[7]),
                    'number_of_trades': int(k[8]),
                    'taker_buy_base_volume': float(k[9]),
                    'taker_buy_quote_volume': float(k[10])
                })
                
            return pd.DataFrame(data)
            
        except Exception as e:
            logger.error(f"Error fetching klines for {symbol}: {str(e)}")
            return pd.DataFrame()
            
    def store_market_data(self, symbol: str, data: pd.DataFrame):
        """
        Store market data in the database.
        
        Args:
            symbol: Trading pair symbol
            data: DataFrame with OHLCV data
        """
        if data.empty:
            logger.warning(f"No data to store for {symbol}")
            return
            
        try:
            # Get database session
            db = next(get_db())
            
            # Prepare records for insertion
            records = []
            for _, row in data.iterrows():
                market_data = MarketData(
                    symbol=symbol,
                    timestamp=row['timestamp'],
                    open=row['open'],
                    high=row['high'],
                    low=row['low'],
                    close=row['close'],
                    volume=row['volume']
                )
                records.append(market_data)
            
            # Bulk insert with conflict handling
            from sqlalchemy.dialects.postgresql import insert
            from sqlalchemy import exists, select
            
            for record in records:
                # Check if record exists
                exists_query = select(exists().where(
                    (MarketData.symbol == record.symbol) & 
                    (MarketData.timestamp == record.timestamp)
                ))
                
                
                record_exists = db.execute(exists_query).scalar()
                
                if not record_exists:
                    db.add(record)
            
            db.commit()
            logger.info(f"Stored {len(records)} records for {symbol}")
            
        except SQLAlchemyError as e:
            logger.error(f"Database error storing data for {symbol}: {str(e)}")
            if 'db' in locals():
                db.rollback()
        except Exception as e:
            logger.error(f"Error storing data for {symbol}: {str(e)}")
            if 'db' in locals():
                db.rollback()
        finally:
            if 'db' in locals():
                db.close()
    
    def update_market_data(self):
        """Update market data for all active symbols."""
        if not self.active_symbols:
            self.active_symbols = self.get_top_symbols()
            
        logger.info(f"Updating market data for {len(self.active_symbols)} symbols")
        
        for symbol in self.active_symbols:
            try:
                # Get candlestick data
                data = self.get_klines(symbol)
                
                # Store in database
                if not data.empty:
                    self.store_market_data(symbol, data)
                    
                # Avoid hitting rate limits
                time.sleep(0.5)
                
            except Exception as e:
                logger.error(f"Error updating {symbol}: {str(e)}")
    
    def update_active_symbols(self):
        """Update the list of active symbols based on current volume."""
        try:
            new_symbols = self.get_top_symbols()
            
            if set(new_symbols) != set(self.active_symbols):
                logger.info(f"Updating active symbols: {', '.join(new_symbols)}")
                self.active_symbols = new_symbols
            else:
                logger.info("Active symbols unchanged")
                
        except Exception as e:
            logger.error(f"Error updating active symbols: {str(e)}")
    
    def schedule_tasks(self):
        """Schedule regular tasks."""
        # Update market data every hour
        schedule.every(self.update_interval_minutes).minutes.do(self.update_market_data)
        
        # Update active symbols list daily
        schedule.every(self.update_symbols_interval_hours).hours.do(self.update_active_symbols)
        
        # Initial run
        self.update_active_symbols()
        self.update_market_data()
        
        # Keep running scheduled tasks
        while self.is_running:
            schedule.run_pending()
            time.sleep(1)
    
    def start(self):
        """Start the data collection service."""
        if self.is_running:
            logger.warning("Market data collector is already running")
            return
            
        self.is_running = True
        
        # Start scheduler in a separate thread
        self.scheduler_thread = threading.Thread(target=self.schedule_tasks)
        self.scheduler_thread.daemon = True
        self.scheduler_thread.start()
        
        logger.info("Market data collector started")
    
    def stop(self):
        """Stop the data collection service."""
        if not self.is_running:
            logger.warning("Market data collector is not running")
            return
            
        self.is_running = False
        
        if self.scheduler_thread:
            self.scheduler_thread.join(timeout=5)
            
        logger.info("Market data collector stopped")

# Example usage
if __name__ == "__main__":
    collector = MarketDataCollector()
    collector.start()
    
    try:
        # Keep main thread alive
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        collector.stop()
        logger.info("Service stopped by user")