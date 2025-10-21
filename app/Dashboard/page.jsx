'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import SideBar from '@/components/SideBar';

export default function DashboardPage() {
  const [stats, setStats] = useState({ vehicles: 0, services: 0, licenses: 0, accidents: 0 });
  const router = useRouter();

  useEffect(() => {
    async function loadStats() {
      const user = await supabase.auth.getUser();
      if (!user.data?.user) {
        router.push('/Login');
        return;
      }

      const [v, s, l, a] = await Promise.all([
        supabase.from('vehicles').select('*'),
        supabase.from('services').select('*'),
        supabase.from('licenses').select('*'),
        supabase.from('accidents').select('*'),
      ]);

      setStats({
        vehicles: v.data?.length || 0,
        services: s.data?.length || 0,
        licenses: l.data?.filter((lic) => lic.payment_status !== 'Paid').length || 0,
        accidents: a.data?.length || 0,
      });
    }

    loadStats();
  }, []);

  return (
    <div className="min-h-screen flex bg-green-50">
      <SideBar />
      <main className="flex-1 p-10">
        <h1 className="text-3xl font-bold text-green-800 mb-2">Fleet Management Dashboard</h1>
        <p className="text-green-700 mb-8 text-lg">Overview of municipal fleet operations</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Vehicles" value={stats.vehicles} />
          <StatCard title="Service Records" value={stats.services} />
          <StatCard title="Pending Licenses" value={stats.licenses} />
          <StatCard title="Accident Reports" value={stats.accidents} />
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md text-center border border-green-200 hover:shadow-lg transition">
      <h3 className="text-lg font-semibold text-green-700">{title}</h3>
      <p className="text-4xl font-bold text-green-900 mt-2">{value}</p>
    </div>
  );
}