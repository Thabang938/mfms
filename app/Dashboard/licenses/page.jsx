'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import SideBar from '@/components/SideBar';
import { FaPlus } from 'react-icons/fa';
import dayjs from 'dayjs';

export default function LicensesPage() {
  const [licenses, setLicenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const [licenseRes, vehicleRes] = await Promise.all([
        supabase.from('licenses').select('*'),
        supabase.from('vehicles').select('*'),
      ]);
      if (licenseRes.data) setLicenses(licenseRes.data);
      if (vehicleRes.data) setVehicles(vehicleRes.data);
    }
    fetchData();
  }, []);

  const getVehicleLabel = (id) => {
    const v = vehicles.find((v) => v.id === id);
    return v ? `MV-${v.registration_number} - ${v.make}` : 'Unknown Vehicle';
  };

  const getDaysLeft = (expiry) => {
    const today = dayjs();
    const exp = dayjs(expiry);
    return exp.diff(today, 'day');
  };

  const getStatusLabel = (daysLeft) => {
    if (daysLeft < 0) return 'Urgent';
    if (daysLeft <= 14) return 'Due Soon';
    return 'Current';
  };

  const summary = {
    total: licenses.length,
    urgent: licenses.filter((l) => getDaysLeft(l.expiry_date) < 0).length,
    dueSoon: licenses.filter((l) => getDaysLeft(l.expiry_date) >= 0 && getDaysLeft(l.expiry_date) <= 14).length,
    current: licenses.filter((l) => getDaysLeft(l.expiry_date) > 14).length,
  };

  return (
    <div className="min-h-screen flex bg-green-50">
      <SideBar />

      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-green-800">License Renewals</h1>
          <button className="flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
            <FaPlus className="mr-2" />
            Record Renewal
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <SummaryCard label="Total Vehicles" value={summary.total} />
          <SummaryCard label="Urgent" value={summary.urgent} />
          <SummaryCard label="Due Soon" value={summary.dueSoon} />
          <SummaryCard label="Current" value={summary.current} />
        </div>

        {/* License Status Table */}
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
                <th className="px-4 py-2 text-left">Manage</th>
              </tr>
            </thead>
            <tbody>
              {licenses.map((l, i) => {
                const vehicle = vehicles.find((v) => v.id === l.vehicle_id);
                const daysLeft = getDaysLeft(l.expiry_date);
                const status = getStatusLabel(daysLeft);
                return (
                  <tr key={i} className="border-t border-green-100 hover:bg-green-50">
                    <td className="px-4 py-2">{vehicle ? `${vehicle.make} ${vehicle.model}` : 'Unknown'}</td>
                    <td className="px-4 py-2">{vehicle?.registration_number || '—'}</td>
                    <td className="px-4 py-2">{l.expiry_date}</td>
                    <td className="px-4 py-2">{daysLeft} days</td>
                    <td className="px-4 py-2">R {l.renewal_cost?.toLocaleString()}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          status === 'Urgent'
                            ? 'bg-red-200 text-red-800'
                            : status === 'Due Soon'
                            ? 'bg-orange-200 text-orange-800'
                            : 'bg-blue-200 text-blue-800'
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <button className="text-green-700 hover:underline text-sm">Manage</button>
                    </td>
                  </tr>
                );
              })}
              {licenses.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-4 py-6 text-center text-green-600">
                    No license records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="bg-white p-6 rounded shadow border border-green-200 text-center">
      <h3 className="text-lg font-semibold text-green-700">{label}</h3>
      <p className="text-2xl font-bold text-green-900 mt-2">{value}</p>
    </div>
  );
}