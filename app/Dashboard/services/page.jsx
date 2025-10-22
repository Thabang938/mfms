'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FaPlus } from 'react-icons/fa';
import SideBar from '@/components/SideBar';

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    async function fetchData() {
      const [serviceRes, vehicleRes] = await Promise.all([
        supabase.from('services').select('*'),
        supabase.from('vehicles').select('*'),
      ]);
      if (serviceRes.data) setServices(serviceRes.data);
      if (vehicleRes.data) setVehicles(vehicleRes.data);
    }
    fetchData();
  }, []);

  const getVehicleLabel = (id) => {
    const v = vehicles.find((v) => v.id === id);
    return v ? `${v.registration_number} - ${v.make} ${v.model}` : 'Unknown Vehicle';
  };

  const filteredServices = services.filter((s) => {
    if (activeTab === 'Scheduled') return s.status === 'Scheduled';
    if (activeTab === 'Completed') return s.status === 'Completed';
    return true;
  });

  const summary = {
    Scheduled: services.filter((s) => s.status === 'Scheduled').length,
    InProgress: services.filter((s) => s.status === 'In Progress').length,
    Overdue: services.filter((s) => {
      const date = new Date(s.service_date);
      return s.status !== 'Completed' && date < new Date();
    }).length,
  };

  return (
    <div className="min-h-screen flex bg-green-50">
      <SideBar />

      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-green-800">Service & Maintenance</h1>
          <button className="flex items-center bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 transition">
            <FaPlus className="mr-2" />
            Schedule Service
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <SummaryCard label="Scheduled" value={summary.Scheduled} color="yellow" />
          <SummaryCard label="In Progress" value={summary.InProgress} color="blue" />
          <SummaryCard label="Overdue" value={summary.Overdue} color="red" />
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-4">
          {['All', 'Scheduled', 'Completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded ${
                activeTab === tab
                  ? 'bg-green-700 text-white'
                  : 'bg-white text-green-700 border border-green-300'
              }`}
            >
              {tab} Services
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-white rounded shadow border border-green-200">
          <table className="min-w-full text-sm">
            <thead className="bg-green-100 text-green-800">
              <tr>
                <th className="px-4 py-2 text-left">Service ID</th>
                <th className="px-4 py-2 text-left">Vehicle</th>
                <th className="px-4 py-2 text-left">Service Date</th>
                <th className="px-4 py-2 text-left">Technician</th>
                <th className="px-4 py-2 text-left">Cost</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Notes</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map((s, i) => (
                <tr key={i} className="border-t border-green-100 hover:bg-green-50">
                  <td className="px-4 py-2">{s.id.slice(0, 8).toUpperCase()}</td>
                  <td className="px-4 py-2">{getVehicleLabel(s.vehicle_id)}</td>
                  <td className="px-4 py-2">{s.service_date}</td>
                  <td className="px-4 py-2">{s.technician || '—'}</td>
                  <td className="px-4 py-2">R {Number(s.maintenance_cost || s.cost || 0).toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        s.status === 'Completed'
                          ? 'bg-green-200 text-green-800'
                          : s.status === 'Scheduled'
                          ? 'bg-yellow-200 text-yellow-800'
                          : s.status === 'In Progress'
                          ? 'bg-blue-200 text-blue-800'
                          : 'bg-red-200 text-red-800'
                      }`}
                    >
                      {s.status || 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-2">{s.notes || '—'}</td>
                </tr>
              ))}
              {filteredServices.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-4 py-6 text-center text-green-600">
                    No service records found.
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

function SummaryCard({ label, value, color }) {
  const bg = {
    yellow: 'bg-yellow-100 text-yellow-800',
    blue: 'bg-blue-100 text-blue-800',
    red: 'bg-red-100 text-red-800',
  }[color];

  return (
    <div className={`p-6 rounded shadow border border-green-200 ${bg}`}>
      <h3 className="text-lg font-semibold">{label}</h3>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}