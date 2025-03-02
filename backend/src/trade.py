class TradingEngine:
    def __init__(self, db_session, api_key=None, api_secret=None):
        self.db = db_session
        self.api_key = api_key
        self.api_secret = api_secret
        self.binance_client = None
        
        if api_key and api_secret:
            from binance.client import Client
            self.binance_client = Client(api_key, api_secret)
    
    def execute_buy(self, symbol, amount, user_id=None, is_simulated=False):
        if is_simulated:
            return self._simulate_buy(symbol, amount, user_id)
        else:
            return self._live_buy(symbol, amount, user_id)
    
    def execute_sell(self, symbol, amount, user_id=None, is_simulated=False):
        if is_simulated:
            return self._simulate_sell(symbol, amount, user_id)
        else:
            return self._live_sell(symbol, amount, user_id)
    
    def _live_buy(self, symbol, amount, user_id):
        # Validate API client exists
        if not self.binance_client:
            raise Exception("API credentials required for live trading")
        
        # Execute real trade through Binance API
        order = self.binance_client.create_order(
            symbol=symbol,
            side=self.binance_client.SIDE_BUY,
            type=self.binance_client.ORDER_TYPE_MARKET,
            quoteOrderQty=amount  # Buy $500 worth of BTC
        )
        
        # Record trade in database
        trade = Trade(
            exchange="binance",
            symbol=symbol,
            side="buy",
            price=float(order['fills'][0]['price']),
            quantity=float(order['executedQty']),
            timestamp=datetime.utcnow(),
            is_simulated=False,
            user_id=user_id
        )
        self.db.add(trade)
        self.db.commit()
        
        return trade
    
    def _simulate_buy(self, symbol, amount, user_id):
        # Get current market price
        price = self._get_current_price(symbol)
        quantity = amount / price
        
        # Record simulated trade
        trade = Trade(
            exchange="binance",
            symbol=symbol,
            side="buy",
            price=price,
            quantity=quantity,
            timestamp=datetime.utcnow(),
            is_simulated=True,
            user_id=user_id
        )
        self.db.add(trade)
        self.db.commit()
        
        return trade
    
    # Implement similar methods for sell operations
    
    def _get_current_price(self, symbol):
        # Either use API or fetch from market data service
        if self.binance_client:
            ticker = self.binance_client.get_symbol_ticker(symbol=symbol)
            return float(ticker['price'])
        else:
            # Fallback to public API
            import requests
            response = requests.get(f"https://api.binance.com/api/v3/ticker/price?symbol={symbol}")
            data = response.json()
            return float(data['price'])