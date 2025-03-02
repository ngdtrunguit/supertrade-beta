import pandas as pd
import pandas_ta as ta
import sqlite3
import datetime
import time
import random

# --- CONFIGURATION ---
LIVE_TRADING = False  # Set to True for real trading, False for Dry-Run
API_KEY = "YOUR_BINANCE_API_KEY" if LIVE_TRADING else None
API_SECRET = "YOUR_BINANCE_SECRET_KEY" if LIVE_TRADING else None
TRADING_PAIR = "BTCUSDT"
TRADE_AMOUNT = 0.001  # Amount of BTC to buy/sell

# SQLite Database Setup
conn = sqlite3.connect('trading_data.db')
cursor = conn.cursor()
cursor.execute("""CREATE TABLE IF NOT EXISTS btc_usdt (timestamp TEXT, close REAL, signal TEXT)""")
conn.commit()
conn.close()

if LIVE_TRADING:
    from binance.client import Client
    from binance.streams import ThreadedWebsocketManager

    # Initialize Binance Client
    client = Client(API_KEY, API_SECRET)

    def get_historical_data():
        """Fetches real market data from Binance."""
        klines = client.get_klines(symbol=TRADING_PAIR, interval=Client.KLINE_INTERVAL_1HOUR, limit=100)
        df = pd.DataFrame(klines, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'] +
                          ['close_time', 'quote_asset_volume', 'num_trades', 'taker_buy_base_volume', 
                           'taker_buy_quote_volume', 'ignore'])
        df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
        df[['close']] = df[['close']].astype(float)
        return df[['timestamp', 'close']]

    def execute_trade(order_type):
        """Executes real trade on Binance."""
        if order_type == "BUY":
            order = client.order_market_buy(symbol=TRADING_PAIR, quantity=TRADE_AMOUNT)
        else:
            order = client.order_market_sell(symbol=TRADING_PAIR, quantity=TRADE_AMOUNT)
        print(f"✅ Trade executed: {order_type} {TRADE_AMOUNT} BTC")
        return order

else:
    def get_historical_data():
        """Simulates price data without Binance API."""
        base_price = 40000  # Simulated BTC price
        simulated_data = []
        for i in range(100):
            price = base_price + random.uniform(-1000, 1000)
            simulated_data.append([datetime.datetime.now() - datetime.timedelta(minutes=60*i), price])
        df = pd.DataFrame(simulated_data, columns=['timestamp', 'close'])
        return df

    def execute_trade(order_type):
        """Simulated trade execution (No real trading)."""
        print(f"⚠ Simulated Trade: {order_type} at {get_historical_data()['close'].iloc[-1]}")

# --- Trade Signal Logic ---
def check_trade_signal():
    df = get_historical_data()
    df['SMA_10'] = ta.sma(df['close'], length=10)
    df['SMA_30'] = ta.sma(df['close'], length=30)

    latest_sma_10 = df['SMA_10'].iloc[-1]
    latest_sma_30 = df['SMA_30'].iloc[-1]
    latest_close = df['close'].iloc[-1]

    signal = None
    if latest_sma_10 > latest_sma_30:
        signal = "BUY"
    elif latest_sma_10 < latest_sma_30:
        signal = "SELL"

    if signal:
        print(f"🚀 Trade Signal: {signal} at {latest_close}")
        execute_trade(signal)

        # Save trade data in SQLite
        conn = sqlite3.connect('trading_data.db')
        cursor = conn.cursor()
        cursor.execute("INSERT INTO btc_usdt (timestamp, close, signal) VALUES (?, ?, ?)", 
                       (str(datetime.datetime.now()), latest_close, signal))
        conn.commit()
        conn.close()

# --- WebSocket for Live Price Updates (Only in Live Mode) ---
if LIVE_TRADING:
    def process_message(msg):
        """Handles incoming WebSocket messages for live prices."""
        close_price = float(msg['k']['c'])
        print(f"[Live Update] BTC/USDT Close Price: {close_price}")
        check_trade_signal()

    twm = ThreadedWebsocketManager(api_key=API_KEY, api_secret=API_SECRET)
    twm.start()
    twm.start_kline_socket(callback=process_message, symbol=TRADING_PAIR, interval=Client.KLINE_INTERVAL_1MINUTE)
else:
    while True:
        check_trade_signal()
        time.sleep(10)  # Simulated update every 10 seconds
