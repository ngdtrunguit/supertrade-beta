import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { executeTrade, getTopSymbols } from '../api/tradingApi';
import { useQuery } from '@tanstack/react-query';

const Trading: React.FC = () => {
  const [tradeParams, setTradeParams] = useState({
    symbol: 'BTCUSDT',
    amount: '',
    side: 'buy' as 'buy' | 'sell',
    isSimulated: true
  });

  const { data: topSymbols } = useQuery({
    queryKey: ['topSymbols'],
    queryFn: getTopSymbols
  });

  const handleTradeSubmit = async () => {
    try {
      const response = await executeTrade(
        tradeParams.symbol, 
        parseFloat(tradeParams.amount), 
        tradeParams.isSimulated, 
        tradeParams.side
      );
      
      // Handle successful trade
      console.log('Trade executed:', response);
      alert('Trade executed successfully!');
    } catch (error) {
      console.error('Trade error:', error);
      alert('Failed to execute trade');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Trading</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Execute Trade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label>Trading Pair</label>
            <Select 
              value={tradeParams.symbol}
              onValueChange={(val) => setTradeParams(prev => ({ ...prev, symbol: val }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Symbol" />
              </SelectTrigger>
              <SelectContent>
                {topSymbols?.map((symbol) => (
                  <SelectItem key={symbol} value={symbol}>
                    {symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label>Trade Side</label>
            <div className="flex space-x-2">
              <Button 
                variant={tradeParams.side === 'buy' ? 'default' : 'outline'}
                onClick={() => setTradeParams(prev => ({ ...prev, side: 'buy' }))}
                className="flex-1"
              >
                Buy
              </Button>
              <Button 
                variant={tradeParams.side === 'sell' ? 'destructive' : 'outline'}
                onClick={() => setTradeParams(prev => ({ ...prev, side: 'sell' }))}
                className="flex-1"
              >
                Sell
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label>Amount (USDT)</label>
            <Input 
              type="number" 
              placeholder="Enter trade amount" 
              value={tradeParams.amount}
              onChange={(e) => setTradeParams(prev => ({ ...prev, amount: e.target.value }))}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="simulation-mode" 
              checked={tradeParams.isSimulated}
              onChange={(e) => setTradeParams(prev => ({ 
                ...prev, 
                isSimulated: e.target.checked 
              }))}
            />
            <label htmlFor="simulation-mode">Simulation Mode</label>
          </div>

          <Button 
            onClick={handleTradeSubmit} 
            className={tradeParams.side === 'buy' ? 'w-full bg-green-500' : 'w-full bg-red-500'}
          >
            {`${tradeParams.side.toUpperCase()} ${tradeParams.symbol}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Trading;