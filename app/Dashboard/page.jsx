'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import SideBar from '@/components/SideBar';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    vehicles: 0,
    dueMaintenance: 0,
    incidents: 0,
    expiringLicenses: 0,
    fuelEfficiency: 0,
    fuelCost: 0,
    maintenanceCost: 0,
    upcomingMaintenance: [],
    expiringLicensesList: [],
    recentAccidents: [],
  });

  const router = useRouter();

  useEffect(() => {
    async function loadStats() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        router.push('/login');
        return;
      }

      const [vehicles, services, accidents, licenses, fuelLogs] = await Promise.all([
        supabase.from('vehicles').select('*'),
        supabase.from('services').select('*'),
        supabase.from('accidents').select('*'),
        supabase.from('licenses').select('*'),
        supabase.from('fuel_logs').select('*'),
      ]);

      const now = new Date();

      const upcomingMaintenance = services.data?.filter(s => {
        const date = new Date(s.upcoming_service_date);
        return date && date > now && (date - now) / (1000 * 60 * 60 * 24) <= 30;
      }) || [];

      const expiringLicensesList = licenses.data?.filter(l => {
        const date = new Date(l.expiry_date);
        return date && date > now && (date - now) / (1000 * 60 * 60 * 24) <= 30;
      }) || [];

      const recentAccidents = accidents.data?.slice(0, 3) || [];

      const fuelEfficiency =
        fuelLogs.data?.reduce((acc, log) => acc + (log.fuel_efficiency || 0), 0) /
        (fuelLogs.data?.length || 1);

      const fuelCost = fuelLogs.data?.reduce((acc, log) => acc + (log.fuel_cost || 0), 0);
      const maintenanceCost = services.data?.reduce((acc, s) => acc + (s.maintenance_cost || 0), 0);

      setStats({
        vehicles: vehicles.data?.length || 0,
        dueMaintenance: upcomingMaintenance.length,
        incidents: accidents.data?.length || 0,
        expiringLicenses: expiringLicensesList.length,
        fuelEfficiency: fuelEfficiency.toFixed(2),
        fuelCost: fuelCost.toFixed(2),
        maintenanceCost: maintenanceCost.toFixed(2),
        upcomingMaintenance,
        expiringLicensesList,
        recentAccidents,
      });
    }

    loadStats();
  }, []);

  return (
    <div className="min-h-screen flex bg-green-50">
      <SideBar />
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-green-800 mb-2">Fleet Management Dashboard</h1>
        <p className="text-green-700 mb-6 text-lg">Municipal fleet overview</p>

        {/* Top Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Vehicles" value={stats.vehicles} />
          <StatCard title="Due Maintenance" value={stats.dueMaintenance} />
          <StatCard title="Active Incidents" value={stats.incidents} />
          <StatCard title="Expiring Licenses" value={stats.expiringLicenses} />
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard title="Fuel Efficiency" value={`${stats.fuelEfficiency} L/100km`} />
          <StatCard title="Monthly Fuel Cost" value={`R ${Number(stats.fuelCost).toLocaleString()}`} />
          <StatCard title="Maintenance Cost" value={`R ${Number(stats.maintenanceCost).toLocaleString()}`} />
        </div>

        {/* Upcoming Maintenance */}
        <Section title="Upcoming Maintenance">
          {stats.upcomingMaintenance.map((item, i) => (
            <div key={i} className="bg-white p-4 rounded shadow mb-2 border-l-4 border-yellow-500">
              <p className="font-semibold text-green-800">
                {item.vehicle_id} - {item.notes || 'Scheduled'}
              </p>
              <p className="text-sm text-green-600">Due: {item.upcoming_service_date}</p>
            </div>
          ))}
        </Section>

        {/* Expiring Licenses */}
        <Section title="Expiring Licenses">
          {stats.expiringLicensesList.map((item, i) => (
            <div key={i} className="bg-white p-4 rounded shadow mb-2 border-l-4 border-red-500">
              <p className="font-semibold text-green-800">{item.vehicle_id}</p>
              <p className="text-sm text-green-600">Expiry Date: {item.expiry_date}</p>
            </div>
          ))}
          <a
            href="/dashboard/licenses"
            className="inline-block mt-4 text-green-700 hover:underline text-sm"
          >
            View All Licenses →
          </a>
        </Section>

        {/* Recent Accidents */}
        <Section title="Recent Accidents">
          {stats.recentAccidents.map((item, i) => (
            <div key={i} className="bg-white p-4 rounded shadow mb-2 border-l-4 border-gray-400">
              <p className="font-semibold text-green-800">{item.vehicle_id}</p>
              <p className="text-sm text-green-600">{item.description || 'Accident reported'}</p>
            </div>
          ))}
        </Section>
      </main>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow text-center border border-green-200 hover:shadow-lg transition">
      <h3 className="text-lg font-semibold text-green-700">{title}</h3>
      <p className="text-3xl font-bold text-green-900 mt-2">{value}</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-10">
      <h2 className="text-xl font-bold text-green-800 mb-4">{title}</h2>
      {children.length > 0 ? children : <p className="text-green-600">No records found.</p>}
    </div>
  );
}