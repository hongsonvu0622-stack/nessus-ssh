"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Server, Users, Trash2, Plus, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const fetchTenants = () => {
    const token = localStorage.getItem('sync_admin_token');
    if (!token) return router.push('/login');
    
    setLoading(true);
    axios.get('/api/admin/tenants', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setTenants(res.data))
    .catch(err => {
      if (err.response?.status === 401 || err.response?.status === 403) router.push('/login');
      else setError(err.message);
    })
    .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTenants();
  }, [router]);

  const createTenant = async () => {
    const name = window.prompt("Enter new Tenant Name:");
    if (!name) return;

    try {
      const token = localStorage.getItem('sync_admin_token');
      await axios.post('/api/admin/tenants', 
        { name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchTenants();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create tenant');
    }
  };

  const deleteTenant = async (id, name) => {
    if (!window.confirm(`WARNING! Are you sure you want to permanently delete tenant "${name}" and ALL its data?`)) return;
    try {
      const token = localStorage.getItem('sync_admin_token');
      await axios.delete(`/api/admin/tenants/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTenants();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete tenant');
    }
  };

  if (loading && tenants.length === 0) return <div className="text-gray-500">Loading tenants...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
        <button 
          onClick={createTenant}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          <Plus size={16} /> Create Tenant
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
              <th className="px-6 py-4 font-medium">Tenant Name</th>
              <th className="px-6 py-4 font-medium">Total Users</th>
              <th className="px-6 py-4 font-medium">Total Vaults</th>
              <th className="px-6 py-4 font-medium">Created At</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {tenants.map((tenant) => (
              <tr key={tenant.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-6 py-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <Server size={16} />
                  </div>
                  <span className="font-medium text-gray-900">{tenant.name}</span>
                </td>
                <td className="px-6 py-4 text-gray-700">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-gray-400" />
                    {tenant._count.users}
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-700">
                  {tenant._count.collections}
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {new Date(tenant.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Link 
                      href={`/dashboard/tenants/${tenant.id}`}
                      className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </Link>
                    <button 
                      onClick={() => deleteTenant(tenant.id, tenant.name)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition"
                      title="Delete Tenant"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tenants.length === 0 && (
          <div className="p-8 text-center text-gray-500">No tenants found.</div>
        )}
      </div>
    </div>
  );
}
