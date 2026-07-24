"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Shield, User, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const fetchUsers = () => {
    const token = localStorage.getItem('sync_admin_token');
    if (!token) return router.push('/login');

    setLoading(true);
    axios.get('/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setUsers(res.data))
    .catch(err => {
      if (err.response?.status === 401 || err.response?.status === 403) router.push('/login');
      else setError(err.message);
    })
    .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, [router]);

  const toggleAdmin = async (id, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'remove' : 'grant'} Global Admin privileges?`)) return;
    try {
      const token = localStorage.getItem('sync_admin_token');
      await axios.put(`/api/admin/users/${id}`, 
        { isSuperAdmin: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update user');
    }
  };

  const deleteUser = async (id, email) => {
    if (!window.confirm(`WARNING! Are you sure you want to permanently delete user ${email}?`)) return;
    try {
      const token = localStorage.getItem('sync_admin_token');
      await axios.delete(`/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete user');
    }
  };

  if (loading && users.length === 0) return <div className="text-gray-500">Loading users...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
              <th className="px-6 py-4 font-medium">Email</th>
              <th className="px-6 py-4 font-medium">Role</th>
              <th className="px-6 py-4 font-medium">Tenants</th>
              <th className="px-6 py-4 font-medium">Joined Date</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-6 py-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <User size={16} />
                  </div>
                  <span className="font-medium text-gray-900">{user.email}</span>
                </td>
                <td className="px-6 py-4">
                  {user.isSuperAdmin ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                      <Shield size={12} /> Global Admin
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      User
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {user._count.tenants}
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => toggleAdmin(user.id, user.isSuperAdmin)}
                      className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md transition"
                    >
                      {user.isSuperAdmin ? 'Demote' : 'Make Admin'}
                    </button>
                    <button 
                      onClick={() => deleteUser(user.id, user.email)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition"
                      title="Delete User"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="p-8 text-center text-gray-500">No users found.</div>
        )}
      </div>
    </div>
  );
}
