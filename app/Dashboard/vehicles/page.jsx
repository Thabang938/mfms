// ...existing code...
'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FaPlus, FaSearch, FaDownload, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import SideBar from '@/components/SideBar';
import Modal from '@/components/Modal';
import VehicleForm from '@/components/forms/VehicleForm';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [openAdd, setOpenAdd] = useState(false);
  const [loading, setLoading] = useState(false);

  // table state
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  async function fetchVehicles() {
    setLoading(true);
    const { data, error } = await supabase.from('vehicles').select('*').order('created_at', { ascending: false });
    setLoading(false);
    if (!error) setVehicles(data || []);
  }

  useEffect(() => { fetchVehicles(); }, []);

  // unique departments for filter dropdown
  const departments = useMemo(() => {
    const setDept = new Set();
    vehicles.forEach(v => v.department && setDept.add(v.department));
    return Array.from(setDept).sort();
  }, [vehicles]);

  // filtering & searching
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

    list.sort((a, b) => {
      const aVal = (a[sortBy] ?? '').toString();
      const bVal = (b[sortBy] ?? '').toString();
      if (sortDir === 'asc') return aVal.localeCompare(bVal, undefined, { numeric: true });
      return bVal.localeCompare(aVal, undefined, { numeric: true });
    });

    return list;
  }, [vehicles, search, statusFilter, departmentFilter, sortBy, sortDir]);

  // pagination
  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  useEffect(() => { if (page > pageCount) setPage(1); }, [pageCount]);

  function toggleSort(key) {
    if (sortBy === key) setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(key); setSortDir('asc'); }
  }

  function exportCSV() {
    const rows = filtered.map(v => ({
      id: v.id,
      registration_number: v.registration_number,
      make: v.make,
      model: v.model,
      year: v.year,
      vin: v.vin,
      department: v.department,
      fuel_type: v.fuel_type,
      odometer: v.odometer,
      status: v.status,
      created_at: v.created_at,
    }));
    const header = Object.keys(rows[0] || {}).join(',');
    const csv = [header, ...rows.map(r => Object.values(r).map(val => `"${String(val ?? '')?.replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vehicles_export_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen flex bg-green-50">
      <SideBar />

      <main className="flex-1 p-8">
        <div className="flex items-start justify-between gap-6 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-green-900">Vehicles</h1>
            <p className="text-sm text-green-700 mt-1">Manage fleet vehicles — registration, status, and telemetry.</p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 border border-green-200 rounded bg-white text-green-700 hover:bg-green-50">
              <FaDownload /> Export
            </button>
            <button onClick={() => { setOpenAdd(true); }} className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800">
              <FaPlus /> Add Vehicle
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-green-200 p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <FaSearch className="absolute left-3 top-3 text-green-500" />
                <input
                  aria-label="Search vehicles"
                  className="w-full md:w-72 pl-10 pr-4 py-2 border rounded focus:ring-2 focus:ring-green-200"
                  placeholder="Search registration, make, model, VIN..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>

              <select
                aria-label="Filter by status"
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
                aria-label="Filter by department"
                className="px-3 py-2 border rounded bg-white text-sm"
                value={departmentFilter}
                onChange={e => { setDepartmentFilter(e.target.value); setPage(1); }}
              >
                <option value="">All departments</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm text-green-700">Rows</label>
              <select className="px-2 py-1 border rounded" value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y">
              <thead className="bg-green-50 text-left text-green-800">
                <tr>
                  <th className="px-4 py-3 cursor-pointer" onClick={() => toggleSort('registration_number')}>
                    <div className="flex items-center gap-2">
                      Registration
                      {sortBy === 'registration_number' && (sortDir === 'asc' ? <FaChevronUp/> : <FaChevronDown/>)}
                    </div>
                  </th>
                  <th className="px-4 py-3 cursor-pointer" onClick={() => toggleSort('make')}>
                    <div className="flex items-center gap-2">
                      Make / Model
                      {sortBy === 'make' && (sortDir === 'asc' ? <FaChevronUp/> : <FaChevronDown/>)}
                    </div>
                  </th>
                  <th className="px-4 py-3 cursor-pointer" onClick={() => toggleSort('year')}>Year</th>
                  <th className="px-4 py-3">Odometer</th>
                  <th className="px-4 py-3">Fuel</th>
                  <th className="px-4 py-3 cursor-pointer" onClick={() => toggleSort('status')}>Status</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center text-green-600">Loading vehicles...</td>
                  </tr>
                )}

                {!loading && paged.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="text-green-800 font-semibold">No vehicles found</div>
                      <div className="text-green-600 text-sm mt-1">Try adjusting filters or add a new vehicle.</div>
                    </td>
                  </tr>
                )}

                {!loading && paged.map(v => (
                  <tr key={v.id} className="hover:bg-green-50 border-t">
                    <td className="px-4 py-3">{v.registration_number}</td>
                    <td className="px-4 py-3">{v.make} {v.model}</td>
                    <td className="px-4 py-3">{v.year || '—'}</td>
                    <td className="px-4 py-3">{v.odometer != null ? `${Number(v.odometer).toLocaleString()} km` : '—'}</td>
                    <td className="px-4 py-3">{v.fuel_type || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${v.status === 'Active' ? 'bg-green-200 text-green-900' : v.status === 'Maintenance' ? 'bg-yellow-200 text-yellow-900' : v.status === 'Incident' ? 'bg-red-200 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                        {v.status || 'Unknown'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-green-700">
              Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}
            </div>

            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1 border rounded bg-white text-green-700 disabled:opacity-40"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Prev
              </button>
              <div className="px-3 py-1 text-sm text-green-900 font-medium">Page {page} / {pageCount}</div>
              <button
                className="px-3 py-1 border rounded bg-white text-green-700 disabled:opacity-40"
                onClick={() => setPage(p => Math.min(pageCount, p + 1))}
                disabled={page === pageCount}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>

      <Modal open={openAdd} onClose={() => setOpenAdd(false)} title="Add Vehicle">
        <VehicleForm onSuccess={() => { fetchVehicles(); setOpenAdd(false); }} onClose={() => setOpenAdd(false)} />
      </Modal>
    </div>
  );
}
// ...existing code...