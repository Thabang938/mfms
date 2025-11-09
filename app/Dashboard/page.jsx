'use client';
import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';
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
  FaWrench
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
      const { data: userData } = await supabaseClient.auth.getUser();
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
        supabaseClient.from('vehicles').select('*'),
        supabaseClient.from('services').select('*, vehicles(registration_number)'),
        supabaseClient.from('accidents').select('*'),
        supabaseClient.from('licenses').select('*, vehicles(registration_number)'),
        supabaseClient.from('fuel_logs').select('*'),
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

      const expiringLicensesList = (licensesRes.data || [])
        .filter(l => {
          const exp = new Date(l.expiry_date);
          return exp >= startOfMonth && exp <= endOfMonth;
        })
        .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date))
        .slice(0, 3); // limit to 3

      const upcomingMaintenance = (servicesRes.data || [])
        .filter(s => {
          const due = new Date(s.upcoming_service_date);
          return due >= now && due <= thirtyDaysFromNow;
        })
        .sort((a, b) => new Date(a.upcoming_service_date) - new Date(b.upcoming_service_date))
        .slice(0, 3); // limit to 3

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
  }, [router]);

  return (
    <div className="min-h-screen flex bg-green-50">
      <SideBar />
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-green-800">Fleet Management</h1>
            <p className="text-sm text-green-600">Overview of fleet health and operations</p>
          </div>
          {user && (
            <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded shadow border border-green-200">
              <FaUserCircle className="text-green-700 text-2xl" />
              <span className="text-green-800 font-medium text-sm">
                {user.user_metadata?.name || user.email}
              </span>
            </div>
          )}
        </div>

        {/* Top Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Vehicles" value={stats.vehicles} icon={<FaCar />} link="/Dashboard/vehicles" />
          <StatCard title="Due Maintenance" value={stats.dueMaintenance} icon={<FaTools />} link="/Dashboard/services" />
          <StatCard title="Active Incidents" value={stats.incidents} icon={<FaExclamationTriangle />} link="/Dashboard/accidents" />
          <StatCard title="Expiring Licenses" value={stats.expiringLicensesList.length} icon={<FaIdCard />} link="/Dashboard/licenses" />
        </div>

        {/* Cost Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard title="Monthly Fuel Cost" value={`R ${Number(stats.fuelCost).toLocaleString()}`} icon={<FaGasPump />} link="/Dashboard/fuel" />
          <StatCard title="Service Cost (This Month)" value={`R ${Number(stats.serviceCost).toLocaleString()}`} icon={<FaWrench />} link="/Dashboard/services" />
        </div>

        {/* Upcoming Maintenance & Expiring Licenses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Section title="Upcoming Maintenance" subtitle="Services due within the next 30 days" viewAllLink="/Dashboard/services">
            <div className="space-y-3">
              {stats.upcomingMaintenance.length > 0 ? (
                stats.upcomingMaintenance.map((item, i) => (
                  <div key={i} className="bg-white p-4 rounded shadow border border-green-100">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-green-800">{item.vehicles?.registration_number || '—'}</p>
                        <p className="text-sm text-green-600">{item.notes || 'Service'}</p>
                      </div>
                      <div className="text-sm text-gray-600">Due: {item.upcoming_service_date}</div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-green-600">No upcoming maintenance.</p>
              )}
            </div>
          </Section>

          <Section title="Expiring Licenses" subtitle="Licenses expiring this month" viewAllLink="/Dashboard/licenses">
            <div className="space-y-3">
              {stats.expiringLicensesList.length > 0 ? (
                stats.expiringLicensesList.map((item, i) => {
                  const daysLeft = Math.ceil(
                    (new Date(item.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div key={i} className="bg-white p-4 rounded shadow border border-green-100">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-green-800">{item.vehicles?.registration_number || '—'}</p>
                          <p className="text-sm text-green-600">{daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}</p>
                        </div>
                        <div className="text-sm text-gray-600">Expires: {item.expiry_date}</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-green-600">No expiring licenses this month.</p>
              )}
            </div>
          </Section>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, link }) {
  return (
    <Link href={link || '#'} className="block">
      <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition border border-green-200 flex flex-col items-start h-full">
        <div className="text-green-600 text-3xl mb-3">{icon}</div>
        <h3 className="text-lg font-semibold text-green-700">{title}</h3>
        <p className="text-2xl font-bold text-green-900 mt-2">{value}</p>
      </div>
    </Link>
  );
}

function Section({ title, subtitle, viewAllLink, children }) {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h2 className="text-lg font-bold text-green-800">{title}</h2>
          {subtitle && <p className="text-sm text-green-600">{subtitle}</p>}
        </div>
        {viewAllLink && (
          <Link href={viewAllLink}>
            <span className="text-sm text-green-700 hover:underline font-medium">View All</span>
          </Link>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}
