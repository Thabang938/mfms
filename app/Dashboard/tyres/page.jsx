'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';
import SideBar from '@/components/SideBar';
import Modal from '@/components/Modal';
import TireForm from '@/components/Forms/TireForm';
import { FaPlus, FaSearch, FaChevronLeft, FaChevronRight, FaDownload } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function TiresPage() {
  const router = useRouter();

  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [tires, setTires] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

  // -------------------- Session --------------------
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

  // -------------------- Fetch Data --------------------
  const fetchData = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const [tireRes, vehicleRes] = await Promise.all([
        supabaseClient.from('tires').select('*').order('install_date', { ascending: false }),
        supabaseClient.from('vehicles').select('*'),
      ]);
      setTires(tireRes.data || []);
      setVehicles(vehicleRes.data || []);
    } catch (err) {
      console.error('Error fetching tires:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (session) fetchData(); }, [session]);

  const getVehicleLabel = (id) => {
    const v = vehicles.find(v => v.id === id);
    return v ? `${v.registration_number} - ${v.make}` : 'Unknown Vehicle';
  };

  // -------------------- Filters --------------------
  const filtered = useMemo(() => {
    if (!search) return tires;
    const q = search.trim().toLowerCase();
    return tires.filter(t => {
      const vehicle = vehicles.find(v => v.id === t.vehicle_id);
      const vehicleLabel = vehicle ? `${vehicle.registration_number} ${vehicle.make}` : '';
      return (
        `${vehicleLabel} ${t.position || ''} ${t.brand || ''} ${t.serial_number || ''} ${t.condition || ''}`
          .toLowerCase()
          .includes(q)
      );
    });
  }, [tires, vehicles, search]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  useEffect(() => { if (page > pageCount) setPage(1); }, [pageCount]);
  const paged = useMemo(() => filtered.slice((page - 1) * perPage, page * perPage), [filtered, page, perPage]);

  const summary = useMemo(() => ({
    total: tires.length,
    good: tires.filter(t => t.condition === 'Good').length,
    fair: tires.filter(t => t.condition === 'Fair').length,
    replace: tires.filter(t => t.condition === 'Replace Soon').length,
  }), [tires]);

  // -------------------- CSV Export --------------------
  const exportCSV = () => {
    if (!paged || paged.length === 0) { alert('No records to export.'); return; }
    const rows = paged.map(t => {
      const vehicle = vehicles.find(v => v.id === t.vehicle_id) || {};
      return {
        vehicle: `${vehicle.registration_number || ''} ${vehicle.make || ''}`.trim(),
        position: t.position || '',
        brand: t.brand || '',
        serial_number: t.serial_number || '',
        install_date: t.install_date || '',
        mileage: t.mileage ?? '',
        pressure: t.pressure ?? '',
        condition: t.condition || '',
      };
    });
    const header = Object.keys(rows[0]).join(',');
    const csv = [header, ...rows.map(r => Object.values(r).map(val => `"${String(val ?? '')?.replace(/"/g, '""')}"`).join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tires_export_${new Date().toISOString().slice(0, 10)}.csv`;
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-green-800">Tyre Management</h1>
            <p className="text-sm text-green-600">Manage tyre records, conditions, and replacements</p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={exportCSV} className="flex items-center bg-white border border-green-300 text-green-700 px-4 py-2 rounded hover:bg-green-100 transition">
              <FaDownload className="mr-2" /> Export
            </button>
            <button onClick={() => setOpenAdd(true)} className="flex items-center bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 transition">
              <FaPlus className="mr-2" /> Record Tyre Change
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Tyres" value={summary.total} color="text-green-900" />
          <StatCard label="Good" value={summary.good} color="text-green-800" />
          <StatCard label="Fair" value={summary.fair} color="text-yellow-800" />
          <StatCard label="Replace Soon" value={summary.replace} color="text-red-800" />
        </div>

        {/* Search */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-green-400" />
            <input
              aria-label="Search tyres"
              className="pl-10 pr-4 py-2 border rounded-md w-64 focus:ring-2 focus:ring-green-200 bg-white transition"
              placeholder="Search vehicle, position, brand, condition..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded shadow border border-green-200 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-green-50 text-green-800">
              <tr>
                <th className="px-4 py-3 text-left">Vehicle</th>
                <th className="px-4 py-3 text-left">Position</th>
                <th className="px-4 py-3 text-left">Brand</th>
                <th className="px-4 py-3 text-left">Serial Number</th>
                <th className="px-4 py-3 text-left">Install Date</th>
                <th className="px-4 py-3 text-left">Mileage</th>
                <th className="px-4 py-3 text-left">Pressure</th>
                <th className="px-4 py-3 text-left">Condition</th>
              </tr>
            </thead>
            <AnimatePresence>
              <tbody>
                {loading && <tr><td colSpan="8" className="px-6 py-12 text-center text-green-600">Loading tyres...</td></tr>}
                {!loading && paged.length === 0 && <tr><td colSpan="8" className="px-6 py-12 text-center text-green-600">No tyre records found.</td></tr>}
                {!loading && paged.map((tire, i) => (
                  <motion.tr
                    key={tire.id || i}
                    className="border-t hover:bg-green-50"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <td className="px-4 py-3">{getVehicleLabel(tire.vehicle_id)}</td>
                    <td className="px-4 py-3">{tire.position}</td>
                    <td className="px-4 py-3">{tire.brand}</td>
                    <td className="px-4 py-3">{tire.serial_number}</td>
                    <td className="px-4 py-3">{tire.install_date || '—'}</td>
                    <td className="px-4 py-3">{tire.mileage != null ? `${tire.mileage.toLocaleString()} km` : '—'}</td>
                    <td className="px-4 py-3">{tire.pressure != null ? `${Number(tire.pressure).toFixed(2)} bar` : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        tire.condition === 'Good' ? 'bg-green-200 text-green-800' :
                        tire.condition === 'Fair' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-red-200 text-red-800'
                      }`}>{tire.condition}</span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </AnimatePresence>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t bg-white">
            <div className="flex items-center gap-3">
              <button
                className="px-3 py-1 border rounded bg-white text-green-700 disabled:opacity-40 flex items-center gap-2"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <FaChevronLeft /> Prev
              </button>
              <div className="text-sm text-green-900 font-medium">Page {page} / {pageCount}</div>
              <button
                className="px-3 py-1 border rounded bg-white text-green-700 disabled:opacity-40 flex items-center gap-2"
                onClick={() => setPage(p => Math.min(pageCount, p + 1))}
                disabled={page === pageCount}
              >
                Next <FaChevronRight />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-sm text-green-700">Rows</div>
              <select className="px-2 py-1 border rounded" value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
              <div className="text-sm text-green-600">Total: <span className="font-medium text-green-800">{total}</span></div>
            </div>
          </div>
        </div>

        {/* Modal */}
        <AnimatePresence>
          {openAdd && (
            <Modal open={openAdd} onClose={() => setOpenAdd(false)} title="Record Tyre Change">
              <TireForm onSuccess={() => { fetchData(); setOpenAdd(false); }} onClose={() => setOpenAdd(false)} />
            </Modal>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// -------------------- StatCard Component --------------------
function StatCard({ label, value, color }) {
  return (
    <motion.div
      className="bg-white p-4 rounded-lg border border-green-100 shadow-sm text-center hover:shadow-md transition"
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-sm text-green-700">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </motion.div>
  );
}
