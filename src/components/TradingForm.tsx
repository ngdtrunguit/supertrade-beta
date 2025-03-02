// src/components/TradingForm.tsx
import React, { useState } from 'react';
import { executeBuy, executeSell } from '../api/tradingApi';

const TradingForm: React.FC = () => {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [amount, setAmount] = useState('500');
  const [isSimulated, setIsSimulated] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const handleSubmit = async (action: 'buy' | 'sell') => {
    setLoading(true);
    try {
      const amountValue = parseFloat(amount);
      
      if (isNaN(amountValue)) {
        throw new Error('Invalid amount');
      }
      
      const executeTrade = action === 'buy' ? executeBuy : executeSell;
      const result = await executeTrade(symbol, amountValue, isSimulated);
      
      setResult(result);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="trading-form">
      <h2>Execute Trade</h2>
      
      <div className="form-group">
        <label>Symbol</label>
        <input 
          type="text" 
          value={symbol} 
          onChange={(e) => setSymbol(e.target.value.toUpperCase())} 
        />
      </div>
      
      <div className="form-group">
        <label>Amount (USD)</label>
        <input 
          type="number" 
          value={amount} 
          onChange={(e) => setAmount(e.target.value)} 
        />
      </div>
      
      <div className="form-group">
        <label>
          <input 
            type="checkbox" 
            checked={isSimulated} 
            onChange={(e) => setIsSimulated(e.target.checked)} 
          />
          Simulation Mode
        </label>
      </div>
      
      <div className="button-group">
        <button 
          onClick={() => handleSubmit('buy')} 
          disabled={loading}
        >
          Buy
        </button>
        <button 
          onClick={() => handleSubmit('sell')} 
          disabled={loading}
        >
          Sell
        </button>
      </div>
      
      {loading && <div className="loading">Processing...</div>}
      
      {result && (
        <div className="result">
          {result.error ? (
            <div className="error">{result.error}</div>
          ) : (
            <div className="success">
              <h3>Trade Executed!</h3>
              <p>Trade ID: {result.trade_id}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TradingForm;