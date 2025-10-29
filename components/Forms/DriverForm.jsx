// ...existing code...
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function DriverForm({ onSuccess, onClose, initial = {} }) {
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
      const [uRes, vRes] = await Promise.all([
        supabase.from('users').select('id, name'),
        supabase.from('vehicles').select('id, registration_number'),
      ]);
      setUsers(uRes.data || []);
      setVehicles(vRes.data || []);
    }
    load();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.from('drivers').insert([form]).select().single();
    setLoading(false);
    if (error) {
      alert('Failed to add driver: ' + error.message);
    } else {
      onSuccess?.(data);
      onClose?.();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <select required value={form.user_id} onChange={e => setForm({...form, user_id: e.target.value})} className="p-2 border rounded">
        <option value="">Select user</option>
        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
      </select>
      <input required placeholder="License number" value={form.license_number} onChange={e => setForm({...form, license_number: e.target.value})} className="p-2 border rounded" />
      <div className="grid grid-cols-2 gap-3">
        <input placeholder="Department" value={form.department} onChange={e => setForm({...form, department: e.target.value})} className="p-2 border rounded" />
        <select value={form.assigned_vehicle_id} onChange={e => setForm({...form, assigned_vehicle_id: e.target.value})} className="p-2 border rounded">
          <option value="">Assign vehicle (optional)</option>
          {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="p-2 border rounded">
          <option>Active</option>
          <option>In Training</option>
          <option>Suspended</option>
          <option>Retired</option>
        </select>
        <input type="date" value={form.expiry_date} onChange={e => setForm({...form, expiry_date: e.target.value})} className="p-2 border rounded" />
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className="px-4 py-2 border rounded text-green-700">Cancel</button>
        <button type="submit" disabled={loading} className="px-4 py-2 bg-green-700 text-white rounded">{loading ? 'Saving...' : 'Add Driver'}</button>
      </div>
    </form>
  );
}
// ...existing code...