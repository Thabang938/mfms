// ...existing code...
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import SideBar from '@/components/SideBar';
import { FaPlus } from 'react-icons/fa';
import Modal from '@/components/Modal';
import LicenseForm from '@/components/forms/LicenseForm';
import dayjs from 'dayjs';

export default function LicensesPage() {
  const [licenses, setLicenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [loading, setLoading] = useState(false);

  async function fetchData() {
    setLoading(true);
    const [licenseRes, vehicleRes] = await Promise.all([
      supabase.from('licenses').select('*').order('expiry_date', { ascending: true }),
      supabase.from('vehicles').select('*'),
    ]);
    setLoading(false);
    if (licenseRes.data) setLicenses(licenseRes.data);
    if (vehicleRes.data) setVehicles(vehicleRes.data);
  }

  useEffect(() => { fetchData(); }, []);

  const getVehicleLabel = (id) => {
    const v = vehicles.find(v => v.id === id);
    return v ? `MV-${v.registration_number} - ${v.make}` : 'Unknown Vehicle';
  };

  const getDaysLeft = (expiry) => {
    if (!expiry) return '—';
    return dayjs(expiry).diff(dayjs(), 'day');
  };

  return (
    <div className="min-h-screen flex bg-green-50">
      <SideBar />
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-green-800">License Renewals</h1>
          <button onClick={() => setOpenAdd(true)} className="flex items-center bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 transition">
            <FaPlus className="mr-2" /> Record Renewal
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded shadow border border-green-200 text-center">
            <h3 className="text-lg font-semibold text-green-700">Total Licenses</h3>
            <p className="text-3xl font-bold text-green-900 mt-2">{licenses.length}</p>
          </div>
        </div>

        <div className="overflow-x-auto bg-white rounded shadow border border-green-200">
          <table className="min-w-full text-sm">
            <thead className="bg-green-100 text-green-800">
              <tr>
                <th className="px-4 py-2 text-left">Vehicle</th>
                <th className="px-4 py-2 text-left">Registration</th>
                <th className="px-4 py-2 text-left">Expiry Date</th>
                <th className="px-4 py-2 text-left">Days Left</th>
                <th className="px-4 py-2 text-left">Renewal Cost</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="6" className="px-6 py-8 text-center text-green-600">Loading licenses...</td></tr>}
              {!loading && licenses.length === 0 && <tr><td colSpan="6" className="px-6 py-8 text-center text-green-600">No license records found.</td></tr>}
              {!loading && licenses.map((l, i) => {
                const vehicle = vehicles.find(v => v.id === l.vehicle_id);
                const daysLeft = getDaysLeft(l.expiry_date);
                const statusLabel = typeof daysLeft === 'number' ? (daysLeft < 0 ? 'Urgent' : daysLeft <= 14 ? 'Due Soon' : 'Current') : '—';
                return (
                  <tr key={l.id || i} className="border-t hover:bg-green-50">
                    <td className="px-4 py-3">{vehicle ? `${vehicle.make} ${vehicle.model}` : 'Unknown'}</td>
                    <td className="px-4 py-3">{vehicle?.registration_number || '—'}</td>
                    <td className="px-4 py-3">{l.expiry_date || '—'}</td>
                    <td className="px-4 py-3">{typeof daysLeft === 'number' ? `${daysLeft} days` : '—'}</td>
                    <td className="px-4 py-3">R {l.renewal_cost?.toLocaleString() || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${statusLabel === 'Urgent' ? 'bg-red-200 text-red-800' : statusLabel === 'Due Soon' ? 'bg-orange-200 text-orange-800' : 'bg-blue-200 text-blue-800'}`}>{statusLabel}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>

      <Modal open={openAdd} onClose={() => setOpenAdd(false)} title="Add License">
        <LicenseForm onSuccess={() => { fetchData(); setOpenAdd(false); }} onClose={() => setOpenAdd(false)} />
      </Modal>
    </div>
  );
}
// ...existing code...