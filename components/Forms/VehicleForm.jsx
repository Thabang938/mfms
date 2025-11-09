'use client';
import { useState } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';
import { FaUpload, FaSpinner } from 'react-icons/fa';

export default function VehicleForm({ onSuccess, onClose, initial = {} }) {
  const [form, setForm] = useState({
    registration_number: initial.registration_number || '',
    make: initial.make || '',
    model: initial.model || '',
    year: initial.year || '',
    vin: initial.vin || '',
    fuel_type: initial.fuel_type || '',
    department: initial.department || '',
    odometer: initial.odometer || '',
    status: initial.status || 'Active',
    description: initial.description || '',
    vehicle_image: initial.vehicle_image || '',
  });

  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      let vehicleImage = form.vehicle_image;

      // Upload image if provided
      if (file) {
        setUploading(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `vehicle_${Date.now()}.${fileExt}`;
        const filePath = `vehicles/${fileName}`;

        const { error: uploadError } = await supabaseClient.storage
          .from('Documents_Storage')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        vehicleImage = filePath;
        setUploading(false);
      }

      const vehicleData = {
        ...form,
        vehicle_image: vehicleImage || null,
        year: form.year ? parseInt(form.year) : null,
        odometer: form.odometer ? parseInt(form.odometer) : null,
      };

      let result;
      if (initial.id) {
        result = await supabaseClient
          .from('vehicles')
          .update(vehicleData)
          .eq('id', initial.id);
      } else {
        result = await supabaseClient.from('vehicles').insert([vehicleData]);
      }

      if (result.error) throw result.error;
      if (onSuccess) onSuccess();
    } catch (err) {
      alert(`Error: ${err.message}`);
      console.error('Vehicle form submission error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Registration */}
      <div>
        <label className="block text-sm font-medium text-green-700 mb-1">Registration Number</label>
        <input
          required
          value={form.registration_number}
          onChange={(e) => setForm({ ...form, registration_number: e.target.value })}
          className="w-full border rounded p-2 focus:ring-2 focus:ring-green-200"
          placeholder="ABC1234"
        />
      </div>

      {/* Make & Model */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-green-700 mb-1">Make</label>
          <input
            required
            value={form.make}
            onChange={(e) => setForm({ ...form, make: e.target.value })}
            className="w-full border rounded p-2 focus:ring-2 focus:ring-green-200"
            placeholder="Toyota"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-green-700 mb-1">Model</label>
          <input
            required
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
            className="w-full border rounded p-2 focus:ring-2 focus:ring-green-200"
            placeholder="Corolla"
          />
        </div>
      </div>

      {/* Year & VIN */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-green-700 mb-1">Year</label>
          <input
            type="number"
            value={form.year}
            onChange={(e) => setForm({ ...form, year: e.target.value })}
            className="w-full border rounded p-2 focus:ring-2 focus:ring-green-200"
            placeholder="2020"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-green-700 mb-1">VIN</label>
          <input
            value={form.vin}
            onChange={(e) => setForm({ ...form, vin: e.target.value })}
            className="w-full border rounded p-2 focus:ring-2 focus:ring-green-200"
            placeholder="Vehicle Identification Number"
          />
        </div>
      </div>

      {/* Fuel & Odometer */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-green-700 mb-1">Fuel Type</label>
          <input
            value={form.fuel_type}
            onChange={(e) => setForm({ ...form, fuel_type: e.target.value })}
            className="w-full border rounded p-2 focus:ring-2 focus:ring-green-200"
            placeholder="Petrol, Diesel, Electric..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-green-700 mb-1">Odometer (km)</label>
          <input
            type="number"
            value={form.odometer}
            onChange={(e) => setForm({ ...form, odometer: e.target.value })}
            className="w-full border rounded p-2 focus:ring-2 focus:ring-green-200"
            placeholder="12000"
          />
        </div>
      </div>

      {/* Department & Status */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-green-700 mb-1">Department</label>
          <input
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            className="w-full border rounded p-2 focus:ring-2 focus:ring-green-200"
            placeholder="Fleet, Logistics..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-green-700 mb-1">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full border rounded p-2 focus:ring-2 focus:ring-green-200"
          >
            <option value="Active">Active</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Incident">Incident</option>
            <option value="Retired">Retired</option>
          </select>
        </div>
      </div>

      {/* Vehicle Description */}
      <div>
        <label className="block text-sm font-medium text-green-700 mb-1">Vehicle Description</label>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full border rounded p-2 focus:ring-2 focus:ring-green-200"
          placeholder="Short description or notes about this vehicle"
        />
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-green-700 mb-1">Vehicle Image (optional)</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full text-sm text-green-700"
        />
        {form.vehicle_image && (
          <p className="text-xs text-green-600 mt-1">Existing image: {form.vehicle_image}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || uploading}
          className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 flex items-center gap-2"
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin" /> Saving...
            </>
          ) : (
            <>
              <FaUpload /> {initial.id ? 'Update Vehicle' : 'Add Vehicle'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
