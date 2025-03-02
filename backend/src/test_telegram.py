import os
from telegram.ext import Updater, CommandHandler, MessageHandler, Filters

def start(update, context):
    update.message.reply_text('Hello! I am your crypto trading bot. Use /price BTC to get Bitcoin price.')

def price_command(update, context):
    try:
        if len(context.args) < 1:
            update.message.reply_text("Usage: /price [symbol]")
            return
            
        symbol = context.args[0].upper()
        
        # Use your API to get the price
        import requests
        response = requests.get(f"http://localhost:8000/get_price/{symbol}")
        
        if response.status_code == 200:
            data = response.json()
            update.message.reply_text(f"Current {symbol} price: ${data['price']:.2f} {data['currency']}")
        else:
            update.message.reply_text(f"Error getting price for {symbol}")
            
    except Exception as e:
        update.message.reply_text(f"Error: {str(e)}")

def run_telegram_bot():
    # Get token from environment variable
    token = "7541214501:AAEBfPG48l36kGi0UgNTGhgeGV_ECrCIC-0"
    
    if not token:
        print("TELEGRAM_BOT_TOKEN environment variable not set!")
        print("Please set it and try again.")
        return
    
    updater = Updater(token=token, use_context=True)
    dispatcher = updater.dispatcher
    
    # Register handlers
    dispatcher.add_handler(CommandHandler("start", start))
    dispatcher.add_handler(CommandHandler("price", price_command))
    
    # Start the bot
    print("Starting Telegram bot...")
    updater.start_polling()
    print("Bot is running! Press Ctrl+C to stop.")
    updater.idle()

if __name__ == "__main__":
    run_telegram_bot()