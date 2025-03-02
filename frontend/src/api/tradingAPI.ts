// src/api/tradingApi.ts
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

/**
 * Interface for trade response from the API
 */
export interface TradeResponse {
  status: string;
  trade_id: string;
  symbol: string;
  price: number;
  quantity: number;
  amount: number;
  timestamp: string;
}

/**
 * Interface for trade history response
 */
export interface TradeHistoryResponse {
  trades: {
    id: number;
    symbol: string;
    side: string;
    price: number;
    quantity: number;
    value: number;
    timestamp: string;
    is_simulated: boolean;
    is_open: boolean;
  }[];
}

/**
 * Execute a buy order
 * @param symbol Trading pair symbol (e.g., BTCUSDT)
 * @param amount Amount in USD to spend
 * @param isSimulated Whether to execute in simulation mode
 * @param userId Optional user ID
 * @returns Trade response
 */
export const executeBuy = async (
  symbol: string, 
  amount: number, 
  isSimulated: boolean = false, 
  userId?: number
): Promise<TradeResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/buy`, {
      symbol,
      amount,
      user_id: userId,
      is_simulated: isSimulated
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      // Extract API error message if available
      throw new Error(error.response.data.detail || 'Failed to execute buy order');
    }
    throw new Error('Network error: Could not connect to trading server');
  }
};

/**
 * Execute a sell order
 * @param symbol Trading pair symbol (e.g., BTCUSDT)
 * @param amount Amount in USD to sell
 * @param isSimulated Whether to execute in simulation mode
 * @param userId Optional user ID
 * @returns Trade response
 */
export const executeSell = async (
  symbol: string, 
  amount: number, 
  isSimulated: boolean = false, 
  userId?: number
): Promise<TradeResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/sell`, {
      symbol,
      amount,
      user_id: userId,
      is_simulated: isSimulated
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      // Extract API error message if available
      throw new Error(error.response.data.detail || 'Failed to execute sell order');
    }
    throw new Error('Network error: Could not connect to trading server');
  }
};

/**
 * Get trading pair price
 * @param symbol Trading pair symbol (e.g., BTCUSDT or BTC)
 * @returns Price information
 */
export const getPrice = async (symbol: string): Promise<{
  symbol: string;
  price: number;
  currency: string;
}> => {
  try {
    // Clean the symbol - add USDT if not present
    const formattedSymbol = symbol.endsWith('USDT') ? symbol : `${symbol}USDT`;
    const response = await axios.get(`${API_BASE_URL}/get_price/${formattedSymbol}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.detail || 'Failed to get price');
    }
    throw new Error('Network error: Could not retrieve price information');
  }
};

/**
 * Get trade history
 * @param userId Optional user ID
 * @param symbol Optional trading pair to filter
 * @param limit Optional limit of trades to return
 * @returns Trade history
 */
export const getTradeHistory = async (
  userId?: number,
  symbol?: string,
  limit: number = 50
): Promise<TradeHistoryResponse['trades']> => {
  try {
    // Build query parameters
    const params: Record<string, string | number> = { limit };
    if (userId) params.user_id = userId;
    if (symbol) params.symbol = symbol;

    const response = await axios.get(`${API_BASE_URL}/trade-history`, { params });
    return response.data.trades;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.detail || 'Failed to fetch trade history');
    }
    throw new Error('Network error: Could not retrieve trade history');
  }
};

/**
 * Get portfolio status including open positions
 * @param userId Optional user ID
 * @returns Portfolio status with open positions
 */
export const getPortfolioStatus = async (userId?: number): Promise<{
  status: string;
  positions: Record<string, any>;
  summary: {
    total_positions: number;
    total_invested: number;
    total_current_value: number;
    overall_pnl: number;
    overall_pnl_percentage: number;
  }
}> => {
  try {
    const params: Record<string, string | number> = {};
    if (userId) params.user_id = userId;

    const response = await axios.get(`${API_BASE_URL}/status`, { params });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.detail || 'Failed to fetch portfolio status');
    }
    throw new Error('Network error: Could not retrieve portfolio information');
  }
};

/**
 * Get technical analysis for a symbol
 * @param symbol Trading pair symbol
 * @param interval Timeframe interval (e.g., 1h, 1d)
 * @returns Technical analysis data
 */
export const getTechnicalAnalysis = async (
  symbol: string,
  interval: string = '1h'
): Promise<{
  symbol: string;
  interval: string;
  summary: Record<string, any>;
  alerts: Array<{
    type: string;
    direction: string;
    message: string;
  }>;
}> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/technical-analysis/${symbol}?interval=${interval}`
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.detail || 'Failed to fetch technical analysis');
    }
    throw new Error('Network error: Could not retrieve technical analysis');
  }
};

/**
 * Get top trading symbols by volume
 * @returns List of top symbols
 */
export const getTopSymbols = async (): Promise<{
  symbols: string[]
}> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/market/top-symbols`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.detail || 'Failed to fetch top symbols');
    }
    throw new Error('Network error: Could not retrieve top trading symbols');
  }
};



/**
 * Execute a trade (buy or sell)
 * @param type 'buy' or 'sell'
 * @param symbol Trading pair symbol (e.g., BTCUSDT)
 * @param amount Amount in USD
 * @param isSimulated Whether to execute in simulation mode
 * @param userId Optional user ID
 * @returns Trade response
 */
export const executeTrade = async (
  type: "buy" | "sell",
  symbol: string,
  amount: number,
  isSimulated: boolean = false,
  userId?: number
): Promise<TradeResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/${type}`, {
      symbol,
      amount,
      user_id: userId,
      is_simulated: isSimulated,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.detail || `Failed to execute ${type} order`);
    }
    throw new Error("Network error: Could not connect to trading server");
  }
};