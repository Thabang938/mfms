'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import SideBar from '@/components/SideBar';
import { FaPlus } from 'react-icons/fa';

export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const [driverRes, userRes, vehicleRes, incidentRes] = await Promise.all([
        supabase.from('drivers').select('*'),
        supabase.from('users').select('*').eq('role', 'Driver'),
        supabase.from('vehicles').select('*'),
        supabase.from('accidents').select('*'),
      ]);
      if (driverRes.data) setDrivers(driverRes.data);
      if (userRes.data) setUsers(userRes.data);
      if (vehicleRes.data) setVehicles(vehicleRes.data);
      if (incidentRes.data) setIncidents(incidentRes.data);
    }
    fetchData();
  }, []);

  const getUserName = (id) => {
    const user = users.find((u) => u.id === id);
    return user?.name || 'Unknown';
  };

  const getVehicleLabel = (id) => {
    const v = vehicles.find((v) => v.id === id);
    return v ? `MV-${v.registration_number} - ${v.make}` : 'Unassigned';
  };

  const summary = {
    total: drivers.length,
    active: drivers.filter((d) => d.status === 'Active').length,
    training: drivers.filter((d) => d.status === 'In Training').length,
    incidents: incidents.length,
  };

  return (
    <div className="min-h-screen flex bg-green-50">
      <SideBar />

      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-green-800">Driver Management</h1>
          <button className="flex items-center bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 transition">
            <FaPlus className="mr-2" />
            Register Driver
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <SummaryCard label="Total Drivers" value={summary.total} />
          <SummaryCard label="Active" value={summary.active} />
          <SummaryCard label="In Training" value={summary.training} />
          <SummaryCard label="Total Incidents" value={summary.incidents} />
        </div>

        {/* Driver Registry Table */}
        <div className="overflow-x-auto bg-white rounded shadow border border-green-200">
          <table className="min-w-full text-sm">
            <thead className="bg-green-100 text-green-800">
              <tr>
                <th className="px-4 py-2 text-left">Driver ID</th>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">License Number</th>
                <th className="px-4 py-2 text-left">Department</th>
                <th className="px-4 py-2 text-left">Assigned Vehicle</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Expiry Date</th>
                <th className="px-4 py-2 text-left">View</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d, i) => (
                <tr key={i} className="border-t border-green-100 hover:bg-green-50">
                  <td className="px-4 py-2">{`DRV-${String(i + 1).padStart(3, '0')}`}</td>
                  <td className="px-4 py-2">{getUserName(d.user_id)}</td>
                  <td className="px-4 py-2">{d.license_number}</td>
                  <td className="px-4 py-2">{d.department}</td>
                  <td className="px-4 py-2">{getVehicleLabel(d.assigned_vehicle_id)}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        d.status === 'Active'
                          ? 'bg-green-200 text-green-800'
                          : d.status === 'In Training'
                          ? 'bg-yellow-200 text-yellow-800'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">{d.expiry_date}</td>
                  <td className="px-4 py-2">
                    <a
                      href={`/dashboard/drivers/${d.id}`}
                      className="text-green-700 hover:underline text-sm"
                    >
                      View
                    </a>
                  </td>
                </tr>
              ))}
              {drivers.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-4 py-6 text-center text-green-600">
                    No drivers found.
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
      <p className="text-3xl font-bold text-green-900 mt-2">{value}</p>
    </div>
  );
}