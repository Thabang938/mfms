'use client';
import { useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';

export default function AccidentForm({ onSuccess, onClose, initial = {} }) {
  const [form, setForm] = useState({
    incident_id: initial.incident_id || '',
    vehicle_id: initial.vehicle_id || '',
    driver_id: initial.driver_id || '',
    date: initial.date || '',
    location: initial.location || '',
    damage: initial.damage || '',
    cause: initial.cause || '',
    status: initial.status || 'Under Review',
    estimated_cost: initial.estimated_cost || '',
    insurance_claim: initial.insurance_claim || false,
  });

  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const [vRes, dRes] = await Promise.all([
        supabaseClient.from('vehicles').select('id, registration_number'),
        supabaseClient.from('drivers').select('id, license_number'),
      ]);
      setVehicles(vRes.data || []);
      setDrivers(dRes.data || []);
    }
    load();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const payload = {
      ...form,
      estimated_cost: form.estimated_cost ? Number(form.estimated_cost) : null,
      insurance_claim: !!form.insurance_claim,
    };
    const { data, error } = await supabaseClient
      .from('accidents')
      .insert([payload])
      .select()
      .single();

    setLoading(false);

    if (error) {
      alert('Failed to add accident: ' + error.message);
    } else {
      onSuccess?.(data);
      onClose?.();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        placeholder="Incident ID"
        value={form.incident_id}
        onChange={e => setForm({ ...form, incident_id: e.target.value })}
        className="p-2 border rounded"
      />

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

      <select
        value={form.driver_id}
        onChange={e => setForm({ ...form, driver_id: e.target.value })}
        className="p-2 border rounded"
      >
        <option value="">Select driver</option>
        {drivers.map(d => (
          <option key={d.id} value={d.id}>{d.license_number}</option>
        ))}
      </select>

      <div className="grid grid-cols-2 gap-3">
        <input
          type="date"
          value={form.date}
          onChange={e => setForm({ ...form, date: e.target.value })}
          className="p-2 border rounded"
        />
        <input
          placeholder="Location"
          value={form.location}
          onChange={e => setForm({ ...form, location: e.target.value })}
          className="p-2 border rounded"
        />
      </div>

      <textarea
        placeholder="Damage"
        value={form.damage}
        onChange={e => setForm({ ...form, damage: e.target.value })}
        className="p-2 border rounded"
      />

      <input
        placeholder="Cause"
        value={form.cause}
        onChange={e => setForm({ ...form, cause: e.target.value })}
        className="p-2 border rounded"
      />

      <div className="grid grid-cols-2 gap-3">
        <select
          value={form.status}
          onChange={e => setForm({ ...form, status: e.target.value })}
          className="p-2 border rounded"
        >
          <option>Under Review</option>
          <option>Filed</option>
          <option>Resolved</option>
          <option>Rejected</option>
        </select>
        <input
          placeholder="Estimated cost"
          type="number"
          value={form.estimated_cost}
          onChange={e => setForm({ ...form, estimated_cost: e.target.value })}
          className="p-2 border rounded"
        />
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={!!form.insurance_claim}
          onChange={e => setForm({ ...form, insurance_claim: e.target.checked })}
        />
        <span className="text-sm">Insurance claim</span>
      </label>

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
          {loading ? 'Saving...' : 'Add Accident'}
        </button>
      </div>
    </form>
  );
}
