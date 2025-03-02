import React from 'react';
import { 
  Bell, 
  User, 
  Settings, 
  LogOut, 
  Search 
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
      <div className="flex items-center space-x-4 flex-1">
        <div className="relative flex-grow max-w-md">
          <Input 
            type="text" 
            placeholder="Search..." 
            className="pl-10"
          />
          <Search 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
            size={20} 
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        
        <div className="relative">
          <Button variant="outline" size="icon">
            <User className="h-5 w-5" />
          </Button>
          
          {/* Dropdown could be added here */}
        </div>
        
        <Button variant="outline" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
        
        <Button variant="destructive" size="icon">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};

export default Header;