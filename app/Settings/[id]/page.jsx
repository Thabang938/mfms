'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function UserPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', role: '', auth_id: '' });

  const fetchUser = async () => {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
    if (error) return toast.error(error.message);
    setUser(data);
    setFormData({ name: data.name, role: data.role, auth_id: data.auth_id });
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('users').update(formData).eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('User updated successfully');
    fetchUser();
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('User deleted successfully');
    router.push('/settings');
  };

  if (!user) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-md mx-auto space-y-6">
      <ToastContainer />
      <h1 className="text-2xl font-bold">User Profile</h1>

      <form className="space-y-4" onSubmit={handleUpdate}>
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

        <div className="flex justify-between gap-2">
          <button type="submit" className="px-4 py-2 rounded bg-green-500 hover:bg-green-600 text-white">
            Update
          </button>
          <button type="button" className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </form>
    </div>
  );
}
