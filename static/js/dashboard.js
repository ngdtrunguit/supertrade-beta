import React, { useState, useEffect } from 'react';
import { createChart, CrosshairMode } from 'lightweight-charts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Activity, BarChart2, Zap, 
  DollarSign, Clock, AlertCircle 
} from 'lucide-react';

// Mock data
const generateMockData = (days = 60) => {
  const result = [];
  let price = 40000;
  let volume = 1000;
  
  const ema7 = [];
  const ema21 = [];
  let rsi = 50;
  
  for (let i = 0; i < days; i++) {
    // Add some randomness to price and volume
    const priceChange = (Math.random() - 0.5) * 800;
    price += priceChange;
    
    // Volume tends to be higher on big price moves
    volume = 1000 + Math.abs(priceChange) * 5 + (Math.random() * 2000);
    
    // Calculate simple EMAs for mock data
    ema7.push(price);
    ema21.push(price);
    
    if (ema7.length > 7) ema7.shift();
    if (ema21.length > 21) ema21.shift();
    
    const ema7Value = ema7.reduce((sum, val) => sum + val, 0) / ema7.length;
    const ema21Value = ema21.reduce((sum, val) => sum + val, 0) / ema21.length;
    
    // Update RSI
    const rsiChange = (Math.random() - 0.5) * 10;
    rsi += rsiChange;
    rsi = Math.max(0, Math.min(100, rsi));
    
    // Calculate VWAP (simple mock)
    const vwap = price * (1 + (Math.random() - 0.5) * 0.05);
    
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    
    result.push({
      date: date.toISOString().split('T')[0],
      price,
      volume,
      ema7: ema7Value,
      ema21: ema21Value,
      vwap,
      rsi
    });
  }
  
  return result;
};

const tradingPairs = [
  "BTCUSDT", "ETHUSDT", "ADAUSDT", "SOLUSDT", "DOTUSDT",
  "AVAXUSDT", "MATICUSDT", "LINKUSDT", "UNIUSDT", "SHIBUSDT"
];

const TradingDashboard = () => {
  const [selectedPair, setSelectedPair] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState("1h");
  const [marketData, setMarketData] = useState([]);
  const [pairInfo, setPairInfo] = useState({
    price: 0,
    priceChange24h: 0,
    volume24h: 0,
    high24h: 0,
    low24h: 0
  });
  
  // Technical indicator signals
  const [indicators, setIndicators] = useState({
    ema: { signal: 'neutral', description: 'No clear trend' },
    rsi: { signal: 'neutral', description: 'RSI within normal range (30-70)' },
    vwap: { signal: 'neutral', description: 'Price near VWAP' }
  });
  
  // Load mock data on component mount or when pair/timeframe changes
  useEffect(() => {
    // In a real app, fetch from API
    // fetch(`/api/market-data/${selectedPair}?timeframe=${timeframe}`)
    
    // Mock data for demonstration
    const mockData = generateMockData();
    setMarketData(mockData);
    
    // Set mock pair info
    const latestPrice = mockData[mockData.length - 1].price;
    const yesterdayPrice = mockData[mockData.length - 2].price;
    const priceChange = latestPrice - yesterdayPrice;
    const percentChange = (priceChange / yesterdayPrice) * 100;
    
    setPairInfo({
      price: latestPrice.toFixed(2),
      priceChange24h: percentChange.toFixed(2),
      volume24h: (mockData[mockData.length - 1].volume * latestPrice).toFixed(0),
      high24h: (latestPrice * 1.05).toFixed(2),
      low24h: (latestPrice * 0.95).toFixed(2)
    });
    
    // Calculate technical signals
    const latest = mockData[mockData.length - 1];
    const emaSignal = latest.ema7 > latest.ema21 ? 'bullish' : 'bearish';
    
    let rsiSignal = 'neutral';
    let rsiDesc = 'RSI within normal range (30-70)';
    if (latest.rsi < 30) {
      rsiSignal = 'bullish';
      rsiDesc = 'RSI below 30 - Oversold condition';
    } else if (latest.rsi > 70) {
      rsiSignal = 'bearish';
      rsiDesc = 'RSI above 70 - Overbought condition';
    }
    
    let vwapSignal = 'neutral';
    let vwapDesc = 'Price near VWAP';
    const vwapDev = ((latest.price - latest.vwap) / latest.vwap) * 100;
    if (vwapDev < -3) {
      vwapSignal = 'bullish';
      vwapDesc = `Price ${Math.abs(vwapDev).toFixed(1)}% below VWAP`;
    } else if (vwapDev > 3) {
      vwapSignal = 'bearish';
      vwapDesc = `Price ${vwapDev.toFixed(1)}% above VWAP`;
    }
    
    setIndicators({
      ema: { 
        signal: emaSignal, 
        description: emaSignal === 'bullish' ? 
          '7-day EMA above 21-day EMA' : '7-day EMA below 21-day EMA' 
      },
      rsi: { signal: rsiSignal, description: rsiDesc },
      vwap: { signal: vwapSignal, description: vwapDesc }
    });
    
  }, [selectedPair, timeframe]);
  
  return (
    <div className="w-full mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold">{selectedPair} Trading Dashboard</h1>
          <div className="flex items-center mt-1">
            <span className="text-3xl font-bold mr-2">${pairInfo.price}</span>
            <Badge 
              className={pairInfo.priceChange24h >= 0 ? "bg-green-500" : "bg-red-500"}
            >
              {pairInfo.priceChange24h >= 0 ? '+' : ''}{pairInfo.priceChange24h}%
            </Badge>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Select 
            value={selectedPair} 
            onValueChange={setSelectedPair}
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
            onValueChange={setTimeframe}
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Activity className="w-5 h-5 mr-2 text-gray-500" />
                <span className="text-sm font-medium">24h Volume</span>
              </div>
              <span className="text-lg font-bold">${parseInt(pairInfo.volume24h).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-gray-500" />
                <span className="text-sm font-medium">24h High</span>
              </div>
              <span className="text-lg font-bold">${pairInfo.high24h}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <TrendingDown className="w-5 h-5 mr-2 text-gray-500" />
                <span className="text-sm font-medium">24h Low</span>
              </div>
              <span className="text-lg font-bold">${pairInfo.low24h}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="h-96">
            <CardHeader className="pb-0">
              <CardTitle>Price Chart</CardTitle>
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
                  <Line type="monotone" dataKey="vwap" stroke="#ff0000" strokeDasharray="3 3" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={marketData.slice(-30)}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="volume" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>RSI (14)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={marketData.slice(-30)}>
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip />
                    <Line type="monotone" dataKey="rsi" stroke="#ff7300" />
                    {/* Overbought line */}
                    <Line 
                      data={marketData.slice(-30).map(item => ({ ...item, overbought: 70 }))}
                      type="monotone"
                      dataKey="overbought"
                      stroke="#ff0000"
                      strokeDasharray="3 3"
                      dot={false}
                    />
                    {/* Oversold line */}
                    <Line 
                      data={marketData.slice(-30).map(item => ({ ...item, oversold: 30 }))}
                      type="monotone"
                      dataKey="oversold"
                      stroke="#00ff00"
                      strokeDasharray="3 3"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Technical Indicators</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-2">EMA Crossover (7/21)</h3>
                <div className="flex items-center">
                  <Badge className={
                    indicators.ema.signal === 'bullish' ? "bg-green-500" : 
                    indicators.ema.signal === 'bearish' ? "bg-red-500" : "bg-gray-500"
                  }>
                    {indicators.ema.signal === 'bullish' ? 'BUY' : 
                     indicators.ema.signal === 'bearish' ? 'SELL' : 'NEUTRAL'}
                  </Badge>
                  <span className="ml-2 text-sm">{indicators.ema.description}</span>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">RSI (14)</h3>
                <div className="flex items-center">
                  <Badge className={
                    indicators.rsi.signal === 'bullish' ? "bg-green-500" : 
                    indicators.rsi.signal === 'bearish' ? "bg-red-500" : "bg-gray-500"
                  }>
                    {indicators.rsi.signal === 'bullish' ? 'BUY' : 
                     indicators.rsi.signal === 'bearish' ? 'SELL' : 'NEUTRAL'}
                  </Badge>
                  <span className="ml-2 text-sm">{indicators.rsi.description}</span>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">VWAP Deviation</h3>
                <div className="flex items-center">
                  <Badge className={
                    indicators.vwap.signal === 'bullish' ? "bg-green-500" : 
                    indicators.vwap.signal === 'bearish' ? "bg-red-500" : "bg-gray-500"
                  }>
                    {indicators.vwap.signal === 'bullish' ? 'BUY' : 
                     indicators.vwap.signal === 'bearish' ? 'SELL' : 'NEUTRAL'}
                  </Badge>
                  <span className="ml-2 text-sm">{indicators.vwap.description}</span>
                </div>
              </div>
              
              <div className="pt-6 border-t">
                <h3 className="text-sm font-medium mb-4">Combined Signal</h3>
                <div className="flex justify-center">
                  <Badge className={
                    (indicators.ema.signal === 'bullish' && 
                     (indicators.rsi.signal === 'bullish' || indicators.vwap.signal === 'bullish'))
                      ? "bg-green-500 text-lg px-6 py-2" : 
                    (indicators.ema.signal === 'bearish' && 
                     (indicators.rsi.signal === 'bearish' || indicators.vwap.signal === 'bearish'))
                      ? "bg-red-500 text-lg px-6 py-2" : 
                      "bg-gray-500 text-lg px-6 py-2"
                  }>
                    {(indicators.ema.signal === 'bullish' && 
                     (indicators.rsi.signal === 'bullish' || indicators.vwap.signal === 'bullish'))
                      ? 'STRONG BUY' : 
                    (indicators.ema.signal === 'bearish' && 
                     (indicators.rsi.signal === 'bearish' || indicators.vwap.signal === 'bearish'))
                      ? 'STRONG SELL' : 
                      'NEUTRAL'}
                  </Badge>
                </div>
              </div>
              
              <div className="pt-4">
                <Button className="w-full bg-blue-500 hover:bg-blue-600">
                  <Zap className="mr-2 h-4 w-4" /> Setup Alert
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Trading Simulator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Amount (USDT)</label>
                <input 
                  type="number" 
                  className="w-full mt-1 p-2 border rounded" 
                  placeholder="100"
                  defaultValue="100"
                />
              </div>
              
              <div className="flex space-x-2">
                <Button className="w-1/2 bg-green-500 hover:bg-green-600">
                  Buy
                </Button>
                <Button className="w-1/2 bg-red-500 hover:bg-red-600">
                  Sell
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TradingDashboard;