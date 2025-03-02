import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
//import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { 
  TrendingUp, TrendingDown, ChevronRight, 
  BarChart2, Zap, DollarSign, Activity 
} from 'lucide-react';

//import TradingView from '@/components/TradingView';
//import PortfolioSummary from '@/components/PortfolioSummary';
//import RecentTrades from '@/components/RecentTrades';
//import MarketOverview from '@/components/MarketOverview';
//import TradingSimulator from '@/components/TradingSimulator';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch portfolio data
    const fetchPortfolioData = async () => {
      try {
        // Replace with actual API call
        const response = await fetch('/api/portfolio');
        const data = await response.json();
        setPortfolioData(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching portfolio data:', error);
        setIsLoading(false);
      }
    };

    fetchPortfolioData();
  }, []);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div className="flex items-center">
              <DollarSign className="mr-4 h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
                <p className="text-2xl font-bold">
                  ${portfolioData?.totalValue.toLocaleString() || '0'}
                </p>
              </div>
            </div>
            <TrendingUp className="h-6 w-6 text-green-500" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div className="flex items-center">
              <BarChart2 className="mr-4 h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">24h Profit/Loss</p>
                <p className={`text-2xl font-bold ${portfolioData?.dayProfitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {portfolioData?.dayProfitLoss >= 0 ? '+' : ''}
                  ${Math.abs(portfolioData?.dayProfitLoss || 0).toLocaleString()}
                </p>
              </div>
            </div>
            <Activity className="h-6 w-6 text-blue-500" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div className="flex items-center">
              <Zap className="mr-4 h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Open Positions</p>
                <p className="text-2xl font-bold">
                  {portfolioData?.openPositions || 0}
                </p>
              </div>
            </div>
            <ChevronRight className="h-6 w-6 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Market Overview</TabsTrigger>
          <TabsTrigger value="trading">Trading View</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="trades">Recent Trades</TabsTrigger>
          <TabsTrigger value="simulator">Trading Simulator</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <MarketOverview />
        </TabsContent>

        <TabsContent value="trading">
          <TradingView />
        </TabsContent>

        <TabsContent value="portfolio">
          <PortfolioSummary />
        </TabsContent>

        <TabsContent value="trades">
          <RecentTrades />
        </TabsContent>

        <TabsContent value="simulator">
          <TradingSimulator />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;