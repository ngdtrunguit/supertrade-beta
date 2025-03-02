# telegram_bot.py
import os
import logging
import asyncio
import re
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, List, Optional, Tuple, Union, Any
import json
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardMarkup, InlineKeyboardButton, ParseMode
from telegram.ext import (
    Updater, CommandHandler, MessageHandler, Filters, 
    CallbackContext, CallbackQueryHandler, ConversationHandler
)
import requests
from sqlalchemy.orm import Session

from models import User, Trade, Alert, UserPreference, get_db
from technical_indicators import TechnicalIndicators
from trading_strategy import TradingStrategy
from trading_simulator import TradingSimulator
from market_data_collector import MarketDataCollector

load_dotenv()


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Constants for conversation states
SYMBOL, AMOUNT, CONFIRM = range(3)

# Configuration
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

class TradingBot:
    """
    Telegram bot for interacting with the trading system.
    """
    
    def __init__(self):
        """Initialize the bot."""
        if not TELEGRAM_BOT_TOKEN:
            raise ValueError("TELEGRAM_BOT_TOKEN environment variable not set")
        
        self.updater = Updater(token=TELEGRAM_BOT_TOKEN, use_context=True)
        self.dispatcher = self.updater.dispatcher
        
        # Initialize technical indicators
        self.indicators = TechnicalIndicators()
        
        # Initialize data collector
        self.data_collector = MarketDataCollector()
        
        # Initialize user data storage
        self.user_data = {}
        
        # Register handlers
        self._register_handlers()
    
    def _register_handlers(self):
        """Register message and command handlers."""
        # Basic commands
        self.dispatcher.add_handler(CommandHandler("start", self.start))
        self.dispatcher.add_handler(CommandHandler("help", self.help_command))
        
        # Price command
        self.dispatcher.add_handler(CommandHandler("price", self.price_command))
        
        # Analysis command
        self.dispatcher.add_handler(CommandHandler("analysis", self.analysis_command))
        
        # Portfolio commands
        self.dispatcher.add_handler(CommandHandler("portfolio", self.portfolio_command))
        self.dispatcher.add_handler(CommandHandler("trades", self.trades_command))
        
        # Top coins command
        self.dispatcher.add_handler(CommandHandler("top", self.top_coins_command))
        
        # Buy command conversation
        buy_conv_handler = ConversationHandler(
            entry_points=[CommandHandler("buy", self.buy_start)],
            states={
                SYMBOL: [MessageHandler(Filters.text & ~Filters.command, self.buy_symbol)],
                AMOUNT: [MessageHandler(Filters.text & ~Filters.command, self.buy_amount)],
                CONFIRM: [
                    CallbackQueryHandler(self.buy_confirm, pattern='^confirm$'),
                    CallbackQueryHandler(self.buy_cancel, pattern='^cancel$')
                ]
            },
            fallbacks=[CommandHandler("cancel", self.buy_cancel_command)]
        )
        self.dispatcher.add_handler(buy_conv_handler)
        
        # Alert commands
        self.dispatcher.add_handler(CommandHandler("alerts", self.alerts_command))
        
        # Connect command
        self.dispatcher.add_handler(CommandHandler("connect", self.connect_command))
        
        # Settings command
        self.dispatcher.add_handler(CommandHandler("settings", self.settings_command))
        
        # Unknown command handler
        self.dispatcher.add_handler(MessageHandler(Filters.command, self.unknown_command))
        
        # Callback query handler for interactive buttons
        self.dispatcher.add_handler(CallbackQueryHandler(self.button_callback))
    
    def start(self, update: Update, context: CallbackContext):
        """Send welcome message when the command /start is issued."""
        user = update.effective_user
        message = (
            f"👋 Hello {user.first_name}!\n\n"
            f"Welcome to the Crypto Trading Bot. I can help you with trading, market analysis, and alerts.\n\n"
            f"Here are some commands to get started:\n"
            f"/price [symbol] - Get current price\n"
            f"/analysis [symbol] - Get technical analysis\n"
            f"/buy - Start buy process\n"
            f"/portfolio - View your portfolio\n"
            f"/trades - View your trade history\n"
            f"/top - See top crypto by volume\n"
            f"/alerts - Manage your alerts\n"
            f"/connect - Connect your account\n"
            f"/settings - Update your preferences\n"
            f"/help - Show all commands"
        )
        update.message.reply_text(message)
    
    def help_command(self, update: Update, context: CallbackContext):
        """Send detailed help message."""
        help_text = (
            "🤖 *Crypto Trading Bot Commands*\n\n"
            "*Price & Analysis*\n"
            "/price [symbol] - Get current price\n"
            "/analysis [symbol] - Get technical analysis\n"
            "/top - See top cryptocurrencies by volume\n\n"
            
            "*Trading*\n"
            "/buy - Start buy process\n"
            "/portfolio - View your portfolio\n"
            "/trades - View your trade history\n\n"
            
            "*Alerts*\n"
            "/alerts - Manage your alerts\n"
            "/addalert [symbol] [condition] - Add new alert\n\n"
            
            "*Account*\n"
            "/connect - Connect your account\n"
            "/settings - Update your preferences\n\n"
            
            "*Other*\n"
            "/help - Show this help message\n"
            "/start - Start the bot\n"
        )
        update.message.reply_text(help_text, parse_mode=ParseMode.MARKDOWN)
    
    def price_command(self, update: Update, context: CallbackContext):
        """Get current price for a symbol."""
        # Check if we have a symbol argument
        if not context.args or len(context.args) < 1:
            update.message.reply_text("Please provide a symbol. Example: /price BTC")
            return
        
        symbol = context.args[0].upper()
        
        # Add USDT suffix if not present
        if not symbol.endswith('USDT'):
            symbol = f"{symbol}USDT"
        
        try:
            # Get market data
            data = self.data_collector.get_klines(symbol, limit=1)
            
            if data.empty:
                update.message.reply_text(f"No data found for {symbol}")
                return
            
            # Get current price
            current_price = data['close'].iloc[-1]
            
            # Format message
            price_message = (
                f"💰 *{symbol} Price*\n\n"
                f"Current Price: ${current_price:,.2f}\n"
                f"Last Updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
            )
            
            # Create inline keyboard for quick actions
            keyboard = [
                [
                    InlineKeyboardButton("Analysis", callback_data=f"analysis_{symbol}"),
                    InlineKeyboardButton("Buy", callback_data=f"buy_{symbol}")
                ],
                [
                    InlineKeyboardButton("1H Chart", callback_data=f"chart_{symbol}_1h"),
                    InlineKeyboardButton("1D Chart", callback_data=f"chart_{symbol}_1d")
                ]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            update.message.reply_text(
                price_message, 
                reply_markup=reply_markup,
                parse_mode=ParseMode.MARKDOWN
            )
        
        except Exception as e:
            logger.error(f"Error in price_command: {str(e)}")
            update.message.reply_text(f"Error getting price for {symbol}: {str(e)}")
    
    def analysis_command(self, update: Update, context: CallbackContext):
        """Get technical analysis for a symbol."""
        # Check if we have a symbol argument
        if not context.args or len(context.args) < 1:
            update.message.reply_text("Please provide a symbol. Example: /analysis BTC")
            return
        
        symbol = context.args[0].upper()
        
        # Add USDT suffix if not present
        if not symbol.endswith('USDT'):
            symbol = f"{symbol}USDT"
        
        try:
            # Get market data
            data = self.data_collector.get_klines(symbol, limit=100)
            
            if data.empty:
                update.message.reply_text(f"No data found for {symbol}")
                return
            
            # Calculate indicators
            analyzed_data, summary = self.indicators.analyze_market_data(data)
            
            # Get alerts
            alerts = self.indicators.get_alert_conditions(analyzed_data)
            
            # Determine overall signal
            signal = "NEUTRAL"
            signal_emoji = "🟡"
            
            if summary['latest_signal'] > 0:
                signal = "BUY"
                signal_emoji = "🟢"
            elif summary['latest_signal'] < 0:
                signal = "SELL"
                signal_emoji = "🔴"
            
            # Format message
            analysis_message = (
                f"📊 *{symbol} Technical Analysis*\n\n"
                f"Current Price: ${summary['latest_close']:,.2f}\n"
                f"Signal: {signal_emoji} {signal}\n\n"
                f"*Indicators:*\n"
                f"• EMA: {summary['ema_status'].capitalize()} (7/21)\n"
                f"• RSI: {summary['latest_rsi']:.2f} ({summary['rsi_status'].capitalize()})\n"
            )
            
            if 'vwap_status' in summary:
                analysis_message += f"• VWAP: {summary['vwap_status'].replace('_', ' ').capitalize()}\n"
            
            analysis_message += f"\n*Alerts:*\n"
            
            if alerts:
                for alert in alerts:
                    alert_emoji = "🟢" if alert['direction'] == 'bullish' else "🔴"
                    analysis_message += f"{alert_emoji} {alert['message']}\n"
            else:
                analysis_message += "No alerts triggered\n"
                
            analysis_message += f"\nLast Updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
            
            # Create inline keyboard for quick actions
            keyboard = [
                [
                    InlineKeyboardButton("Set Alert", callback_data=f"setalert_{symbol}")
                ],
                [
                    InlineKeyboardButton("Buy", callback_data=f"buy_{symbol}"),
                    InlineKeyboardButton("Price", callback_data=f"price_{symbol}")
                ]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            update.message.reply_text(
                analysis_message, 
                reply_markup=reply_markup,
                parse_mode=ParseMode.MARKDOWN
            )
        
        except Exception as e:
            logger.error(f"Error in analysis_command: {str(e)}")
            update.message.reply_text(f"Error analyzing {symbol}: {str(e)}")
    
    def portfolio_command(self, update: Update, context: CallbackContext):
        """Show user portfolio."""
        user_id = update.effective_user.id
        
        try:
            # Get database session
            db = next(get_db())
            
            # Find user by telegram_id
            user = db.query(User).filter(User.telegram_id == str(user_id)).first()
            
            if not user:
                update.message.reply_text(
                    "You need to connect your account first. Use /connect to get started."
                )
                return
            
            # Get user's trades
            trades = db.query(Trade).filter(
                Trade.user_id == user.id,
                Trade.is_open == True
            ).all()
            
            if not trades:
                update.message.reply_text(
                    "You don't have any open positions. Use /buy to start trading."
                )
                return
            
            # Group trades by symbol
            positions = {}
            for trade in trades:
                if trade.symbol not in positions:
                    positions[trade.symbol] = {
                        'quantity': 0,
                        'total_cost': 0,
                        'trades': []
                    }
                
                positions[trade.symbol]['quantity'] += trade.quantity
                positions[trade.symbol]['total_cost'] += trade.total_value
                positions[trade.symbol]['trades'].append(trade)
            
            # Calculate current values and P/L
            total_value = 0
            total_cost = 0
            
            portfolio_message = "📈 *Your Portfolio*\n\n"
            
            for symbol, position in positions.items():
                try:
                    # Get current price
                    market_data = self.data_collector.get_klines(symbol, limit=1)
                    current_price = market_data['close'].iloc[-1]
                    
                    # Calculate values
                    current_value = position['quantity'] * current_price
                    avg_price = position['total_cost'] / position['quantity']
                    profit_loss = current_value - position['total_cost']
                    profit_loss_pct = (profit_loss / position['total_cost']) * 100
                    
                    # Update totals
                    total_value += current_value
                    total_cost += position['total_cost']
                    
                    # Format position details
                    pl_emoji = "🟢" if profit_loss >= 0 else "🔴"
                    
                    portfolio_message += (
                        f"*{symbol}*\n"
                        f"Quantity: {position['quantity']:.8f}\n"
                        f"Avg. Price: ${avg_price:.2f}\n"
                        f"Current Price: ${current_price:.2f}\n"
                        f"Value: ${current_value:.2f}\n"
                        f"P/L: {pl_emoji} ${profit_loss:.2f} ({profit_loss_pct:.2f}%)\n\n"
                    )
                
                except Exception as e:
                    logger.error(f"Error calculating position for {symbol}: {str(e)}")
                    portfolio_message += f"*{symbol}*: Error calculating position\n\n"
            
            # Add portfolio summary
            total_pl = total_value - total_cost
            total_pl_pct = (total_pl / total_cost) * 100 if total_cost > 0 else 0
            
            overall_emoji = "🟢" if total_pl >= 0 else "🔴"
            
            portfolio_message += (
                f"*Portfolio Summary*\n"
                f"Total Value: ${total_value:.2f}\n"
                f"Total Cost: ${total_cost:.2f}\n"
                f"Overall P/L: {overall_emoji} ${total_pl:.2f} ({total_pl_pct:.2f}%)\n"
            )
            
            # Create inline keyboard for quick actions
            keyboard = [
                [
                    InlineKeyboardButton("Buy", callback_data="buy"),
                    InlineKeyboardButton("Trades", callback_data="trades")
                ]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            update.message.reply_text(
                portfolio_message, 
                reply_markup=reply_markup,
                parse_mode=ParseMode.MARKDOWN
            )
        
        except Exception as e:
            logger.error(f"Error in portfolio_command: {str(e)}")
            update.message.reply_text(f"Error retrieving portfolio: {str(e)}")
        finally:
            if 'db' in locals():
                db.close()
    
    def trades_command(self, update: Update, context: CallbackContext):
        """Show recent trades."""
        user_id = update.effective_user.id
        
        try:
            # Get database session
            db = next(get_db())
            
            # Find user by telegram_id
            user = db.query(User).filter(User.telegram_id == str(user_id)).first()
            
            if not user:
                update.message.reply_text(
                    "You need to connect your account first. Use /connect to get started."
                )
                return
            
            # Get user's recent trades (limit to 10)
            trades = db.query(Trade).filter(
                Trade.user_id == user.id
            ).order_by(Trade.timestamp.desc()).limit(10).all()
            
            if not trades:
                update.message.reply_text(
                    "You don't have any trades yet. Use /buy to start trading."
                )
                return
            
            trades_message = "📜 *Recent Trades*\n\n"
            
            for trade in trades:
                side_emoji = "🟢" if trade.side.value == "buy" else "🔴"
                status = "Open" if trade.is_open else "Closed"
                sim_label = "(Sim)" if trade.is_simulated else ""
                
                trades_message += (
                    f"{trade.timestamp.strftime('%Y-%m-%d %H:%M')} "
                    f"{side_emoji} {trade.side.value.upper()} {sim_label}\n"
                    f"{trade.symbol}: {trade.quantity:.8f} @ ${trade.price:.2f}\n"
                    f"Value: ${trade.total_value:.2f} | Status: {status}\n\n"
                )
            
            keyboard = [
                [
                    InlineKeyboardButton("Portfolio", callback_data="portfolio"),
                    InlineKeyboardButton("Buy", callback_data="buy")
                ]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            update.message.reply_text(
                trades_message, 
                reply_markup=reply_markup,
                parse_mode=ParseMode.MARKDOWN
            )
        
        except Exception as e:
            logger.error(f"Error in trades_command: {str(e)}")
            update.message.reply_text(f"Error retrieving trades: {str(e)}")
        finally:
            if 'db' in locals():
                db.close()
    
    def top_coins_command(self, update: Update, context: CallbackContext):
        """Show top coins by volume."""
        try:
            # Get top symbols
            top_symbols = self.data_collector.get_top_symbols()
            
            if not top_symbols:
                update.message.reply_text("Error retrieving top coins")
                return
            
            # Get prices for top symbols
            prices = {}
            changes = {}
            
            for symbol in top_symbols[:10]:  # Limit to top 10
                try:
                    data = self.data_collector.get_klines(symbol, limit=25)  # Get 24h data
                    
                    if not data.empty:
                        current_price = data['close'].iloc[-1]
                        prev_price = data['close'].iloc[0]
                        
                        prices[symbol] = current_price
                        changes[symbol] = ((current_price - prev_price) / prev_price) * 100
                except Exception as e:
                    logger.error(f"Error getting price for {symbol}: {str(e)}")
                    prices[symbol] = 0
                    changes[symbol] = 0
            
            # Format message
            top_coins_message = "🏆 *Top Cryptocurrencies by Volume*\n\n"
            
            for i, symbol in enumerate(top_symbols[:10]):
                if symbol in prices:
                    change_emoji = "🟢" if changes[symbol] >= 0 else "🔴"
                    
                    top_coins_message += (
                        f"{i+1}. *{symbol}*\n"
                        f"   Price: ${prices[symbol]:,.2f}\n"
                        f"   24h Change: {change_emoji} {changes[symbol]:.2f}%\n\n"
                    )
            
            # Create inline keyboard
            keyboard = []
            row = []
            
            for i, symbol in enumerate(top_symbols[:6]):
                base_symbol = symbol[:-4] if symbol.endswith('USDT') else symbol
                row.append(InlineKeyboardButton(base_symbol, callback_data=f"price_{symbol}"))
                
                if len(row) == 3 or i == len(top_symbols[:6]) - 1:
                    keyboard.append(row)
                    row = []
            
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            update.message.reply_text(
                top_coins_message, 
                reply_markup=reply_markup,
                parse_mode=ParseMode.MARKDOWN
            )
        
        except Exception as e:
            logger.error(f"Error in top_coins_command: {str(e)}")
            update.message.reply_text(f"Error retrieving top coins: {str(e)}")
    
    def buy_start(self, update: Update, context: CallbackContext):
        """Start the buy conversation."""
        user_id = update.effective_user.id
        
        try:
            # Get database session
            db = next(get_db())
            
            # Find user by telegram_id
            user = db.query(User).filter(User.telegram_id == str(user_id)).first()
            
            if not user:
                update.message.reply_text(
                    "You need to connect your account first. Use /connect to get started."
                )
                return ConversationHandler.END
            
            # Get top symbols
            top_symbols = self.data_collector.get_top_symbols()
            
            # Format message
            message = (
                "🛒 *Buy Cryptocurrency*\n\n"
                "Enter the symbol you want to buy (e.g., BTC, ETH).\n"
                "You can type /cancel to abort this operation.\n\n"
                "*Popular symbols:*\n"
            )
            
            # Add top 5 symbols
            for symbol in top_symbols[:5]:
                base_symbol = symbol[:-4] if symbol.endswith('USDT') else symbol
                message += f"• {base_symbol}\n"
            
            # Create inline keyboard for quick selection
            keyboard = []
            row = []
            
            for i, symbol in enumerate(top_symbols[:6]):
                base_symbol = symbol[:-4] if symbol.endswith('USDT') else symbol
                row.append(InlineKeyboardButton(base_symbol, callback_data=f"buyselect_{base_symbol}"))
                
                if len(row) == 3 or i == len(top_symbols[:6]) - 1:
                    keyboard.append(row)
                    row = []
            
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            update.message.reply_text(
                message, 
                reply_markup=reply_markup,
                parse_mode=ParseMode.MARKDOWN
            )
            
            return SYMBOL
        
        except Exception as e:
            logger.error(f"Error in buy_start: {str(e)}")
            update.message.reply_text(f"Error starting buy process: {str(e)}")
            return ConversationHandler.END
        finally:
            if 'db' in locals():
                db.close()
    
    def buy_symbol(self, update: Update, context: CallbackContext):
        """Process the symbol input."""
        symbol = update.message.text.strip().upper()
        
        # Add USDT suffix if not present
        if not symbol.endswith('USDT'):
            symbol = f"{symbol}USDT"
        
        try:
            # Check if the symbol exists
            data = self.data_collector.get_klines(symbol, limit=1)
            
            if data.empty:
                update.message.reply_text(
                    f"Symbol {symbol} not found. Please try again or type /cancel to abort."
                )
                return SYMBOL
            
            # Store the symbol
            context.user_data['buy_symbol'] = symbol
            
            # Get current price
            current_price = data['close'].iloc[-1]
            context.user_data['buy_price'] = current_price
            
            # Ask for amount
            message = (
                f"💰 *Buy {symbol}*\n\n"
                f"Current price: ${current_price:,.2f}\n\n"
                f"Enter the amount in USDT you want to spend.\n"
                f"You can type /cancel to abort this operation."
            )
            
            # Create inline keyboard with predefined amounts
            keyboard = [
                [
                    InlineKeyboardButton("$100", callback_data="buyamount_100"),
                    InlineKeyboardButton("$500", callback_data="buyamount_500"),
                    InlineKeyboardButton("$1000", callback_data="buyamount_1000")
                ]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            update.message.reply_text(
                message, 
                reply_markup=reply_markup,
                parse_mode=ParseMode.MARKDOWN
            )
            
            return AMOUNT
            
        except Exception as e:
            logger.error(f"Error in buy_symbol: {str(e)}")
            update.message.reply_text(
                f"Error processing symbol: {str(e)}\n"
                f"Please try again or type /cancel to abort."
            )
            return SYMBOL
    
    def buy_amount(self, update: Update, context: CallbackContext):
        """Process the amount input."""
        amount_text = update.message.text.strip()
        
        # Remove currency symbols
        amount_text = amount_text.replace('$', '').replace('USDT', '')
        
        try:
            amount = float(amount_text)
            
            if amount <= 0:
                update.message.reply_text(
                    "Amount must be greater than 0. Please try again or type /cancel to abort."
                )
                return AMOUNT
            
            # Store the amount
            context.user_data['buy_amount'] = amount
            
            # Get stored symbol and price
            symbol = context.user_data['buy_symbol']
            price = context.user_data['buy_price']
            
            # Calculate quantity
            quantity = amount / price
            
            # Ask for confirmation
            message = (
                f"🔍 *Confirm Purchase*\n\n"
                f"Symbol: {symbol}\n"
                f"Price: ${price:,.2f}\n"
                f"Amount: ${amount:,.2f}\n"
                f"Quantity: {quantity:.8f}\n\n"
                f"Please confirm your purchase."
            )
            
            keyboard = [
                [
                    InlineKeyboardButton("✅ Confirm", callback_data="confirm"),
                    InlineKeyboardButton("❌ Cancel", callback_data="cancel")
                ]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            update.message.reply_text(
                message, 
                reply_markup=reply_markup,
                parse_mode=ParseMode.MARKDOWN
            )
            
            return CONFIRM
            
        except ValueError:
            update.message.reply_text(
                "Invalid amount. Please enter a numeric value or type /cancel to abort."
            )
            return AMOUNT
        except Exception as e:
            logger.error(f"Error in buy_amount: {str(e)}")
            update.message.reply_text(
                f"Error processing amount: {str(e)}\n"
                f"Please try again or type /cancel to abort."
            )
            return AMOUNT
    
    def buy_confirm(self, update: Update, context: CallbackContext):
        """Process the confirmation and execute the buy."""
        query = update.callback_query
        query.answer()
        
        user_id = update.effective_user.id
        
        try:
            # Get database session
            db = next(get_db())
            
            # Find user by telegram_id
            user = db.query(User).filter(User.telegram_id == str(user_id)).first()
            
            if not user:
                query.edit_message_text(
                    "You need to connect your account first. Use /connect to get started."
                )
                return ConversationHandler.END
            
            # Get stored data
            symbol = context.user_data['buy_symbol']
            amount = context.user_data['buy_amount']
            
            # Get user preferences
            preferences = db.query(UserPreference).filter(UserPreference.user_id == user.id).first()
            
            if not preferences:
                # Create default preferences
                preferences = UserPreference(user_id=user.id)
                db.add(preferences)
                db.commit()
                db.refresh(preferences)
            
            # Initialize simulator
            simulator = TradingSimulator(
                user_id=user.id,
                starting_capital=preferences.default_trade_amount * 10,  # 10x default trade amount
                risk_level=preferences.risk_level,
                data_collector=self.data_collector
            )
            
            # Execute buy trade
            result = simulator.execute_buy(
                symbol=symbol,
                amount=amount,
                store_in_db=True
            )
            
            if result['status'] != 'success':
                query.edit_message_text(
                    f"Error executing trade: {result.get('message', 'Unknown error')}"
                )
                return ConversationHandler.END
            
            trade = result['trade']
            
            # Format success message
            success_message = (
                f"✅ *Trade Executed Successfully*\n\n"
                f"Symbol: {trade['symbol']}\n"
                f"Side: BUY\n"
                f"Price: ${trade['price']:,.2f}\n"
                f"Amount: ${trade['amount']:,.2f}\n"
                f"Quantity: {trade['quantity']:.8f}\n"
                f"Fee: ${trade['fee']:,.2f}\n"
                f"Time: {trade['timestamp'].strftime('%Y-%m-%d %H:%M:%S')}\n\n"
                f"*Note: This is a simulated trade.*"
            )
            
            # Create inline keyboard for quick actions
            keyboard = [
                [
                    InlineKeyboardButton("Portfolio", callback_data="portfolio"),
                    InlineKeyboardButton("Trade Again", callback_data="buy")
                ],
                [
                    InlineKeyboardButton("Market Analysis", callback_data=f"analysis_{symbol}")
                ]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            query.edit_message_text(
                success_message, 
                reply_markup=reply_markup,
                parse_mode=ParseMode.MARKDOWN
            )
            
            # Clear user data
            context.user_data.clear()
            
            return ConversationHandler.END
            
        except Exception as e:
            logger.error(f"Error in buy_confirm: {str(e)}")
            query.edit_message_text(f"Error executing trade: {str(e)}")
            return ConversationHandler.END
        finally:
            if 'db' in locals():
                db.close()
    
    def buy_cancel(self, update: Update, context: CallbackContext):
        """Cancel the buy process."""
        if update.callback_query:
            query = update.callback_query
            query.answer()
            query.edit_message_text("Buy operation cancelled.")
        else:
            update.message.reply_text("Buy operation cancelled.")
        
        # Clear user data
        context.user_data.clear()
        
        return ConversationHandler.END
    
    def buy_cancel_command(self, update: Update, context: CallbackContext):
        """Command handler to cancel the buy process."""
        update.message.reply_text("Buy operation cancelled.")
        
        # Clear user data
        context.user_data.clear()
        
        return ConversationHandler.END
    
    def alerts_command(self, update: Update, context: CallbackContext):
        """Show user alerts."""
        user_id = update.effective_user.id
        
        try:
            # Get database session
            db = next(get_db())
            
            # Find user by telegram_id
            user = db.query(User).filter(User.telegram_id == str(user_id)).first()
            
            if not user:
                update.message.reply_text(
                    "You need to connect your account first. Use /connect to get started."
                )
                return
            
            # Get user's alerts
            alerts = db.query(Alert).filter(
                Alert.user_id == user.id
            ).order_by(Alert.created_at.desc()).all()
            
            if not alerts:
                # Create inline keyboard for creating alerts
                keyboard = [
                    [
                        InlineKeyboardButton("Create Alert", callback_data="create_alert")
                    ]
                ]
                reply_markup = InlineKeyboardMarkup(keyboard)
                
                update.message.reply_text(
                    "You don't have any alerts yet. Click below to create one.",
                    reply_markup=reply_markup
                )
                return
            
            alerts_message = "🔔 *Your Alerts*\n\n"
            
            for alert in alerts:
                status_emoji = {
                    "pending": "⏳",
                    "triggered": "✅",
                    "acknowledged": "👁️",
                    "expired": "⏰"
                }.get(alert.status.value, "❓")
                
                alerts_message += (
                    f"{status_emoji} *{alert.symbol}*\n"
                    f"Type: {alert.alert_type}\n"
                    f"Message: {alert.message}\n"
                    f"Created: {alert.created_at.strftime('%Y-%m-%d %H:%M')}\n"
                )
                
                if alert.triggered_at:
                    alerts_message += f"Triggered: {alert.triggered_at.strftime('%Y-%m-%d %H:%M')}\n"
                
                alerts_message += "\n"
            
            # Create inline keyboard for alert actions
            keyboard = [
                [
                    InlineKeyboardButton("Create Alert", callback_data="create_alert"),
                    InlineKeyboardButton("Clear Triggered", callback_data="clear_alerts")
                ]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            update.message.reply_text(
                alerts_message, 
                reply_markup=reply_markup,
                parse_mode=ParseMode.MARKDOWN
            )
        
        except Exception as e:
            logger.error(f"Error in alerts_command: {str(e)}")
            update.message.reply_text(f"Error retrieving alerts: {str(e)}")
        finally:
            if 'db' in locals():
                db.close()
    
    def connect_command(self, update: Update, context: CallbackContext):
        """Connect Telegram account to web account."""
        user_id = update.effective_user.id
        
        try:
            # Check if we have any arguments (username)
            if not context.args or len(context.args) < 1:
                update.message.reply_text(
                    "Please provide your username. Example: /connect username"
                )
                return
            
            username = context.args[0]
            
            # Get database session
            db = next(get_db())
            
            # Find user by username
            user = db.query(User).filter(User.username == username).first()
            
            if not user:
                update.message.reply_text(
                    f"No user found with username '{username}'. "
                    f"Please check your username and try again."
                )
                return
            
            # Check if this Telegram ID is already linked to another account
            existing_user = db.query(User).filter(User.telegram_id == str(user_id)).first()
            
            if existing_user and existing_user.id != user.id:
                update.message.reply_text(
                    f"This Telegram account is already linked to user '{existing_user.username}'. "
                    f"Please disconnect from that account first."
                )
                return
            
            # Update user's telegram_id
            user.telegram_id = str(user_id)
            db.commit()
            
            # Send success message
            update.message.reply_text(
                f"✅ Successfully connected to account '{username}'! "
                f"You can now use all features of the trading bot."
            )
        
        except Exception as e:
            logger.error(f"Error in connect_command: {str(e)}")
            update.message.reply_text(f"Error connecting account: {str(e)}")
        finally:
            if 'db' in locals():
                db.close()
    
    def settings_command(self, update: Update, context: CallbackContext):
        """Show and update user settings."""
        user_id = update.effective_user.id
        
        try:
            # Get database session
            db = next(get_db())
            
            # Find user by telegram_id
            user = db.query(User).filter(User.telegram_id == str(user_id)).first()
            
            if not user:
                update.message.reply_text(
                    "You need to connect your account first. Use /connect to get started."
                )
                return
            
            # Get user preferences
            preferences = db.query(UserPreference).filter(UserPreference.user_id == user.id).first()
            
            if not preferences:
                # Create default preferences
                preferences = UserPreference(user_id=user.id)
                db.add(preferences)
                db.commit()
                db.refresh(preferences)
            
            # Format message
            settings_message = (
                f"⚙️ *User Settings*\n\n"
                f"Username: {user.username}\n"
                f"Default Trade Amount: ${preferences.default_trade_amount}\n"
                f"Risk Level: {preferences.risk_level}/5\n"
                f"Theme: {preferences.theme}\n\n"
                f"*Notification Settings:*\n"
            )
            
            # Parse notification settings
            notification_settings = preferences.get_notification_settings()
            
            for key, value in notification_settings.items():
                emoji = "✅" if value else "❌"
                settings_message += f"{emoji} {key.replace('_', ' ').title()}\n"
            
            # Get default symbols
            default_symbols = preferences.get_default_symbols()
            
            settings_message += f"\n*Default Symbols:*\n"
            for symbol in default_symbols:
                settings_message += f"• {symbol}\n"
            
            # Create inline keyboard for settings actions
            keyboard = [
                [
                    InlineKeyboardButton("Change Amount", callback_data="settings_amount"),
                    InlineKeyboardButton("Change Risk", callback_data="settings_risk")
                ],
                [
                    InlineKeyboardButton("Notifications", callback_data="settings_notifications"),
                    InlineKeyboardButton("Symbols", callback_data="settings_symbols")
                ]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            update.message.reply_text(
                settings_message, 
                reply_markup=reply_markup,
                parse_mode=ParseMode.MARKDOWN
            )
        
        except Exception as e:
            logger.error(f"Error in settings_command: {str(e)}")
            update.message.reply_text(f"Error retrieving settings: {str(e)}")
        finally:
            if 'db' in locals():
                db.close()
    
    def unknown_command(self, update: Update, context: CallbackContext):
        """Handle unknown commands."""
        update.message.reply_text(
            "Sorry, I don't recognize that command. Type /help to see available commands."
        )
    
    def button_callback(self, update: Update, context: CallbackContext):
        """Handle button callbacks."""
        query = update.callback_query
        query.answer()
        
        data = query.data
        
        # Process different callback types
        if data.startswith("price_"):
            # Extract symbol
            symbol = data.split("_")[1]
            self._handle_price_callback(query, symbol)
        
        elif data.startswith("analysis_"):
            # Extract symbol
            symbol = data.split("_")[1]
            self._handle_analysis_callback(query, symbol)
        
        elif data.startswith("buy_"):
            # Extract symbol
            symbol = data.split("_")[1]
            self._handle_buy_callback(query, symbol)
        
        elif data == "buy":
            # Redirect to buy command
            query.edit_message_text("Starting buy process. Please use /buy command.")
        
        elif data == "portfolio":
            # Show portfolio inline
            self._handle_portfolio_callback(query, context)
        
        elif data == "trades":
            # Show trades inline
            self._handle_trades_callback(query, context)
        
        elif data.startswith("buyselect_"):
            # Handle buy symbol selection in conversation
            symbol = data.split("_")[1]
            context.user_data['buy_symbol'] = f"{symbol}USDT"
            
            # Get current price
            try:
                data = self.data_collector.get_klines(f"{symbol}USDT", limit=1)
                current_price = data['close'].iloc[-1]
                context.user_data['buy_price'] = current_price
                
                # Ask for amount
                message = (
                    f"💰 *Buy {symbol}USDT*\n\n"
                    f"Current price: ${current_price:,.2f}\n\n"
                    f"Enter the amount in USDT you want to spend.\n"
                    f"You can type /cancel to abort this operation."
                )
                
                # Create inline keyboard with predefined amounts
                keyboard = [
                    [
                        InlineKeyboardButton("$100", callback_data="buyamount_100"),
                        InlineKeyboardButton("$500", callback_data="buyamount_500"),
                        InlineKeyboardButton("$1000", callback_data="buyamount_1000")
                    ]
                ]
                reply_markup = InlineKeyboardMarkup(keyboard)
                
                query.edit_message_text(
                    message, 
                    reply_markup=reply_markup,
                    parse_mode=ParseMode.MARKDOWN
                )
                
                # Return the next state
                return AMOUNT
            
            except Exception as e:
                logger.error(f"Error in buyselect callback: {str(e)}")
                query.edit_message_text(f"Error getting price: {str(e)}")
                return ConversationHandler.END
        
        elif data.startswith("buyamount_"):
            # Handle buy amount selection in conversation
            amount = float(data.split("_")[1])
            context.user_data['buy_amount'] = amount
            
            # Get stored symbol and price
            symbol = context.user_data['buy_symbol']
            price = context.user_data['buy_price']
            
            # Calculate quantity
            quantity = amount / price
            
            # Ask for confirmation
            message = (
                f"🔍 *Confirm Purchase*\n\n"
                f"Symbol: {symbol}\n"
                f"Price: ${price:,.2f}\n"
                f"Amount: ${amount:,.2f}\n"
                f"Quantity: {quantity:.8f}\n\n"
                f"Please confirm your purchase."
            )
            
            keyboard = [
                [
                    InlineKeyboardButton("✅ Confirm", callback_data="confirm"),
                    InlineKeyboardButton("❌ Cancel", callback_data="cancel")
                ]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            query.edit_message_text(
                message, 
                reply_markup=reply_markup,
                parse_mode=ParseMode.MARKDOWN
            )
            
            # Return the next state
            return CONFIRM
        
        elif data.startswith("chart_"):
            # Extract symbol and timeframe
            parts = data.split("_")
            symbol = parts[1]
            timeframe = parts[2] if len(parts) > 2 else "1h"
            
            # Show message about sending chart
            query.edit_message_text(
                f"⏳ Retrieving {timeframe} chart for {symbol}...\n\n"
                f"Note: Chart visualization in Telegram is not yet implemented. "
                f"Please use the web interface for detailed charts."
            )
        
        elif data == "create_alert":
            # Show message about creating alerts
            query.edit_message_text(
                "⏳ Alert creation wizard will be implemented soon.\n\n"
                f"For now, please use the web interface to create alerts."
            )
    
    def _handle_price_callback(self, query, symbol):
        """Handle price button callback."""
        try:
            # Get market data
            data = self.data_collector.get_klines(symbol, limit=1)
            
            if data.empty:
                query.edit_message_text(f"No data found for {symbol}")
                return
            
            # Get current price
            current_price = data['close'].iloc[-1]
            
            # Format message
            price_message = (
                f"💰 *{symbol} Price*\n\n"
                f"Current Price: ${current_price:,.2f}\n"
                f"Last Updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
            )
            
            # Create inline keyboard for quick actions
            keyboard = [
                [
                    InlineKeyboardButton("Analysis", callback_data=f"analysis_{symbol}"),
                    InlineKeyboardButton("Buy", callback_data=f"buy_{symbol}")
                ],
                [
                    InlineKeyboardButton("1H Chart", callback_data=f"chart_{symbol}_1h"),
                    InlineKeyboardButton("1D Chart", callback_data=f"chart_{symbol}_1d")
                ]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            query.edit_message_text(
                price_message, 
                reply_markup=reply_markup,
                parse_mode=ParseMode.MARKDOWN
            )
        
        except Exception as e:
            logger.error(f"Error in _handle_price_callback: {str(e)}")
            query.edit_message_text(f"Error getting price for {symbol}: {str(e)}")
    
    def _handle_analysis_callback(self, query, symbol):
        """Handle analysis button callback."""
        try:
            # Get market data
            data = self.data_collector.get_klines(symbol, limit=100)
            
            if data.empty:
                query.edit_message_text(f"No data found for {symbol}")
                return
            
            # Calculate indicators
            analyzed_data, summary = self.indicators.analyze_market_data(data)
            
            # Get alerts
            alerts = self.indicators.get_alert_conditions(analyzed_data)
            
            # Determine overall signal
            signal = "NEUTRAL"
            signal_emoji = "🟡"
            
            if summary['latest_signal'] > 0:
                signal = "BUY"
                signal_emoji = "🟢"
            elif summary['latest_signal'] < 0:
                signal = "SELL"
                signal_emoji = "🔴"
            
            # Format message
            analysis_message = (
                f"📊 *{symbol} Technical Analysis*\n\n"
                f"Current Price: ${summary['latest_close']:,.2f}\n"
                f"Signal: {signal_emoji} {signal}\n\n"
                f"*Indicators:*\n"
                f"• EMA: {summary['ema_status'].capitalize()} (7/21)\n"
                f"• RSI: {summary['latest_rsi']:.2f} ({summary['rsi_status'].capitalize()})\n"
            )
            
            if 'vwap_status' in summary:
                analysis_message += f"• VWAP: {summary['vwap_status'].replace('_', ' ').capitalize()}\n"
            
            analysis_message += f"\n*Alerts:*\n"
            
            if alerts:
                for alert in alerts:
                    alert_emoji = "🟢" if alert['direction'] == 'bullish' else "🔴"
                    analysis_message += f"{alert_emoji} {alert['message']}\n"
            else:
                analysis_message += "No alerts triggered\n"
                
            analysis_message += f"\nLast Updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
            
            # Create inline keyboard for quick actions
            keyboard = [
                [
                    InlineKeyboardButton("Set Alert", callback_data=f"setalert_{symbol}")
                ],
                [
                    InlineKeyboardButton("Buy", callback_data=f"buy_{symbol}"),
                    InlineKeyboardButton("Price", callback_data=f"price_{symbol}")
                ]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            query.edit_message_text(
                analysis_message, 
                reply_markup=reply_markup,
                parse_mode=ParseMode.MARKDOWN
            )
        
        except Exception as e:
            logger.error(f"Error in _handle_analysis_callback: {str(e)}")
            query.edit_message_text(f"Error analyzing {symbol}: {str(e)}")
    
    def _handle_buy_callback(self, query, symbol):
        """Handle buy button callback."""
        query.edit_message_text(
            f"To buy {symbol}, please use the /buy command and select {symbol}."
        )
    
    def _handle_portfolio_callback(self, query, context):
        """Handle portfolio button callback."""
        user_id = query.from_user.id
        
        try:
            # Get database session
            db = next(get_db())
            
            # Find user by telegram_id
            user = db.query(User).filter(User.telegram_id == str(user_id)).first()
            
            if not user:
                query.edit_message_text(
                    "You need to connect your account first. Use /connect to get started."
                )
                return
            
            # Get user's trades
            trades = db.query(Trade).filter(
                Trade.user_id == user.id,
                Trade.is_open == True
            ).all()
            
            if not trades:
                query.edit_message_text(
                    "You don't have any open positions. Use /buy to start trading."
                )
                return
            
            # Group trades by symbol
            positions = {}
            for trade in trades:
                if trade.symbol not in positions:
                    positions[trade.symbol] = {
                        'quantity': 0,
                        'total_cost': 0,
                        'trades': []
                    }
                
                positions[trade.symbol]['quantity'] += trade.quantity
                positions[trade.symbol]['total_cost'] += trade.total_value
                positions[trade.symbol]['trades'].append(trade)
            
            # Calculate current values and P/L
            total_value = 0
            total_cost = 0
            
            portfolio_message = "📈 *Your Portfolio*\n\n"
            
            for symbol, position in positions.items():
                try:
                    # Get current price
                    market_data = self.data_collector.get_klines(symbol, limit=1)
                    current_price = market_data['close'].iloc[-1]
                    
                    # Calculate values
                    current_value = position['quantity'] * current_price
                    avg_price = position['total_cost'] / position['quantity']
                    profit_loss = current_value - position['total_cost']
                    profit_loss_pct = (profit_loss / position['total_cost']) * 100
                    
                    # Update totals
                    total_value += current_value
                    total_cost += position['total_cost']
                    
                    # Format position details
                    pl_emoji = "🟢" if profit_loss >= 0 else "🔴"
                    
                    portfolio_message += (
                        f"*{symbol}*\n"
                        f"Quantity: {position['quantity']:.8f}\n"
                        f"Avg. Price: ${avg_price:.2f}\n"
                        f"Current Price: ${current_price:.2f}\n"
                        f"Value: ${current_value:.2f}\n"
                        f"P/L: {pl_emoji} ${profit_loss:.2f} ({profit_loss_pct:.2f}%)\n\n"
                    )
                
                except Exception as e:
                    logger.error(f"Error calculating position for {symbol}: {str(e)}")
                    portfolio_message += f"*{symbol}*: Error calculating position\n\n"
            
            # Add portfolio summary
            total_pl = total_value - total_cost
            total_pl_pct = (total_pl / total_cost) * 100 if total_cost > 0 else 0
            
            overall_emoji = "🟢" if total_pl >= 0 else "🔴"
            
            portfolio_message += (
                f"*Portfolio Summary*\n"
                f"Total Value: ${total_value:.2f}\n"
                f"Total Cost: ${total_cost:.2f}\n"
                f"Overall P/L: {overall_emoji} ${total_pl:.2f} ({total_pl_pct:.2f}%)\n"
            )
            
            # Create inline keyboard for quick actions
            keyboard = [
                [
                    InlineKeyboardButton("Buy", callback_data="buy"),
                    InlineKeyboardButton("Trades", callback_data="trades")
                ]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            query.edit_message_text(
                portfolio_message, 
                reply_markup=reply_markup,
                parse_mode=ParseMode.MARKDOWN
            )
        
        except Exception as e:
            logger.error(f"Error in _handle_portfolio_callback: {str(e)}")
            query.edit_message_text(f"Error retrieving portfolio: {str(e)}")
        finally:
            if 'db' in locals():
                db.close()
    
    def _handle_trades_callback(self, query, context):
        """Handle trades button callback."""
        user_id = query.from_user.id
        
        try:
            # Get database session
            db = next(get_db())
            
            # Find user by telegram_id
            user = db.query(User).filter(User.telegram_id == str(user_id)).first()
            
            if not user:
                query.edit_message_text(
                    "You need to connect your account first. Use /connect to get started."
                )
                return
            
            # Get user's recent trades (limit to 5 for inline display)
            trades = db.query(Trade).filter(
                Trade.user_id == user.id
            ).order_by(Trade.timestamp.desc()).limit(5).all()
            
            if not trades:
                query.edit_message_text(
                    "You don't have any trades yet. Use /buy to start trading."
                )
                return
            
            trades_message = "📜 *Recent Trades*\n\n"
            
            for trade in trades:
                side_emoji = "🟢" if trade.side.value == "buy" else "🔴"
                status = "Open" if trade.is_open else "Closed"
                sim_label = "(Sim)" if trade.is_simulated else ""
                
                trades_message += (
                    f"{trade.timestamp.strftime('%Y-%m-%d %H:%M')} "
                    f"{side_emoji} {trade.side.value.upper()} {sim_label}\n"
                    f"{trade.symbol}: {trade.quantity:.8f} @ ${trade.price:.2f}\n"
                    f"Value: ${trade.total_value:.2f} | Status: {status}\n\n"
                )
            
            trades_message += "For full history, use /trades command."
            
            keyboard = [
                [
                    InlineKeyboardButton("Portfolio", callback_data="portfolio"),
                    InlineKeyboardButton("Buy", callback_data="buy")
                ]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            query.edit_message_text(
                trades_message, 
                reply_markup=reply_markup,
                parse_mode=ParseMode.MARKDOWN
            )
        
        except Exception as e:
            logger.error(f"Error in _handle_trades_callback: {str(e)}")
            query.edit_message_text(f"Error retrieving trades: {str(e)}")
        finally:
            if 'db' in locals():
                db.close()
    
    def start_bot(self):
        """Start the bot."""
        logger.info("Starting bot...")
        self.updater.start_polling()
        logger.info("Bot started!")
        self.updater.idle()

# Main function to run the bot
def main():
    try:
        # Initialize and start the bot
        bot = TradingBot()
        bot.start_bot()
    except Exception as e:
        logger.error(f"Error in main: {str(e)}")

if __name__ == '__main__':
    main()