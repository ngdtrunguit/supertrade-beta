
// src/pages/SimulationPage.tsx
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
//import { Label } from '../components/ui/label';
//import { Slider } from '../components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
//import { Badge } from '../components/ui/badge';
//import { Checkbox } from '../components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, Play, Pause, StepForward, RefreshCw } from 'lucide-react';

const SimulationPage: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [startingCapital, setStartingCapital] = useState(10000);
  const [days, setDays] = useState(30);
  const [symbols, setSymbols] = useState(['BTCUSDT', 'ETHUSDT']);
  const [riskLevel, setRiskLevel] = useState(3);
  
  // Mock simulation results
  const simulationResults = {
    initialBalance: 10000,
    finalBalance: 12450,
    profitLoss: 2450,
    profitLossPct: 24.5,
    totalTrades: 42,
    winCount: 28,
    lossCount: 14,
    winRate: 66.67,
    dailyResults: Array.from({ length: 30 }, (_, i) => ({
      date: `2023-10-${i + 1}`,
      balance: 10000 + (i * 80) + (Math.random() * 200 - 100)
    }))
  };

  const toggleSimulation = () => {
    setIsRunning(!isRunning);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Trading Simulator</h1>
          <p className="text-gray-500">Backtest strategies using historical data</p>
        </div>
        <Button 
          onClick={toggleSimulation}
          className={isRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-500 hover:bg-green-600'}
        >
          {isRunning ? (
            <>
              <Pause className="mr-2 h-4 w-4" />
              Pause Simulation
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Run Simulation
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Simulation Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="starting-capital">Starting Capital (USDT)</Label>
                <Input 
                  id="starting-capital" 
                  type="number" 
                  value={startingCapital}
                  onChange={(e) => setStartingCapital(Number(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="days">Simulation Period (Days)</Label>
                  <span className="text-sm text-gray-500">{days} days</span>
                </div>
                <Slider 
                  id="days" 
                  min={1} 
                  max={90} 
                  step={1}
                  value={[days]}
                  onValueChange={(value) => setDays(value[0])}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Trading Pairs</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="btc" defaultChecked />
                    <label htmlFor="btc" className="text-sm font-medium">BTC</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="eth" defaultChecked />
                    <label htmlFor="eth" className="text-sm font-medium">ETH</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="ada" />
                    <label htmlFor="ada" className="text-sm font-medium">ADA</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="sol" />
                    <label htmlFor="sol" className="text-sm font-medium">SOL</label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="risk-level">Risk Level</Label>
                  <Badge variant="outline">{riskLevel}/5</Badge>
                </div>
                <Slider 
                  id="risk-level" 
                  min={1} 
                  max={5} 
                  step={1}
                  value={[riskLevel]}
                  onValueChange={(value) => setRiskLevel(value[0])}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="strategy">Trading Strategy</Label>
                <Select defaultValue="combined">
                  <SelectTrigger>
                    <SelectValue placeholder="Select strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ema_crossover">EMA Crossover</SelectItem>
                    <SelectItem value="rsi_strategy">RSI Strategy</SelectItem>
                    <SelectItem value="combined">Combined Indicators</SelectItem>
                    <SelectItem value="custom">Custom Strategy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button>
                <Play className="mr-2 h-4 w-4" />
                Start
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="lg:col-span-2 space-y-6">
          <Card className="h-96">
            <CardHeader>
              <CardTitle>Portfolio Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={simulationResults.dailyResults}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={['auto', 'auto']} />
                  <Tooltip 
                    formatter={(value) => [`${value.toFixed(2)}`, 'Balance']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="#8884d8" 
                    activeDot={{ r: 8 }} 
                    name="Portfolio Value"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Simulation Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Initial Balance:</span>
                    <span className="font-medium">${simulationResults.initialBalance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Final Balance:</span>
                    <span className="font-medium">${simulationResults.finalBalance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Profit/Loss:</span>
                    <span className={`font-medium ${simulationResults.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${simulationResults.profitLoss.toFixed(2)} ({simulationResults.profitLossPct.toFixed(2)}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Trades:</span>
                    <span className="font-medium">{simulationResults.totalTrades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Win Rate:</span>
                    <span className="font-medium">{simulationResults.winRate.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Win/Loss:</span>
                    <span className="font-medium">{simulationResults.winCount}/{simulationResults.lossCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Trades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="p-2 border rounded">
                    <div className="flex justify-between items-center">
                      <div>
                        <Badge className="bg-green-500">BUY</Badge>
                        <span className="ml-2 font-medium">BTCUSDT</span>
                      </div>
                      <span className="text-sm text-gray-500">2023-10-15</span>
                    </div>
                    <div className="mt-1 text-sm">
                      <span>0.05 BTC @ $39,750.00</span>
                      <span className="text-green-600 ml-4">+$125.50 (3.2%)</span>
                    </div>
                  </div>
                  
                  <div className="p-2 border rounded">
                    <div className="flex justify-between items-center">
                      <div>
                        <Badge className="bg-red-500">SELL</Badge>
                        <span className="ml-2 font-medium">ETHUSDT</span>
                      </div>
                      <span className="text-sm text-gray-500">2023-10-14</span>
                    </div>
                    <div className="mt-1 text-sm">
                      <span>0.5 ETH @ $2,150.00</span>
                      <span className="text-red-600 ml-4">-$45.75 (2.1%)</span>
                    </div>
                  </div>
                  
                  <div className="p-2 border rounded">
                    <div className="flex justify-between items-center">
                      <div>
                        <Badge className="bg-green-500">BUY</Badge>
                        <span className="ml-2 font-medium">ETHUSDT</span>
                      </div>
                      <span className="text-sm text-gray-500">2023-10-13</span>
                    </div>
                    <div className="mt-1 text-sm">
                      <span>0.5 ETH @ $2,080.00</span>
                      <span className="text-green-600 ml-4">+$70.00 (3.4%)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};