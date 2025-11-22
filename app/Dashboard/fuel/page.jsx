'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';
import SideBar from '@/components/SideBar';
import Modal from '@/components/Modal';
import FuelForm from '@/components/Forms/FuelForm';
import { FaPlus, FaSearch, FaDownload } from 'react-icons/fa';

export default function FuelPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  const [fuelLogs, setFuelLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);

  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); 
    d.setDate(1); 
    return d.toISOString().slice(0,10); 
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0,10));
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

  // -------------------- Session Management --------------------
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabaseClient.auth.getSession();
      setSession(session);
      setLoadingSession(false);
    };
    checkSession();

    const { data: listener } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) router.push('/Login');
    });

    return () => listener.subscription.unsubscribe();
  }, [router]);

  // -------------------- Fetch Vehicles --------------------
  const fetchVehicles = async () => {
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
  };

  // -------------------- Fetch Fuel Logs --------------------
  const fetchFuelLogs = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
      if (userError) throw userError;

      let query = supabaseClient
        .from('fuel_logs')
        .select('*')
        .order('purchase_date', { ascending: false });

      // RLS: restrict non-admin/fleet users to their own logs
      const { data: profile, error: profileError } = await supabaseClient
        .from('users')
        .select('role')
        .eq('auth_id', user.id)
        .single();
      if (profileError) throw profileError;

      if (!['Fleet Manager', 'Admin Clerk'].includes(profile?.role)) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setFuelLogs(data || []);
    } catch (err) {
      console.error('Error fetching fuel logs:', err.message);
      setFuelLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // -------------------- Combined Fetch --------------------
  useEffect(() => {
    if (session) {
      fetchVehicles();
      fetchFuelLogs();
    }
  }, [session]);

  // -------------------- Helpers --------------------
  const getVehicleLabel = (id) => {
    const v = vehicles.find(v => v.id === id);
    return v ? `MV-${v.registration_number} — ${v.make || ''} ${v.model || ''}`.trim() : 'Unknown';
  };

  const formatCurrencyFixed = (value) => 
    `R ${Number(value || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // -------------------- Filtered & Paginated --------------------
  const filtered = useMemo(() => {
    const from = dateFrom || '';
    const to = dateTo || '';
    const q = (search || '').trim().toLowerCase();
    return fuelLogs.filter(f => {
      if (from && f.purchase_date && f.purchase_date < from) return false;
      if (to && f.purchase_date && f.purchase_date > to) return false;
      if (!q) return true;
      const vehicle = getVehicleLabel(f.vehicle_id).toLowerCase();
      return (f.transaction_id || '').toLowerCase().includes(q) ||
             vehicle.includes(q) ||
             (f.station || '').toLowerCase().includes(q);
    });
  }, [fuelLogs, search, dateFrom, dateTo, vehicles]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  useEffect(() => { if (page > pageCount) setPage(1); }, [pageCount]);
  const paged = useMemo(() => filtered.slice((page - 1) * perPage, page * perPage), [filtered, page, perPage]);

  const summary = useMemo(() => {
    const monthFiltered = fuelLogs.filter(f => {
      if (!f.purchase_date) return false;
      const d = new Date(f.purchase_date);
      const start = new Date(dateFrom);
      const end = new Date(dateTo);
      return (!dateFrom || d >= start) && (!dateTo || d <= end);
    });
    const totalLiters = monthFiltered.reduce((s, r) => s + (Number(r.liters) || 0), 0);
    const totalCost = monthFiltered.reduce((s, r) => s + (Number(r.cost) || 0), 0);
    const avgPrice = monthFiltered.length ? totalCost / (totalLiters || 1) : 0;
    return { totalLiters, totalCost, avgPrice, records: monthFiltered.length };
  }, [fuelLogs, dateFrom, dateTo]);

  // -------------------- CSV Export --------------------
  const exportCSV = () => {
    if (!filtered.length) return;
    const rows = filtered.map(r => ({
      transaction_id: r.transaction_id,
      purchase_date: r.purchase_date,
      vehicle: getVehicleLabel(r.vehicle_id),
      liters: r.liters,
      cost: r.cost,
      station: r.station,
      odometer: r.odometer
    }));
    const header = Object.keys(rows[0]).join(',');
    const csv = [header, ...rows.map(r => Object.values(r).map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fuel_logs_${dateFrom || 'all'}_${dateTo || 'all'}.csv`;
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
      <main className="flex-1 p-8 transition-all duration-300 ease-in-out">

        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-green-900">Fuel Tracking</h1>
            <p className="text-sm text-green-600 mt-1">Track fuel purchases, cost, and fleet consumption.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-green-400" />
              <input
                className="pl-10 pr-4 py-2 border rounded-md w-72 focus:ring-2 focus:ring-green-200 bg-white transition"
                placeholder="Search transaction, vehicle, station..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                aria-label="Search fuel logs"
              />
            </div>
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} className="px-3 py-2 border rounded bg-white text-sm" />
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} className="px-3 py-2 border rounded bg-white text-sm" />
            <button onClick={() => setOpenAdd(true)} className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 transition">
              <FaPlus /> Add Fuel
            </button>
            <button onClick={exportCSV} className="flex items-center gap-2 bg-white border border-green-200 text-green-700 px-3 py-2 rounded hover:bg-green-50 transition">
              <FaDownload /> Export
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[{ label: 'Records', value: summary.records },
            { label: 'Total Liters', value: `${Number(summary.totalLiters || 0).toLocaleString()} L` },
            { label: 'Total Cost', value: formatCurrencyFixed(summary.totalCost) },
            { label: 'Avg Price / L', value: summary.avgPrice ? `R ${summary.avgPrice.toFixed(2)}` : '—' }].map(s => (
            <div key={s.label} className="bg-white p-4 rounded-lg border border-green-100 shadow-sm text-center">
              <div className="text-sm text-green-700">{s.label}</div>
              <div className="text-2xl font-bold text-green-900">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded shadow border border-green-200 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-green-50 text-left text-green-800">
              <tr>
                <th className="px-4 py-3">Transaction</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Liters</th>
                <th className="px-4 py-3">Cost</th>
                <th className="px-4 py-3">Odometer</th>
                <th className="px-4 py-3">Station</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="7" className="px-6 py-12 text-center text-green-600">Loading fuel logs...</td></tr>}
              {!loading && paged.length === 0 && <tr><td colSpan="7" className="px-6 py-12 text-center text-green-600">No records found.</td></tr>}
              {!loading && paged.map((log,i) => (
                <tr key={log.id || i} className="border-t hover:bg-green-50 transition">
                  <td className="px-4 py-3">{log.transaction_id || `FUEL-${(page-1)*perPage+i+1}`}</td>
                  <td className="px-4 py-3">{log.purchase_date || '—'}</td>
                  <td className="px-4 py-3">{getVehicleLabel(log.vehicle_id)}</td>
                  <td className="px-4 py-3">{log.liters ?? '—'} L</td>
                  <td className="px-4 py-3">{formatCurrencyFixed(log.cost)}</td>
                  <td className="px-4 py-3">{log.odometer ? `${Number(log.odometer).toLocaleString()} km` : '—'}</td>
                  <td className="px-4 py-3">{log.station || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex flex-col md:flex-row items-center justify-between px-4 py-3 border-t bg-white gap-3">
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1 border rounded bg-white text-green-700 disabled:opacity-40"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >Prev</button>

              {Array.from({ length: pageCount }, (_, i) => (
                <button
                  key={i+1}
                  onClick={() => setPage(i+1)}
                  className={`px-3 py-1 rounded border ${page === i+1 ? 'bg-green-700 text-white' : 'bg-white text-green-700'} hover:bg-green-200`}
                >{i+1}</button>
              ))}

              <button
                className="px-3 py-1 border rounded bg-white text-green-700 disabled:opacity-40"
                onClick={() => setPage(p => Math.min(pageCount, p + 1))}
                disabled={page === pageCount}
              >Next</button>
            </div>
            <div className="text-sm text-green-700">Rows:
              <select className="ml-2 px-2 py-1 border rounded" value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
              <span className="ml-4 font-medium text-green-800">Total: {total}</span>
            </div>
          </div>
        </div>

      </main>

      <Modal open={openAdd} onClose={()=>setOpenAdd(false)} title="Add Fuel Record">
        <FuelForm onSuccess={()=>{fetchFuelLogs(); setOpenAdd(false);}} onClose={()=>setOpenAdd(false)} />
      </Modal>
    </div>
  );
}
