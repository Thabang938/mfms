'use client';
import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';
import { FaSave } from 'react-icons/fa';

export default function LicenseForm({ initial = {}, onSuccess, onClose }) {
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState({
    vehicle_id: initial.vehicle_id || '',
    expiry_date: initial.expiry_date || '',
    renewal_cost: initial.renewal_cost || '',
  });
  const [loading, setLoading] = useState(false);

  // -------------------- Fetch Vehicles --------------------
  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabaseClient.from('vehicles').select('*').order('registration_number');
      if (error) throw error;
      setVehicles(data || []);
    } catch (err) {
      console.error('Error fetching vehicles:', err.message);
    }
  };

  // -------------------- Handle Submit --------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.vehicle_id || !form.expiry_date || !form.renewal_cost) {
      alert('Please fill all fields.');
      return;
    }

    try {
      setLoading(true);

      if (initial.id) {
        // Update existing license
        const { error } = await supabaseClient
          .from('licenses')
          .update({
            vehicle_id: form.vehicle_id,
            expiry_date: form.expiry_date,
            renewal_cost: parseFloat(form.renewal_cost),
          })
          .eq('id', initial.id);
        if (error) throw error;
      } else {
        // Insert new license
        const { error } = await supabaseClient.from('licenses').insert([{
          vehicle_id: form.vehicle_id,
          expiry_date: form.expiry_date,
          renewal_cost: parseFloat(form.renewal_cost),
        }]);
        if (error) throw error;
      }

      onSuccess?.();
    } catch (err) {
      console.error('Error saving license:', err.message);
      alert('Failed to save license: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Vehicle Select */}
      <div>
        <label className="block text-sm font-medium text-green-700 mb-1">Vehicle</label>
        <select
          className="w-full border rounded px-3 py-2"
          value={form.vehicle_id}
          onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
          required
        >
          <option value="">Select vehicle</option>
          {vehicles.map(v => (
            <option key={v.id} value={v.id}>
              {v.registration_number} — {v.make} {v.model}
            </option>
          ))}
        </select>
      </div>

      {/* Expiry Date */}
      <div>
        <label className="block text-sm font-medium text-green-700 mb-1">Expiry Date</label>
        <input
          type="date"
          className="w-full border rounded px-3 py-2"
          value={form.expiry_date}
          onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
          required
        />
      </div>

      {/* Renewal Cost */}
      <div>
        <label className="block text-sm font-medium text-green-700 mb-1">Renewal Cost (R)</label>
        <input
          type="number"
          className="w-full border rounded px-3 py-2"
          value={form.renewal_cost}
          onChange={(e) => setForm({ ...form, renewal_cost: e.target.value })}
          min={0}
          step="0.01"
          required
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 mt-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 flex items-center gap-2"
        >
          <FaSave /> {initial.id ? 'Update License' : 'Add License'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="bg-white border border-green-300 text-green-700 px-4 py-2 rounded hover:bg-green-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
