// src/components/TradingSimulator.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Switch } from './ui/switch';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, Play, Pause, RefreshCw } from 'lucide-react';

interface SimulationParams {
  startingCapital: number;
  days: number;
  riskLevel: number;
  selectedSymbols: string[];
  strategy: string;
}

interface SimulationResult {
  initialBalance: number;
  finalBalance: number;
  profitLoss: number;
  profitLossPct: number;
  totalTrades: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  dailyResults: Array<{
    date: string;
    balance: number;
  }>;
  trades: Array<{
    id: number;
    symbol: string;
    side: 'BUY' | 'SELL';
    price: number;
    quantity: number;
    value: number;
    timestamp: string;
    profitLoss?: number;
    profitLossPct?: number;
  }>;
}

const TradingSimulator: React.FC = () => {
  const [loading, setLoading] = useState(false  );
};

export default TradingSimulator;
  const [isRunning, setIsRunning] = useState(false);
  const [params, setParams] = useState<SimulationParams>({
    startingCapital: 10000,
    days: 30,
    riskLevel: 3,
    selectedSymbols: ['BTCUSDT', 'ETHUSDT'],
    strategy: 'combined'
  });
  const [results, setResults] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const availableSymbols = [
    { id: 'BTC', name: 'Bitcoin' },
    { id: 'ETH', name: 'Ethereum' },
    { id: 'ADA', name: 'Cardano' },
    { id: 'SOL', name: 'Solana' },
    { id: 'DOT', name: 'Polkadot' },
    { id: 'AVAX', name: 'Avalanche' },
    { id: 'MATIC', name: 'Polygon' },
    { id: 'LINK', name: 'Chainlink' }
  ];

  // Simulate running the simulation
  const runSimulation = async () => {
    setLoading(true);
    setIsRunning(true);
    setError(null);
    
    try {
      // In a real app, this would be an API call
      // const response = await fetch('/api/simulate/run', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     symbols: params.selectedSymbols,
      //     starting_capital: params.startingCapital,
      //     risk_level: params.riskLevel,
      //     days: params.days,
      //     strategy: params.strategy
      //   }),
      // });
      // const data = await response.json();
      
      // For demo, simulate a network delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create mock simulation results
      const mockResults: SimulationResult = {
        initialBalance: params.startingCapital,
        finalBalance: params.startingCapital * (1 + (Math.random() * 0.5 - 0.1)), // -10% to +40%
        profitLoss: 0, // Will calculate
        profitLossPct: 0, // Will calculate
        totalTrades: Math.floor(params.days * 1.4),
        winCount: 0, // Will calculate 
        lossCount: 0, // Will calculate
        winRate: 0, // Will calculate
        dailyResults: [],
        trades: []
      };
  
  // Toggle a symbol selection
  const toggleSymbol = (symbolId: string) => {
    const symbol = `${symbolId}USDT`;
    setParams(prev => {
      const selected = [...prev.selectedSymbols];
      if (selected.includes(symbol)) {
        return { ...prev, selectedSymbols: selected.filter(s => s !== symbol) };
      } else {
        return { ...prev, selectedSymbols: [...selected, symbol] };
      }
    });
  };

  // Reset the simulation parameters
  const resetSimulation = () => {
    setParams({
      startingCapital: 10000,
      days: 30,
      riskLevel: 3,
      selectedSymbols: ['BTCUSDT', 'ETHUSDT'],
      strategy: 'combined'
    });
    setResults(null);
  };
      
      // Calculate profit/loss
      mockResults.profitLoss = mockResults.finalBalance - mockResults.initialBalance;
      mockResults.profitLossPct = (mockResults.profitLoss / mockResults.initialBalance) * 100;
      
      // Create win/loss counts based on a typical win rate between 55-65%
      const winRate = 0.55 + (Math.random() * 0.1);
      mockResults.winCount = Math.floor(mockResults.totalTrades * winRate);
      mockResults.lossCount = mockResults.totalTrades - mockResults.winCount;
      mockResults.winRate = (mockResults.winCount / mockResults.totalTrades) * 100;
      
      // Generate daily balance data
      let currentBalance = mockResults.initialBalance;
      mockResults.dailyResults = Array.from({ length: params.days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (params.days - i));
        
        // Add some randomness to daily changes
        const dailyChange = (Math.random() * 0.06) - 0.02; // -2% to +4%
        currentBalance = currentBalance * (1 + dailyChange);
        
        return {
          date: date.toISOString().split('T')[0],
          balance: currentBalance
        };
      });
      
      setResults(mockResults);
    } catch (err) {
      console.error('Error running simulation:', err);
      setError('Failed to run simulation. Please try again.');
    } finally {
      setLoading(false);
      setIsRunning(false);
    }
      });
      
      // Generate sample trades
      const symbols = params.selectedSymbols;
      mockResults.trades = Array.from({ length: Math.min(10, mockResults.totalTrades) }, (_, i) => {
        const isWin = i < Math.ceil(10 * winRate);
        const side = Math.random() > 0.5 ? 'BUY' : 'SELL';
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];
        const price = symbol.includes('BTC') ? 40000 + (Math.random() * 5000 - 2500) :
                     symbol.includes('ETH') ? 2200 + (Math.random() * 300 - 150) : 
                     Math.random() * 100 + 1;
        const quantity = symbol.includes('BTC') ? 0.05 : 
                        symbol.includes('ETH') ? 0.5 : 
                        Math.random() * 1000 + 10;
        
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * params.days));
        
        const profitLossPct = isWin ? Math.random() * 10 + 1 : -(Math.random() * 8 + 1);
        const profitLoss = (price * quantity) * (profitLossPct / 100);
        
        return {
          id: 1000 + i,
          symbol,
          side,
          price,
          quantity,
          value: price * quantity,
          timestamp: date.toISOString(),
          profitLoss: profitLoss,
          profitLossPct: profitLossPct