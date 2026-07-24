"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Server, Users, Key, Trash2, Edit2, ChevronDown, ChevronRight, User } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function TenantDetailsPage() {
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedVaults, setExpandedVaults] = useState({});
  const router = useRouter();
  const params = useParams();
  const tenantId = params.id;

  const fetchTenant = () => {
    const token = localStorage.getItem('sync_admin_token');
    if (!token) return router.push('/login');
    
    setLoading(true);
    axios.get(`/api/admin/tenants/${tenantId}/details`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setTenant(res.data))
    .catch(err => {
      if (err.response?.status === 401 || err.response?.status === 403) router.push('/login');
      else setError(err.message);
    })
    .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTenant();
  }, [tenantId, router]);

  const updateName = async () => {
    const newName = window.prompt("Enter new Tenant Name:", tenant?.name);
    if (!newName || newName === tenant.name) return;

    try {
      const token = localStorage.getItem('sync_admin_token');
      await axios.put(`/api/admin/tenants/${tenantId}`, 
        { name: newName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchTenant();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to rename tenant');
    }
  };

  const deleteResource = async (resourceId) => {
    if (!window.confirm(`WARNING! You are about to permanently delete this resource from the vault. This action cannot be undone. Proceed?`)) return;
    try {
      const token = localStorage.getItem('sync_admin_token');
      await axios.delete(`/api/admin/resources/${resourceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTenant();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete resource');
    }
  };

  const toggleVault = (vaultId) => {
    setExpandedVaults(prev => ({ ...prev, [vaultId]: !prev[vaultId] }));
  };

  if (loading && !tenant) return <div className="text-gray-500">Loading tenant details...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!tenant) return <div className="text-gray-500">Tenant not found</div>;

  return (
    <div>
      <div className="mb-4">
        <Link href="/dashboard/tenants" className="text-indigo-600 hover:underline text-sm font-medium">&larr; Back to Tenants</Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <Server size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              {tenant.name}
              <button onClick={updateName} className="text-gray-400 hover:text-indigo-600 transition" title="Rename Tenant">
                <Edit2 size={16} />
              </button>
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {tenant.users && tenant.users.length > 0 && (
                <span className="font-medium text-indigo-600 mr-2">
                  Owner: {tenant.users.find(u => u.role === 'OWNER')?.user?.email || tenant.users[0]?.user?.email}
                </span>
              )}
              ID: {tenant.id} &bull; Created: {new Date(tenant.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Users */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 font-semibold text-gray-700 flex items-center gap-2">
              <Users size={18} /> Users ({tenant.users.length})
            </div>
            <ul className="divide-y divide-gray-50">
              {tenant.users.map(tu => (
                <li key={tu.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                      <User size={16} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{tu.user.email}</p>
                      <p className="text-xs text-gray-500 capitalize">{tu.role.toLowerCase()}</p>
                    </div>
                  </div>
                </li>
              ))}
              {tenant.users.length === 0 && (
                <li className="p-4 text-sm text-gray-500 text-center">No users in this tenant.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Right Column: Vaults & Resources */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 font-semibold text-gray-700 flex items-center gap-2">
              <Key size={18} /> Encrypted Vaults ({tenant.collections.length})
            </div>
            
            <div className="divide-y divide-gray-100">
              {tenant.collections.map(vault => (
                <div key={vault.id}>
                  {/* Vault Row */}
                  <div 
                    onClick={() => toggleVault(vault.id)}
                    className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3">
                      {expandedVaults[vault.id] ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
                      <div>
                        <p className="font-medium text-gray-900">{vault.name}</p>
                        <p className="text-xs text-gray-500">{vault.resources.length} resources &bull; {vault.users.length} members</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                      {vault.type}
                    </span>
                  </div>

                  {/* Expanded Resources */}
                  {expandedVaults[vault.id] && (
                    <div className="bg-gray-50 p-4 border-t border-gray-100">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Resources in Vault</h4>
                      {vault.resources.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">Vault is empty.</p>
                      ) : (
                        <div className="space-y-6">
                          {Object.entries(
                            vault.resources.reduce((acc, res) => {
                              (acc[res.type] = acc[res.type] || []).push(res);
                              return acc;
                            }, {})
                          ).map(([type, typeResources]) => (
                            <div key={type} className="space-y-2">
                              <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b border-gray-100 pb-1">
                                {type} ({typeResources.length})
                              </h5>
                              {typeResources.map(res => (
                                <div key={res.id} className="bg-white border border-gray-200 rounded-lg p-3 flex justify-between items-start shadow-sm hover:border-gray-300 transition-colors">
                                  <div>
                                    <h4 className="font-mono text-sm font-semibold text-gray-800">{res.name}</h4>
                                    <p className="text-[10px] text-gray-400 font-mono mt-1">ID: {res.id}</p>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <p className="text-xs text-gray-400 whitespace-nowrap">Updated: {new Date(res.updatedAt).toLocaleDateString()}</p>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); deleteResource(res.id); }}
                                      className="text-red-500 hover:text-red-700 p-1 bg-red-50 hover:bg-red-100 rounded transition-colors"
                                      title="Force Delete Resource"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {tenant.collections.length === 0 && (
                <div className="p-8 text-center text-gray-500">No vaults found in this tenant.</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
