"use client";

import React from 'react';
import { Cloud, Users, Server, LayoutDashboard, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('sync_admin_token');
    router.push('/login');
  };

  const navItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Users', href: '/dashboard/users', icon: Users },
    { name: 'Tenants', href: '/dashboard/tenants', icon: Server },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-indigo-900 text-white flex flex-col fixed h-full">
        <div className="p-6 flex items-center gap-3 border-b border-indigo-800">
          <Cloud className="text-indigo-400" />
          <span className="font-bold text-lg tracking-wide">NexusCloud</span>
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                  isActive ? 'bg-indigo-800/50 text-white' : 'text-indigo-200 hover:bg-indigo-800/30'
                }`}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-indigo-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-indigo-200 hover:bg-indigo-800/50 hover:text-white rounded-lg text-sm font-medium transition"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 ml-64 p-8">
        {children}
      </div>
    </div>
  );
}
