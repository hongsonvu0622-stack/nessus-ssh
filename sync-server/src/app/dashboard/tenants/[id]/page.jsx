"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Server, Users, Key, Trash2, Edit2, ChevronDown, ChevronRight, User } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

const ResourceTable = ({ resources, deleteResource, currentUserRole }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const itemsPerPage = 50;

  const filtered = resources.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.type.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-sm mt-3">
       <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
          <input 
            type="text" 
            placeholder="Search resources..." 
            value={search} 
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            className="px-3 py-1.5 border border-gray-200 rounded text-sm w-64 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <div className="text-sm text-gray-500">Total: {filtered.length} items</div>
       </div>
       <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50 text-xs uppercase text-gray-500">
               <th className="p-3 font-medium">Type</th>
               <th className="p-3 font-medium">Name</th>
               <th className="p-3 font-medium">Updated</th>
               <th className="p-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-50">
             {paginated.map(res => (
                <tr key={res.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-3">
                    <span className="px-2.5 py-1 rounded-md bg-gray-100 text-xs font-mono text-gray-600">{res.type}</span>
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-gray-800">{res.name}</div>
                    <div className="text-[10px] text-gray-400 font-mono mt-0.5">ID: {res.id}</div>
                  </td>
                  <td className="p-3 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(res.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-right">
                    {currentUserRole !== 'VIEWER' && (
                       <button onClick={(e) => { e.stopPropagation(); deleteResource(res.id); }} className="text-red-500 hover:text-red-700 p-1.5 bg-red-50 hover:bg-red-100 rounded transition-colors" title="Force Delete Resource">
                         <Trash2 size={15} />
                       </button>
                    )}
                  </td>
                </tr>
             ))}
             {paginated.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500 text-sm">No resources found.</td>
                </tr>
             )}
          </tbody>
       </table>
       {totalPages > 1 && (
         <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/80">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="px-3 py-1.5 bg-white border border-gray-200 rounded text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors">Previous</button>
            <span className="text-sm text-gray-500 font-medium">Page {currentPage} of {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="px-3 py-1.5 bg-white border border-gray-200 rounded text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors">Next</button>
         </div>
       )}
    </div>
  );
}

export default function TenantDetailsPage() {
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedVaults, setExpandedVaults] = useState({});

  // Invite state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  
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

  const handleInvite = async () => {
    if (!inviteEmail) return;
    try {
      const token = localStorage.getItem('sync_admin_token');
      await axios.post(`/api/admin/tenants/${tenantId}/invite`, 
        { email: inviteEmail, role: inviteRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('MEMBER');
      fetchTenant();
      alert('User invited successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to invite user');
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
              {tenant.currentUserRole !== 'VIEWER' && (
                <button onClick={updateName} className="text-gray-400 hover:text-indigo-600 transition" title="Rename Tenant">
                  <Edit2 size={16} />
                </button>
              )}
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
            <div className="p-4 border-b border-gray-100 bg-gray-50 font-semibold text-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={18} /> Users ({tenant.users.length})
              </div>
              {tenant.currentUserRole !== 'VIEWER' && (
                <button 
                  onClick={() => setShowInviteModal(true)} 
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition px-2 py-1 rounded border border-indigo-100"
                >
                  + Invite
                </button>
              )}
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
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Resources in Vault</h4>
                      {vault.resources.length === 0 ? (
                        <p className="text-sm text-gray-400 italic mt-3">Vault is empty.</p>
                      ) : (
                        <ResourceTable resources={vault.resources} deleteResource={deleteResource} currentUserRole={tenant.currentUserRole} />
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

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Invite Member</h2>
            <p className="text-sm text-gray-500 mb-6">Enter the email address of the user you want to invite. They must have already registered an account.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setShowInviteModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition">Cancel</button>
              <button onClick={handleInvite} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition">Send Invite</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
