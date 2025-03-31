
import React from 'react';
import { Home, CookingPot, Search, User, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

type NavItem = {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive: boolean;
};

const MobileNavBar = () => {
  // Get current path to determine active state
  const path = window.location.pathname;
  
  const navItems: NavItem[] = [
    {
      icon: <Home size={20} />,
      label: 'Home',
      href: '/',
      isActive: path === '/',
    },
    {
      icon: <Search size={20} />,
      label: 'Explore',
      href: '/explore',
      isActive: path === '/explore',
    },
    {
      icon: <CookingPot size={20} />,
      label: 'Cook',
      href: '/cook/1', // Fixed to go to a specific recipe ID
      isActive: path.startsWith('/cook'),
    },
    {
      icon: <ShoppingCart size={20} />,
      label: 'Shopping',
      href: '/shopping-list',
      isActive: path === '/shopping-list',
    },
    {
      icon: <User size={20} />,
      label: 'Profile',
      href: '/profile',
      isActive: path === '/profile',
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border py-2 px-1 flex justify-around items-center z-50">
      {navItems.map((item, index) => (
        <Link
          key={index}
          to={item.href}
          className={cn(
            "mobile-nav-item flex flex-col items-center text-[10px] p-2 rounded-lg",
            item.isActive ? "text-primary" : "text-muted-foreground"
          )}
        >
          {item.icon}
          <span className="mt-1">{item.label}</span>
        </Link>
      ))}
    </div>
  );
};

export default MobileNavBar;
