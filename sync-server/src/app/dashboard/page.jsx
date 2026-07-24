"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LogOut, Cloud, Users, Shield, Server, FileKey } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('sync_admin_token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const res = await axios.get('/api/sync/pull', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('sync_admin_token');
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('sync_admin_token');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-indigo-900 text-white flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-indigo-800">
          <Cloud className="text-indigo-400" />
          <span className="font-bold text-lg tracking-wide">NexusCloud</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-indigo-800/50 rounded-lg text-sm font-medium">
            <Server size={18} />
            My Vaults
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-indigo-200 hover:bg-indigo-800/50 rounded-lg text-sm font-medium transition">
            <Users size={18} />
            Tenants & Users
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-indigo-200 hover:bg-indigo-800/50 rounded-lg text-sm font-medium transition">
            <Shield size={18} />
            Access Policies
          </a>
        </nav>
        <div className="p-4 border-t border-indigo-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-indigo-300 hover:text-white text-sm w-full px-4 py-2"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Vaults (Collections)</h2>
            <p className="text-gray-500 mt-1">Manage your E2EE shared collections and resources.</p>
          </div>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
            + Create Vault
          </button>
        </header>

        {loading ? (
          <div className="text-gray-500">Loading your vaults...</div>
        ) : data.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500">
            No vaults found. Create one or ask your admin for access.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {data.map((item) => (
              <div key={item.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${item.collection.type === 'PERSONAL' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                      {item.collection.type === 'PERSONAL' ? <FileKey size={20} /> : <Users size={20} />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.collection.name}</h3>
                      <span className="text-xs text-gray-500">{item.collection.type} Vault</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                    {item.role}
                  </span>
                </div>
                
                <div className="pt-4 border-t border-gray-100 mt-4 text-sm text-gray-600 flex justify-between">
                  <span>{item.collection.resources?.length || 0} encrypted items</span>
                  <button className="text-indigo-600 font-medium hover:underline">Manage</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
