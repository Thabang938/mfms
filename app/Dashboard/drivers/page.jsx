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
    return v ? `${v.registration_number}` : 'Unassigned';
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
    suspended: drivers.filter(d => d.status === 'Suspended').length,
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

  if (loadingSession) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-green-700">Checking session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-green-50">
      <Toaster position="top-right" />
      <SideBar />
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-green-800">Driver Management</h1>
            <p className="text-sm text-green-600 mt-2">Register drivers, assign vehicles, and monitor status.</p>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={handleExport} 
              className="flex items-center gap-2 bg-white border border-green-300 text-green-700 px-4 py-2 rounded-lg hover:bg-green-50 transition font-medium shadow-sm"
            >
              <FaFileExport /> Export
            </button>
            <button 
              onClick={() => setOpenAdd(true)} 
              className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition font-medium shadow-md"
            >
              <FaPlus /> Register Driver
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow border border-green-100 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Total Drivers</p>
                <p className="text-3xl font-bold text-green-900 mt-2">{summary.total}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <FaUser className="text-green-700 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-green-100 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Active</p>
                <p className="text-3xl font-bold text-green-900 mt-2">{summary.active}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <span className="text-green-700 text-xl font-bold">{summary.total > 0 ? (summary.active/summary.total*100).toFixed(0) : 0}%</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-green-100 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">In Training</p>
                <p className="text-3xl font-bold text-green-900 mt-2">{summary.training}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <span className="text-green-700 text-xl font-bold">{summary.total > 0 ? (summary.training/summary.total*100).toFixed(0) : 0}%</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-green-100 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Suspended</p>
                <p className="text-3xl font-bold text-green-900 mt-2">{summary.suspended}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <span className="text-green-700 text-xl font-bold">{summary.total > 0 ? (summary.suspended/summary.total*100).toFixed(0) : 0}%</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-green-100 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Unassigned</p>
                <p className="text-3xl font-bold text-green-900 mt-2">{summary.unassigned}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <span className="text-green-700 text-xl font-bold">{summary.total > 0 ? (summary.unassigned/summary.total*100).toFixed(0) : 0}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3 flex-1">
            <div className="relative flex-1 md:flex-none md:w-64">
              <FaSearch className="absolute left-3 top-3 text-green-400" />
              <input 
                aria-label="Search drivers" 
                className="pl-10 pr-4 py-2 border border-green-300 rounded-lg w-full focus:ring-2 focus:ring-green-200 bg-white transition" 
                placeholder="Search name, license, vehicle..." 
                value={search} 
                onChange={e => { setSearch(e.target.value); setPage(1); }} 
              />
            </div>

            <select 
              className="px-3 py-2 border border-green-300 rounded-lg bg-white text-sm text-green-700 focus:ring-2 focus:ring-green-200 transition" 
              value={statusFilter} 
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All statuses</option>
              <option value="Active">Active</option>
              <option value="In Training">In Training</option>
              <option value="Suspended">Suspended</option>
            </select>

            <select 
              className="px-3 py-2 border border-green-300 rounded-lg bg-white text-sm text-green-700 focus:ring-2 focus:ring-green-200 transition" 
              value={departmentFilter} 
              onChange={e => { setDepartmentFilter(e.target.value); setPage(1); }}
            >
              <option value="">All departments</option>
              {[...new Set(drivers.map(d => d.department).filter(Boolean))].map(dep => <option key={dep} value={dep}>{dep}</option>)}
            </select>
          </div>
        </div>

        {/* Drivers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && <div className="col-span-full text-center text-green-600 py-12">Loading drivers...</div>}
          {!loading && paged.length === 0 && <div className="col-span-full text-center text-green-600 py-12">No drivers found.</div>}
          {!loading && paged.map((d, i) => {
            const userRow = users.find(u => u.id === d.user_id);
            return (
              <div 
                key={d.id || i} 
                className="bg-white border border-green-100 rounded-lg p-5 shadow-sm hover:shadow-lg hover:border-green-300 transition flex flex-col cursor-pointer group" 
                onClick={() => router.push(`/Dashboard/drivers/${d.id}`)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    {userRow?.user_image ? (
                      <img src={userRow.user_image} alt={userRow.name} className="w-12 h-12 rounded-full object-cover border-2 border-green-200" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center border-2 border-green-200">
                        <FaUser className="text-green-600 text-lg" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-green-900 font-semibold text-lg">{userRow?.name || '—'}</h3>
                      <p className="text-xs text-green-600">{userRow?.employee_number || '—'}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                    d.status === 'Active' ? 'bg-green-100 text-green-900' : 
                    d.status === 'In Training' ? 'bg-green-50 text-green-800 border border-green-200' : 
                    d.status === 'Suspended' ? 'bg-green-50 text-green-700 border border-green-200' : 
                    'bg-green-50 text-green-700'
                  }`}>
                    {d.status}
                  </span>
                </div>

                <div className="space-y-2 flex-1">
                  <div className="bg-green-50 rounded p-2.5 border border-green-100">
                    <p className="text-xs text-green-600 font-medium">License</p>
                    <p className="text-green-900 font-semibold">{d.license_number}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-green-50 rounded p-2.5 border border-green-100">
                      <p className="text-xs text-green-600 font-medium">Department</p>
                      <p className="text-green-900 font-semibold text-sm truncate">{d.department || 'N/A'}</p>
                    </div>
                    <div className="bg-green-50 rounded p-2.5 border border-green-100">
                      <p className="text-xs text-green-600 font-medium">Expires</p>
                      <p className="text-green-900 font-semibold text-sm">{d.expiry_date ? d.expiry_date.slice(5) : 'N/A'}</p>
                    </div>
                  </div>
                  <div className="bg-green-50 rounded p-2.5 border border-green-100">
                    <p className="text-xs text-green-600 font-medium">Vehicle</p>
                    <p className="text-green-900 font-semibold text-sm truncate">{getVehicleLabel(d.assigned_vehicle_id)}</p>
                  </div>
                </div>

                <button 
                  className="mt-4 w-full bg-green-700 text-white py-2 rounded-lg hover:bg-green-800 transition font-medium text-sm opacity-0 group-hover:opacity-100"
                  onClick={(e) => { e.stopPropagation(); router.push(`/Dashboard/drivers/${d.id}`); }}
                >
                  View Details
                </button>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-8 bg-white p-4 rounded-lg shadow border border-green-100">
          <div className="flex items-center gap-3">
            <button 
              className="px-3 py-1 border border-green-300 rounded-lg bg-white text-green-700 disabled:opacity-40 hover:bg-green-50 transition flex items-center gap-2" 
              onClick={() => setPage(p => Math.max(1, p - 1))} 
              disabled={page === 1}
            >
              <FaChevronLeft /> Prev
            </button>
            <span className="text-sm text-green-900 font-medium">Page {page} / {pageCount}</span>
            <button 
              className="px-3 py-1 border border-green-300 rounded-lg bg-white text-green-700 disabled:opacity-40 hover:bg-green-50 transition flex items-center gap-2" 
              onClick={() => setPage(p => Math.min(pageCount, p + 1))} 
              disabled={page === pageCount}
            >
              Next <FaChevronRight />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-green-700">Rows</span>
            <select 
              className="px-2 py-1 border border-green-300 rounded-lg bg-white text-green-700 focus:ring-2 focus:ring-green-200 transition" 
              value={perPage} 
              onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>
            <span className="text-sm text-green-700">Total: <span className="font-semibold text-green-900">{total}</span></span>
          </div>
        </div>

        {/* Modal */}
        <Modal open={openAdd} onClose={() => setOpenAdd(false)} title="Register Driver">
          <DriverForm 
            onSuccess={() => { fetchData(); setOpenAdd(false); }} 
            onClose={() => setOpenAdd(false)} 
          />
        </Modal>
      </main>
    </div>
  );
}