// src/components/AppLayout.tsx
import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  BarChart,
  Briefcase,
  Home,
  LineChart,
  LogOut,
  Menu,
  Settings,
  Bell,
  X,
  Activity,
  Wallet,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';
import { cn } from '../utils/cn';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: <Home className="h-5 w-5" />,
  },
  {
    title: "Portfolio",
    href: "/portfolio",
    icon: <Briefcase className="h-5 w-5" />,
  },
  {
    title: "Trade",
    href: "/trade",
    icon: <Activity className="h-5 w-5" />,
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: <LineChart className="h-5 w-5" />,
  },
];

const otherNavItems: NavItem[] = [
  {
    title: "Alerts",
    href: "/alerts",
    icon: <Bell className="h-5 w-5" />,
  },
  {
    title: "Simulation",
    href: "/simulation",
    icon: <BarChart className="h-5 w-5" />,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: <Settings className="h-5 w-5" />,
  },
];

const AppLayout: React.FC = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSimulationMode, setIsSimulationMode] = useState(true);

  const toggleSimulationMode = () => {
    setIsSimulationMode(!isSimulationMode);
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
          <Link 
            to="/" 
            className="flex items-center text-lg font-semibold"
          >
            <Activity className="h-5 w-5 mr-2" />
            <span>Crypto Trading Bot</span>
          </Link>
        </nav>
        <div className="flex-1">
          <nav className="hidden md:flex md:gap-6 lg:gap-10">
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center text-md transition-colors hover:text-primary",
                  location.pathname === item.href || 
                  (item.href !== "/" && location.pathname.startsWith(item.href))
                    ? "text-gray-900 font-medium"
                    : "text-gray-500"
                )}
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant={isSimulationMode ? "outline" : "destructive"}
            size="sm"
            className="hidden md:flex"
            onClick={toggleSimulationMode}
          >
            {isSimulationMode ? (
              <>
                <Wallet className="mr-2 h-4 w-4" />
                Simulation Mode
              </>
            ) : (
              <>
                <Activity className="mr-2 h-4 w-4" />
                Live Trading
              </>
            )}
          </Button>
          <Button variant="ghost" size="icon" className="shrink-0">
            <RefreshCw className="h-5 w-5" />
            <span className="sr-only">Refresh</span>
          </Button>
          <Link to="/alerts">
            <Button variant="ghost" size="icon" className="shrink-0">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notifications</span>
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder-user.jpg" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>
                <Link to="/settings" className="flex w-full">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      {/* Mobile Menu */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 md:hidden"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
          <nav className="grid gap-2 text-lg font-medium">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <Activity className="h-5 w-5" />
              <span className="sr-only">Crypto Trading Bot</span>
            </Link>
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900",
                  location.pathname === item.href || 
                  (item.href !== "/" && location.pathname.startsWith(item.href))
                    ? "text-gray-900 bg-gray-100"
                    : ""
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.icon}
                <span>{item.title}</span>
              </Link>
            ))}
            <div className="my-2 h-px bg-gray-200" />
            {otherNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900",
                  location.pathname === item.href ||
                  (item.href !== "/" && location.pathname.startsWith(item.href))
                    ? "text-gray-900 bg-gray-100"
                    : ""
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.icon}
                <span>{item.title}</span>
              </Link>
            ))}
          </nav>
          <div className="mt-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarImage src="/placeholder-user.jpg" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div className="grid gap-0.5 text-xs">
                  <div className="font-medium">User</div>
                  <div className="text-gray-500">user@example.com</div>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Log out</span>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Main Content Area */}
      <div className="grid flex-1 md:grid-cols-[240px_1fr]">
        {/* Sidebar (desktop only) */}
        <aside className="hidden border-r bg-gray-50/40 md:block">
          <div className="flex h-full max-h-screen flex-col gap-2 p-4">
            <div className="flex flex-col gap-1">
              <Button 
                variant={isSimulationMode ? "outline" : "destructive"}
                size="sm"
                className="justify-start"
                onClick={toggleSimulationMode}
              >
                {isSimulationMode ? (
                  <>
                    <Wallet className="mr-2 h-4 w-4" />
                    Simulation Mode
                  </>
                ) : (
                  <>
                    <Activity className="mr-2 h-4 w-4" />
                    Live Trading
                  </>
                )}
              </Button>
            </div>
            <nav className="grid gap-1 text-sm">
              <div className="py-2">
                <h2 className="mb-2 px-2 text-xs font-semibold text-gray-500">
                  Main Navigation
                </h2>
                {mainNavItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900",
                      location.pathname === item.href || 
                      (item.href !== "/" && location.pathname.startsWith(item.href))
                        ? "text-gray-900 bg-gray-100"
                        : ""
                    )}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                ))}
              </div>
              <div className="py-2">
                <h2 className="mb-2 px-2 text-xs font-semibold text-gray-500">
                  Other
                </h2>
                {otherNavItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900",
                      location.pathname === item.href ||
                      (item.href !== "/" && location.pathname.startsWith(item.href))
                        ? "text-gray-900 bg-gray-100"
                        : ""
                    )}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                ))}
              </div>
            </nav>
            <div className="mt-auto">
              <div className="flex flex-col items-start gap-1 pt-4 border-t">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarImage src="/placeholder-user.jpg" />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div className="grid gap-0.5 text-xs">
                      <div className="font-medium">User</div>
                      <div className="text-gray-500">user@example.com</div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Profile</DropdownMenuItem>
                      <DropdownMenuItem>Settings</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Log out</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </aside>
        
        {/* Main content */}
        <main className="flex flex-col p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;