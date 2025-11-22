// ...existing code...
'use client';
import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';
import { FaSave } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export default function TireForm({ initial = {}, onSuccess, onClose }) {
  const [form, setForm] = useState({
    vehicle_id: initial.vehicle_id || '',
    brand: initial.brand || '',
    serial_number: initial.serial_number || '',
    position: initial.position || '',
    install_date: initial.install_date || '',
    cost: initial.cost || '',
    mileage: initial.mileage || '',
    pressure: initial.pressure || '',
    condition: initial.condition || 'Good',
    notes: initial.notes || '',
  });

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadVehicles() {
      try {
        const { data, error } = await supabaseClient
          .from('vehicles')
          .select('id, registration_number')
          .order('registration_number');
        if (error) throw error;
        setVehicles(data || []);
      } catch (err) {
        console.error('TireForm loadVehicles error:', err.message);
      }
    }
    loadVehicles();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.vehicle_id || !form.brand || !form.position) {
      toast.error('Vehicle, brand and position are required.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        vehicle_id: form.vehicle_id,
        brand: form.brand || null,
        serial_number: form.serial_number || null,
        position: form.position || null,
        install_date: form.install_date || null,
        cost: form.cost ? Number(form.cost) : null,
        mileage: form.mileage ? Number(form.mileage) : null,
        pressure: form.pressure ? Number(form.pressure) : null,
        condition: form.condition || 'Good',
        notes: form.notes || null,
      };

      let record;
      if (initial.id) {
        const { data, error } = await supabaseClient
          .from('tires')
          .update(payload)
          .eq('id', initial.id)
          .select()
          .single();
        if (error) throw error;
        record = data;
      } else {
        const { data, error } = await supabaseClient
          .from('tires')
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        record = data;
      }

      toast.success(initial.id ? 'Tire updated' : 'Tire recorded');
      onSuccess?.(record);
      onClose?.();
    } catch (err) {
      console.error('TireForm submit error:', err.message);
      toast.error('Failed to save tyre record');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div>
        <label className="block text-sm font-medium text-green-700 mb-1">Vehicle *</label>
        <select
          required
          value={form.vehicle_id}
          onChange={e => setForm({ ...form, vehicle_id: e.target.value })}
          className="p-2 border border-green-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Select vehicle</option>
          {vehicles.map(v => (
            <option key={v.id} value={v.id}>
              {v.registration_number}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-green-700 mb-1">Position *</label>
          <select
            required
            value={form.position}
            onChange={e => setForm({ ...form, position: e.target.value })}
            className="p-2 border border-green-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Select position</option>
            <option value="Front Left">Front Left</option>
            <option value="Front Right">Front Right</option>
            <option value="Rear Left">Rear Left</option>
            <option value="Rear Right">Rear Right</option>
            <option value="Spare">Spare</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-green-700 mb-1">Brand *</label>
          <input
            required
            value={form.brand}
            onChange={e => setForm({ ...form, brand: e.target.value })}
            className="p-2 border border-green-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Tire brand"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-green-700 mb-1">Serial Number</label>
          <input
            value={form.serial_number}
            onChange={e => setForm({ ...form, serial_number: e.target.value })}
            className="p-2 border border-green-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Serial number"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-green-700 mb-1">Install Date</label>
          <input
            type="date"
            value={form.install_date}
            onChange={e => setForm({ ...form, install_date: e.target.value })}
            className="p-2 border border-green-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-green-700 mb-1">Cost (R)</label>
          <input
            type="number"
            step="0.01"
            value={form.cost}
            onChange={e => setForm({ ...form, cost: e.target.value })}
            className="p-2 border border-green-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-green-700 mb-1">Mileage (km)</label>
          <input
            type="number"
            value={form.mileage}
            onChange={e => setForm({ ...form, mileage: e.target.value })}
            className="p-2 border border-green-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-green-700 mb-1">Pressure (PSI)</label>
          <input
            type="number"
            step="0.1"
            value={form.pressure}
            onChange={e => setForm({ ...form, pressure: e.target.value })}
            className="p-2 border border-green-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="0.0"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-green-700 mb-1">Condition</label>
        <select
          value={form.condition}
          onChange={e => setForm({ ...form, condition: e.target.value })}
          className="p-2 border border-green-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="Good">Good</option>
          <option value="Fair">Fair</option>
          <option value="Replace Soon">Replace Soon</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-green-700 mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
          className="p-2 border border-green-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Additional notes"
          rows="3"
        />
      </div>

      <div className="flex justify-end gap-3 mt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-green-300 rounded text-green-700 hover:bg-green-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 transition flex items-center gap-2 disabled:opacity-50"
        >
          <FaSave /> {loading ? 'Saving...' : (initial.id ? 'Update Tyre' : 'Add Tyre')}
        </button>
      </div>
    </form>
  );
}
// ...existing code...