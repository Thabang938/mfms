'use client';
import { useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';

export default function TireForm({ onSuccess, onClose, initial = {} }) {
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
  });

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadVehicles() {
      const { data } = await supabaseClient.from('vehicles').select('id, registration_number');
      setVehicles(data || []);
    }
    loadVehicles();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...form,
      cost: form.cost ? Number(form.cost) : null,
      mileage: form.mileage ? Number(form.mileage) : null,
      pressure: form.pressure ? Number(form.pressure) : null,
    };

    const { data, error } = await supabaseClient.from('tires').insert([payload]).select().single();

    setLoading(false);

    if (error) {
      alert('Failed to add tyre: ' + error.message);
    } else {
      onSuccess?.(data);
      onClose?.();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <select
        required
        value={form.vehicle_id}
        onChange={e => setForm({ ...form, vehicle_id: e.target.value })}
        className="p-2 border rounded"
      >
        <option value="">Select vehicle</option>
        {vehicles.map(v => (
          <option key={v.id} value={v.id}>{v.registration_number}</option>
        ))}
      </select>

      <div className="grid grid-cols-2 gap-3">
        <input
          placeholder="Brand"
          value={form.brand}
          onChange={e => setForm({ ...form, brand: e.target.value })}
          className="p-2 border rounded"
        />
        <input
          placeholder="Serial number"
          value={form.serial_number}
          onChange={e => setForm({ ...form, serial_number: e.target.value })}
          className="p-2 border rounded"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input
          placeholder="Position (e.g., Front Left)"
          value={form.position}
          onChange={e => setForm({ ...form, position: e.target.value })}
          className="p-2 border rounded"
        />
        <input
          type="date"
          value={form.install_date}
          onChange={e => setForm({ ...form, install_date: e.target.value })}
          className="p-2 border rounded"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <input
          type="number"
          placeholder="Cost"
          value={form.cost}
          onChange={e => setForm({ ...form, cost: e.target.value })}
          className="p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Mileage"
          value={form.mileage}
          onChange={e => setForm({ ...form, mileage: e.target.value })}
          className="p-2 border rounded"
        />
        <input
          type="number"
          step="0.01"
          placeholder="Pressure"
          value={form.pressure}
          onChange={e => setForm({ ...form, pressure: e.target.value })}
          className="p-2 border rounded"
        />
      </div>

      <select
        value={form.condition}
        onChange={e => setForm({ ...form, condition: e.target.value })}
        className="p-2 border rounded"
      >
        <option>Good</option>
        <option>Fair</option>
        <option>Replace Soon</option>
      </select>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border rounded text-green-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-green-700 text-white rounded"
        >
          {loading ? 'Saving...' : 'Add Tyre'}
        </button>
      </div>
    </form>
  );
}
