'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import SideBar from '@/components/SideBar';
import { FaPlus } from 'react-icons/fa';

export default function FuelPage() {
  const [fuelLogs, setFuelLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const [fuelRes, vehicleRes] = await Promise.all([
        supabase.from('fuel_logs').select('*'),
        supabase.from('vehicles').select('*'),
      ]);
      if (fuelRes.data) setFuelLogs(fuelRes.data);
      if (vehicleRes.data) setVehicles(vehicleRes.data);
    }
    fetchData();
  }, []);

  const getVehicleLabel = (id) => {
    const v = vehicles.find((v) => v.id === id);
    return v ? `MV-${v.registration_number} - ${v.make}` : 'Unknown Vehicle';
  };

  const summary = {
    monthlyCost: fuelLogs.reduce((sum, log) => sum + (log.cost || 0), 0),
    avgFuelPrice: fuelLogs.length
      ? fuelLogs.reduce((sum, log) => sum + (log.cost / log.liters), 0) / fuelLogs.length
      : 0,
    totalLiters: fuelLogs.reduce((sum, log) => sum + (log.liters || 0), 0),
    fleetEfficiency: fuelLogs.length
      ? fuelLogs.reduce((sum, log) => sum + (log.liters || 0), 0) / fuelLogs.length
      : 0,
  };

  return (
    <div className="min-h-screen flex bg-green-50">
      <SideBar />

      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-green-800">Fuel Tracking</h1>
          <button className="flex items-center bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 transition">
            <FaPlus className="mr-2" />
            Add Fuel Record
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <SummaryCard label="Monthly Cost" value={`R ${summary.monthlyCost.toLocaleString()}`} />
          <SummaryCard label="Avg Fuel Price" value={`R ${summary.avgFuelPrice.toFixed(2)}/L`} />
          <SummaryCard label="Fleet Efficiency" value={`${summary.fleetEfficiency.toFixed(1)} L/100km`} />
          <SummaryCard label="Total Liters" value={`${summary.totalLiters.toLocaleString()} L`} />
        </div>

        {/* Fuel Purchase Records Table */}
        <div className="overflow-x-auto bg-white rounded shadow border border-green-200">
          <table className="min-w-full text-sm">
            <thead className="bg-green-100 text-green-800">
              <tr>
                <th className="px-4 py-2 text-left">Transaction ID</th>
                <th className="px-4 py-2 text-left">Vehicle</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Liters</th>
                <th className="px-4 py-2 text-left">Cost</th>
                <th className="px-4 py-2 text-left">Odometer</th>
                <th className="px-4 py-2 text-left">Fuel Type</th>
                <th className="px-4 py-2 text-left">Station</th>
                <th className="px-4 py-2 text-left">View</th>
              </tr>
            </thead>
            <tbody>
              {fuelLogs.map((log, i) => (
                <tr key={i} className="border-t border-green-100 hover:bg-green-50">
                  <td className="px-4 py-2">{log.transaction_id || `FUEL-${i + 1}`}</td>
                  <td className="px-4 py-2">{getVehicleLabel(log.vehicle_id)}</td>
                  <td className="px-4 py-2">{log.purchase_date}</td>
                  <td className="px-4 py-2">{log.liters} L</td>
                  <td className="px-4 py-2">R {log.cost?.toLocaleString()}</td>
                  <td className="px-4 py-2">{log.odometer} km</td>
                  <td className="px-4 py-2">{log.fuel_type}</td>
                  <td className="px-4 py-2">{log.station}</td>
                  <td className="px-4 py-2">
                    <a
                      href={`/dashboard/fuel/${log.id}`}
                      className="text-green-700 hover:underline text-sm"
                    >
                      View
                    </a>
                  </td>
                </tr>
              ))}
              {fuelLogs.length === 0 && (
                <tr>
                  <td colSpan="9" className="px-4 py-6 text-center text-green-600">
                    No fuel records found.
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