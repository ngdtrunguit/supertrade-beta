// src/components/Portfolio.tsx
import React, { useState, useEffect } from 'react';
import { getPortfolioStatus } from '../api/tradingApi';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

interface PositionData {
  symbol: string;
  quantity: number;
  avg_price: number;
  current_price: number;
  current_value: number;
  cost_basis: number;
  profit_loss: number;
  profit_loss_pct: number;
}

interface PortfolioData {
  positions: Record<string, PositionData>;
  summary: {
    total_positions: number;
    total_invested: number;
    total_current_value: number;
    overall_pnl: number;
    overall_pnl_percentage: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const Portfolio: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  const fetchPortfolioData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPortfolioStatus();
      setPortfolioData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load portfolio data');
      console.error('Error fetching portfolio data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Prepare data for pie chart
  const preparePieData = () => {
    if (!portfolioData || !portfolioData.positions) return [];
    
    return Object.entries(portfolioData.positions).map(([symbol, data]) => ({
      name: symbol,
      value: data.current_value
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
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center text-red-500">
            <AlertCircle className="h-6 w-6 mr-2" />
            <div>
              <h3 className="font-medium">Error loading portfolio</h3>
              <p>{error}</p>
            </div>
          </div>
          <Button 
            onClick={fetchPortfolioData} 
            className="mt-4"
            variant="outline"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!portfolioData || !portfolioData.positions || Object.keys(portfolioData.positions).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <h3 className="font-medium text-lg mb-2">No Open Positions</h3>
            <p className="text-gray-500 mb-6">You don't have any open trading positions yet.</p>
            <Button>Start Trading</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pieData = preparePieData();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Total Value:</span>
                  <span className="font-bold text-lg">
                    ${portfolioData.summary.total_current_value.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Invested:</span>
                  <span className="font-medium">
                    ${portfolioData.summary.total_invested.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Profit/Loss:</span>
                  <div className="flex items-center">
                    {portfolioData.summary.overall_pnl >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={portfolioData.summary.overall_pnl >= 0 ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
                      ${portfolioData.summary.overall_pnl.toFixed(2)} 
                      ({portfolioData.summary.overall_pnl_percentage.toFixed(2)}%)
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Positions:</span>
                  <Badge variant="outline">
                    {portfolioData.summary.total_positions}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center h-52">
              {pieData.length > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name }) => name}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Value']} />
                  </PieChart>
                </ResponsiveContainer>
              )}
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Avg. Price</TableHead>
                  <TableHead>Current</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>P/L</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(portfolioData.positions).map(([symbol, position]) => (
                  <TableRow key={symbol}>
                    <TableCell className="font-medium">{symbol}</TableCell>
                    <TableCell>{position.quantity.toFixed(8)}</TableCell>
                    <TableCell>${position.avg_price.toFixed(2)}</TableCell>
                    <TableCell>${position.current_price.toFixed(2)}</TableCell>
                    <TableCell>${position.current_value.toFixed(2)}</TableCell>
                    <TableCell className={position.profit_loss >= 0 ? 'text-green-500' : 'text-red-500'}>
                      <div className="flex items-center">
                        {position.profit_loss >= 0 ? (
                          <TrendingUp className="h-4 w-4 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 mr-1" />
                        )}
                        ${position.profit_loss.toFixed(2)}
                        <span className="text-xs ml-1">
                          ({position.profit_loss_pct.toFixed(2)}%)
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">Sell</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Portfolio;