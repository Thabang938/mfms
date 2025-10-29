// ...existing code...
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function DocumentForm({ onSuccess, onClose, initial = {} }) {
  const [form, setForm] = useState({
    vehicle_id: initial.vehicle_id || '',
    doc_type: initial.doc_type || '',
    file_url: initial.file_url || '',
    name: initial.name || '',
    expiry_date: initial.expiry_date || '',
    status: initial.status || 'Current',
  });
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('vehicles').select('id, registration_number');
      setVehicles(data || []);
    }
    load();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.from('documents').insert([form]).select().single();
    setLoading(false);
    if (error) {
      alert('Failed to add document: ' + error.message);
    } else {
      onSuccess?.(data);
      onClose?.();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <select required value={form.vehicle_id} onChange={e => setForm({...form, vehicle_id: e.target.value})} className="p-2 border rounded">
        <option value="">Select vehicle</option>
        {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number}</option>)}
      </select>
      <input placeholder="Document name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="p-2 border rounded" />
      <input placeholder="Doc type" value={form.doc_type} onChange={e => setForm({...form, doc_type: e.target.value})} className="p-2 border rounded" />
      <input placeholder="File URL" value={form.file_url} onChange={e => setForm({...form, file_url: e.target.value})} className="p-2 border rounded" />
      <div className="grid grid-cols-2 gap-3">
        <input type="date" value={form.expiry_date} onChange={e => setForm({...form, expiry_date: e.target.value})} className="p-2 border rounded" />
        <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="p-2 border rounded">
          <option>Current</option>
          <option>Expiring Soon</option>
          <option>Archived</option>
          <option>Active</option>
        </select>
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className="px-4 py-2 border rounded text-green-700">Cancel</button>
        <button type="submit" disabled={loading} className="px-4 py-2 bg-green-700 text-white rounded">{loading ? 'Saving...' : 'Add Document'}</button>
      </div>
    </form>
  );
}
// ...existing code...