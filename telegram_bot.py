import os
import logging
from telegram.ext import Updater, CommandHandler, MessageHandler, Filters
import requests
import re
from datetime import datetime

# Setup logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO
)
logger = logging.getLogger(__name__)

API_BASE_URL = "http://localhost:8000"

def extract_amount(text):
    """Extract dollar amount from text like '$500'"""
    match = re.search(r'\$(\d+(\.\d+)?)', text)
    if match:
        return float(match.group(1))
    return None

def start(update, context):
    update.message.reply_text('Hello! I am your crypto trading bot. Use /price BTC to get Bitcoin price.')

def price_command(update, context):
    try:
        if len(context.args) < 1:
            update.message.reply_text("Usage: /price [symbol]")
            return
            
        symbol = context.args[0].upper()
        
        # Use your API to get the price
        response = requests.get(f"{API_BASE_URL}/get_price/{symbol}")
        
        if response.status_code == 200:
            data = response.json()
            update.message.reply_text(f"Current {symbol} price: ${data['price']:.2f} {data['currency']}")
        else:
            update.message.reply_text(f"Error getting price for {symbol}")
            
    except Exception as e:
        update.message.reply_text(f"Error: {str(e)}")

def buy_command(update, context):
    try:
        if len(context.args) < 2:
            update.message.reply_text("Usage: /buy [symbol] $[amount]")
            return
        
        symbol = context.args[0].upper()
        
        # Extract amount from the command
        amount_text = ' '.join(context.args[1:])
        amount = extract_amount(amount_text)
        
        if not amount:
            update.message.reply_text("Please specify amount with $ sign (e.g., $500)")
            return
            
        # Default to simulation mode for now
        is_simulated = True
        
        # User ID from Telegram
        user_id = update.effective_user.id
        
        # Execute buy via API
        response = requests.post(f"{API_BASE_URL}/buy", json={
            "symbol": symbol,
            "amount": amount,
            "user_id": user_id,
            "is_simulated": is_simulated
        })
        
        if response.status_code == 200:
            data = response.json()
            update.message.reply_text(
                f"✅ Buy order executed:\n"
                f"Symbol: {data['symbol']}\n"
                f"Amount: ${amount:.2f}\n"
                f"Price: ${data['price']:.2f}\n"
                f"Quantity: {data['quantity']:.8f}\n"
                f"Mode: {'Simulation' if is_simulated else 'Live'}"
            )
        else:
            error_data = response.json()
            update.message.reply_text(f"❌ Error executing buy: {error_data.get('detail', 'Unknown error')}")
            
    except Exception as e:
        update.message.reply_text(f"Error: {str(e)}")

def sell_command(update, context):
    try:
        if len(context.args) < 2:
            update.message.reply_text("Usage: /sell [symbol] $[amount]")
            return
        
        symbol = context.args[0].upper()
        
        # Extract amount from the command
        amount_text = ' '.join(context.args[1:])
        amount = extract_amount(amount_text)
        
        if not amount:
            update.message.reply_text("Please specify amount with $ sign (e.g., $500)")
            return
            
        # Default to simulation mode for now
        is_simulated = True
        
        # User ID from Telegram
        user_id = update.effective_user.id
        
        # Execute sell via API
        response = requests.post(f"{API_BASE_URL}/sell", json={
            "symbol": symbol,
            "amount": amount,
            "user_id": user_id,
            "is_simulated": is_simulated
        })
        
        if response.status_code == 200:
            data = response.json()
            update.message.reply_text(
                f"✅ Sell order executed:\n"
                f"Symbol: {data['symbol']}\n"
                f"Amount: ${amount:.2f}\n"
                f"Price: ${data['price']:.2f}\n"
                f"Quantity: {data['quantity']:.8f}\n"
                f"Mode: {'Simulation' if is_simulated else 'Live'}"
            )
        else:
            error_data = response.json()
            update.message.reply_text(f"❌ Error executing sell: {error_data.get('detail', 'Unknown error')}")
            
    except Exception as e:
        update.message.reply_text(f"Error: {str(e)}")

def status_command(update, context):
    try:
        # User ID from Telegram
        user_id = update.effective_user.id
        
        # Get status from API
        response = requests.get(f"{API_BASE_URL}/status?user_id={user_id}")
        
        if response.status_code == 200:
            data = response.json()
            
            if not data["positions"]:
                update.message.reply_text("You have no open positions.")
                return
                
            # Format positions
            position_texts = []
            for pos in data["positions"]:
                pnl_emoji = "🟢" if pos["pnl_percentage"] >= 0 else "🔴"
                position_texts.append(
                    f"{pos['symbol']}: {pos['quantity']:.8f}\n"
                    f"Entry: ${pos['entry_price']:.2f} | Current: ${pos['current_price']:.2f}\n"
                    f"P&L: {pnl_emoji} {pos['pnl_percentage']:.2f}% (${pos['pnl_amount']:.2f})"
                )
            
            # Format summary
            summary = data["summary"]
            overall_pnl_emoji = "🟢" if summary["overall_pnl_percentage"] >= 0 else "🔴"
            
            message = "📊 Your Portfolio:\n\n"
            message += "\n\n".join(position_texts)
            message += f"\n\n📈 Summary:\n"
            message += f"Total Positions: {summary['total_positions']}\n"
            message += f"Total Invested: ${summary['total_invested']:.2f}\n"
            message += f"Current Value: ${summary['total_current_value']:.2f}\n"
            message += f"Overall P&L: {overall_pnl_emoji} {summary['overall_pnl_percentage']:.2f}% (${summary['overall_pnl']:.2f})"
            
            update.message.reply_text(message)
        else:
            error_data = response.json()
            update.message.reply_text(f"❌ Error getting status: {error_data.get('detail', 'Unknown error')}")
            
    except Exception as e:
        update.message.reply_text(f"Error: {str(e)}")
def history_command(update, context):
    try:
        # Parse optional arguments
        symbol = None
        limit = 10
        
        if context.args:
            symbol = context.args[0].upper()
            
            # Check if there's a limit parameter
            if len(context.args) > 1 and context.args[1].isdigit():
                limit = min(int(context.args[1]), 20)  # Cap at 20 to avoid huge messages
        
        # User ID from Telegram
        user_id = update.effective_user.id
        
        # Get trade history from API
        params = {"user_id": user_id, "limit": limit}
        if symbol:
            params["symbol"] = symbol
            
        response = requests.get(f"{API_BASE_URL}/trade-history", params=params)
        
        if response.status_code == 200:
            data = response.json()
            trades = data["trades"]
            
            if not trades:
                update.message.reply_text("You don't have any trading history yet.")
                return
                
            # Format trade history
            message = "📜 Your Trade History:\n\n"
            
            for trade in trades:
                trade_date = datetime.fromisoformat(trade["timestamp"].replace("Z", "+00:00"))
                formatted_date = trade_date.strftime("%Y-%m-%d %H:%M")
                
                side_emoji = "🟢" if trade["side"] == "buy" else "🔴"
                status = "Open" if trade["is_open"] else "Closed"
                sim_label = "(Sim)" if trade["is_simulated"] else ""
                
                message += (
                    f"{formatted_date} {side_emoji} {trade['side'].upper()} {sim_label}\n"
                    f"{trade['symbol']}: {trade['quantity']:.8f} @ ${trade['price']:.2f}\n"
                    f"Value: ${trade['value']:.2f} | Status: {status}\n\n"
                )
            
            update.message.reply_text(message)
        else:
            error_data = response.json()
            update.message.reply_text(f"❌ Error getting history: {error_data.get('detail', 'Unknown error')}")
            
    except Exception as e:
        update.message.reply_text(f"Error: {str(e)}")
        
def main():
    # Get token from environment variable
    token = os.getenv('TELEGRAM_BOT_TOKEN')
    
    if not token:
        logger.error("TELEGRAM_BOT_TOKEN environment variable not set!")
        return
    
    updater = Updater(token=token, use_context=True)
    dispatcher = updater.dispatcher
    
    # Register handlers
    dispatcher.add_handler(CommandHandler("start", start))
    dispatcher.add_handler(CommandHandler("price", price_command))
    dispatcher.add_handler(CommandHandler("buy", buy_command))
    dispatcher.add_handler(CommandHandler("sell", sell_command))
    dispatcher.add_handler(CommandHandler("status", status_command))
    dispatcher.add_handler(CommandHandler("history", history_command))  # Add this line

    
    # Start the bot
    logger.info("Starting Telegram bot...")
    updater.start_polling()
    logger.info("Bot is running!")
    updater.idle()

if __name__ == "__main__":
    main()