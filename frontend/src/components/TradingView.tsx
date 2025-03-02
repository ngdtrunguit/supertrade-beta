// src/components/TradingView.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Activity, Loader2 } from 'lucide-react';

const TradingView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [selectedPair, setSelectedPair] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState("1h");
  const [marketData, setMarketData] = useState<any[]>([]);

  // Trading pairs
  const tradingPairs = [
    "BTCUSDT", "ETHUSDT", "ADAUSDT", "SOLUSDT", "DOTUSDT",
    "AVAXUSDT", "MATICUSDT", "LINKUSDT", "UNIUSDT", "SHIBUSDT"
  ];

  useEffect(() => {
    // Simulate fetching data
    const fetchData = async () => {
      setLoading(true);
      try {
        // In a real app, this would be an API call:
        // const response = await fetch(`/api/market-data/${selectedPair}?timeframe=${timeframe}`);
        // const data = await response.json();
        
        // For demo purposes, generate mock data
        const mockData = generateMockData(60);
        setMarketData(mockData);
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching market data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedPair, timeframe]);

  // Function to generate mock data
  const generateMockData = (days = 60) => {
    const result = [];
    let price = 40000;
    
    for (let i = 0; i < days; i++) {
      // Add some randomness to price
      const priceChange = (Math.random() - 0.5) * 800;
      price += priceChange;
      
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      
      result.push({
        date: date.toISOString().split('T')[0],
        price,
        volume: 1000 + Math.abs(priceChange) * 5 + (Math.random() * 2000),
        ema7: price * (1 + (Math.random() - 0.5) * 0.01),
        ema21: price * (1 + (Math.random() - 0.5) * 0.02)
      });
    }
    
    return result;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-500" />
          <p className="mt-2 text-gray-500">Loading chart data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Trading Chart</h2>
        <div className="flex gap-2">
          <Select 
            value={selectedPair} 
            onValueChange={(value) => setSelectedPair(value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select pair" />
            </SelectTrigger>
            <SelectContent>
              {tradingPairs.map(pair => (
                <SelectItem key={pair} value={pair}>{pair}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select 
            value={timeframe} 
            onValueChange={(value) => setTimeframe(value)}
          >
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5m">5m</SelectItem>
              <SelectItem value="15m">15m</SelectItem>
              <SelectItem value="1h">1h</SelectItem>
              <SelectItem value="4h">4h</SelectItem>
              <SelectItem value="1d">1d</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="h-96">
        <CardHeader className="pb-0">
          <CardTitle>Price Chart ({selectedPair})</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={marketData}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" />
              <YAxis domain={['auto', 'auto']} />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="price" stroke="#8884d8" fillOpacity={1} fill="url(#colorPrice)" />
              <Line type="monotone" dataKey="ema7" stroke="#ff7300" dot={false} />
              <Line type="monotone" dataKey="ema21" stroke="#387908" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default TradingView;