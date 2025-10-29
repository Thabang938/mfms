// ...existing code...
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function FuelForm({ onSuccess, onClose, initial = {} }) {
  const [form, setForm] = useState({
    vehicle_id: initial.vehicle_id || '',
    purchase_date: initial.purchase_date || '',
    liters: initial.liters || '',
    cost: initial.cost || '',
    station: initial.station || '',
    odometer: initial.odometer || '',
    fuel_type: initial.fuel_type || '',
    transaction_id: initial.transaction_id || '',
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
    const payload = {
      ...form,
      liters: form.liters ? Number(form.liters) : null,
      cost: form.cost ? Number(form.cost) : null,
      odometer: form.odometer ? Number(form.odometer) : null,
    };
    const { data, error } = await supabase.from('fuel_logs').insert([payload]).select().single();
    setLoading(false);
    if (error) {
      alert('Failed to add fuel record: ' + error.message);
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
      <div className="grid grid-cols-2 gap-3">
        <input type="date" value={form.purchase_date} onChange={e => setForm({...form, purchase_date: e.target.value})} className="p-2 border rounded" />
        <input placeholder="Station" value={form.station} onChange={e => setForm({...form, station: e.target.value})} className="p-2 border rounded" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <input placeholder="Liters" type="number" value={form.liters} onChange={e => setForm({...form, liters: e.target.value})} className="p-2 border rounded" />
        <input placeholder="Cost" type="number" value={form.cost} onChange={e => setForm({...form, cost: e.target.value})} className="p-2 border rounded" />
        <input placeholder="Odometer" type="number" value={form.odometer} onChange={e => setForm({...form, odometer: e.target.value})} className="p-2 border rounded" />
      </div>
      <input placeholder="Fuel type" value={form.fuel_type} onChange={e => setForm({...form, fuel_type: e.target.value})} className="p-2 border rounded" />
      <input placeholder="Transaction ID (optional)" value={form.transaction_id} onChange={e => setForm({...form, transaction_id: e.target.value})} className="p-2 border rounded" />

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className="px-4 py-2 border rounded text-green-700">Cancel</button>
        <button type="submit" disabled={loading} className="px-4 py-2 bg-green-700 text-white rounded">{loading ? 'Saving...' : 'Add Fuel'}</button>
      </div>
    </form>
  );
}
// ...existing code...