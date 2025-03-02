# trading_simulator.py
import logging
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple, Union
from datetime import datetime, timedelta
import uuid
import json
from decimal import Decimal, ROUND_DOWN
from sqlalchemy.orm import Session
from models import Trade, User, TradeSide, get_db
from market_data_collector import MarketDataCollector
from trading_strategy import TradingStrategy

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class TradingSimulator:
    """
    Simulates trading with real market conditions but with virtual funds.
    """
    
    def __init__(self, 
                user_id: Optional[int] = None,
                starting_capital: float = 10000.0,
                quote_currency: str = 'USDT',
                risk_level: int = 3,
                strategy: Optional[TradingStrategy] = None,
                data_collector: Optional[MarketDataCollector] = None):
        """
        Initialize the trading simulator.
        
        Args:
            user_id: User ID for storing trades in the database
            starting_capital: Initial capital in quote currency
            quote_currency: Quote currency (e.g., 'USDT')
            risk_level: Risk level from 1 (conservative) to 5 (aggressive)
            strategy: Trading strategy instance (optional)
            data_collector: Market data collector instance (optional)
        """
        self.user_id = user_id
        self.starting_capital = Decimal(str(starting_capital))
        self.quote_currency = quote_currency
        self.risk_level = risk_level
        
        # Initialize portfolio with starting capital
        self.portfolio = {
            quote_currency: {
                'amount': self.starting_capital,
                'available': self.starting_capital
            }
        }
        
        # Initialize trading history
        self.trade_history = []
        self.open_positions = {}
        
        # Performance metrics
        self.performance = {
            'starting_balance': self.starting_capital,
            'current_balance': self.starting_capital,
            'total_profit_loss': Decimal('0'),
            'total_profit_loss_pct': Decimal('0'),
            'roi': Decimal('0'),
            'win_count': 0,
            'loss_count': 0,
            'total_trades': 0,
            'win_rate': Decimal('0'),
            'largest_win': Decimal('0'),
            'largest_loss': Decimal('0'),
            'average_profit': Decimal('0'),
            'average_loss': Decimal('0'),
            'drawdown': Decimal('0'),
            'max_drawdown': Decimal('0'),
            'sharpe_ratio': Decimal('0'),
            'start_time': datetime.now(),
            'duration': timedelta(0)
        }
        
        # Initialize strategy
        self.strategy = strategy or TradingStrategy(risk_level=self.risk_level)
        
        # Initialize data collector
        self.data_collector = data_collector or MarketDataCollector()
        
        # Initialize fee structure (Binance default)
        self.fee_rate = Decimal('0.001')  # 0.1% fee
        
    def execute_buy(self, 
                  symbol: str, 
                  amount: Union[float, Decimal],
                  price: Optional[Union[float, Decimal]] = None,
                  store_in_db: bool = True) -> Dict:
        """
        Execute a buy order in the simulation.
        
        Args:
            symbol: Trading pair symbol (e.g., 'BTCUSDT')
            amount: Amount in quote currency to spend
            price: Price to execute at (if None, will use current market price)
            store_in_db: Whether to store the trade in the database
            
        Returns:
            Dictionary with trade details
        """
        # Validate inputs
        amount = Decimal(str(amount))
        
        # Extract base and quote currencies from symbol
        base_currency = symbol[:-len(self.quote_currency)]
        
        # Check if we have enough balance
        if amount > self.portfolio.get(self.quote_currency, {}).get('available', Decimal('0')):
            return {
                'status': 'error',
                'message': f'Insufficient {self.quote_currency} balance',
                'amount_requested': float(amount),
                'available_balance': float(self.portfolio.get(self.quote_currency, {}).get('available', Decimal('0')))
            }
        
        # Get current price if not provided
        if price is None:
            try:
                market_data = self._get_market_data(symbol)
                price = Decimal(str(market_data['close'].iloc[-1]))
            except Exception as e:
                return {
                    'status': 'error',
                    'message': f'Error getting current price: {str(e)}'
                }
        else:
            price = Decimal(str(price))
        
        # Calculate quantity and fee
        quantity = self._calculate_quantity(amount, price)
        fee = amount * self.fee_rate
        
        # Subtract amount and fee from quote balance
        self._update_portfolio_balance(self.quote_currency, -amount)
        
        # Add base currency to portfolio
        if base_currency not in self.portfolio:
            self.portfolio[base_currency] = {
                'amount': Decimal('0'),
                'available': Decimal('0')
            }
        
        self._update_portfolio_balance(base_currency, quantity)
        
        # Create trade record
        trade = {
            'id': str(uuid.uuid4()),
            'user_id': self.user_id,
            'symbol': symbol,
            'side': 'buy',
            'price': float(price),
            'quantity': float(quantity),
            'amount': float(amount),
            'fee': float(fee),
            'timestamp': datetime.now(),
            'is_simulated': True,
            'is_open': True,
            'base_currency': base_currency,
            'quote_currency': self.quote_currency
        }
        
        # Store in trade history
        self.trade_history.append(trade)
        
        # Track as open position
        if symbol not in self.open_positions:
            self.open_positions[symbol] = []
            
        self.open_positions[symbol].append(trade)
        
        # Update performance metrics
        self._update_performance_metrics()
        
        # Store in database if requested
        if store_in_db and self.user_id:
            self._store_trade_in_db(trade)
        
        return {
            'status': 'success',
            'trade': trade
        }
    
    def execute_sell(self, 
                   symbol: str, 
                   quantity: Optional[Union[float, Decimal]] = None,
                   amount: Optional[Union[float, Decimal]] = None,
                   price: Optional[Union[float, Decimal]] = None,
                   store_in_db: bool = True) -> Dict:
        """
        Execute a sell order in the simulation.
        
        Args:
            symbol: Trading pair symbol (e.g., 'BTCUSDT')
            quantity: Quantity of base currency to sell (optional)
            amount: Amount in quote currency to sell (optional, used if quantity not provided)
            price: Price to execute at (if None, will use current market price)
            store_in_db: Whether to store the trade in the database
            
        Returns:
            Dictionary with trade details
        """
        # Extract base and quote currencies from symbol
        base_currency = symbol[:-len(self.quote_currency)]
        
        # Check if we have any of the base currency
        if base_currency not in self.portfolio or self.portfolio[base_currency]['available'] <= 0:
            return {
                'status': 'error',
                'message': f'No {base_currency} available to sell',
                'available_balance': float(self.portfolio.get(base_currency, {}).get('available', Decimal('0')))
            }
        
        # Get current price if not provided
        if price is None:
            try:
                market_data = self._get_market_data(symbol)
                price = Decimal(str(market_data['close'].iloc[-1]))
            except Exception as e:
                return {
                    'status': 'error',
                    'message': f'Error getting current price: {str(e)}'
                }
        else:
            price = Decimal(str(price))
        
        # Calculate quantity if not provided
        if quantity is None:
            if amount is None:
                # Sell all available
                quantity = self.portfolio[base_currency]['available']
            else:
                amount = Decimal(str(amount))
                quantity = amount / price
                
                # Make sure we're not selling more than available
                available = self.portfolio[base_currency]['available']
                if quantity > available:
                    quantity = available
        else:
            quantity = Decimal(str(quantity))
            
            # Make sure we're not selling more than available
            available = self.portfolio[base_currency]['available']
            if quantity > available:
                return {
                    'status': 'error',
                    'message': f'Insufficient {base_currency} balance',
                    'quantity_requested': float(quantity),
                    'available_balance': float(available)
                }
        
        # Calculate total amount and fee
        amount = quantity * price
        fee = amount * self.fee_rate
        
        # Subtract quantity from base balance
        self._update_portfolio_balance(base_currency, -quantity)
        
        # Add amount minus fee to quote balance
        self._update_portfolio_balance(self.quote_currency, amount - fee)
        
        # Create trade record
        trade = {
            'id': str(uuid.uuid4()),
            'user_id': self.user_id,
            'symbol': symbol,
            'side': 'sell',
            'price': float(price),
            'quantity': float(quantity),
            'amount': float(amount),
            'fee': float(fee),
            'timestamp': datetime.now(),
            'is_simulated': True,
            'is_open': False,
            'base_currency': base_currency,
            'quote_currency': self.quote_currency
        }
        
        # Store in trade history
        self.trade_history.append(trade)
        
        # Calculate profit/loss if we have matching open positions
        if symbol in self.open_positions and self.open_positions[symbol]:
            remaining_quantity = quantity
            matched_positions = []
            
            # Match sell with open positions (FIFO)
            for pos in self.open_positions[symbol]:
                if remaining_quantity <= 0:
                    break
                    
                pos_quantity = Decimal(str(pos['quantity']))
                
                if pos_quantity <= remaining_quantity:
                    # Use entire position
                    matched_quantity = pos_quantity
                    remaining_quantity -= pos_quantity
                    
                    # Mark position as closed
                    pos['is_open'] = False
                    matched_positions.append(pos)
                else:
                    # Use partial position
                    matched_quantity = remaining_quantity
                    
                    # Reduce position quantity
                    pos['quantity'] = float(pos_quantity - matched_quantity)
                    remaining_quantity = Decimal('0')
                    
                # Calculate profit/loss for this match
                entry_price = Decimal(str(pos['price']))
                exit_price = price
                
                profit_loss = (exit_price - entry_price) * matched_quantity
                profit_loss_pct = (exit_price - entry_price) / entry_price * Decimal('100')
                
                trade['matched_position'] = pos['id']
                trade['profit_loss'] = float(profit_loss)
                trade['profit_loss_pct'] = float(profit_loss_pct)
                
                # Update performance metrics
                if profit_loss > 0:
                    self.performance['win_count'] += 1
                    self.performance['largest_win'] = max(self.performance['largest_win'], profit_loss)
                else:
                    self.performance['loss_count'] += 1
                    self.performance['largest_loss'] = min(self.performance['largest_loss'], profit_loss)
                
                self.performance['total_profit_loss'] += profit_loss
            
            # Remove closed positions
            self.open_positions[symbol] = [
                pos for pos in self.open_positions[symbol] if pos['is_open']
            ]
        
        # Update performance metrics
        self._update_performance_metrics()
        
        # Store in database if requested
        if store_in_db and self.user_id:
            self._store_trade_in_db(trade)
        
        return {
            'status': 'success',
            'trade': trade
        }
    
    def get_balance(self) -> Dict:
        """
        Get current portfolio balance.
        
        Returns:
            Dictionary with portfolio balance details
        """
        total_balance_usd = Decimal('0')
        
        for currency, balance in self.portfolio.items():
            if currency == self.quote_currency:
                # Quote currency is already in USD equivalent
                total_balance_usd += balance['amount']
            else:
                # Get current price for other currencies
                try:
                    symbol = f"{currency}{self.quote_currency}"
                    market_data = self._get_market_data(symbol)
                    price = Decimal(str(market_data['close'].iloc[-1]))
                    
                    # Calculate USD equivalent
                    usd_value = balance['amount'] * price
                    total_balance_usd += usd_value
                except Exception as e:
                    logger.warning(f"Error getting price for {currency}: {str(e)}")
        
        return {
            'portfolio': {k: {'amount': float(v['amount']), 'available': float(v['available'])} 
                          for k, v in self.portfolio.items()},
            'total_balance_usd': float(total_balance_usd),
            'profit_loss': float(total_balance_usd - self.starting_capital),
            'profit_loss_pct': float((total_balance_usd - self.starting_capital) / self.starting_capital * Decimal('100')),
            'quote_currency': self.quote_currency
        }
    
    def get_open_positions(self) -> Dict:
        """
        Get all open positions.
        
        Returns:
            Dictionary with open positions by symbol
        """
        result = {}
        
        for symbol, positions in self.open_positions.items():
            if not positions:
                continue
                
            total_quantity = sum(Decimal(str(pos['quantity'])) for pos in positions)
            total_cost = sum(Decimal(str(pos['amount'])) for pos in positions)
            
            if total_quantity <= 0:
                continue
                
            avg_price = total_cost / total_quantity
            
            # Get current price
            try:
                market_data = self._get_market_data(symbol)
                current_price = Decimal(str(market_data['close'].iloc[-1]))
                
                # Calculate profit/loss
                current_value = total_quantity * current_price
                profit_loss = current_value - total_cost
                profit_loss_pct = profit_loss / total_cost * Decimal('100')
                
                result[symbol] = {
                    'quantity': float(total_quantity),
                    'avg_price': float(avg_price),
                    'current_price': float(current_price),
                    'current_value': float(current_value),
                    'cost_basis': float(total_cost),
                    'profit_loss': float(profit_loss),
                    'profit_loss_pct': float(profit_loss_pct),
                    'positions': positions
                }
            except Exception as e:
                logger.warning(f"Error getting current price for {symbol}: {str(e)}")
        
        return result
    
    def get_trade_history(self) -> List[Dict]:
        """
        Get all trade history.
        
        Returns:
            List of trade dictionaries
        """
        return self.trade_history
    
    def get_performance_metrics(self) -> Dict:
        """
        Get detailed performance metrics.
        
        Returns:
            Dictionary with performance metrics
        """
        # Update metrics before returning
        self._update_performance_metrics()
        
        # Convert Decimal to float for JSON serialization
        return {k: float(v) if isinstance(v, Decimal) else v for k, v in self.performance.items()}
    
    def run_simulation(self, symbols: List[str], days: int = 30, interval: str = '1h') -> Dict:
        """
        Run a simulation over historical data.
        
        Args:
            symbols: List of symbols to trade
            days: Number of days to simulate
            interval: Data interval
            
        Returns:
            Dictionary with simulation results
        """
        # Reset portfolio to starting conditions
        self._reset_simulation()
        
        # Get historical data
        historical_data = {}
        for symbol in symbols:
            try:
                # Get data
                data = self._get_market_data(symbol, days=days, interval=interval)
                historical_data[symbol] = data
            except Exception as e:
                logger.error(f"Error getting historical data for {symbol}: {str(e)}")
        
        # Run simulation day by day
        start_date = datetime.now() - timedelta(days=days)
        end_date = datetime.now()
        current_date = start_date
        
        daily_results = []
        
        while current_date <= end_date:
            daily_balance = self.get_balance()
            
            # Check for signals on each symbol
            for symbol in symbols:
                if symbol not in historical_data:
                    continue
                    
                # Filter data up to current date
                data = historical_data[symbol][historical_data[symbol]['timestamp'] <= current_date]
                
                if len(data) < 30:  # Need enough data for indicators
                    continue
                
                # Get signal
                try:
                    # Get available capital
                    available_capital = float(self.portfolio[self.quote_currency]['available'])
                    
                    # Get current positions
                    open_positions = self.get_open_positions()
                    
                    # Generate recommendation
                    recommendation = self.strategy.generate_trade_recommendation(
                        symbol=symbol,
                        market_data=data,
                        available_capital=available_capital,
                        current_positions=open_positions.get(symbol)
                    )
                    
                    # Execute recommendation
                    if recommendation['action'] == 'BUY':
                        self.execute_buy(
                            symbol=symbol,
                            amount=recommendation['amount'],
                            price=recommendation['price'],
                            store_in_db=False
                        )
                    elif recommendation['action'] == 'SELL' and symbol in open_positions:
                        self.execute_sell(
                            symbol=symbol,
                            quantity=open_positions[symbol]['quantity'],
                            price=recommendation['price'],
                            store_in_db=False
                        )
                except Exception as e:
                    logger.error(f"Error processing {symbol} on {current_date}: {str(e)}")
            
            # Record daily results
            daily_results.append({
                'date': current_date.strftime('%Y-%m-%d'),
                'balance': self.get_balance()['total_balance_usd'],
                'trades': len([t for t in self.trade_history if datetime.strptime(t['timestamp'].strftime('%Y-%m-%d'), '%Y-%m-%d') == current_date])
            })
            
            # Move to next day
            current_date += timedelta(days=1)
        
        # Calculate final results
        final_balance = self.get_balance()
        performance = self.get_performance_metrics()
        
        return {
            'initial_balance': float(self.starting_capital),
            'final_balance': final_balance['total_balance_usd'],
            'profit_loss': final_balance['profit_loss'],
            'profit_loss_pct': final_balance['profit_loss_pct'],
            'total_trades': len(self.trade_history),
            'win_count': performance['win_count'],
            'loss_count': performance['loss_count'],
            'win_rate': performance['win_rate'],
            'daily_results': daily_results,
            'trade_history': self.trade_history[:20],  # First 20 trades only for brevity
            'performance': performance
        }
    
    def _reset_simulation(self):
        """Reset the simulator to initial state."""
        # Reset portfolio
        self.portfolio = {
            self.quote_currency: {
                'amount': self.starting_capital,
                'available': self.starting_capital
            }
        }
        
        # Reset history and positions
        self.trade_history = []
        self.open_positions = {}
        
        # Reset performance metrics
        self.performance = {
            'starting_balance': self.starting_capital,
            'current_balance': self.starting_capital,
            'total_profit_loss': Decimal('0'),
            'total_profit_loss_pct': Decimal('0'),
            'roi': Decimal('0'),
            'win_count': 0,
            'loss_count': 0,
            'total_trades': 0,
            'win_rate': Decimal('0'),
            'largest_win': Decimal('0'),
            'largest_loss': Decimal('0'),
            'average_profit': Decimal('0'),
            'average_loss': Decimal('0'),
            'drawdown': Decimal('0'),
            'max_drawdown': Decimal('0'),
            'sharpe_ratio': Decimal('0'),
            'start_time': datetime.now(),
            'duration': timedelta(0)
        }
    
    def _get_market_data(self, symbol: str, days: int = 30, interval: str = '1h') -> pd.DataFrame:
        """
        Get market data for a symbol.
        
        Args:
            symbol: Trading pair symbol
            days: Number of days of historical data
            interval: Data interval
            
        Returns:
            DataFrame with market data
        """
        # Use data collector to get market data
        if self.data_collector:
            data = self.data_collector.get_klines(symbol, interval=interval, limit=days * 24)
            return data
        
        # Fallback to simple random data for testing
        dates = pd.date_range(end=datetime.now(), periods=days * 24, freq='H')
        prices = np.linspace(40000, 50000, days * 24) + np.random.normal(0, 1000, days * 24)
        volumes = np.random.normal(100, 20, days * 24) * 1000
        
        return pd.DataFrame({
            'timestamp': dates,
            'open': prices * 0.99,
            'high': prices * 1.02,
            'low': prices * 0.98,
            'close': prices,
            'volume': volumes
        })
    
    def _calculate_quantity(self, amount: Decimal, price: Decimal) -> Decimal:
        """
        Calculate quantity based on amount and price, with proper rounding.
        
        Args:
            amount: Amount in quote currency
            price: Price per unit
            
        Returns:
            Quantity with proper decimal places
        """
        # Calculate raw quantity
        quantity = amount / price
        
        # Round down to 8 decimal places (standard for most crypto)
        return quantity.quantize(Decimal('0.00000001'), rounding=ROUND_DOWN)
    
    def _update_portfolio_balance(self, currency: str, amount: Decimal):
        """
        Update portfolio balance for a currency.
        
        Args:
            currency: Currency code
            amount: Amount to add (positive) or subtract (negative)
        """
        # Ensure currency exists in portfolio
        if currency not in self.portfolio:
            self.portfolio[currency] = {
                'amount': Decimal('0'),
                'available': Decimal('0')
            }
        
        # Update balance
        self.portfolio[currency]['amount'] += amount
        self.portfolio[currency]['available'] += amount
    
    def _update_performance_metrics(self):
        """Update performance metrics based on current state."""
        # Get current balance
        balance = self.get_balance()
        total_balance = Decimal(str(balance['total_balance_usd']))
        
        # Update performance metrics
        self.performance['current_balance'] = total_balance
        self.performance['total_profit_loss'] = total_balance - self.starting_capital
        
        if self.starting_capital > 0:
            self.performance['total_profit_loss_pct'] = (
                self.performance['total_profit_loss'] / self.starting_capital * Decimal('100')
            )
            self.performance['roi'] = self.performance['total_profit_loss_pct']
        
        # Update trade counts
        self.performance['total_trades'] = len(self.trade_history)
        
        # Calculate win rate
        total_trades = self.performance['win_count'] + self.performance['loss_count']
        if total_trades > 0:
            self.performance['win_rate'] = Decimal(str(self.performance['win_count'] / total_trades * 100))
        
        # Calculate average profit/loss
        profits = [
            Decimal(str(t.get('profit_loss', 0))) 
            for t in self.trade_history 
            if t.get('profit_loss', 0) and Decimal(str(t.get('profit_loss', 0))) > 0
        ]
        
        losses = [
            Decimal(str(t.get('profit_loss', 0))) 
            for t in self.trade_history 
            if t.get('profit_loss', 0) and Decimal(str(t.get('profit_loss', 0))) < 0
        ]
        
        if profits:
            self.performance['average_profit'] = sum(profits) / len(profits)
        
        if losses:
            self.performance['average_loss'] = sum(losses) / len(losses)
        
        # Calculate drawdown
        peak_balance = max(
            total_balance,
            self.performance.get('peak_balance', Decimal('0'))
        )
        
        self.performance['peak_balance'] = peak_balance
        current_drawdown = (peak_balance - total_balance) / peak_balance * Decimal('100')
        self.performance['drawdown'] = current_drawdown
        
        if current_drawdown > self.performance['max_drawdown']:
            self.performance['max_drawdown'] = current_drawdown
        
        # Update duration
        self.performance['duration'] = datetime.now() - self.performance['start_time']
    
    def _store_trade_in_db(self, trade: Dict):
        """
        Store a trade in the database.
        
        Args:
            trade: Trade dictionary
        """
        try:
            # Get database session
            db = next(get_db())
            
            # Create trade record
            db_trade = Trade(
                user_id=trade['user_id'],
                symbol=trade['symbol'],
                side=TradeSide.BUY if trade['side'] == 'buy' else TradeSide.SELL,
                price=trade['price'],
                quantity=trade['quantity'],
                total_value=trade['amount'],
                fee=trade['fee'],
                timestamp=trade['timestamp'],
                exchange='binance',
                is_simulated=True,
                is_open=trade['is_open'],
                strategy='simulator',
                notes=json.dumps({
                    'base_currency': trade['base_currency'],
                    'quote_currency': trade['quote_currency'],
                    'profit_loss': trade.get('profit_loss', None),
                    'profit_loss_pct': trade.get('profit_loss_pct', None),
                    'matched_position': trade.get('matched_position', None)
                })
            )
            
            db.add(db_trade)
            db.commit()
            
        except Exception as e:
            logger.error(f"Error storing trade in database: {str(e)}")
            if 'db' in locals():
                db.rollback()
        finally:
            if 'db' in locals():
                db.close()

# Example usage
if __name__ == "__main__":
    # Initialize simulator
    simulator = TradingSimulator(starting_capital=10000.0, risk_level=3)
    
    # Execute some trades
    buy_result = simulator.execute_buy(symbol="BTCUSDT", amount=1000.0)
    print(f"Buy result: {buy_result['status']}")
    
    # Check balance
    balance = simulator.get_balance()
    print(f"Current balance: ${balance['total_balance_usd']}")
    
    # Run a simulation
    sim_results = simulator.run_simulation(
        symbols=["BTCUSDT", "ETHUSDT", "ADAUSDT"],
        days=30
    )
    
    print(f"Simulation results:")
    print(f"Initial balance: ${sim_results['initial_balance']}")
    print(f"Final balance: ${sim_results['final_balance']}")
    print(f"Profit/Loss: ${sim_results['profit_loss']} ({sim_results['profit_loss_pct']}%)")
    print(f"Total trades: {sim_results['total_trades']}")
    print(f"Win rate: {sim_results['performance']['win_rate']}%")