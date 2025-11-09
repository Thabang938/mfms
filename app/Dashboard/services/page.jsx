'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';
import SideBar from '@/components/SideBar';
import Modal from '@/components/Modal';
import ServiceForm from '@/components/Forms/ServiceForm';
import { FaTools, FaPlus, FaSearch, FaDownload } from 'react-icons/fa';

export default function ServicesPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  const [services, setServices] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [activeTab, setActiveTab] = useState('All');

  const [search, setSearch] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

  const [userRole, setUserRole] = useState(null);

  // -------------------- Session Management --------------------
 useEffect(() => {
  const checkSession = async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    setSession(session); // No redirect here
    setLoadingSession(false);
  };

  checkSession();

  const { data: listener } = supabaseClient.auth.onAuthStateChange((_event, session) => {
    setSession(session);
    if (!session) router.push('/Login');
  });

  return () => {
    listener.subscription.unsubscribe();
  };
}, [router]);

  // -------------------- Fetch Vehicles --------------------
  async function fetchVehicles() {
    try {
      const { data, error } = await supabaseClient
        .from('vehicles')
        .select('id, make, model, registration_number');
      if (error) throw error;
      setVehicles(data || []);
    } catch (err) {
      console.error('Error fetching vehicles:', err.message);
      setVehicles([]);
    }
  }

  // -------------------- Fetch Services --------------------
  async function fetchServices() {
    if (!session) return;
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
      if (userError) throw userError;

      // Get role from users table
      const { data: profile, error: profileError } = await supabaseClient
        .from('users')
        .select('role')
        .eq('auth_id', user.id)
        .single();
      if (profileError) throw profileError;

      setUserRole(profile?.role || 'User');

      // Fetch services
      const { data, error } = await supabaseClient
        .from('services')
        .select('*')
        .order('service_date', { ascending: false });
      if (error) throw error;

      setServices(data || []);
    } catch (err) {
      console.error('Error fetching services:', err.message);
      setServices([]);
    } finally {
      setLoading(false);
    }
  }

  // -------------------- Combined Fetch --------------------
  useEffect(() => {
    if (session) {
      fetchVehicles();
      fetchServices();
    }
  }, [session]);

  // -------------------- Helpers --------------------
  const getVehicleLabel = (id) => {
    const v = vehicles.find(v => v.id === id);
    return v ? `${v.registration_number} — ${v.make} ${v.model}` : 'Unknown Vehicle';
  };

  // -------------------- Summary --------------------
  const summary = useMemo(() => ({
    Scheduled: services.filter(s => s.status === 'Scheduled').length,
    'In Progress': services.filter(s => s.status === 'In Progress').length,
    Completed: services.filter(s => s.status === 'Completed').length,
    Overdue: services.filter(s => s.status === 'Overdue').length,
  }), [services]);

  // -------------------- Filter by Tab --------------------
  const baseList = useMemo(() => {
    let list = services.slice();
    if (activeTab === 'Scheduled') list = list.filter(s => s.status === 'Scheduled');
    if (activeTab === 'Completed') list = list.filter(s => s.status === 'Completed');
    return list;
  }, [services, activeTab]);

  // -------------------- Apply Search --------------------
  const filtered = useMemo(() => {
    const q = (search || '').trim().toLowerCase();
    if (!q) return baseList;
    return baseList.filter(s => {
      const vehicleLabel = getVehicleLabel(s.vehicle_id);
      return `${vehicleLabel} ${s.service_type || ''} ${s.technician || ''} ${s.notes || ''}`.toLowerCase().includes(q);
    });
  }, [baseList, search, vehicles]);

  // -------------------- Pagination --------------------
  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  useEffect(() => { if (page > pageCount) setPage(1); }, [pageCount]);
  const paged = useMemo(() => filtered.slice((page - 1) * perPage, page * perPage), [filtered, page, perPage]);

  // -------------------- CSV Export --------------------
  const exportCSV = () => {
    if (!paged || paged.length === 0) { alert('No records to export.'); return; }
    const rows = paged.map(s => ({
      id: s.id,
      date: s.service_date,
      vehicle: getVehicleLabel(s.vehicle_id),
      type: s.service_type || '',
      technician: s.technician || '',
      mileage: s.mileage || '',
      cost: s.cost || '',
      status: s.status || '',
      notes: s.notes || '',
    }));

    const header = Object.keys(rows[0]).join(',');
    const csv = [header, ...rows.map(r => Object.values(r).map(val => `"${String(val ?? '')?.replace(/"/g,'""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `services_export_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loadingSession) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-green-700">Checking session...</p>
      </div>
    );
  }

  // -------------------- Render --------------------
  return (
    <div className="min-h-screen flex bg-green-50">
      <SideBar />
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-green-800 flex items-center gap-2">
              <FaTools className="text-green-700 text-2xl" /> Service & Maintenance
            </h1>
            <p className="text-green-600 text-sm mt-1">Track and schedule vehicle maintenance</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-green-400" />
              <input
                aria-label="Search services"
                className="pl-10 pr-4 py-2 border rounded-md w-72 focus:ring-2 focus:ring-green-200 bg-white"
                placeholder="Search vehicle, technician, notes..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <button onClick={exportCSV} className="flex items-center gap-2 bg-white border border-green-200 text-green-700 px-3 py-2 rounded hover:bg-green-50">
              <FaDownload /> Export
            </button>
            <button onClick={() => setOpenAdd(true)} className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800">
              <FaPlus /> Schedule Service
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {Object.entries(summary).map(([label, count]) => (
            <div key={label} className="bg-white p-4 rounded-lg border border-green-100 shadow-sm text-center">
              <div className="text-sm text-green-700">{label}</div>
              <div className="text-2xl font-bold text-green-900">{count}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-4">
          {['All','Scheduled','Completed'].map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setPage(1); }}
              className={`px-4 py-2 rounded ${activeTab===tab?'bg-green-700 text-white':'bg-white text-green-700 border border-green-300'} hover:bg-green-600 hover:text-white transition`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <p className="text-green-700">Loading services...</p>
        ) : filtered.length === 0 ? (
          <div className="overflow-x-auto bg-white rounded shadow border border-green-200">
            <div className="px-6 py-12 text-center text-green-600">No service records found.</div>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded shadow border border-green-200">
            <table className="min-w-full text-sm">
              <thead className="bg-green-100 text-green-800">
                <tr>
                  <th className="px-4 py-2 text-left">Service ID</th>
                  <th className="px-4 py-2 text-left">Vehicle</th>
                  <th className="px-4 py-2 text-left">Service Type</th>
                  <th className="px-4 py-2 text-left">Service Date</th>
                  <th className="px-4 py-2 text-left">Technician</th>
                  <th className="px-4 py-2 text-left">Cost</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((s,i) => (
                  <tr key={s.id || i} className="border-t hover:bg-green-50">
                    <td className="px-4 py-3">{s.id}</td>
                    <td className="px-4 py-3">{getVehicleLabel(s.vehicle_id)}</td>
                    <td className="px-4 py-3">{s.service_type || '—'}</td>
                    <td className="px-4 py-3">{s.service_date || '—'}</td>
                    <td className="px-4 py-3">{s.technician || '—'}</td>
                    <td className="px-4 py-3">R {Number(s.cost||0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        s.status==='Scheduled'?'bg-yellow-100 text-yellow-700':
                        s.status==='Completed'?'bg-green-100 text-green-700':
                        s.status==='In Progress'?'bg-blue-100 text-blue-700':
                        s.status==='Overdue'?'bg-red-100 text-red-700':'bg-gray-100 text-gray-700'}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between px-4 py-3 border-t bg-white">
              <div className="text-sm text-green-700">
                Showing {(page-1)*perPage+1}–{Math.min(page*perPage,total)} of {total}
              </div>

              <div className="flex items-center gap-2">
                <button className="px-3 py-1 border rounded bg-white text-green-700 disabled:opacity-40"
                  onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>Prev</button>
                <div className="px-3 py-1 text-sm text-green-900 font-medium">Page {page} / {pageCount}</div>
                <button className="px-3 py-1 border rounded bg-white text-green-700 disabled:opacity-40"
                  onClick={()=>setPage(p=>Math.min(pageCount,p+1))} disabled={page===pageCount}>Next</button>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-sm text-green-700">Rows</div>
                <select className="px-2 py-1 border rounded" value={perPage} onChange={e=>{setPerPage(Number(e.target.value)); setPage(1);}}>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </select>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Modal */}
      <Modal open={openAdd} onClose={()=>setOpenAdd(false)} title="Schedule Service">
        <ServiceForm onSuccess={()=>{ fetchServices(); setOpenAdd(false); }} onClose={()=>setOpenAdd(false)} />
      </Modal>
    </div>
  );
}
