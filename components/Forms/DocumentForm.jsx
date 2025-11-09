'use client';
import { useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';

export default function DocumentForm({ onSuccess, onClose, initial = {} }) {
  const [form, setForm] = useState({
    vehicle_id: initial.vehicle_id || '',
    doc_type: initial.doc_type || '',
    name: initial.name || '',
    expiry_date: initial.expiry_date || '',
    status: initial.status || 'Current',
  });
  const [file, setFile] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load vehicles from Supabase
  useEffect(() => {
    async function loadVehicles() {
      const { data, error } = await supabaseClient
        .from('vehicles')
        .select('id, registration_number')
        .order('registration_number', { ascending: true });

      if (error) {
        console.error('Error fetching vehicles:', error);
      } else {
        setVehicles(data || []);
      }
    }
    loadVehicles();
  }, []);

  // Handle form submit
  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.vehicle_id || !form.name || !form.doc_type) {
      alert('Please fill in all required fields.');
      return;
    }

    if (!file) {
      alert('Please select a file to upload.');
      return;
    }

    setLoading(true);

    try {
      // ✅ Upload file to private bucket
      const filePath = `mfms_documents/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabaseClient.storage
        .from('Documents_Storage')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // ✅ Get current authenticated user
      const {
        data: { user },
        error: userError,
      } = await supabaseClient.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated.');

      // ✅ Find corresponding user in public.users table
      const { data: userRow, error: userLookupError } = await supabaseClient
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userLookupError || !userRow)
        throw new Error('User not found in users table.');

      // ✅ Insert document record
      const { data, error: insertError } = await supabaseClient
        .from('documents')
        .insert([
          {
            vehicle_id: form.vehicle_id,
            doc_type: form.doc_type,
            name: form.name,
            expiry_date: form.expiry_date || null,
            status: form.status,
            uploaded_by: userRow.id,
            storage_path: filePath,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      onSuccess?.(data);
      onClose?.();
    } catch (err) {
      console.error('Error uploading document:', err);
      alert('Failed to upload document: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      {/* Vehicle Selection */}
      <div>
        <label className="block text-sm font-medium text-green-700 mb-1">
          Select Vehicle
        </label>
        <select
          required
          value={form.vehicle_id}
          onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
          className="p-2 border border-green-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Select vehicle</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.registration_number}
            </option>
          ))}
        </select>
      </div>

      {/* Document Name */}
      <div>
        <label className="block text-sm font-medium text-green-700 mb-1">
          Document Name
        </label>
        <input
          placeholder="Enter document name"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="p-2 border border-green-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Document Type */}
      <div>
        <label className="block text-sm font-medium text-green-700 mb-1">
          Document Type
        </label>
        <input
          placeholder="e.g., License, Insurance, Registration"
          required
          value={form.doc_type}
          onChange={(e) => setForm({ ...form, doc_type: e.target.value })}
          className="p-2 border border-green-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-green-700 mb-1">
          Upload File
        </label>
        <input
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.png"
          onChange={(e) => setFile(e.target.files[0])}
          className="p-2 border border-green-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Expiry Date & Status */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-green-700 mb-1">
            Expiry Date
          </label>
          <input
            type="date"
            value={form.expiry_date}
            onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
            className="p-2 border border-green-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-green-700 mb-1">
            Status
          </label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="p-2 border border-green-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option>Current</option>
            <option>Expiring Soon</option>
            <option>Archived</option>
            <option>Active</option>
          </select>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 mt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-green-500 text-green-700 rounded hover:bg-green-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className={`px-4 py-2 bg-green-700 text-white rounded ${
            loading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-green-800'
          }`}
        >
          {loading ? 'Saving...' : 'Save Document'}
        </button>
      </div>
    </form>
  );
}
