// src/components/Alerts.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle, Bell, BellOff, Clock, CheckCircle, 
  Trash2, Plus, ArrowUpCircle, ArrowDownCircle, Loader2
} from 'lucide-react';
import { getTopSymbols, getTechnicalAnalysis } from '../api/tradingApi';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

interface Alert {
  id: number;
  symbol: string;
  alert_type: string;
  message: string;
  created_at: string;
  triggered_at: string | null;
  status: 'pending' | 'triggered' | 'acknowledged' | 'expired';
  notify_email: boolean;
  notify_telegram: boolean;
  condition: Record<string, any>;
}

const AlertsComponent: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [topSymbols, setTopSymbols] = useState<string[]>([]);
  
  // Form state
  const [newAlert, setNewAlert] = useState({
    symbol: 'BTCUSDT',
    alert_type: 'price',
    price: '',
    direction: 'above',
    notify_email: true,
    notify_telegram: true,
    message: '',
  });

  useEffect(() => {
    fetchAlerts();
    fetchTopSymbols();
  }, []);

  useEffect(() => {
    // Update default message when alert type or direction changes
    if (newAlert.alert_type === 'price') {
      setNewAlert(prev => ({
        ...prev,
        message: `${prev.symbol} price ${prev.direction} $${prev.price || '?'}`
      }));
    }
  }, [newAlert.symbol, newAlert.alert_type, newAlert.direction, newAlert.price]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/alerts`);
      setAlerts(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load alerts. Please try again.');
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopSymbols = async () => {
    try {
      const response = await getTopSymbols();
      setTopSymbols(response.symbols.slice(0, 10));
    } catch (err) {
      console.error('Error fetching top symbols:', err);
    }
  };

  const createAlert = async () => {
    try {
      setLoading(true);
      
      const alertData = {
        symbol: newAlert.symbol,
        alert_type: newAlert.alert_type,
        condition: newAlert.alert_type === 'price' 
          ? { 
              price: parseFloat(newAlert.price), 
              direction: newAlert.direction 
            }
          : { },
        message: newAlert.message,
        notify_email: newAlert.notify_email,
        notify_telegram: newAlert.notify_telegram
      };
      
      const response = await axios.post(`${API_BASE_URL}/alerts`, alertData);
      
      // Add the new alert to the list
      setAlerts(prev => [response.data, ...prev]);
      
      // Reset form
      setNewAlert({
        symbol: 'BTCUSDT',
        alert_type: 'price',
        price: '',
        direction: 'above',
        notify_email: true,
        notify_telegram: true,
        message: '',
      });
      
      setShowCreateForm(false);
      setError(null);
    } catch (err) {
      setError('Failed to create alert. Please try again.');
      console.error('Error creating alert:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteAlert = async (id: number) => {
    try {
      setLoading(true);
      await axios.delete(`${API_BASE_URL}/alerts/${id}`);
      setAlerts(prev => prev.filter(alert => alert.id !== id));
      setError(null);
    } catch (err) {
      setError('Failed to delete alert. Please try again.');
      console.error('Error deleting alert:', err);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (id: number) => {
    try {
      setLoading(true);
      const response = await axios.put(`${API_BASE_URL}/alerts/${id}/acknowledge`);
      
      // Update the alert in the list
      setAlerts(prev => 
        prev.map(alert => alert.id === id ? response.data : alert)
      );
      
      setError(null);
    } catch (err) {
      setError('Failed to acknowledge alert. Please try again.');
      console.error('Error acknowledging alert:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'triggered':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'acknowledged':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'expired':
        return <BellOff className="h-4 w-4 text-gray-400" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  if (loading && alerts.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-500" />
            <p className="mt-2 text-gray-500">Loading alerts...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Alerts</h2>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : <>
            <Plus className="mr-2 h-4 w-4" /> New Alert
          </>}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <div className="flex">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Alert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Symbol</Label>
                <Select 
                  value={newAlert.symbol} 
                  onValueChange={val => setNewAlert({...newAlert, symbol: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select symbol" />
                  </SelectTrigger>
                  <SelectContent>
                    {topSymbols.map(symbol => (
                      <SelectItem key={symbol} value={symbol}>{symbol}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Alert Type</Label>
                <Select 
                  value={newAlert.alert_type} 
                  onValueChange={val => setNewAlert({...newAlert, alert_type: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select alert type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price">Price Alert</SelectItem>
                    <SelectItem value="ema_crossover">EMA Crossover</SelectItem>
                    <SelectItem value="rsi">RSI Threshold</SelectItem>
                    <SelectItem value="vwap">VWAP Deviation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newAlert.alert_type === 'price' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Direction</Label>
                      <Select 
                        value={newAlert.direction} 
                        onValueChange={val => setNewAlert({...newAlert, direction: val})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select direction" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="above">Above</SelectItem>
                          <SelectItem value="below">Below</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Price ($)</Label>
                      <Input 
                        type="number" 
                        placeholder="Enter target price" 
                        value={newAlert.price}
                        onChange={(e) => setNewAlert({...newAlert, price: e.target.value})}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>Alert Message</Label>
                <Input 
                  placeholder="Enter alert message" 
                  value={newAlert.message}
                  onChange={(e) => setNewAlert({...newAlert, message: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notify-email" className="cursor-pointer">
                    Email Notification
                  </Label>
                  <Switch 
                    id="notify-email"
                    checked={newAlert.notify_email}
                    onCheckedChange={(checked) => setNewAlert({...newAlert, notify_email: checked})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notify-telegram" className="cursor-pointer">
                    Telegram Notification
                  </Label>
                  <Switch 
                    id="notify-telegram"
                    checked={newAlert.notify_telegram}
                    onCheckedChange={(checked) => setNewAlert({...newAlert, notify_telegram: checked})}
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
            <Button onClick={createAlert} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create Alert
            </Button>
          </CardFooter>
        </Card>
      )}

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Alerts</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="triggered">Triggered</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500 text-center">
                  You don't have any alerts set up yet. Create your first alert to get notified of important market events.
                </p>
                <Button className="mt-4" onClick={() => setShowCreateForm(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Create Alert
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {alerts.map(alert => (
                <Card key={alert.id} className={alert.status === 'triggered' ? 'border-red-300' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between">
                      <div className="flex items-center">
                        {getStatusIcon(alert.status)}
                        <Badge variant="outline" className="ml-2">
                          {alert.symbol}
                        </Badge>
                        <Badge variant="secondary" className="ml-2">
                          {alert.alert_type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        {alert.status === 'triggered' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => acknowledgeAlert(alert.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" /> Acknowledge
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => deleteAlert(alert.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="mt-2">{alert.message}</p>
                    <div className="flex justify-between text-sm text-gray-500 mt-3">
                      <span>Created: {new Date(alert.created_at).toLocaleString()}</span>
                      {alert.triggered_at && (
                        <span>Triggered: {new Date(alert.triggered_at).toLocaleString()}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          {alerts.filter(a => a.status === 'pending').length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                No pending alerts.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {alerts
                .filter(alert => alert.status === 'pending')
                .map(alert => (
                  <Card key={alert.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-yellow-500" />
                          <Badge variant="outline" className="ml-2">
                            {alert.symbol}
                          </Badge>
                          <Badge variant="secondary" className="ml-2">
                            {alert.alert_type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => deleteAlert(alert.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="mt-2">{alert.message}</p>
                      <div className="text-sm text-gray-500 mt-3">
                        <span>Created: {new Date(alert.created_at).toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="triggered" className="mt-4">
          {alerts.filter(a => a.status === 'triggered').length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                No triggered alerts.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {alerts
                .filter(alert => alert.status === 'triggered')
                .map(alert => (
                  <Card key={alert.id} className="border-red-300">
                    <CardContent className="pt-6">
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <Badge variant="outline" className="ml-2">
                            {alert.symbol}
                          </Badge>
                          <Badge variant="secondary" className="ml-2">
                            {alert.alert_type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => acknowledgeAlert(alert.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" /> Acknowledge
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => deleteAlert(alert.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="mt-2">{alert.message}</p>
                      <div className="flex justify-between text-sm text-gray-500 mt-3">
                        <span>Created: {new Date(alert.created_at).toLocaleString()}</span>
                        <span>Triggered: {new Date(alert.triggered_at!).toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AlertsComponent;