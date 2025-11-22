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
  const [file, setFile] = useState(null);
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
      alert('Please fill all required fields.');
      return;
    }

    setLoading(true);

    try {
      let licensePaymentsPath = initial.license_payments || null;

      // Upload file if provided
      if (file) {
        const filePath = `license_payments/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        const { error: uploadError } = await supabaseClient.storage
          .from('Documents_Storage')
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;
        licensePaymentsPath = filePath;
      }

      const payload = {
        vehicle_id: form.vehicle_id,
        expiry_date: form.expiry_date,
        renewal_cost: parseFloat(form.renewal_cost),
        license_payments: licensePaymentsPath,
      };

      if (initial.id) {
        // Update existing license
        const { error } = await supabaseClient
          .from('licenses')
          .update(payload)
          .eq('id', initial.id);
        if (error) throw error;
      } else {
        // Insert new license
        const { error } = await supabaseClient.from('licenses').insert([payload]);
        if (error) throw error;
      }

      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error('Error saving license:', err.message);
      alert('Failed to save license: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
      {/* Vehicle Select */}
      <div>
        <label className="block text-sm font-medium text-green-700 mb-2">Vehicle *</label>
        <select
          className="w-full border border-green-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
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
        <label className="block text-sm font-medium text-green-700 mb-2">Expiry Date *</label>
        <input
          type="date"
          className="w-full border border-green-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          value={form.expiry_date}
          onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
          required
        />
      </div>

      {/* Renewal Cost */}
      <div>
        <label className="block text-sm font-medium text-green-700 mb-2">Renewal Cost (R) *</label>
        <input
          type="number"
          step="0.01"
          className="w-full border border-green-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          value={form.renewal_cost}
          onChange={(e) => setForm({ ...form, renewal_cost: e.target.value })}
          placeholder="0.00"
          required
        />
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-green-700 mb-2">Payment Receipt (PDF/Image)</label>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full border border-green-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        {file && <p className="text-sm text-green-600 mt-1">File selected: {file.name}</p>}
      </div>

      {/* Buttons */}
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
          <FaSave /> {loading ? 'Saving...' : (initial.id ? 'Update License' : 'Add License')}
        </button>
      </div>
    </form>
  );
}