// src/api/tradingApi.ts
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const executeBuy = async (symbol: string, amount: number, isSimulated: boolean = false, userId?: number) => {
  const response = await axios.post(`${API_BASE_URL}/buy`, {
    symbol,
    amount,
    user_id: userId,
    is_simulated: isSimulated
  });
  return response.data;
};

export const executeSell = async (symbol: string, amount: number, isSimulated: boolean = false, userId?: number) => {
  const response = await axios.post(`${API_BASE_URL}/sell`, {
    symbol,
    amount,
    user_id: userId,
    is_simulated: isSimulated
  });
  return response.data;
};

export const getTradeHistory = async (userId?: number) => {
  const response = await axios.get(`${API_BASE_URL}/trades${userId ? `?user_id=${userId}` : ''}`);
  return response.data;
};