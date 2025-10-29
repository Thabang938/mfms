// ...existing code...
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import SideBar from '@/components/SideBar';
import { FaPlus } from 'react-icons/fa';
import Modal from '@/components/Modal';
import TireForm from '@/components/forms/TireForm';

export default function TiresPage() {
  const [tires, setTires] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [loading, setLoading] = useState(false);

  async function fetchData() {
    setLoading(true);
    const [tireRes, vehicleRes] = await Promise.all([
      supabase.from('tires').select('*').order('install_date', { ascending: false }),
      supabase.from('vehicles').select('*'),
    ]);
    setLoading(false);
    if (tireRes.data) setTires(tireRes.data);
    if (vehicleRes.data) setVehicles(vehicleRes.data);
  }

  useEffect(() => { fetchData(); }, []);

  const getVehicleLabel = (id) => {
    const v = vehicles.find(v => v.id === id);
    return v ? `${v.registration_number} - ${v.make}` : 'Unknown Vehicle';
  };

  const summary = {
    total: tires.length,
    good: tires.filter(t => t.condition === 'Good').length,
    fair: tires.filter(t => t.condition === 'Fair').length,
    replace: tires.filter(t => t.condition === 'Replace Soon').length,
  };

  return (
    <div className="min-h-screen flex bg-green-50">
      <SideBar />
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-green-800">Tyre Management</h1>
          <button onClick={() => setOpenAdd(true)} className="flex items-center bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 transition">
            <FaPlus className="mr-2" /> Record Tyre Change
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded shadow border border-green-200 text-center"><h3 className="text-lg font-semibold text-green-700">Total Tyres</h3><p className="text-3xl font-bold text-green-900 mt-2">{summary.total}</p></div>
          <div className="bg-white p-6 rounded shadow border border-green-200 text-center"><h3 className="text-lg font-semibold text-green-700">Good</h3><p className="text-3xl font-bold text-green-900 mt-2">{summary.good}</p></div>
          <div className="bg-white p-6 rounded shadow border border-green-200 text-center"><h3 className="text-lg font-semibold text-green-700">Fair</h3><p className="text-3xl font-bold text-green-900 mt-2">{summary.fair}</p></div>
          <div className="bg-white p-6 rounded shadow border border-green-200 text-center"><h3 className="text-lg font-semibold text-green-700">Replace Soon</h3><p className="text-3xl font-bold text-green-900 mt-2">{summary.replace}</p></div>
        </div>

        <div className="overflow-x-auto bg-white rounded shadow border border-green-200">
          <table className="min-w-full text-sm">
            <thead className="bg-green-100 text-green-800">
              <tr>
                <th className="px-4 py-2 text-left">Vehicle</th>
                <th className="px-4 py-2 text-left">Position</th>
                <th className="px-4 py-2 text-left">Brand</th>
                <th className="px-4 py-2 text-left">Serial Number</th>
                <th className="px-4 py-2 text-left">Install Date</th>
                <th className="px-4 py-2 text-left">Mileage</th>
                <th className="px-4 py-2 text-left">Pressure</th>
                <th className="px-4 py-2 text-left">Condition</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="8" className="px-6 py-8 text-center text-green-600">Loading tyres...</td></tr>}
              {!loading && tires.length === 0 && <tr><td colSpan="8" className="px-6 py-8 text-center text-green-600">No tyre records found.</td></tr>}
              {!loading && tires.map((tire, i) => (
                <tr key={tire.id || i} className="border-t hover:bg-green-50">
                  <td className="px-4 py-3">{getVehicleLabel(tire.vehicle_id)}</td>
                  <td className="px-4 py-3">{tire.position}</td>
                  <td className="px-4 py-3">{tire.brand}</td>
                  <td className="px-4 py-3">{tire.serial_number}</td>
                  <td className="px-4 py-3">{tire.install_date || '—'}</td>
                  <td className="px-4 py-3">{tire.mileage?.toLocaleString() ? `${tire.mileage.toLocaleString()} km` : '—'}</td>
                  <td className="px-4 py-3">{tire.pressure != null ? `${Number(tire.pressure).toFixed(2)} bar` : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${tire.condition === 'Good' ? 'bg-green-200 text-green-800' : tire.condition === 'Fair' ? 'bg-yellow-200 text-yellow-800' : 'bg-red-200 text-red-800'}`}>{tire.condition}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <Modal open={openAdd} onClose={() => setOpenAdd(false)} title="Record Tyre Change">
        <TireForm onSuccess={() => { fetchData(); setOpenAdd(false); }} onClose={() => setOpenAdd(false)} />
      </Modal>
    </div>
  );
}
// ...existing code...