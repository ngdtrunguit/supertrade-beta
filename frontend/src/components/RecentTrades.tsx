// src/components/RecentTrades.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';

interface Trade {
  id: number;
  symbol: string;
  side: 'buy' | 'sell';
  price: number;
  quantity: number;
  value: number;
  timestamp: string;
  isSimulated: boolean;
  isOpen: boolean;
  profitLoss?: number;
  profitLossPct?: number;
}

const RecentTrades: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API call to get trade history
    const fetchTradeHistory = async () => {
      setLoading(true);
      try {
        // In a real app, this would be an API call
        // const response = await fetch('/api/trade-history');
        // const data = await response.json();
        
        // For demo, create mock data
        await new Promise(resolve => setTimeout(resolve, 600)); // Simulate network delay
        
        const mockTrades: Trade[] = [
          {
            id: 1001,
            symbol: 'BTCUSDT',
            side: 'buy',
            price: 39750.00,
            quantity: 0.05,
            value: 39750.00 * 0.05,
            timestamp: '2023-10-15T14:30:00Z',
            isSimulated: true,
            isOpen: true
          },
          {
            id: 1002,
            symbol: 'ETHUSDT',
            side: 'sell',
            price: 2150.00,
            quantity: 0.5,
            value: 2150.00 * 0.5,
            timestamp: '2023-10-14T16:45:00Z',
            isSimulated: true,
            isOpen: false,
            profitLoss: -45.75,
            profitLossPct: -2.1
          },
          {
            id: 1003,
            symbol: 'ETHUSDT',
            side: 'buy',
            price: 2080.00,
            quantity: 0.5,
            value: 2080.00 * 0.5,
            timestamp: '2023-10-13T09:15:00Z',
            isSimulated: true,
            isOpen: false
          },
          {
            id: 1004,
            symbol: 'ADAUSDT',
            side: 'buy',
            price: 0.48,
            quantity: 2000,
            value: 0.48 * 2000,
            timestamp: '2023-10-12T11:30:00Z',
            isSimulated: true,
            isOpen: true
          },
          {
            id: 1005,
            symbol: 'SOLUSDT',
            side: 'sell',
            price: 38.25,
            quantity: 25,
            value: 38.25 * 25,
            timestamp: '2023-10-10T08:20:00Z',
            isSimulated: true,
            isOpen: false,
            profitLoss: -28.75,
            profitLossPct: -3.0
          }
        ];
        
        setTrades(mockTrades);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching trade history:', error);
        setError('Failed to load trade history. Please try again later.');
        setLoading(false);
      }
    };

    fetchTradeHistory();
  }, []);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-500" />
          <p className="mt-2 text-gray-500">Loading trade history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Trades</CardTitle>
      </CardHeader>
      <CardContent>
        {trades.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No trade history found.</p>
            <Button className="mt-4">Make Your First Trade</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Symbol</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-right">Price</th>
                  <th className="px-4 py-2 text-right">Quantity</th>
                  <th className="px-4 py-2 text-right">Value</th>
                  <th className="px-4 py-2 text-right">P/L</th>
                  <th className="px-4 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade) => (
                  <tr key={trade.id} className="border-b">
                    <td className="px-4 py-2">{formatDate(trade.timestamp)}</td>
                    <td className="px-4 py-2">{trade.symbol}</td>
                    <td className="px-4 py-2">
                      <Badge className={trade.side === 'buy' ? 'bg-green-500' : 'bg-red-500'}>
                        {trade.side.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-right">${trade.price.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">
                      {trade.quantity < 1 ? trade.quantity.toFixed(8) : trade.quantity.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right">${trade.value.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">
                      {trade.profitLoss ? (
                        <span className={trade.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}>
                          ${trade.profitLoss.toFixed(2)}
                          <span className="text-xs">
                            ({trade.profitLossPct?.toFixed(2)}%)
                          </span>
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <Badge variant={trade.isOpen ? 'default' : 'outline'}>
                        {trade.isOpen ? 'Open' : 'Closed'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentTrades;