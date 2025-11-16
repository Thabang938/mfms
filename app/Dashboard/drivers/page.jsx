'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';
import SideBar from '@/components/SideBar';
import Modal from '@/components/Modal';
import DriverForm from '@/components/Forms/DriverForm';
import { FaPlus, FaSearch, FaChevronLeft, FaChevronRight, FaFileExport, FaUser } from 'react-icons/fa';
import { Toaster } from 'react-hot-toast';

export default function DriversPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  const [drivers, setDrivers] = useState([]);
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [loading, setLoading] = useState(false);

  // Table controls
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabaseClient.auth.getSession();
      setSession(session);
      setLoadingSession(false);
    };
    check();
    const { data: listener } = supabaseClient.auth.onAuthStateChange((_e, s) => {
      if (!s) router.push('/Login');
    });
    return () => listener.subscription.unsubscribe();
  }, [router]);

  async function fetchData() {
    if (!session) return;
    setLoading(true);
    try {
      const [vRes, uRes, dRes] = await Promise.all([
        supabaseClient.from('vehicles').select('id, registration_number, make, model'),
        supabaseClient.from('users').select('id, name, role, user_image'),
        supabaseClient.from('drivers').select('*').order('license_number', { ascending: true }),
      ]);
      if (vRes.error) throw vRes.error;
      if (uRes.error) throw uRes.error;
      if (dRes.error) throw dRes.error;
      setVehicles(vRes.data || []);
      setUsers(uRes.data || []);
      setDrivers(dRes.data || []);
    } catch (err) {
      console.error('Error fetching drivers data:', err.message);
      setDrivers([]);
      setUsers([]);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, [session]);

  const getUserName = (userId) => {
    return users.find(u => u.id === userId)?.name || '—';
  };

  const getVehicleLabel = (id) => {
    const v = vehicles.find(vv => vv.id === id);
    return v ? `MV-${v.registration_number}` : 'Unassigned';
  };

  const filtered = useMemo(() => {
    let list = drivers.slice();
    if (statusFilter) list = list.filter(d => d.status === statusFilter);
    if (departmentFilter) list = list.filter(d => d.department === departmentFilter);
    if (!search) return list;
    const q = search.trim().toLowerCase();
    return list.filter(d => {
      const userName = getUserName(d.user_id);
      const vehicleLabel = getVehicleLabel(d.assigned_vehicle_id);
      return `${userName} ${d.license_number || ''} ${d.department || ''} ${vehicleLabel}`.toLowerCase().includes(q);
    });
  }, [drivers, users, vehicles, search, statusFilter, departmentFilter]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  useEffect(() => { if (page > pageCount) setPage(1); }, [pageCount]);
  const paged = useMemo(() => filtered.slice((page - 1) * perPage, page * perPage), [filtered, page, perPage]);

  const summary = useMemo(() => ({
    total: drivers.length,
    active: drivers.filter(d => d.status === 'Active').length,
    training: drivers.filter(d => d.status === 'In Training').length,
    unassigned: drivers.filter(d => !d.assigned_vehicle_id).length,
  }), [drivers]);

  const handleExport = () => {
    const headers = ['Driver Name', 'License', 'Department', 'Vehicle', 'Status'];
    const rows = filtered.map(d => [
      getUserName(d.user_id),
      d.license_number || '',
      d.department || '',
      getVehicleLabel(d.assigned_vehicle_id),
      d.status || ''
    ]);
    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'drivers_export.csv');
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex bg-green-50">
      <Toaster position="top-right" />
      <SideBar />
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-green-800">Driver Management</h1>
            <p className="text-sm text-green-600">Register drivers, assign vehicles, and monitor status.</p>
          </div>

          <div className="flex gap-3">
            <button onClick={handleExport} className="flex items-center gap-2 bg-white border border-green-700 text-green-700 px-4 py-2 rounded hover:bg-green-100 transition"><FaFileExport /> Export</button>
            <button onClick={() => setOpenAdd(true)} className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 transition"><FaPlus /> Register Driver</button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard title="Total Drivers" value={summary.total} />
          <StatCard title="Active" value={summary.active} />
          <StatCard title="In Training" value={summary.training} />
          <StatCard title="Unassigned" value={summary.unassigned} />
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-green-400" />
            <input aria-label="Search drivers" className="pl-10 pr-4 py-2 border rounded-md w-full md:w-64 focus:ring-2 focus:ring-green-200 bg-white" placeholder="Search name, license, vehicle..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>

          <div className="flex items-center gap-3">
            <select className="px-3 py-2 border rounded bg-white text-sm" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All statuses</option>
              <option value="Active">Active</option>
              <option value="In Training">In Training</option>
              <option value="Suspended">Suspended</option>
            </select>

            <select className="px-3 py-2 border rounded bg-white text-sm" value={departmentFilter} onChange={e => { setDepartmentFilter(e.target.value); setPage(1); }}>
              <option value="">All departments</option>
              {[...new Set(drivers.map(d => d.department).filter(Boolean))].map(dep => <option key={dep} value={dep}>{dep}</option>)}
            </select>
          </div>
        </div>

        {/* Driver Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && <div className="col-span-full text-center text-green-600 py-12">Loading drivers...</div>}
          {!loading && paged.length === 0 && <div className="col-span-full text-center text-green-600 py-12">No drivers found.</div>}
          {!loading && paged.map((d, i) => {
            const userRow = users.find(u => u.id === d.user_id);
            return (
              <div key={d.id || i} className="bg-white border border-green-200 rounded-lg p-4 shadow hover:shadow-lg transition flex flex-col cursor-pointer" onClick={() => router.push(`/Dashboard/drivers/${d.id}`)}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-green-700 font-semibold">{userRow?.name || '—'}</div>
                  {userRow?.user_image ? <img src={userRow.user_image} alt={userRow.name} className="w-8 h-8 rounded-full object-cover" /> : <FaUser className="text-green-500 text-xl" />}
                </div>
                <div className="text-sm text-green-600 mb-1">License: {d.license_number || '—'}</div>
                <div className="text-sm text-green-600 mb-1">Department: {d.department || '—'}</div>
                <div className="text-sm text-green-600 mb-1">Vehicle: {getVehicleLabel(d.assigned_vehicle_id)}</div>
                <div className="mt-3">
                  <span className={`mt-2 px-2 py-1 rounded text-xs font-semibold ${d.status === 'Active' ? 'bg-green-200 text-green-800' : d.status === 'In Training' ? 'bg-yellow-200 text-yellow-800' : d.status === 'Suspended' ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-800'}`}>{d.status || '—'}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6">
          <div className="flex items-center gap-3">
            <button className="px-3 py-1 border rounded bg-white text-green-700 disabled:opacity-40 flex items-center gap-2" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><FaChevronLeft /> Prev</button>
            <span className="text-sm text-green-900 font-medium">Page {page} / {pageCount}</span>
            <button className="px-3 py-1 border rounded bg-white text-green-700 disabled:opacity-40 flex items-center gap-2" onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount}>Next <FaChevronRight /></button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-green-700">Rows</span>
            <select className="px-2 py-1 border rounded" value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>
            <span className="text-sm text-green-600">Total: <span className="font-medium text-green-800">{total}</span></span>
          </div>
        </div>

        <Modal open={openAdd} onClose={() => setOpenAdd(false)} title="Register Driver">
          <DriverForm onSuccess={() => { fetchData(); setOpenAdd(false); }} onClose={() => setOpenAdd(false)} />
        </Modal>
      </main>
    </div>
  );
}

// StatCard component
function StatCard({ title, value }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition border border-green-200 flex flex-col items-start h-full">
      <div className="text-green-600 text-3xl mb-3"><FaUser /></div>
      <h3 className="text-lg font-semibold text-green-700">{title}</h3>
      <p className="text-2xl font-bold text-green-900 mt-2">{value}</p>
    </div>
  );
} 