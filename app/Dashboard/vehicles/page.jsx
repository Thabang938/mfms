'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import SideBar from '@/components/SideBar';
import { FaPlus, FaSearch, FaDownload, FaCar, FaTools, FaCheckCircle } from 'react-icons/fa';
import Modal from '@/components/Modal';
import VehicleForm from '@/components/Forms/VehicleForm';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [openAdd, setOpenAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [perPage, setPerPage] = useState(5);
  const [page, setPage] = useState(1);

  async function fetchVehicles() {
    setLoading(true);
    const { data, error } = await supabase.from('vehicles').select('*').order('created_at', { ascending: false });
    setLoading(false);
    if (!error) setVehicles(data || []);
  }

  useEffect(() => { fetchVehicles(); }, []);

  const departments = useMemo(() => {
    const setDept = new Set();
    vehicles.forEach(v => v.department && setDept.add(v.department));
    return Array.from(setDept).sort();
  }, [vehicles]);

  const stats = useMemo(() => ({
    total: vehicles.length,
    maintenance: vehicles.filter(v => v.status === 'Maintenance').length,
    active: vehicles.filter(v => v.status === 'Active').length,
  }), [vehicles]);

  const filtered = useMemo(() => {
    let list = vehicles.slice();
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(v =>
        (v.registration_number || '').toLowerCase().includes(q) ||
        (v.make || '').toLowerCase().includes(q) ||
        (v.model || '').toLowerCase().includes(q) ||
        (v.vin || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter) list = list.filter(v => v.status === statusFilter);
    if (departmentFilter) list = list.filter(v => v.department === departmentFilter);
    return list;
  }, [vehicles, search, statusFilter, departmentFilter]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  useEffect(() => { if (page > pageCount) setPage(1); }, [pageCount]);

  function exportCSV() {
    if (filtered.length === 0) return alert('No vehicles to export.');
    const rows = filtered.map(v => ({
      id: v.id, registration_number: v.registration_number, make: v.make,
      model: v.model, year: v.year, vin: v.vin, department: v.department,
      fuel_type: v.fuel_type, odometer: v.odometer, status: v.status,
      created_at: v.created_at,
    }));
    const header = Object.keys(rows[0]).join(',');
    const csv = [header, ...rows.map(r => Object.values(r)
      .map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vehicles_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen flex bg-green-50">
      <SideBar />

      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-green-800">Vehicles</h1>
            <p className="text-sm text-green-600">Manage fleet vehicles — registration, status, and telemetry.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportCSV}
              className="flex items-center bg-white border border-green-300 text-green-700 px-4 py-2 rounded hover:bg-green-100 transition"
            >
              <FaDownload className="mr-2" /> Export
            </button>

            <button
              onClick={() => setOpenAdd(true)}
              className="flex items-center bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 transition"
            >
              <FaPlus className="mr-2" /> Add Vehicle
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard title="Total Vehicles" value={stats.total} icon={<FaCar />} />
          <StatCard title="In Maintenance" value={stats.maintenance} icon={<FaTools />} />
          <StatCard title="Active Vehicles" value={stats.active} icon={<FaCheckCircle />} />
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-green-400" />
              <input
                aria-label="Search vehicles"
                className="pl-10 pr-4 py-2 border rounded-md w-64 focus:ring-2 focus:ring-green-200 bg-white"
                placeholder="Search registration, make, model, VIN..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>

            <select
              className="px-3 py-2 border rounded bg-white text-sm"
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All statuses</option>
              <option value="Active">Active</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Incident">Incident</option>
              <option value="Retired">Retired</option>
            </select>

            <select
              className="px-3 py-2 border rounded bg-white text-sm"
              value={departmentFilter}
              onChange={e => { setDepartmentFilter(e.target.value); setPage(1); }}
            >
              <option value="">All departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Rows per page selector */}
          <div className="flex items-center gap-3 mt-2 md:mt-0">
            <span className="text-sm text-green-700">Rows</span>
            <select
              className="px-2 py-1 border rounded"
              value={perPage}
              onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>
          </div>
        </div>

        {/* Vehicle Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading && <div className="text-green-600 text-center col-span-full py-12">Loading vehicles...</div>}
          {!loading && paged.length === 0 && <div className="text-green-600 text-center col-span-full py-12">No vehicles found.</div>}
          {!loading && paged.map(v => (
            <div key={v.id} className="bg-white p-4 rounded-lg shadow border border-green-100 hover:shadow-lg transition flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-green-800 text-lg">{v.registration_number}</h3>
                <span className={`px-2 py-1 text-xs font-semibold rounded ${
                  v.status === 'Active' ? 'bg-green-200 text-green-900' :
                  v.status === 'Maintenance' ? 'bg-yellow-200 text-yellow-900' :
                  v.status === 'Incident' ? 'bg-red-200 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>{v.status}</span>
              </div>
              <div className="text-sm text-green-700 mb-1">{v.make} {v.model} ({v.year || '—'})</div>
              <div className="text-sm text-green-600 mb-1">Odometer: {v.odometer != null ? `${Number(v.odometer).toLocaleString()} km` : '—'}</div>
              <div className="text-sm text-green-600 mb-1">Fuel: {v.fuel_type || '—'}</div>
              <div className="text-sm text-green-600">Dept: {v.department || '—'}</div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-green-700">Showing {(page - 1) * perPage + 1}-{Math.min(page * perPage, total)} of {total}</div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 border rounded bg-white text-green-700 disabled:opacity-40"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Prev
            </button>
            <span className="px-3 py-1 text-sm text-green-900 font-medium">{page} / {pageCount}</span>
            <button
              className="px-3 py-1 border rounded bg-white text-green-700 disabled:opacity-40"
              onClick={() => setPage(p => Math.min(pageCount, p + 1))}
              disabled={page === pageCount}
            >
              Next
            </button>
          </div>
        </div>

        {/* Modal */}
        <Modal open={openAdd} onClose={() => setOpenAdd(false)} title="Add Vehicle">
          <VehicleForm onSuccess={() => { fetchVehicles(); setOpenAdd(false); }} onClose={() => setOpenAdd(false)} />
        </Modal>
      </main>
    </div>
  );
}

// Stat card component
function StatCard({ title, value, icon }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition border border-green-200 flex flex-col items-start h-full">
      <div className="text-green-600 text-3xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-green-700">{title}</h3>
      <p className="text-2xl font-bold text-green-900 mt-2">{value}</p>
    </div>
  );
}
