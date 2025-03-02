// src/components/PortfolioSummary.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip 
} from 'recharts';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';

interface Position {
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  currentValue: number;
  costBasis: number;
  profitLoss: number;
  profitLossPct: number;
}

interface PortfolioData {
  positions: Position[];
  totalValue: number;
  totalInvested: number;
  totalProfitLoss: number;
  totalProfitLossPct: number;
}

const PortfolioSummary: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  useEffect(() => {
    // Simulate API call to get portfolio data
    const fetchPortfolioData = async () => {
      setLoading(true);
      try {
        // In a real app, this would be an API call
        // const response = await fetch('/api/portfolio');
        // const data = await response.json();
        
        // For demo, create mock data
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
        
        const mockData: PortfolioData = {
          positions: [
            {
              symbol: 'BTCUSDT',
              quantity: 0.05,
              avgPrice: 39750,
              currentPrice: 41250,
              currentValue: 41250 * 0.05,
              costBasis: 39750 * 0.05,
              profitLoss: (41250 - 39750) * 0.05,
              profitLossPct: ((41250 - 39750) / 39750) * 100
            },
            {
              symbol: 'ETHUSDT',
              quantity: 0.5,
              avgPrice: 2150,
              currentPrice: 2275,
              currentValue: 2275 * 0.5,
              costBasis: 2150 * 0.5,
              profitLoss: (2275 - 2150) * 0.5,
              profitLossPct: ((2275 - 2150) / 2150) * 100
            },
            {
              symbol: 'ADAUSDT',
              quantity: 200,
              avgPrice: 0.45,
              currentPrice: 0.48,
              currentValue: 0.48 * 200,
              costBasis: 0.45 * 200,
              profitLoss: (0.48 - 0.45) * 200,
              profitLossPct: ((0.48 - 0.45) / 0.45) * 100
            }
          ],
          totalValue: 0,
          totalInvested: 0,
          totalProfitLoss: 0,
          totalProfitLossPct: 0
        };
        
        // Calculate totals
        mockData.totalValue = mockData.positions.reduce((sum, pos) => sum + pos.currentValue, 0);
        mockData.totalInvested = mockData.positions.reduce((sum, pos) => sum + pos.costBasis, 0);
        mockData.totalProfitLoss = mockData.totalValue - mockData.totalInvested;
        mockData.totalProfitLossPct = (mockData.totalProfitLoss / mockData.totalInvested) * 100;
        
        setPortfolio(mockData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching portfolio data:', error);
        setError('Failed to load portfolio data. Please try again later.');
        setLoading(false);
      }
    };

    fetchPortfolioData();
  }, []);

  // Prepare data for pie chart
  const getPieData = () => {
    if (!portfolio) return [];
    
    return portfolio.positions.map(position => ({
      name: position.symbol,
      value: position.currentValue
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-500" />
          <p className="mt-2 text-gray-500">Loading portfolio data...</p>
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

  if (!portfolio || portfolio.positions.length === 0) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="text-center">
            <h3 className="text-lg font-medium mb-2">No Open Positions</h3>
            <p className="text-gray-500 mb-4">You don't have any active positions in your portfolio.</p>
            <Button>Start Trading</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Total Value:</span>
                <span className="font-bold text-lg">
                  ${portfolio.totalValue.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Invested:</span>
                <span className="font-medium">
                  ${portfolio.totalInvested.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Profit/Loss:</span>
                <div className="flex items-center">
                  {portfolio.totalProfitLoss >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={portfolio.totalProfitLoss >= 0 ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
                    ${portfolio.totalProfitLoss.toFixed(2)} 
                    ({portfolio.totalProfitLossPct.toFixed(2)}%)
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Positions:</span>
                <Badge variant="outline">
                  {portfolio.positions.length}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-center h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getPieData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name }) => name}
                  >
                    {getPieData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Value']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Open Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left">Symbol</th>
                  <th className="px-4 py-2 text-right">Quantity</th>
                  <th className="px-4 py-2 text-right">Avg. Price</th>
                  <th className="px-4 py-2 text-right">Current</th>
                  <th className="px-4 py-2 text-right">Value</th>
                  <th className="px-4 py-2 text-right">P/L</th>
                  <th className="px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.positions.map((position, index) => (
                  <tr key={index} className="border-b">
                    <td className="px-4 py-2 font-medium">{position.symbol}</td>
                    <td className="px-4 py-2 text-right">{position.quantity.toFixed(position.quantity < 1 ? 8 : 2)}</td>
                    <td className="px-4 py-2 text-right">${position.avgPrice.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">${position.currentPrice.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">${position.currentValue.toFixed(2)}</td>
                    <td className={`px-4 py-2 text-right ${position.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      <div className="flex items-center justify-end">
                        {position.profitLoss >= 0 ? (
                          <TrendingUp className="h-4 w-4 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 mr-1" />
                        )}
                        ${position.profitLoss.toFixed(2)}
                        <span className="text-xs ml-1">
                          ({position.profitLossPct.toFixed(2)}%)
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <Button variant="outline" size="sm">Sell</Button>
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

export default PortfolioSummary;