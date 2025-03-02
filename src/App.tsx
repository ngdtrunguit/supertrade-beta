// src/App.tsx
import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import TradingDashboard from './components/TradingDashboard';
import TradingForm from './components/TradingForm';
import Portfolio from './components/Portfolio';
import AlertsComponent from './components/Alerts';
import SettingsPage from './pages/SettingsPage';
import SimulationPage from './pages/SimulationPage';
import AnalyticsPage from './pages/AnalyticsPage';
import NotFoundPage from './pages/NotFoundPage';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<TradingDashboard />} />
          <Route path="portfolio" element={<Portfolio />} />
          <Route path="trade" element={<TradingForm />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="alerts" element={<AlertsComponent />} />
          <Route path="simulation" element={<SimulationPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;

// src/pages/SettingsPage.tsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-500">Manage your account and trading preferences</p>
      </div>

      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="trading">Trading</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
        </TabsList>
        
        <TabsContent value="account" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input id="confirm-password" type="password" />
              </div>
              <Button>Update Password</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trading" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trading Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-amount">Default Trading Amount (USDT)</Label>
                <Input id="default-amount" type="number" defaultValue="500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="risk-level">Risk Level</Label>
                <Select defaultValue="3">
                  <SelectTrigger>
                    <SelectValue placeholder="Select risk level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Very Conservative</SelectItem>
                    <SelectItem value="2">2 - Conservative</SelectItem>
                    <SelectItem value="3">3 - Moderate</SelectItem>
                    <SelectItem value="4">4 - Aggressive</SelectItem>
                    <SelectItem value="5">5 - Very Aggressive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Default Symbols</Label>
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
                    <Checkbox id="ada" defaultChecked />
                    <label htmlFor="ada" className="text-sm font-medium">ADA</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="sol" defaultChecked />
                    <label htmlFor="sol" className="text-sm font-medium">SOL</label>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 py-2">
                <Switch id="default-simulation" defaultChecked />
                <Label htmlFor="default-simulation">Default to Simulation Mode</Label>
              </div>
              <Button>Save Preferences</Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Trading Strategies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-strategy">Default Strategy</Label>
                <Select defaultValue="ema_crossover">
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
              <Button>Configure Strategy</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 justify-between">
                  <div>
                    <Label htmlFor="email-notifications" className="text-base">Email Notifications</Label>
                    <p className="text-sm text-gray-500">Receive alerts and trade confirmations via email</p>
                  </div>
                  <Switch id="email-notifications" defaultChecked />
                </div>
                
                <div className="flex items-center space-x-2 justify-between">
                  <div>
                    <Label htmlFor="telegram-notifications" className="text-base">Telegram Notifications</Label>
                    <p className="text-sm text-gray-500">Receive alerts and trade confirmations via Telegram</p>
                  </div>
                  <Switch id="telegram-notifications" defaultChecked />
                </div>
                
                <div className="flex items-center space-x-2 justify-between">
                  <div>
                    <Label htmlFor="trade-notifications" className="text-base">Trade Notifications</Label>
                    <p className="text-sm text-gray-500">Get notified when trades are executed</p>
                  </div>
                  <Switch id="trade-notifications" defaultChecked />
                </div>
                
                <div className="flex items-center space-x-2 justify-between">
                  <div>
                    <Label htmlFor="price-notifications" className="text-base">Price Alerts</Label>
                    <p className="text-sm text-gray-500">Get notified when price targets are reached</p>
                  </div>
                  <Switch id="price-notifications" defaultChecked />
                </div>
                
                <div className="flex items-center space-x-2 justify-between">
                  <div>
                    <Label htmlFor="technical-notifications" className="text-base">Technical Analysis Alerts</Label>
                    <p className="text-sm text-gray-500">Get notified about technical indicator signals</p>
                  </div>
                  <Switch id="technical-notifications" defaultChecked />
                </div>
              </div>
              <Button>Save Notification Settings</Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Telegram Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Telegram Bot</Label>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="px-4 py-2">Connected</Badge>
                  <Button variant="outline" size="sm">Disconnect</Button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Your account is connected to the Telegram bot. You can interact with it by sending commands to @CryptoTradingBot.
                </p>
              </div>
              <Button variant="outline">Reconnect Telegram</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="api" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-medium">Binance API Key</h3>
                    <p className="text-sm text-gray-500">Last updated: 2023-10-15</p>
                  </div>
                  <Badge variant="outline">Active</Badge>
                </div>
                <div className="p-3 border rounded bg-gray-50">
                  <div className="flex items-center justify-between">
                    <code className="text-xs">••••••••••••••••••••••••••••••</code>
                    <Button variant="ghost" size="sm">Show</Button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <Input id="api-key" placeholder="Enter your API key" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="api-secret">API Secret</Label>
                <Input id="api-secret" type="password" placeholder="Enter your API secret" />
              </div>
              <div className="flex items-center space-x-2 py-2">
                <Switch id="test-only" defaultChecked />
                <Label htmlFor="test-only">Test mode only (no real trading)</Label>
              </div>
              <Button>Save API Keys</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// src/pages/SimulationPage.tsx
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

// src/pages/AnalyticsPage.tsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

const AnalyticsPage: React.FC = () => {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  
  // Mock data for charts
  const performanceData = [
    { month: 'Jan', profit: 1200, trades: 25 },
    { month: 'Feb', profit: 1900, trades: 30 },
    { month: 'Mar', profit: 800, trades: 22 },
    { month: 'Apr', profit: -500, trades: 18 },
    { month: 'May', profit: 1700, trades: 27 },
    { month: 'Jun', profit: 1300, trades: 24 },
  ];
  
  const symbolDistribution = [
    { name: 'BTC', value: 45 },
    { name: 'ETH', value: 25 },
    { name: 'ADA', value: 15 },
    { name: 'SOL', value: 10 },
    { name: 'Other', value: 5 },
  ];
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-gray-500">Monitor your trading performance</p>
        </div>
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex gap-2">
                <CalendarIcon className="h-4 w-4" />
                <span>Date Range</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Select defaultValue="all">
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="year">Past Year</SelectItem>
              <SelectItem value="month">Past Month</SelectItem>
              <SelectItem value="week">Past Week</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trades">Trades</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="indicators">Indicators</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <h3 className="text-lg font-medium mb-2">Total Profit/Loss</h3>
                  <div className="text-3xl font-bold text-green-500">+$4,400</div>
                  <Badge className="mt-2">+22.5%</Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <h3 className="text-lg font-medium mb-2">Total Trades</h3>
                  <div className="text-3xl font-bold">146</div>
                  <div className="flex mt-2 gap-2">
                    <Badge className="bg-green-500">Win: 98</Badge>
                    <Badge className="bg-red-500">Loss: 48</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <h3 className="text-lg font-medium mb-2">Win Rate</h3>
                  <div className="text-3xl font-bold">67.1%</div>
                  <Badge className="mt-2 bg-green-500">Above Target</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="h-80">
              <CardHeader>
                <CardTitle>Monthly Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="profit" fill="#8884d8" name="Profit/Loss (USD)" />
                    <Bar dataKey="trades" fill="#82ca9d" name="Number of Trades" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card className="h-80">
              <CardHeader>
                <CardTitle>Symbol Distribution</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="w-full h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={symbolDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {symbolDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="trades" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Trade History</CardTitle>
            </CardHeader>
            <CardContent>
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
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="px-4 py-2">2023-10-15</td>
                      <td className="px-4 py-2">BTCUSDT</td>
                      <td className="px-4 py-2"><Badge className="bg-green-500">BUY</Badge></td>
                      <td className="px-4 py-2 text-right">$39,750.00</td>
                      <td className="px-4 py-2 text-right">0.05</td>
                      <td className="px-4 py-2 text-right">$1,987.50</td>
                      <td className="px-4 py-2 text-right text-green-500">+$125.50</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-2">2023-10-14</td>
                      <td className="px-4 py-2">ETHUSDT</td>
                      <td className="px-4 py-2"><Badge className="bg-red-500">SELL</Badge></td>
                      <td className="px-4 py-2 text-right">$2,150.00</td>
                      <td className="px-4 py-2 text-right">0.5</td>
                      <td className="px-4 py-2 text-right">$1,075.00</td>
                      <td className="px-4 py-2 text-right text-red-500">-$45.75</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-2">2023-10-13</td>
                      <td className="px-4 py-2">ETHUSDT</td>
                      <td className="px-4 py-2"><Badge className="bg-green-500">BUY</Badge></td>
                      <td className="px-4 py-2 text-right">$2,080.00</td>
                      <td className="px-4 py-2 text-right">0.5</td>
                      <td className="px-4 py-2 text-right">$1,040.00</td>
                      <td className="px-4 py-2 text-right text-green-500">+$70.00</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-2">2023-10-12</td>
                      <td className="px-4 py-2">ADAUSDT</td>
                      <td className="px-4 py-2"><Badge className="bg-green-500">BUY</Badge></td>
                      <td className="px-4 py-2 text-right">$0.48</td>
                      <td className="px-4 py-2 text-right">2000</td>
                      <td className="px-4 py-2 text-right">$960.00</td>
                      <td className="px-4 py-2 text-right text-green-500">+$32.00</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-2">2023-10-10</td>
                      <td className="px-4 py-2">SOLUSDT</td>
                      <td className="px-4 py-2"><Badge className="bg-red-500">SELL</Badge></td>
                      <td className="px-4 py-2 text-right">$38.25</td>
                      <td className="px-4 py-2 text-right">25</td>
                      <td className="px-4 py-2 text-right">$956.25</td>
                      <td className="px-4 py-2 text-right text-red-500">-$28.75</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="performance" className="mt-6 space-y-6">
          <Card className="h-96">
            <CardHeader>
              <CardTitle>Portfolio Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={[
                    { date: '2023-05', balance: 10000 },
                    { date: '2023-06', balance: 10800 },
                    { date: '2023-07', balance: 11200 },
                    { date: '2023-08', balance: 10900 },
                    { date: '2023-09', balance: 11700 },
                    { date: '2023-10', balance: 12500 }
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value.toFixed(2)}`, 'Balance']} />
                  <Legend />
                  <Line type="monotone" dataKey="balance" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Return:</span>
                  <span className="font-medium text-green-500">+22.5%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Annualized Return:</span>
                  <span className="font-medium text-green-500">+43.2%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Sharpe Ratio:</span>
                  <span className="font-medium">1.8</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Max Drawdown:</span>
                  <span className="font-medium text-red-500">-12.3%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Win Rate:</span>
                  <span className="font-medium">67.1%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Average Win:</span>
                  <span className="font-medium text-green-500">+$85.23</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Average Loss:</span>
                  <span className="font-medium text-red-500">-$42.15</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Trading Strategy Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">EMA Crossover</span>
                      <Badge className="bg-green-500">+18.5%</Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">RSI Strategy</span>
                      <Badge className="bg-green-500">+12.3%</Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Combined Indicators</span>
                      <Badge className="bg-green-500">+24.7%</Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">VWAP Strategy</span>
                      <Badge className="bg-red-500">-3.2%</Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-red-500 h-2.5 rounded-full" style={{ width: '35%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="indicators" className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Technical Indicators</h2>
              <p className="text-gray-500">Analysis of indicator performance</p>
            </div>
            <div className="flex gap-2">
              <Select defaultValue="BTCUSDT">
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Symbol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BTCUSDT">BTC</SelectItem>
                  <SelectItem value="ETHUSDT">ETH</SelectItem>
                  <SelectItem value="ADAUSDT">ADA</SelectItem>
                  <SelectItem value="SOLUSDT">SOL</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="1d">
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15m">15m</SelectItem>
                  <SelectItem value="1h">1h</SelectItem>
                  <SelectItem value="4h">4h</SelectItem>
                  <SelectItem value="1d">1d</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>EMA Crossover Signals</CardTitle>
              </CardHeader>
              <CardContent className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={[
                      { date: '2023-05', price: 30000, ema7: 29000, ema21: 29500 },
                      { date: '2023-06', price: 32000, ema7: 31000, ema21: 30000 },
                      { date: '2023-07', price: 34000, ema7: 33500, ema21: 31500 },
                      { date: '2023-08', price: 33000, ema7: 33000, ema21: 32000 },
                      { date: '2023-09', price: 35000, ema7: 34000, ema21: 33000 },
                      { date: '2023-10', price: 38000, ema7: 36500, ema21: 34000 }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="price" stroke="#8884d8" name="Price" />
                    <Line type="monotone" dataKey="ema7" stroke="#82ca9d" name="EMA 7" />
                    <Line type="monotone" dataKey="ema21" stroke="#ff7300" name="EMA 21" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>RSI (14)</CardTitle>
              </CardHeader>
              <CardContent className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={[
                      { date: '2023-05', rsi: 35 },
                      { date: '2023-06', rsi: 45 },
                      { date: '2023-07', rsi: 65 },
                      { date: '2023-08', rsi: 75 },
                      { date: '2023-09', rsi: 50 },
                      { date: '2023-10', rsi: 60 }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="rsi" stroke="#ff7300" name="RSI" />
                    <Line 
                      data={[
                        { date: '2023-05', overbought: 70 },
                        { date: '2023-10', overbought: 70 }
                      ]} 
                      type="monotone" 
                      dataKey="overbought" 
                      stroke="#ff0000" 
                      strokeDasharray="3 3" 
                      dot={false} 
                    />
                    <Line 
                      data={[
                        { date: '2023-05', oversold: 30 },
                        { date: '2023-10', oversold: 30 }
                      ]} 
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
            
            <Card>
              <CardHeader>
                <CardTitle>VWAP Deviation</CardTitle>
              </CardHeader>
              <CardContent className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={[
                      { date: '2023-05', price: 30000, vwap: 29800, deviation: 0.67 },
                      { date: '2023-06', price: 32000, vwap: 31500, deviation: 1.59 },
                      { date: '2023-07', price: 34000, vwap: 33000, deviation: 3.03 },
                      { date: '2023-08', price: 33000, vwap: 33500, deviation: -1.49 },
                      { date: '2023-09', price: 35000, vwap: 34000, deviation: 2.94 },
                      { date: '2023-10', price: 38000, vwap: 36000, deviation: 5.56 }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" domain={[-6, 6]} />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="price" stroke="#8884d8" name="Price" />
                    <Line yAxisId="left" type="monotone" dataKey="vwap" stroke="#82ca9d" name="VWAP" strokeDasharray="3 3" />
                    <Line yAxisId="right" type="monotone" dataKey="deviation" stroke="#ff7300" name="Deviation %" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Signal Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-100 p-4 rounded text-center">
                      <div className="text-lg font-bold">EMA</div>
                      <div className="text-xl font-bold text-green-500">72%</div>
                      <div className="text-xs text-gray-500">Success Rate</div>
                    </div>
                    <div className="bg-gray-100 p-4 rounded text-center">
                      <div className="text-lg font-bold">RSI</div>
                      <div className="text-xl font-bold text-green-500">64%</div>
                      <div className="text-xs text-gray-500">Success Rate</div>
                    </div>
                    <div className="bg-gray-100 p-4 rounded text-center">
                      <div className="text-lg font-bold">VWAP</div>
                      <div className="text-xl font-bold text-amber-500">53%</div>
                      <div className="text-xs text-gray-500">Success Rate</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>EMA Bullish (7 over 21)</span>
                      <span className="text-green-500 font-medium">+9.2%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>EMA Bearish (7 under 21)</span>
                      <span className="text-red-500 font-medium">-4.5%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>RSI Oversold Exit</span>
                      <span className="text-green-500 font-medium">+11.7%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>RSI Overbought Exit</span>
                      <span className="text-red-500 font-medium">-6.3%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>VWAP Below Threshold</span>
                      <span className="text-green-500 font-medium">+5.4%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>VWAP Above Threshold</span>
                      <span className="text-red-500 font-medium">-3.8%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// src/pages/NotFoundPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)]">
      <AlertTriangle className="h-16 w-16 text-amber-500 mb-6" />
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
      <p className="text-gray-500 mb-8 text-center max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/">
        <Button>Return to Dashboard</Button>
      </Link>
    </div>
  );
};

export default NotFoundPage;  <Label htmlFor="username">Username</Label>
                  <Input id="username" defaultValue="user123" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="user@example.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select defaultValue="utc">
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utc">UTC</SelectItem>
                    <SelectItem value="est">Eastern Time (ET)</SelectItem>
                    <SelectItem value="pst">Pacific Time (PT)</SelectItem>
                    <SelectItem value="gmt">GMT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="space-y-2">