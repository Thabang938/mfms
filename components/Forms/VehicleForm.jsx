// ...existing code...
'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function VehicleForm({ onSuccess, onClose, initial = {} }) {
  const [form, setForm] = useState({
    registration_number: initial.registration_number || '',
    make: initial.make || '',
    model: initial.model || '',
    year: initial.year || '',
    vin: initial.vin || '',
    department: initial.department || '',
    fuel_type: initial.fuel_type || '',
    odometer: initial.odometer || 0,
    status: initial.status || 'Active',
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const payload = {
      ...form,
      year: form.year ? Number(form.year) : null,
      odometer: form.odometer ? Number(form.odometer) : 0,
    };
    const { data, error } = await supabase.from('vehicles').insert([payload]).select().single();
    setLoading(false);
    if (error) {
      alert('Failed to add vehicle: ' + error.message);
    } else {
      onSuccess?.(data);
      onClose?.();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <input required placeholder="Registration" value={form.registration_number} onChange={e => setForm({...form, registration_number: e.target.value})} className="p-2 border rounded" />
        <input placeholder="Make" value={form.make} onChange={e => setForm({...form, make: e.target.value})} className="p-2 border rounded" />
        <input placeholder="Model" value={form.model} onChange={e => setForm({...form, model: e.target.value})} className="p-2 border rounded" />
        <input type="number" placeholder="Year" value={form.year} onChange={e => setForm({...form, year: e.target.value})} className="p-2 border rounded" />
        <input placeholder="VIN" value={form.vin} onChange={e => setForm({...form, vin: e.target.value})} className="p-2 border rounded" />
        <input placeholder="Department" value={form.department} onChange={e => setForm({...form, department: e.target.value})} className="p-2 border rounded" />
        <input placeholder="Fuel Type" value={form.fuel_type} onChange={e => setForm({...form, fuel_type: e.target.value})} className="p-2 border rounded" />
        <input type="number" placeholder="Odometer" value={form.odometer} onChange={e => setForm({...form, odometer: e.target.value})} className="p-2 border rounded" />
        <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="p-2 border rounded col-span-2">
          <option>Active</option>
          <option>Maintenance</option>
          <option>Incident</option>
          <option>Retired</option>
        </select>
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className="px-4 py-2 border rounded text-green-700">Cancel</button>
        <button type="submit" disabled={loading} className="px-4 py-2 bg-green-700 text-white rounded">
          {loading ? 'Saving...' : 'Add Vehicle'}
        </button>
      </div>
    </form>
  );
}
// ...existing code...