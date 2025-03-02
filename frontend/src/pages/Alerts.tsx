import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Alert } from '../types';

const Alerts: React.FC = () => {
  const [newAlert, setNewAlert] = useState({
    symbol: 'BTCUSDT',
    type: 'price',
    condition: '',
    message: ''
  });

  const { data: alerts, refetch } = useQuery<Alert[]>({
    queryKey: ['alerts'],
    queryFn: () => api.get('/alerts').then(res => res.data)
  });

  const createAlertMutation = useMutation({
    mutationFn: (alertData) => api.post('/alerts', alertData),
    onSuccess: () => {
      refetch();
      // Reset form
      setNewAlert({
        symbol: 'BTCUSDT',
        type: 'price',
        condition: '',
        message: ''
      });
    }
  });

  const handleCreateAlert = () => {
    createAlertMutation.mutate(newAlert);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Alerts</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Create New Alert</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Symbol</label>
              <Select 
                value={newAlert.symbol} 
                onValueChange={(val) => setNewAlert(prev => ({ ...prev, symbol: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Symbol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BTCUSDT">BTCUSDT</SelectItem>
                  <SelectItem value="ETHUSDT">ETHUSDT</SelectItem>
                  <SelectItem value="ADAUSDT">ADAUSDT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium">Alert Type</label>
              <Select 
                value={newAlert.type} 
                onValueChange={(val) => setNewAlert(prev => ({ ...prev, type: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Alert Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="rsi">RSI</SelectItem>
                  <SelectItem value="ema">EMA Crossover</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium">Condition</label>
            <Input 
              placeholder="Enter alert condition (e.g., price > 50000)" 
              value={newAlert.condition}
              onChange={(e) => setNewAlert(prev => ({ ...prev, condition: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium">Message</label>
            <Input 
              placeholder="Alert message" 
              value={newAlert.message}
              onChange={(e) => setNewAlert(prev => ({ ...prev, message: e.target.value }))}
            />
          </div>
          
          <Button 
            onClick={handleCreateAlert} 
            disabled={createAlertMutation.isPending}
          >
            {createAlertMutation.isPending ? 'Creating...' : 'Create Alert'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {alerts?.length === 0 ? (
            <p className="text-center text-gray-500">No active alerts</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left">Symbol</th>
                  <th className="text-left">Type</th>
                  <th className="text-left">Condition</th>
                  <th className="text-left">Message</th>
                  <th className="text-left">Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {alerts?.map((alert) => (
                  <tr key={alert.id}>
                    <td>{alert.type}</td>
                    <td>{alert.message}</td>
                    <td>
                      <span className={`
                        ${alert.status === 'active' ? 'text-green-500' : 
                          alert.status === 'triggered' ? 'text-red-500' : 'text-gray-500'}
                      `}>
                        {alert.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <Button size="sm" variant="outline">Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Alerts;