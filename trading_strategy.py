# trading_strategy.py
import logging
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from technical_indicators import TechnicalIndicators

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class TradingStrategy:
    """
    Trading strategy implementation that combines multiple technical indicators
    to generate trading signals.
    """
    
    def __init__(self, 
                risk_level: int = 3,
                use_ema: bool = True, 
                use_rsi: bool = True, 
                use_vwap: bool = True):
        """
        Initialize the trading strategy.
        
        Args:
            risk_level: Risk level from 1 (conservative) to 5 (aggressive)
            use_ema: Whether to use EMA crossover signals
            use_rsi: Whether to use RSI signals
            use_vwap: Whether to use VWAP deviation signals
        """
        self.risk_level = risk_level
        self.use_ema = use_ema
        self.use_rsi = use_rsi
        self.use_vwap = use_vwap
        
        # Initialize technical indicators
        self.indicators = TechnicalIndicators()
        
        # Strategy parameters based on risk level
        self.strategy_params = self._get_strategy_params()
        
    def _get_strategy_params(self) -> Dict:
        """
        Get strategy parameters based on risk level.
        
        Returns:
            Dictionary of strategy parameters
        """
        # Default parameters (risk level 3)
        params = {
            'signal_threshold': 0.5,  # Threshold for combined signal
            'ema_weight': 0.4,       # Weight of EMA signal in combined signal
            'rsi_weight': 0.3,       # Weight of RSI signal in combined signal
            'vwap_weight': 0.3,      # Weight of VWAP signal in combined signal
            'position_size': 0.2,    # Position size as fraction of available capital
            'max_positions': 5,      # Maximum number of concurrent positions
            'stop_loss': 0.05,       # Stop loss percentage (5%)
            'take_profit': 0.1       # Take profit percentage (10%)
        }
        
        # Adjust parameters based on risk level
        if self.risk_level == 1:  # Very conservative
            params.update({
                'signal_threshold': 0.7,
                'position_size': 0.1,
                'max_positions': 3,
                'stop_loss': 0.03,
                'take_profit': 0.06
            })
        elif self.risk_level == 2:  # Conservative
            params.update({
                'signal_threshold': 0.6,
                'position_size': 0.15,
                'max_positions': 4,
                'stop_loss': 0.04,
                'take_profit': 0.08
            })
        elif self.risk_level == 4:  # Aggressive
            params.update({
                'signal_threshold': 0.4,
                'position_size': 0.25,
                'max_positions': 6,
                'stop_loss': 0.06,
                'take_profit': 0.15
            })
        elif self.risk_level == 5:  # Very aggressive
            params.update({
                'signal_threshold': 0.3,
                'position_size': 0.3,
                'max_positions': 8,
                'stop_loss': 0.08,
                'take_profit': 0.2
            })
            
        return params
    
    def analyze(self, market_data: pd.DataFrame) -> Tuple[pd.DataFrame, Dict]:
        """
        Analyze market data and generate trading signals.
        
        Args:
            market_data: DataFrame with OHLCV data
            
        Returns:
            Tuple of (DataFrame with indicators and signals, signal summary)
        """
        # Calculate technical indicators
        df, summary = self.indicators.analyze_market_data(market_data)
        
        # Generate custom combined signal based on strategy parameters
        self._generate_custom_signal(df)
        
        # Get the latest signal
        latest = df.iloc[-1]
        
        # Create signal summary
        signal_summary = {
            'timestamp': datetime.now(),
            'symbol': market_data['symbol'].iloc[0] if 'symbol' in market_data.columns else None,
            'price': latest['close'],
            'signal': self._interpret_signal(latest['custom_signal']),
            'signal_strength': abs(latest['custom_signal']),
            'ema_signal': latest['ema_signal'] if self.use_ema else 0,
            'rsi_signal': latest['rsi_signal'] if self.use_rsi else 0,
            'vwap_signal': latest['vwap_signal'] if self.use_vwap else 0,
            'custom_signal': latest['custom_signal'],
            'stop_loss': latest['close'] * (1 - self.strategy_params['stop_loss']) if latest['custom_signal'] > 0 else None,
            'take_profit': latest['close'] * (1 + self.strategy_params['take_profit']) if latest['custom_signal'] > 0 else None,
            'risk_level': self.risk_level,
            'position_size': self.strategy_params['position_size']
        }
        
        return df, signal_summary
    
    def _generate_custom_signal(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Generate custom trading signal based on strategy parameters.
        
        Args:
            df: DataFrame with indicators
            
        Returns:
            DataFrame with added custom signal
        """
        # Initialize custom signal
        df['custom_signal'] = 0
        
        # Calculate weighted signal
        if self.use_ema:
            df['custom_signal'] += df['ema_signal'] * self.strategy_params['ema_weight']
            
        if self.use_rsi:
            df['custom_signal'] += df['rsi_signal'] * self.strategy_params['rsi_weight']
            
        if self.use_vwap and 'vwap_signal' in df.columns:
            df['custom_signal'] += df['vwap_signal'] * self.strategy_params['vwap_weight']
        
        # Determine final signal based on threshold
        df['signal_strength'] = df['custom_signal'].abs()
        df['signal'] = 0  # Default to hold
        
        signal_threshold = self.strategy_params['signal_threshold']
        
        # Buy signal when combined signal exceeds positive threshold
        df.loc[df['custom_signal'] >= signal_threshold, 'signal'] = 1
        
        # Sell signal when combined signal exceeds negative threshold
        df.loc[df['custom_signal'] <= -signal_threshold, 'signal'] = -1
        
        return df
    
    def _interpret_signal(self, signal_value: float) -> str:
        """
        Convert numerical signal to readable string.
        
        Args:
            signal_value: Numerical signal value
            
        Returns:
            Signal as string
        """
        threshold = self.strategy_params['signal_threshold']
        
        if signal_value >= threshold * 1.5:
            return "STRONG BUY"
        elif signal_value >= threshold:
            return "BUY"
        elif signal_value <= -threshold * 1.5:
            return "STRONG SELL"
        elif signal_value <= -threshold:
            return "SELL"
        else:
            return "HOLD"
    
    def calculate_position_size(self, available_capital: float, symbol_price: float) -> float:
        """
        Calculate position size based on risk level and available capital.
        
        Args:
            available_capital: Available capital in quote currency (e.g., USDT)
            symbol_price: Current price of the symbol
            
        Returns:
            Position size in quote currency
        """
        position_size_percent = self.strategy_params['position_size']
        position_amount = available_capital * position_size_percent
        return position_amount
    
    def should_close_position(self, 
                            entry_price: float, 
                            current_price: float, 
                            entry_time: datetime,
                            current_time: datetime,
                            is_long: bool = True) -> Tuple[bool, str]:
        """
        Determine if a position should be closed based on strategy rules.
        
        Args:
            entry_price: Entry price of the position
            current_price: Current price of the symbol
            entry_time: Entry time of the position
            current_time: Current time
            is_long: Whether the position is long (True) or short (False)
            
        Returns:
            Tuple of (should_close, reason)
        """
        # Calculate price change
        price_change_pct = ((current_price - entry_price) / entry_price) * (1 if is_long else -1)
        
        # Check stop loss
        if price_change_pct <= -self.strategy_params['stop_loss']:
            return True, "Stop loss triggered"
            
        # Check take profit
        if price_change_pct >= self.strategy_params['take_profit']:
            return True, "Take profit triggered"
            
        # Default - keep position open
        return False, "Position within parameters"
    
    def generate_trade_recommendation(self, 
                                    symbol: str, 
                                    market_data: pd.DataFrame,
                                    available_capital: float = 1000.0,
                                    current_positions: Optional[Dict] = None) -> Dict:
        """
        Generate a trade recommendation for a symbol.
        
        Args:
            symbol: Trading pair symbol
            market_data: DataFrame with OHLCV data
            available_capital: Available capital in quote currency
            current_positions: Dictionary of current positions
            
        Returns:
            Trade recommendation dictionary
        """
        # Analyze market data
        analyzed_data, signal_summary = self.analyze(market_data)
        
        # Get the current price
        current_price = analyzed_data['close'].iloc[-1]
        
        # Check if we have a position for this symbol
        has_position = False
        if current_positions and symbol in current_positions:
            has_position = True
        
        # Calculate position size
        if signal_summary['signal'] in ["BUY", "STRONG BUY"] and not has_position:
            position_size = self.calculate_position_size(available_capital, current_price)
            quantity = position_size / current_price
            
            recommendation = {
                'action': 'BUY',
                'symbol': symbol,
                'price': current_price,
                'quantity': quantity,
                'amount': position_size,
                'stop_loss': signal_summary['stop_loss'],
                'take_profit': signal_summary['take_profit'],
                'reason': f"Signal: {signal_summary['signal']} (Strength: {signal_summary['signal_strength']:.2f})",
                'risk_level': self.risk_level,
                'timestamp': datetime.now()
            }
        elif signal_summary['signal'] in ["SELL", "STRONG SELL"] and has_position:
            position = current_positions[symbol]
            recommendation = {
                'action': 'SELL',
                'symbol': symbol,
                'price': current_price,
                'quantity': position['quantity'],
                'amount': position['quantity'] * current_price,
                'reason': f"Signal: {signal_summary['signal']} (Strength: {signal_summary['signal_strength']:.2f})",
                'profit_loss': (current_price - position['entry_price']) * position['quantity'],
                'profit_loss_pct': ((current_price - position['entry_price']) / position['entry_price']) * 100,
                'timestamp': datetime.now()
            }
        else:
            recommendation = {
                'action': 'HOLD',
                'symbol': symbol,
                'price': current_price,
                'reason': f"Signal: {signal_summary['signal']} (Strength: {signal_summary['signal_strength']:.2f})",
                'timestamp': datetime.now()
            }
            
        return recommendation

# Example usage
if __name__ == "__main__":
    # Create sample market data
    dates = pd.date_range(start='2023-01-01', periods=100, freq='D')
    prices = np.linspace(40000, 50000, 100) + np.random.normal(0, 1000, 100)
    volumes = np.random.normal(100, 20, 100) * 1000
    
    market_data = pd.DataFrame({
        'timestamp': dates,
        'open': prices * 0.99,
        'high': prices * 1.02,
        'low': prices * 0.98,
        'close': prices,
        'volume': volumes,
        'symbol': 'BTCUSDT'
    })
    
    # Initialize strategy with moderate risk
    strategy = TradingStrategy(risk_level=3)
    
    # Generate trade recommendation
    recommendation = strategy.generate_trade_recommendation(
        symbol='BTCUSDT',
        market_data=market_data,
        available_capital=10000.0
    )
    
    print(f"Trade Recommendation: {recommendation['action']} {recommendation['symbol']}")
    print(f"Reason: {recommendation['reason']}")
    
    if recommendation['action'] == 'BUY':
        print(f"Amount: ${recommendation['amount']:.2f}")
        print(f"Quantity: {recommendation['quantity']:.8f}")
        print(f"Stop Loss: ${recommendation['stop_loss']:.2f}")
        print(f"Take Profit: ${recommendation['take_profit']:.2f}")
    elif recommendation['action'] == 'SELL':
        print(f"Amount: ${recommendation['amount']:.2f}")
        print(f"Profit/Loss: ${recommendation['profit_loss']:.2f} ({recommendation['profit_loss_pct']:.2f}%)")