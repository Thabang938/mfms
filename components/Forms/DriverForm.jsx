// ...existing code...
'use client';
import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';
import { FaSave } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export default function DriverForm({ initial = {}, onSuccess, onClose }) {
  const [form, setForm] = useState({
    user_id: initial.user_id || '',
    license_number: initial.license_number || '',
    department: initial.department || '',
    assigned_vehicle_id: initial.assigned_vehicle_id || '',
    status: initial.status || 'Active',
    expiry_date: initial.expiry_date || '',
  });

  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [uRes, vRes] = await Promise.all([
          supabaseClient.from('users').select('id, name').order('name'),
          supabaseClient.from('vehicles').select('id, registration_number').order('registration_number'),
        ]);
        setUsers(uRes.data || []);
        setVehicles(vRes.data || []);
      } catch (err) {
        console.error('DriverForm load error:', err.message);
      }
    }
    load();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.user_id || !form.license_number) {
      toast.error('User and license number are required.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        user_id: form.user_id,
        license_number: form.license_number,
        department: form.department || null,
        assigned_vehicle_id: form.assigned_vehicle_id || null,
        status: form.status || 'Active',
        expiry_date: form.expiry_date || null,
      };

      let record;
      if (initial.id) {
        const { data, error } = await supabaseClient.from('drivers').update(payload).eq('id', initial.id).select().single();
        if (error) throw error;
        record = data;
      } else {
        const { data, error } = await supabaseClient.from('drivers').insert([payload]).select().single();
        if (error) throw error;
        record = data;
      }

      toast.success(initial.id ? 'Driver updated' : 'Driver added');
      onSuccess?.(record);
      onClose?.();
    } catch (err) {
      console.error('DriverForm submit error:', err.message);
      toast.error('Failed to save driver');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <select required value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })} className="p-2 border rounded w-full">
        <option value="">Select user</option>
        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
      </select>

      <input required placeholder="License number" value={form.license_number} onChange={e => setForm({ ...form, license_number: e.target.value })} className="p-2 border rounded w-full" />

      <div className="grid grid-cols-2 gap-3">
        <input placeholder="Department" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="p-2 border rounded" />
        <select value={form.assigned_vehicle_id} onChange={e => setForm({ ...form, assigned_vehicle_id: e.target.value })} className="p-2 border rounded">
          <option value="">Assign vehicle (optional)</option>
          {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="p-2 border rounded">
          <option>Active</option>
          <option>In Training</option>
          <option>Suspended</option>
          <option>Retired</option>
        </select>
        <input type="date" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} className="p-2 border rounded" />
      </div>

      <div className="flex justify-end gap-3 mt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 border rounded text-green-700">Cancel</button>
        <button type="submit" disabled={loading} className="px-4 py-2 bg-green-700 text-white rounded flex items-center gap-2">
          <FaSave /> {loading ? 'Saving...' : (initial.id ? 'Update Driver' : 'Add Driver')}
        </button>
      </div>
    </form>
  );
}