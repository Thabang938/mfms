'use client';

import { useEffect, useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { Dialog } from '@headlessui/react';
import { supabase } from '@/lib/supabaseClient';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import Link from 'next/link';

export default function SettingsDashboard() {
  const [users, setUsers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', role: '', auth_id: '' });
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 8;

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('users').select('*');
    if (error) return toast.error(error.message);
    setUsers(data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingUser) {
      const { error } = await supabase.from('users').update(formData).eq('id', editingUser.id);
      if (error) return toast.error(error.message);
      toast.success('User updated successfully');
    } else {
      const { error } = await supabase.from('users').insert([formData]);
      if (error) return toast.error(error.message);
      toast.success('User added successfully');
    }
    setModalOpen(false);
    setEditingUser(null);
    setFormData({ name: '', role: '', auth_id: '' });
    fetchUsers();
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('User deleted successfully');
    fetchUsers();
  };

  // Role chart
  const roleStats = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});
  const chartData = Object.entries(roleStats).map(([role, count]) => ({ role, count }));

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.role.toLowerCase().includes(search.toLowerCase()) ||
      user.auth_id?.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  return (
    <div className="p-6 space-y-6">
      <ToastContainer />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold">Settings - User Management</h1>
        <button
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"
          onClick={() => setModalOpen(true)}
        >
          <FaPlus /> Add User
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-2 items-center">
        <FaSearch className="text-gray-500" />
        <input
          type="text"
          placeholder="Search users..."
          className="border px-3 py-2 rounded w-full md:w-1/3"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Role Chart */}
      <div className="bg-white shadow rounded p-4">
        <h2 className="font-semibold mb-4">User Role Distribution</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis dataKey="role" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#34D399" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* User Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {currentUsers.map((user) => (
          <div key={user.id} className="bg-white shadow rounded p-4 flex flex-col justify-between hover:shadow-lg transition">
            <div>
              <h3 className="text-xl font-semibold">{user.name}</h3>
              <p className="text-gray-500">Role: {user.role}</p>
              <p className="text-gray-400 text-sm truncate">Auth ID: {user.auth_id}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <Link href={`/settings/${user.id}`} className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white px-2 py-1 rounded flex justify-center items-center gap-1">
                <FaEdit /> View
              </Link>
              <button
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded flex justify-center items-center gap-1"
                onClick={() => handleDelete(user.id)}
              >
                <FaTrash /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-2 mt-6">
        <button
          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
        >
          <FaChevronLeft />
        </button>
        <span>
          Page {currentPage} / {totalPages}
        </span>
        <button
          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => prev + 1)}
        >
          <FaChevronRight />
        </button>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} className="fixed z-50 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
          <div className="bg-white rounded max-w-md mx-auto p-6 z-50 w-full shadow-lg">
            <Dialog.Title className="text-lg font-bold mb-4">{editingUser ? 'Edit User' : 'Add User'}</Dialog.Title>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  className="w-full border px-3 py-2 rounded"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  className="w-full border px-3 py-2 rounded"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                >
                  <option value="">Select Role</option>
                  <option value="Fleet Manager">Fleet Manager</option>
                  <option value="Technician">Technician</option>
                  <option value="Admin Clerk">Admin Clerk</option>
                  <option value="Driver">Driver</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Auth ID</label>
                <input
                  type="text"
                  className="w-full border px-3 py-2 rounded"
                  value={formData.auth_id}
                  onChange={(e) => setFormData({ ...formData, auth_id: e.target.value })}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded bg-green-500 hover:bg-green-600 text-white">
                  {editingUser ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
