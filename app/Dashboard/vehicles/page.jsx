'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FaPlus, FaSearch } from 'react-icons/fa';
import SideBar from '@/components/SideBar';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchVehicles() {
      const { data, error } = await supabase.from('vehicles').select('*');
      if (!error) setVehicles(data);
    }
    fetchVehicles();
  }, []);

  const filteredVehicles = vehicles.filter((v) =>
    v.registration_number?.toLowerCase().includes(search.toLowerCase()) ||
    v.make?.toLowerCase().includes(search.toLowerCase()) ||
    v.model?.toLowerCase().includes(search.toLowerCase()) ||
    v.department?.toLowerCase().includes(search.toLowerCase()) ||
    v.vin?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex bg-green-50">
      <SideBar />

      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-green-800">
            All Vehicles ({filteredVehicles.length})
          </h1>
          <button className="flex items-center bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 transition">
            <FaPlus className="mr-2" />
            Add Vehicle
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center mb-6">
          <div className="relative w-full max-w-md">
            <FaSearch className="absolute top-3 left-3 text-green-600" />
            <input
              type="text"
              placeholder="Search by registration, make, model, VIN, department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Vehicle Table */}
        <div className="overflow-x-auto bg-white rounded shadow border border-green-200">
          <table className="min-w-full text-sm">
            <thead className="bg-green-100 text-green-800">
              <tr>
                <th className="px-4 py-2 text-left">Vehicle ID</th>
                <th className="px-4 py-2 text-left">Registration</th>
                <th className="px-4 py-2 text-left">Make/Model</th>
                <th className="px-4 py-2 text-left">Year</th>
                <th className="px-4 py-2 text-left">VIN</th>
                <th className="px-4 py-2 text-left">Department</th>
                <th className="px-4 py-2 text-left">Odometer</th>
                <th className="px-4 py-2 text-left">Fuel Type</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((v, i) => (
                <tr key={v.id} className="border-t border-green-100 hover:bg-green-50">
                  <td className="px-4 py-2">{`MV-${String(i + 1).padStart(3, '0')}`}</td>
                  <td className="px-4 py-2">{v.registration_number}</td>
                  <td className="px-4 py-2">{v.make} {v.model}</td>
                  <td className="px-4 py-2">{v.year}</td>
                  <td className="px-4 py-2">{v.vin}</td>
                  <td className="px-4 py-2">{v.department}</td>
                  <td className="px-4 py-2">{v.odometer?.toLocaleString()} km</td>
                  <td className="px-4 py-2">{v.fuel_type}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        v.status === 'Active'
                          ? 'bg-green-200 text-green-800'
                          : v.status === 'Maintenance'
                          ? 'bg-yellow-200 text-yellow-800'
                          : v.status === 'Incident'
                          ? 'bg-red-200 text-red-800'
                          : v.status === 'Retired'
                          ? 'bg-gray-200 text-gray-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {v.status || 'Unknown'}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredVehicles.length === 0 && (
                <tr>
                  <td colSpan="9" className="px-4 py-6 text-center text-green-600">
                    No vehicles found.
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