import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useFetch } from '../hooks/useFetch';
import { PortfolioPosition } from '../types';

const Portfolio: React.FC = () => {
  const { data: positions, loading, error } = useFetch<PortfolioPosition[]>('/portfolio');

  if (loading) return <div>Loading portfolio...</div>;
  if (error) return <div>Error loading portfolio: {error.message}</div>;
  if (!positions || positions.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl mb-4">No Open Positions</h2>
        <p className="mb-6">You don't have any active trading positions.</p>
        <Button>Start Trading</Button>
      </div>
    );
  }

  const totalValue = positions.reduce((sum, pos) => 
    sum + (pos.quantity * pos.currentPrice), 0
  );

  const totalProfitLoss = positions.reduce((sum, pos) => 
    sum + pos.profitLoss, 0
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Portfolio</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${totalValue.toFixed(2)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Total Profit/Loss</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${
              totalProfitLoss >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              ${totalProfitLoss.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Number of Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{positions.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Open Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left">Symbol</th>
                <th className="text-right">Quantity</th>
                <th className="text-right">Avg. Price</th>
                <th className="text-right">Current Price</th>
                <th className="text-right">Total Value</th>
                <th className="text-right">Profit/Loss</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((position, index) => (
                <tr key={index}>
                  <td>{position.symbol}</td>
                  <td className="text-right">{position.quantity.toFixed(4)}</td>
                  <td className="text-right">${position.avgPrice.toFixed(2)}</td>
                  <td className="text-right">${position.currentPrice.toFixed(2)}</td>
                  <td className="text-right">
                    ${(position.quantity * position.currentPrice).toFixed(2)}
                  </td>
                  <td className={`text-right ${
                    position.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    ${position.profitLoss.toFixed(2)}
                  </td>
                  <td className="text-center">
                    <Button size="sm" variant="outline">Sell</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Portfolio;