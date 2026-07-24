"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, Server, Database, Key } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('sync_admin_token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchStats = async () => {
      try {
        const res = await axios.get('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('sync_admin_token');
          router.push('/login');
        } else {
          setError(err.message || 'Failed to fetch stats');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [router]);

  if (loading) return <div className="text-gray-500">Loading overview...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!stats) return null;

  const statCards = [
    { title: 'Total Users', value: stats.users, icon: Users, color: 'bg-blue-500' },
    { title: 'Total Tenants', value: stats.tenants, icon: Server, color: 'bg-indigo-500' },
    { title: 'Total Collections', value: stats.collections, icon: Database, color: 'bg-emerald-500' },
    { title: 'Total Resources', value: stats.resources, icon: Key, color: 'bg-rose-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className={`p-4 rounded-lg ${stat.color} text-white`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
