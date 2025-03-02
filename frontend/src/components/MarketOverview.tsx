// src/components/MarketOverview.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2, ArrowUp, ArrowDown } from 'lucide-react';

interface CryptoAsset {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
}

const MarketOverview: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('24h');
  const [marketData, setMarketData] = useState<CryptoAsset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('volume');

  useEffect(() => {
    // Simulate API call to get market data
    const fetchMarketData = async () => {
      setLoading(true);
      try {
        // In a real app, this would be an API call
        // const response = await fetch(`/api/market-data?timeframe=${timeframe}`);
        // const data = await response.json();
        
        // For demo, create mock data
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
        
        const mockData: CryptoAsset[] = [
          {
            symbol: 'BTCUSDT',
            name: 'Bitcoin',
            price: 41250.75,
            change24h: 2.3,
            volume24h: 28500000000,
            marketCap: 802500000000
          },
          {
            symbol: 'ETHUSDT',
            name: 'Ethereum',
            price: 2275.50,
            change24h: 1.8,
            volume24h: 15200000000,
            marketCap: 273000000000
          },
          {
            symbol: 'BNBUSDT',
            name: 'Binance Coin',
            price: 385.25,
            change24h: -0.5,
            volume24h: 1450000000,
            marketCap: 59800000000
          },
          {
            symbol: 'ADAUSDT',
            name: 'Cardano',
            price: 0.48,
            change24h: 3.2,
            volume24h: 850000000,
            marketCap: 16900000000
          },
          {
            symbol: 'SOLUSDT',
            name: 'Solana',
            price: 145.80,
            change24h: 5.1,
            volume24h: 2100000000,
            marketCap: 63500000000
          },
          {
            symbol: 'XRPUSDT',
            name: 'Ripple',
            price: 0.58,
            change24h: -1.2,
            volume24h: 1750000000,
            marketCap: 31200000000
          },
          {
            symbol: 'DOTUSDT',
            name: 'Polkadot',
            price: 6.75,
            change24h: 2.8,
            volume24h: 420000000,
            marketCap: 8500000000
          },
          {
            symbol: 'DOGEUSDT',
            name: 'Dogecoin',
            price: 0.075,
            change24h: -2.3,
            volume24h: 580000000,
            marketCap: 10800000000
          },
          {
            symbol: 'MATICUSDT',
            name: 'Polygon',
            price: 0.65,
            change24h: 1.5,
            volume24h: 350000000,
            marketCap: 6300000000
          },
          {
            symbol: 'AVAXUSDT',
            name: 'Avalanche',
            price: 31.20,
            change24h: 4.7,
            volume24h: 620000000,
            marketCap: 11500000000
          }
        ];
        
        // Sort by the selected criteria
        const sortedData = [...mockData].sort((a, b) => {
          if (sortBy === 'volume') return b.volume24h - a.volume24h;
          if (sortBy === 'price') return b.price - a.price;
          if (sortBy === 'change') return b.change24h - a.change24h;
          return b.marketCap - a.marketCap;
        });
        
        setMarketData(sortedData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching market data:', error);
        setError('Failed to load market data. Please try again later.');
        setLoading(false);
      }
    };

    fetchMarketData();
  }, [timeframe, sortBy]);

  // Format large numbers for display
  const formatNumber = (num: number) => {
    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(1)}B`;
    }
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(1)}K`;
    }
    return `$${num.toFixed(2)}`;
  };

  const volumeData = marketData.slice(0, 5).map(item => ({
    name: item.symbol.replace('USDT', ''),
    volume: item.volume24h / 1000000000, // Convert to billions for chart
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-500" />
          <p className="mt-2 text-gray-500">Loading market data...</p>
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Market Overview</h2>
        <div className="flex gap-4">
          <Select 
            value={timeframe} 
            onValueChange={(value) => setTimeframe(value)}
          >
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1 Hour</SelectItem>
              <SelectItem value="24h">24 Hours</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
            </SelectContent>
          </Select>
          
          <Select 
            value={sortBy} 
            onValueChange={(value) => setSortBy(value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="volume">Volume</SelectItem>
              <SelectItem value="marketCap">Market Cap</SelectItem>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="change">% Change</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Volume (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}B`, 'Volume']} />
                <Bar dataKey="volume" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Price Changes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {marketData.slice(0, 5).map((asset) => (
                <div key={asset.symbol} className="flex justify-between items-center pb-2 border-b">
                  <div>
                    <div className="font-medium">{asset.name}</div>
                    <div className="text-sm text-gray-500">{asset.symbol}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${asset.price.toFixed(2)}</div>
                    <div className={asset.change24h >= 0 ? 'text-green-500 flex items-center justify-end' : 'text-red-500 flex items-center justify-end'}>
                      {asset.change24h >= 0 ? (
                        <ArrowUp className="h-3 w-3 mr-1" />
                      ) : (
                        <ArrowDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(asset.change24h).toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Market Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left">Asset</th>
                  <th className="px-4 py-2 text-right">Price</th>
                  <th className="px-4 py-2 text-right">24h Change</th>
                  <th className="px-4 py-2 text-right">24h Volume</th>
                  <th className="px-4 py-2 text-right">Market Cap</th>
                  <th className="px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {marketData.map((asset) => (
                  <tr key={asset.symbol} className="border-b">
                    <td className="px-4 py-2">
                      <div className="font-medium">{asset.name}</div>
                      <div className="text-xs text-gray-500">{asset.symbol}</div>
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      ${asset.price.toFixed(2)}
                    </td>
                    <td className={`px-4 py-2 text-right ${asset.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      <div className="flex items-center justify-end">
                        {asset.change24h >= 0 ? (
                          <ArrowUp className="h-4 w-4 mr-1" />
                        ) : (
                          <ArrowDown className="h-4 w-4 mr-1" />
                        )}
                        {Math.abs(asset.change24h).toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right">
                      {formatNumber(asset.volume24h)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {formatNumber(asset.marketCap)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <div className="flex justify-center space-x-2">
                        <Button variant="outline" size="sm">Buy</Button>
                        <Button variant="outline" size="sm">Analyze</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketOverview;