// src/pages/SettingsPage.tsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
//import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
//import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
//import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

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