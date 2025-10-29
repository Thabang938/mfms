// ...existing code...
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import SideBar from '@/components/SideBar';
import { FaPlus } from 'react-icons/fa';
import Modal from '@/components/Modal';
import AccidentForm from '@/components/forms/AccidentForm';

export default function AccidentsPage() {
  const [accidents, setAccidents] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [loading, setLoading] = useState(false);

  async function fetchData() {
    setLoading(true);
    const [accidentRes, vehicleRes, driverRes] = await Promise.all([
      supabase.from('accidents').select('*').order('date', { ascending: false }),
      supabase.from('vehicles').select('*'),
      supabase.from('drivers').select('*'),
    ]);
    setLoading(false);
    if (accidentRes.data) setAccidents(accidentRes.data);
    if (vehicleRes.data) setVehicles(vehicleRes.data);
    if (driverRes.data) setDrivers(driverRes.data);
  }

  useEffect(() => { fetchData(); }, []);

  const getVehicleLabel = (id) => {
    const v = vehicles.find(v => v.id === id);
    return v ? `${v.make} ${v.model} (${v.year || '—'})` : 'Unknown Vehicle';
  };

  const getDriverName = (id) => {
    const d = drivers.find(d => d.id === id);
    return d ? d.license_number || d.id : 'Unknown Driver';
  };

  const summary = {
    total: accidents.length,
    active: accidents.filter(a => a.status === 'Under Review' || a.status === 'Filed').length,
    claims: accidents.filter(a => a.insurance_claim).length,
    cost: accidents.reduce((sum, a) => sum + (a.estimated_cost || 0), 0),
  };

  return (
    <div className="min-h-screen flex bg-green-50">
      <SideBar />
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-green-800">Accident Reporting</h1>
            <p className="text-green-700 text-sm">Track and manage vehicle incidents and claims</p>
          </div>
          <button onClick={() => setOpenAdd(true)} className="flex items-center bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 transition">
            <FaPlus className="mr-2" /> Report Accident
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded shadow border border-green-200 text-center"><h3 className="text-lg font-semibold text-green-700">Total Incidents</h3><p className="text-2xl font-bold text-green-900 mt-2">{summary.total}</p></div>
          <div className="bg-white p-6 rounded shadow border border-green-200 text-center"><h3 className="text-lg font-semibold text-green-700">Active Cases</h3><p className="text-2xl font-bold text-green-900 mt-2">{summary.active}</p></div>
        </div>

        <div className="overflow-x-auto bg-white rounded shadow border border-green-200">
          <table className="min-w-full text-sm">
            <thead className="bg-green-100 text-green-800">
              <tr>
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Vehicle</th>
                <th className="px-4 py-2 text-left">Location</th>
                <th className="px-4 py-2 text-left">Driver</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Estimated Cost</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="7" className="px-6 py-8 text-center text-green-600">Loading accident reports...</td></tr>}
              {!loading && accidents.length === 0 && <tr><td colSpan="7" className="px-6 py-8 text-center text-green-600">No accident reports found.</td></tr>}
              {!loading && accidents.map((a, i) => (
                <tr key={a.id || i} className="border-t hover:bg-green-50">
                  <td className="px-4 py-3">{a.incident_id || `INC-${i+1}`}</td>
                  <td className="px-4 py-3">{a.date || '—'}</td>
                  <td className="px-4 py-3">{getVehicleLabel(a.vehicle_id)}</td>
                  <td className="px-4 py-3">{a.location || '—'}</td>
                  <td className="px-4 py-3">{getDriverName(a.driver_id)}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-semibold ${a.status === 'Under Review' ? 'bg-yellow-200 text-yellow-800' : a.status === 'Filed' ? 'bg-blue-200 text-blue-800' : a.status === 'Resolved' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'}`}>{a.status}</span></td>
                  <td className="px-4 py-3">R {Number(a.estimated_cost || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <Modal open={openAdd} onClose={() => setOpenAdd(false)} title="Report Accident">
        <AccidentForm onSuccess={() => { fetchData(); setOpenAdd(false); }} onClose={() => setOpenAdd(false)} />
      </Modal>
    </div>
  );
}
// ...existing code...