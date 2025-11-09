'use client';
import { useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';

export default function ServiceForm({ onSuccess, onClose, initial = {} }) {
  const [form, setForm] = useState({
    vehicle_id: initial.vehicle_id || '',
    service_date: initial.service_date || '',
    mileage: initial.mileage || '',
    parts_replaced: initial.parts_replaced || '',
    maintenance_cost: initial.maintenance_cost || '',
    upcoming_service_date: initial.upcoming_service_date || '',
    status: initial.status || 'Scheduled',
    technician: initial.technician || '',
    notes: initial.notes || '',
  });

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadVehicles() {
      const { data } = await supabaseClient
        .from('vehicles')
        .select('id, registration_number, make, model');
      setVehicles(data || []);
    }
    loadVehicles();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...form,
      mileage: form.mileage ? Number(form.mileage) : null,
      maintenance_cost: form.maintenance_cost ? Number(form.maintenance_cost) : null,
    };

    const { data, error } = await supabaseClient
      .from('services')
      .insert([payload])
      .select()
      .single();

    setLoading(false);

    if (error) {
      alert('Failed to add service: ' + error.message);
    } else {
      onSuccess?.(data);
      onClose?.();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        <select
          required
          value={form.vehicle_id}
          onChange={e => setForm({ ...form, vehicle_id: e.target.value })}
          className="p-2 border rounded"
        >
          <option value="">Select vehicle</option>
          {vehicles.map(v => (
            <option key={v.id} value={v.id}>
              {v.registration_number} — {v.make} {v.model}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-3">
          <input
            type="date"
            value={form.service_date}
            onChange={e => setForm({ ...form, service_date: e.target.value })}
            className="p-2 border rounded"
          />
          <input
            placeholder="Mileage"
            type="number"
            value={form.mileage}
            onChange={e => setForm({ ...form, mileage: e.target.value })}
            className="p-2 border rounded"
          />
        </div>

        <input
          placeholder="Technician"
          value={form.technician}
          onChange={e => setForm({ ...form, technician: e.target.value })}
          className="p-2 border rounded"
        />

        <input
          placeholder="Maintenance Cost"
          type="number"
          value={form.maintenance_cost}
          onChange={e => setForm({ ...form, maintenance_cost: e.target.value })}
          className="p-2 border rounded"
        />

        <input
          type="date"
          value={form.upcoming_service_date}
          onChange={e => setForm({ ...form, upcoming_service_date: e.target.value })}
          className="p-2 border rounded"
        />

        <select
          value={form.status}
          onChange={e => setForm({ ...form, status: e.target.value })}
          className="p-2 border rounded"
        >
          <option>Scheduled</option>
          <option>In Progress</option>
          <option>Completed</option>
          <option>Overdue</option>
        </select>

        <textarea
          placeholder="Notes / parts replaced"
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
          className="p-2 border rounded"
        />
      </div>

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
          {loading ? 'Saving...' : 'Add Service'}
        </button>
      </div>
    </form>
  );
}
