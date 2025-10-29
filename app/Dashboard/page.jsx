'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SideBar from '@/components/SideBar';
import {
  FaUserCircle,
  FaCar,
  FaTools,
  FaExclamationTriangle,
  FaIdCard,
  FaGasPump,
  FaWrench,
} from 'react-icons/fa';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    vehicles: 0,
    dueMaintenance: 0,
    incidents: 0,
    serviceCost: 0,
    fuelCost: 0,
    expiringLicensesList: [],
    upcomingMaintenance: [],
  });

  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function loadStats() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        router.push('/Login');
        return;
      }

      setUser(userData.user);

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const [vehiclesRes, servicesRes, accidentsRes, licensesRes, fuelRes] = await Promise.all([
        supabase.from('vehicles').select('*'),
        supabase.from('services').select('*, vehicles(make, model, registration_number)'),
        supabase.from('accidents').select('*'),
        supabase.from('licenses').select('*, vehicles(make, model, registration_number)'),
        supabase.from('fuel_logs').select('*'),
      ]);

      const dueMaintenance = servicesRes.data?.filter(s => s.status === 'Scheduled') || [];
      const activeIncidents = accidentsRes.data?.filter(a => a.status === 'Under Review') || [];

      const serviceCost = servicesRes.data
        ?.filter(s => {
          const date = new Date(s.service_date);
          return date >= startOfMonth && date <= endOfMonth;
        })
        .reduce((sum, s) => sum + (s.cost || 0), 0) || 0;

      const fuelCost = fuelRes.data
        ?.filter(f => {
          const date = new Date(f.purchase_date);
          return date >= startOfMonth && date <= endOfMonth;
        })
        .reduce((sum, f) => sum + (f.cost || 0), 0) || 0;

      const expiringLicensesList = licensesRes.data?.filter(l => {
        const exp = new Date(l.expiry_date);
        return exp >= startOfMonth && exp <= endOfMonth;
      }) || [];

      const upcomingMaintenance = servicesRes.data?.filter(s => {
        const due = new Date(s.upcoming_service_date);
        return due >= now && due <= thirtyDaysFromNow;
      }) || [];

      setStats({
        vehicles: vehiclesRes.data?.length || 0,
        dueMaintenance: dueMaintenance.length,
        incidents: activeIncidents.length,
        serviceCost: serviceCost.toFixed(2),
        fuelCost: fuelCost.toFixed(2),
        expiringLicensesList,
        upcomingMaintenance,
      });
    }

    loadStats();
  }, []);

  return (
    <div className="min-h-screen flex bg-green-50">
      <SideBar />
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-green-800">Fleet Management System</h1>
          {user && (
            <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded shadow border border-green-200">
              <FaUserCircle className="text-green-700 text-2xl" />
              <span className="text-green-800 font-medium text-sm">
                {user.user_metadata?.name || user.email}
              </span>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Vehicles" value={stats.vehicles} icon={<FaCar />} />
          <StatCard title="Due Maintenance" value={stats.dueMaintenance} icon={<FaTools />} />
          <StatCard title="Active Incidents" value={stats.incidents} icon={<FaExclamationTriangle />} />
          <StatCard title="Expiring Licenses" value={stats.expiringLicensesList.length} icon={<FaIdCard />} />
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard title="Monthly Fuel Cost" value={`R ${Number(stats.fuelCost).toLocaleString()}`} icon={<FaGasPump />} />
          <StatCard title="Service Cost (This Month)" value={`R ${Number(stats.serviceCost).toLocaleString()}`} icon={<FaWrench />} />
        </div>

        {/* Upcoming Maintenance */}
        <Section title="Upcoming Maintenance" subtitle="Services due within the next 30 days" viewAllLink="/Dashboard/services">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.upcomingMaintenance.map((item, i) => {
              const statusColor =
                item.status === 'Due Soon' ? 'border-red-500 text-red-600' : 'border-blue-500 text-blue-600';
              return (
                <div key={i} className={`bg-white p-4 rounded shadow border-l-4 ${statusColor}`}>
                  <p className="font-semibold text-green-800">
                    {item.vehicles?.registration_number} - {item.vehicles?.make} {item.vehicles?.model}
                  </p>
                  <p className="text-sm">{item.notes || item.parts_replaced || 'Service'} • {item.status}</p>
                  <p className="text-sm">Due: {item.upcoming_service_date}</p>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Expiring Licenses */}
        <Section title="Expiring Licenses" subtitle="Licenses expiring this month" viewAllLink="/Dashboard/licenses">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.expiringLicensesList.map((item, i) => {
              const daysLeft = Math.ceil(
                (new Date(item.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );
              return (
                <div key={i} className="bg-white p-4 rounded shadow border-l-4 border-red-500">
                  <p className="font-semibold text-green-800">
                    {item.vehicles?.registration_number} - {item.vehicles?.make} {item.vehicles?.model}
                  </p>
                  <p className="text-sm text-green-600">
                    {daysLeft > 0 ? `${daysLeft} days left` : `Expired`}
                  </p>
                  <p className="text-sm">Expires: {item.expiry_date}</p>
                </div>
              );
            })}
          </div>
        </Section>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow text-center border border-green-200 hover:shadow-lg transition flex flex-col items-center">
      <div className="text-green-600 text-3xl mb-2">{icon}</div>
      <h3 className="text-lg font-semibold text-green-700">{title}</h3>
      <p className="text-3xl font-bold text-green-900 mt-2">{value}</p>
    </div>
  );
}

function Section({ title, subtitle, viewAllLink, children }) {
  return (
    <div className="mb-10">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-green-800">{title}</h2>
          {subtitle && <p className="text-sm text-green-600">{subtitle}</p>}
        </div>
        {viewAllLink && (
          <Link href={viewAllLink}>
            <span className="text-sm text-green-700 hover:underline font-medium">View All</span>
          </Link>
        )}
      </div>
      {children.length > 0 ? children : <p className="text-green-600">No records found.</p>}
    </div>
  );
}