export interface Trade {
    id: number;
    symbol: string;
    side: 'buy' | 'sell';
    price: number;
    quantity: number;
    timestamp: string;
  }
  
  export interface PortfolioPosition {
    symbol: string;
    quantity: number;
    avgPrice: number;
    currentPrice: number;
    profitLoss: number;
  }
  
  export interface Alert {
    id: number;
    type: string;
    message: string;
    status: 'active' | 'triggered' | 'resolved';
  }