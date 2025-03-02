# Crypto Trading Bot with Technical Indicators

A comprehensive cryptocurrency trading platform that provides technical analysis, automated trading strategies, portfolio management, and a simulation engine for risk-free paper trading. The system features a web-based dashboard and Telegram bot integration for convenient monitoring and trading.

## Key Features

- **Technical Indicators**: Implementation of EMA Crossover (7/21 day), RSI (14-period with oversold<30, overbought>70), and VWAP (daily basis with ±3% deviation alerts)
- **Real-time Data**: Connects to Binance API for market data with websocket support for live price updates
- **Trading Simulator**: Paper trading with real market conditions, configurable starting capital, and performance metrics
- **Comprehensive Database**: Secure storage of user data, API keys (encrypted), trades, alerts, and market data
- **Multi-Interface Access**: Web dashboard with React and Telegram bot for on-the-go trading
- **Top Cryptocurrencies Focus**: Automatically monitors top 15 coins by 24h volume (excluding BTC, ETH, BNB)
- **Security Features**: AES-256 encryption for API keys, JWT authentication, rate limiting, and no withdrawal permissions

## Architecture

The application follows a modular design with several key components:

- **Backend**: Python 3.11+ core for trading algorithms and data analysis
- **API Server**: FastAPI for RESTful endpoints and websocket connections
- **Database**: PostgreSQL for secure, scalable data storage
- **Frontend**: React.js with Chart.js for interactive visualization
- **Messaging**: Telegram Bot API for mobile notifications and trading

## Installation

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- Docker and Docker Compose (optional, for containerized deployment)

### Local Development Setup

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/crypto-trading-bot.git
cd crypto-trading-bot
```

2. **Setup virtual environment for Python**

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. **Configure environment variables**

Create a `.env` file in the project root:

```
# Database
DATABASE_URL=postgresql://crypto_user:crypto_password@localhost/crypto_bot

# Binance API (optional for live data)
BINANCE_API_KEY=your_binance_api_key
BINANCE_API_SECRET=your_binance_api_secret

# Telegram Bot (optional)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Security
API_ENCRYPTION_KEY=your_encryption_key_base64
JWT_SECRET_KEY=your_jwt_secret_key
```

4. **Setup PostgreSQL database**

```bash
# Create database and user
createdb crypto_bot
createuser -P crypto_user  # Set password to "crypto_password" when prompted
psql -d crypto_bot -c "GRANT ALL PRIVILEGES ON DATABASE crypto_bot TO crypto_user;"
```

5. **Run database migrations**

```bash
alembic upgrade head
```

6. **Start the backend server**

```bash
uvicorn app:app --reload
```

7. **Set up and run the frontend**

```bash
cd frontend
npm install
npm start
```

### Docker Deployment

For a containerized setup, use Docker Compose:

```bash
docker-compose up -d
```

This will start the PostgreSQL database, backend API, and frontend in separate containers.

## Core Components

### 1. Technical Indicators Module

The `technical_indicators.py` module implements the following indicators:

- **EMA Crossover**: 7-day and 21-day EMA with golden/death cross signals
- **RSI**: 14-period RSI with oversold (<30) and overbought (>70) signals
- **VWAP**: Daily VWAP with ±3% deviation alerts

### 2. Market Data Collector

The `market_data_collector.py` component:

- Fetches real-time and historical data from Binance
- Automatically refreshes the top 15 cryptocurrencies by volume
- Manages data storage in the PostgreSQL database
- Handles rate limiting and API outages gracefully

### 3. Trading Strategy

The `trading_strategy.py` module:

- Combines multiple technical indicators to generate signals
- Customizable risk levels from conservative (1) to aggressive (5)
- Provides position sizing, stop-loss and take-profit recommendations
- Generates detailed trade recommendations with supporting analysis

### 4. Trading Simulator

The `trading_simulator.py` component:

- Simulates trading with virtual funds but real market conditions
- Tracks portfolio performance with detailed metrics
- Supports back-testing on historical data
- Provides profit/loss calculations and performance analytics

### 5. FastAPI Service

The `app.py` FastAPI service provides:

- RESTful endpoints for all functionality
- JWT authentication for secure access
- Real-time market data and analysis
- Trade execution and portfolio management
- User preference management

### 6. Telegram Bot Integration

The `telegram_bot.py` module offers:

- Command-based interaction (/price, /analysis, /buy, etc.)
- Real-time market updates and alerts
- Portfolio status and trade history access
- Secure account linking to web interface

## API Endpoints

The application exposes the following key endpoints:

### Authentication
- `POST /token` - Get JWT access token
- `POST /users` - Create a new user

### Market Data
- `GET /market-data/{symbol}` - Get price data for a symbol
- `GET /technical-analysis/{symbol}` - Get technical indicators for a symbol
- `GET /market/top-symbols` - Get top cryptocurrencies by volume

### Trading
- `POST /simulate/trade` - Execute a simulated trade
- `POST /simulate/run` - Run a trading simulation
- `GET /trades` - Get trade history

### User Management
- `GET /users/me` - Get current user info
- `GET /preferences` - Get user preferences
- `PUT /preferences` - Update user preferences

### API Keys & Alerts
- `POST /api-keys` - Add a new API key
- `GET /api-keys` - Get all API keys
- `POST /alerts` - Create a new alert
- `GET /alerts` - Get all alerts

## Usage Examples

### Web Dashboard

The web dashboard provides an intuitive interface for trading and analysis:

1. **Login/Register** to access your personalized dashboard
2. Use the **Market Overview** to see top cryptocurrencies and their trends
3. Select a symbol to view the **Technical Analysis** with indicators and signals
4. Set up **Alerts** for price movements or indicator signals
5. Use the **Trading Simulator** to practice trading with virtual funds
6. Monitor your **Portfolio** performance and trade history
7. Adjust **Settings** to customize risk levels and notification preferences

### Telegram Bot

The Telegram bot allows mobile access to key features:

```
# Basic commands
/start - Welcome message and bot introduction
/help - List all available commands
/price BTC - Get current price of Bitcoin
/analysis ETH - Get technical analysis for Ethereum
/buy - Start the buy process
/portfolio - View your current portfolio
/trades - View your trade history
/top - See top cryptocurrencies by volume
/alerts - Manage your alerts
/settings - Update your preferences
```

## Security Considerations

The application implements several security measures:

1. **API Key Encryption**: All exchange API keys are encrypted with AES-256 before storage
2. **JWT Authentication**: Secure token-based authentication for all API endpoints
3. **Rate Limiting**: Protection against brute force attacks
4. **No Withdrawal Permissions**: Trading API keys don't require withdrawal permissions
5. **Password Hashing**: User passwords are securely hashed with pbkdf2_sha256
6. **Data Validation**: Input validation on all API endpoints

## Deployment Options

### Local Development

Suitable for testing and development:

```bash
uvicorn app:app --reload
```

### Production Deployment

For production environments:

```bash
# Using Gunicorn with Uvicorn workers
gunicorn app:app -k uvicorn.workers.UvicornWorker -w 4 --bind 0.0.0.0:8000
```

### Docker Deployment

Containerized deployment for improved isolation and scalability:

```bash
docker-compose up -d
```

### Cloud Deployment (Azure Container Apps)

For cloud-based deployment:

```bash
# Build and tag images
docker-compose build

docker tag crypto-trading-bot_backend YourACRName.azurecr.io/crypto-bot-backend:latest
docker tag crypto-trading-bot_frontend YourACRName.azurecr.io/crypto-bot-frontend:latest

# Push to ACR
docker push YourACRName.azurecr.io/crypto-bot-backend:latest
docker push YourACRName.azurecr.io/crypto-bot-frontend:latest

# Deploy to Azure Container Apps
az containerapp create \
  --name crypto-bot-backend \
  --resource-group YourResourceGroup \
  --environment crypto-bot-env \
  --image YourACRName.azurecr.io/crypto-bot-backend:latest \
  --target-port 8000 \
  --ingress external
```

## Maintenance and Monitoring

### Database Backups

Automated daily backups can be set up using the included script:

```bash
chmod +x backup-db.sh
crontab -e
# Add: 0 3 * * * /path/to/backup_db.sh
```

### Logging

The application uses structured logging for easier monitoring:

- Application logs: Standard output/error
- Database logs: PostgreSQL logs
- Request logs: FastAPI middleware

### Monitoring

For production deployments, consider integrating:

- Prometheus for metrics collection
- Grafana for visualization
- Sentry for error tracking

## Customization

### Adding New Technical Indicators

To add a new indicator:

1. Add calculation logic to `technical_indicators.py`
2. Integrate the new indicator into `trading_strategy.py`
3. Update the frontend visualization components

### Changing Risk Parameters

Risk levels can be adjusted in `trading_strategy.py`:

```python
# Modify the parameters for different risk levels
if self.risk_level == 1:  # Very conservative
    params.update({
        'signal_threshold': 0.7,
        'position_size': 0.1,
        # Other parameters...
    })
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Binance API](https://github.com/binance/binance-spot-api-docs) for market data
- [FastAPI](https://fastapi.tiangolo.com/) for the API framework
- [SQLAlchemy](https://www.sqlalchemy.org/) for database ORM
- [React](https://reactjs.org/) for the frontend framework
- [python-telegram-bot](https://github.com/python-telegram-bot/python-telegram-bot) for Telegram integration