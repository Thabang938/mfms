'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import SideBar from '@/components/SideBar';
import { FaPlus } from 'react-icons/fa';

export default function AccidentsPage() {
  const [accidents, setAccidents] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const [accidentRes, vehicleRes, driverRes] = await Promise.all([
        supabase.from('accidents').select('*'),
        supabase.from('vehicles').select('*'),
        supabase.from('drivers').select('*'),
      ]);
      if (accidentRes.data) setAccidents(accidentRes.data);
      if (vehicleRes.data) setVehicles(vehicleRes.data);
      if (driverRes.data) setDrivers(driverRes.data);
    }
    fetchData();
  }, []);

  const getVehicleLabel = (id) => {
    const v = vehicles.find((v) => v.id === id);
    return v ? `${v.make} ${v.model} (${v.year})` : 'Unknown Vehicle';
  };

  const getDriverName = (id) => {
    const d = drivers.find((d) => d.id === id);
    const user = d?.user_id ? d.user_id : null;
    return user || 'Unknown Driver';
  };

  const summary = {
    total: accidents.length,
    active: accidents.filter((a) => a.status === 'Under Review' || a.status === 'Filed').length,
    claims: accidents.filter((a) => a.insurance_claim).length,
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
          <button className="flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
            <FaPlus className="mr-2" />
            Report Accident
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <SummaryCard label="Total Incidents" value={summary.total} />
          <SummaryCard label="Active Cases" value={summary.active} />
          <SummaryCard label="Insurance Claims" value={summary.claims} />
          <SummaryCard label="Total Cost" value={`R ${summary.cost.toLocaleString()}`} />
        </div>

        {/* Incident Reports Table */}
        <div className="overflow-x-auto bg-white rounded shadow border border-green-200">
          <table className="min-w-full text-sm">
            <thead className="bg-green-100 text-green-800">
              <tr>
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Vehicle</th>
                <th className="px-4 py-2 text-left">Location</th>
                <th className="px-4 py-2 text-left">Driver</th>
                <th className="px-4 py-2 text-left">Damage</th>
                <th className="px-4 py-2 text-left">Cause</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Estimated Cost</th>
              </tr>
            </thead>
            <tbody>
              {accidents.map((a, i) => (
                <tr key={i} className="border-t border-green-100 hover:bg-green-50">
                  <td className="px-4 py-2">{a.incident_id}</td>
                  <td className="px-4 py-2">{a.date}</td>
                  <td className="px-4 py-2">{getVehicleLabel(a.vehicle_id)}</td>
                  <td className="px-4 py-2">{a.location}</td>
                  <td className="px-4 py-2">{getDriverName(a.driver_id)}</td>
                  <td className="px-4 py-2">{a.damage}</td>
                  <td className="px-4 py-2">{a.cause}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        a.status === 'Under Review'
                          ? 'bg-yellow-200 text-yellow-800'
                          : a.status === 'Filed'
                          ? 'bg-blue-200 text-blue-800'
                          : a.status === 'Resolved'
                          ? 'bg-green-200 text-green-800'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">R {a.estimated_cost?.toLocaleString()}</td>
                </tr>
              ))}
              {accidents.length === 0 && (
                <tr>
                  <td colSpan="9" className="px-4 py-6 text-center text-green-600">
                    No accident reports found.
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