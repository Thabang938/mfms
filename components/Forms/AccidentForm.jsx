// ...existing code...
'use client';
import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';
import { FaSave } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export default function AccidentForm({ initial = {}, onSuccess, onClose }) {
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
    insurance_claim: !!initial.insurance_claim,
    repair_date: initial.repair_date || '',
  });

  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [vRes, dRes] = await Promise.all([
          supabaseClient.from('vehicles').select('id, registration_number, make, model').order('registration_number'),
          supabaseClient.from('drivers').select('id, license_number, user_id'),
        ]);
        setVehicles(vRes.data || []);
        setDrivers(dRes.data || []);
      } catch (err) {
        console.error('AccidentForm load error:', err.message);
      }
    }
    load();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.vehicle_id || !form.date) {
      toast.error('Vehicle and date are required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        incident_id: form.incident_id || null,
        vehicle_id: form.vehicle_id,
        driver_id: form.driver_id || null,
        date: form.date || null,
        location: form.location || null,
        damage: form.damage || null,
        cause: form.cause || null,
        status: form.status || 'Under Review',
        estimated_cost: form.estimated_cost ? Number(form.estimated_cost) : null,
        insurance_claim: !!form.insurance_claim,
        repair_date: form.repair_date || null,
      };

      let record;
      if (initial.id) {
        const { data, error } = await supabaseClient.from('accidents').update(payload).eq('id', initial.id).select().single();
        if (error) throw error;
        record = data;
      } else {
        const { data, error } = await supabaseClient.from('accidents').insert([payload]).select().single();
        if (error) throw error;
        record = data;
      }

      // if file attached, upload to private bucket and insert documents row
      if (file) {
        const filePath = `accidents_reports/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        const { error: uploadErr } = await supabaseClient.storage.from('Documents_Storage').upload(filePath, file, { upsert: true });
        if (uploadErr) throw uploadErr;

        // get current public.users row for uploaded_by
        const { data: authData } = await supabaseClient.auth.getUser();
        const authUserId = authData?.user?.id;
        let uploadedBy = null;
        if (authUserId) {
          const { data: userRow } = await supabaseClient.from('users').select('id').eq('auth_id', authUserId).single();
          uploadedBy = userRow?.id || null;
        }

        await supabaseClient.from('documents').insert([{
          vehicle_id: form.vehicle_id || null,
          doc_type: 'Accident Report',
          name: file.name,
          file_url: null,
          storage_path: filePath,
          uploaded_by: uploadedBy,
        }]);
      }

      toast.success(initial.id ? 'Accident updated' : 'Accident reported');
      onSuccess?.(record);
      onClose?.();
    } catch (err) {
      console.error('AccidentForm submit error:', err.message);
      toast.error('Failed to save accident');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input placeholder="Incident ID" value={form.incident_id} onChange={e => setForm({ ...form, incident_id: e.target.value })} className="p-2 border rounded" />
        <select required value={form.vehicle_id} onChange={e => setForm({ ...form, vehicle_id: e.target.value })} className="p-2 border rounded">
          <option value="">Select vehicle</option>
          {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number} — {v.make}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <select value={form.driver_id} onChange={e => setForm({ ...form, driver_id: e.target.value })} className="p-2 border rounded">
          <option value="">Select driver (optional)</option>
          {drivers.map(d => <option key={d.id} value={d.id}>{d.license_number}</option>)}
        </select>

        <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="p-2 border rounded" />
      </div>

      <input placeholder="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="p-2 border rounded w-full" />
      <textarea placeholder="Damage" value={form.damage} onChange={e => setForm({ ...form, damage: e.target.value })} className="p-2 border rounded w-full" />
      <input placeholder="Cause" value={form.cause} onChange={e => setForm({ ...form, cause: e.target.value })} className="p-2 border rounded w-full" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input placeholder="Estimated cost (R)" type="number" value={form.estimated_cost} onChange={e => setForm({ ...form, estimated_cost: e.target.value })} className="p-2 border rounded" />
        <input type="date" value={form.repair_date} onChange={e => setForm({ ...form, repair_date: e.target.value })} className="p-2 border rounded" />
      </div>

      <label className="flex items-center gap-2">
        <input type="checkbox" checked={form.insurance_claim} onChange={e => setForm({ ...form, insurance_claim: e.target.checked })} />
        <span className="text-sm">Insurance claim</span>
      </label>

      <div>
        <label className="block text-sm text-green-700 mb-1">Upload Accident Report (optional)</label>
        <input type="file" accept=".pdf,image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
      </div>

      <div className="flex justify-end gap-3 mt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 border rounded text-green-700">Cancel</button>
        <button type="submit" disabled={loading} className="px-4 py-2 bg-green-700 text-white rounded flex items-center gap-2">
          <FaSave /> {loading ? 'Saving...' : (initial.id ? 'Update Accident' : 'Add Accident')}
        </button>
      </div>
    </form>
  );
}