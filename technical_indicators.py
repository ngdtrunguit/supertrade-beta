# technical_indicators.py
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class TechnicalIndicators:
    """
    Technical indicators implementation for crypto trading strategies.
    Includes EMA crossover, RSI, and VWAP indicators as specified.
    """
    
    def __init__(self):
        """Initialize the technical indicators processor."""
        self.indicators_config = {
            'ema_short': 7,       # 7-day EMA (short period)
            'ema_long': 21,       # 21-day EMA (long period)
            'rsi_period': 14,     # 14-period RSI
            'rsi_oversold': 30,   # RSI oversold threshold
            'rsi_overbought': 70, # RSI overbought threshold
            'vwap_deviation': 3   # VWAP deviation percentage (±3%)
        }
    
    def calculate_ema(self, data: pd.DataFrame, column: str = 'close', 
                      short_period: int = None, long_period: int = None) -> pd.DataFrame:
        """
        Calculate Exponential Moving Averages for the given data.
        
        Args:
            data: DataFrame with price data
            column: Column name to use for calculations (default: 'close')
            short_period: Period for short EMA (default: from config)
            long_period: Period for long EMA (default: from config)
            
        Returns:
            DataFrame with added EMA columns
        """
        if short_period is None:
            short_period = self.indicators_config['ema_short']
        if long_period is None:
            long_period = self.indicators_config['ema_long']
            
        # Create a copy to avoid modifying the original DataFrame
        result = data.copy()
        
        # Calculate EMAs
        result[f'ema_{short_period}'] = result[column].ewm(span=short_period, adjust=False).mean()
        result[f'ema_{long_period}'] = result[column].ewm(span=long_period, adjust=False).mean()
        
        return result
    
    def calculate_rsi(self, data: pd.DataFrame, column: str = 'close', 
                     period: int = None) -> pd.DataFrame:
        """
        Calculate the Relative Strength Index (RSI) for the given data.
        
        Args:
            data: DataFrame with price data
            column: Column name to use for calculations (default: 'close')
            period: Period for RSI calculation (default: from config)
            
        Returns:
            DataFrame with added RSI column
        """
        if period is None:
            period = self.indicators_config['rsi_period']
            
        # Create a copy to avoid modifying the original DataFrame
        result = data.copy()
        
        # Calculate price changes
        delta = result[column].diff()
        
        # Separate gains and losses
        gain = delta.copy()
        loss = delta.copy()
        gain[gain < 0] = 0
        loss[loss > 0] = 0
        loss = abs(loss)
        
        # Calculate average gains and losses
        avg_gain = gain.rolling(window=period).mean()
        avg_loss = loss.rolling(window=period).mean()
        
        # Calculate RS and RSI
        rs = avg_gain / avg_loss
        result['rsi'] = 100 - (100 / (1 + rs))
        
        return result
    
    def calculate_vwap(self, data: pd.DataFrame, 
                      price_col: str = 'close', 
                      volume_col: str = 'volume',
                      groupby_col: str = 'date') -> pd.DataFrame:
        """
        Calculate Volume Weighted Average Price (VWAP) on a daily basis.
        
        Args:
            data: DataFrame with price and volume data
            price_col: Column name for price data (default: 'close')
            volume_col: Column name for volume data (default: 'volume')
            groupby_col: Column to group by for VWAP periods (default: 'date')
            
        Returns:
            DataFrame with added VWAP column and deviation indicators
        """
        # Create a copy to avoid modifying the original DataFrame
        result = data.copy()
        
        # Ensure we have a date column to group by
        if groupby_col not in result.columns and 'timestamp' in result.columns:
            result[groupby_col] = pd.to_datetime(result['timestamp']).dt.date
        
        # Calculate typical price
        if 'high' in result.columns and 'low' in result.columns:
            result['typical_price'] = (result['high'] + result['low'] + result[price_col]) / 3
        else:
            result['typical_price'] = result[price_col]
            
        # Calculate price * volume
        result['pv'] = result['typical_price'] * result[volume_col]
        
        # Group by date and calculate cumulative values within each day
        result['cumulative_pv'] = result.groupby(groupby_col)['pv'].cumsum()
        result['cumulative_volume'] = result.groupby(groupby_col)[volume_col].cumsum()
        
        # Calculate VWAP
        result['vwap'] = result['cumulative_pv'] / result['cumulative_volume']
        
        # Calculate deviation from VWAP as percentage
        result['vwap_deviation'] = ((result[price_col] - result['vwap']) / result['vwap']) * 100
        
        # Add deviation alert indicators
        deviation_threshold = self.indicators_config['vwap_deviation']
        result['vwap_above_threshold'] = result['vwap_deviation'] > deviation_threshold
        result['vwap_below_threshold'] = result['vwap_deviation'] < -deviation_threshold
        
        return result
    
    def generate_signals(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Generate trading signals based on technical indicators.
        
        Args:
            data: DataFrame with price and volume data
            
        Returns:
            DataFrame with added signal columns
        """
        # Create a copy of input data
        df = data.copy()
        
        # Ensure we have all required indicators
        if 'ema_7' not in df.columns or 'ema_21' not in df.columns:
            df = self.calculate_ema(df)
            
        if 'rsi' not in df.columns:
            df = self.calculate_rsi(df)
            
        if 'vwap' not in df.columns:
            if 'volume' in df.columns:
                df = self.calculate_vwap(df)
        
        # Create signal columns with default neutral signal
        df['ema_signal'] = 0
        df['rsi_signal'] = 0
        df['vwap_signal'] = 0
        df['combined_signal'] = 0
        
        # Calculate EMA crossover signals
        # 1 for bullish (short crosses above long), -1 for bearish (short crosses below long)
        df['ema_above'] = df[f'ema_{self.indicators_config["ema_short"]}'] > df[f'ema_{self.indicators_config["ema_long"]}']
        df['ema_signal'] = df['ema_above'].diff().fillna(0)
        df.loc[df['ema_signal'] > 0, 'ema_signal'] = 1  # Bullish crossover
        df.loc[df['ema_signal'] < 0, 'ema_signal'] = -1  # Bearish crossover
        df.loc[df['ema_signal'] == 0, 'ema_signal'] = 0  # No crossover
        
        # Calculate RSI signals
        oversold = self.indicators_config['rsi_oversold']
        overbought = self.indicators_config['rsi_overbought']
        
        # Track when RSI crosses above oversold or below overbought
        df['rsi_above_oversold'] = df['rsi'] > oversold
        df['rsi_below_overbought'] = df['rsi'] < overbought
        
        # Generate signals when RSI crosses thresholds
        df.loc[(df['rsi_above_oversold'] == True) & (df['rsi_above_oversold'].shift(1) == False), 'rsi_signal'] = 1
        df.loc[(df['rsi_below_overbought'] == True) & (df['rsi_below_overbought'].shift(1) == False), 'rsi_signal'] = -1
        
        # Calculate VWAP signals if VWAP is available
        if 'vwap' in df.columns:
            deviation = self.indicators_config['vwap_deviation']
            
            # Buy signal when price crosses below VWAP - deviation%
            df.loc[df['vwap_deviation'] < -deviation, 'vwap_signal'] = 1
            
            # Sell signal when price crosses above VWAP + deviation%
            df.loc[df['vwap_deviation'] > deviation, 'vwap_signal'] = -1
        
        # Create combined signal (simple average of all signals)
        used_signals = ['ema_signal', 'rsi_signal']
        if 'vwap_signal' in df.columns:
            used_signals.append('vwap_signal')
            
        df['combined_signal'] = df[used_signals].mean(axis=1)
        
        # Determine final buy/sell/hold signal
        df['signal'] = 0  # 0 = hold
        df.loc[df['combined_signal'] >= 0.5, 'signal'] = 1  # 1 = buy
        df.loc[df['combined_signal'] <= -0.5, 'signal'] = -1  # -1 = sell
        
        return df
    
    def analyze_market_data(self, data: pd.DataFrame) -> Tuple[pd.DataFrame, Dict]:
        """
        Perform a complete analysis of market data with all indicators.
        
        Args:
            data: DataFrame with OHLCV data
            
        Returns:
            Tuple of (DataFrame with all indicators and signals, summary dict)
        """
        # Ensure data is sorted by timestamp
        df = data.sort_values('timestamp') if 'timestamp' in data.columns else data.copy()
        
        # Calculate all indicators
        df = self.calculate_ema(df)
        df = self.calculate_rsi(df)
        
        if 'volume' in df.columns:
            df = self.calculate_vwap(df)
        
        # Generate signals
        df = self.generate_signals(df)
        
        # Generate a summary
        latest = df.iloc[-1]
        summary = {
            'latest_close': latest['close'] if 'close' in latest else None,
            'latest_ema_short': latest[f'ema_{self.indicators_config["ema_short"]}'],
            'latest_ema_long': latest[f'ema_{self.indicators_config["ema_long"]}'],
            'latest_rsi': latest['rsi'],
            'latest_signal': latest['signal'],
            'rsi_status': 'oversold' if latest['rsi'] < self.indicators_config['rsi_oversold'] else 
                         ('overbought' if latest['rsi'] > self.indicators_config['rsi_overbought'] else 'neutral'),
            'ema_status': 'bullish' if latest['ema_above'] else 'bearish',
        }
        
        if 'vwap' in latest:
            summary.update({
                'latest_vwap': latest['vwap'],
                'vwap_deviation': latest['vwap_deviation'],
                'vwap_status': 'above_threshold' if latest['vwap_deviation'] > self.indicators_config['vwap_deviation'] else
                              ('below_threshold' if latest['vwap_deviation'] < -self.indicators_config['vwap_deviation'] else 'neutral')
            })
        
        return df, summary

    def get_alert_conditions(self, analyzed_data: pd.DataFrame) -> List[Dict]:
        """
        Generate alert conditions based on analyzed data.
        
        Args:
            analyzed_data: DataFrame with indicators and signals already calculated
            
        Returns:
            List of alert dictionaries
        """
        alerts = []
        latest = analyzed_data.iloc[-1]
        
        # Check for EMA crossover
        if latest['ema_signal'] == 1:
            alerts.append({
                'type': 'ema_crossover',
                'direction': 'bullish',
                'message': f"Bullish EMA Crossover: {self.indicators_config['ema_short']}-day EMA crossed above {self.indicators_config['ema_long']}-day EMA"
            })
        elif latest['ema_signal'] == -1:
            alerts.append({
                'type': 'ema_crossover',
                'direction': 'bearish',
                'message': f"Bearish EMA Crossover: {self.indicators_config['ema_short']}-day EMA crossed below {self.indicators_config['ema_long']}-day EMA"
            })
            
        # Check for RSI conditions
        if latest['rsi_signal'] == 1:
            alerts.append({
                'type': 'rsi_oversold_exit',
                'direction': 'bullish',
                'message': f"RSI Oversold Exit: RSI crossed above {self.indicators_config['rsi_oversold']} from oversold condition"
            })
        elif latest['rsi_signal'] == -1:
            alerts.append({
                'type': 'rsi_overbought_exit',
                'direction': 'bearish',
                'message': f"RSI Overbought Exit: RSI crossed below {self.indicators_config['rsi_overbought']} from overbought condition"
            })
            
        # Check for VWAP alerts
        if 'vwap_signal' in analyzed_data.columns:
            deviation = self.indicators_config['vwap_deviation']
            if latest['vwap_signal'] == 1:
                alerts.append({
                    'type': 'vwap_deviation',
                    'direction': 'bullish',
                    'message': f"Price below VWAP: Currently {abs(latest['vwap_deviation']):.2f}% below VWAP (threshold: {deviation}%)"
                })
            elif latest['vwap_signal'] == -1:
                alerts.append({
                    'type': 'vwap_deviation',
                    'direction': 'bearish',
                    'message': f"Price above VWAP: Currently {latest['vwap_deviation']:.2f}% above VWAP (threshold: {deviation}%)"
                })
                
        return alerts