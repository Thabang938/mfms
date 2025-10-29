// ...existing code...
'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import SideBar from '@/components/SideBar';
import { FaPlus, FaSearch, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Modal from '@/components/Modal';
import DriverForm from '@/components/forms/DriverForm';

export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [loading, setLoading] = useState(false);

  // table controls
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  async function fetchData() {
    setLoading(true);
    const [driverRes, userRes, vehicleRes] = await Promise.all([
      supabase.from('drivers').select('*'),
      supabase.from('users').select('*').eq('role', 'Driver'),
      supabase.from('vehicles').select('*'),
    ]);
    setLoading(false);
    if (driverRes.data) setDrivers(driverRes.data);
    if (userRes.data) setUsers(userRes.data);
    if (vehicleRes.data) setVehicles(vehicleRes.data);
  }

  useEffect(() => { fetchData(); }, []);

  const getUserName = (id) => users.find(u => u.id === id)?.name || 'Unknown';
  const getVehicleLabel = (id) => {
    const v = vehicles.find(vv => vv.id === id);
    return v ? `MV-${v.registration_number}` : 'Unassigned';
  };

  // unique department values for filter dropdown
  const departments = useMemo(() => {
    const s = new Set();
    drivers.forEach(d => d.department && s.add(d.department));
    vehicles.forEach(v => v.department && s.add(v.department));
    return Array.from(s).sort();
  }, [drivers, vehicles]);

  // summary counts
  const summary = useMemo(() => ({
    total: drivers.length,
    active: drivers.filter(d => d.status === 'Active').length,
    training: drivers.filter(d => d.status === 'In Training').length,
    unassigned: drivers.filter(d => !d.assigned_vehicle_id).length,
  }), [drivers]);

  // filtered & searched list
  const filtered = useMemo(() => {
    let list = drivers.slice();

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d => {
        const name = getUserName(d.user_id).toLowerCase();
        const license = (d.license_number || '').toLowerCase();
        const dept = (d.department || '').toLowerCase();
        const vehicle = (vehicles.find(v => v.id === d.assigned_vehicle_id)?.registration_number || '').toLowerCase();
        return name.includes(q) || license.includes(q) || dept.includes(q) || vehicle.includes(q);
      });
    }

    if (statusFilter) list = list.filter(d => d.status === statusFilter);
    if (departmentFilter) list = list.filter(d => d.department === departmentFilter);

    return list;
  }, [drivers, users, vehicles, search, statusFilter, departmentFilter]);

  // pagination
  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  useEffect(() => { if (page > pageCount) setPage(1); }, [pageCount]); // reset page if out of range

  const paged = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page, perPage]);

  return (
    <div className="min-h-screen flex bg-green-50">
      <SideBar />

      <main className="flex-1 p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-green-800">Driver Management</h1>
            <p className="text-sm text-green-600">Register drivers, assign vehicles, and monitor status.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-green-400" />
              <input
                aria-label="Search drivers"
                className="pl-10 pr-4 py-2 border rounded-md w-64 focus:ring-2 focus:ring-green-200 bg-white"
                placeholder="Search name, license, vehicle..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>

            <select className="px-3 py-2 border rounded bg-white text-sm" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All statuses</option>
              <option value="Active">Active</option>
              <option value="In Training">In Training</option>
              <option value="Suspended">Suspended</option>
            </select>

            <select className="px-3 py-2 border rounded bg-white text-sm" value={departmentFilter} onChange={e => { setDepartmentFilter(e.target.value); setPage(1); }}>
              <option value="">All departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            <button onClick={() => setOpenAdd(true)} className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 transition">
              <FaPlus /> Register Driver
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm">
            <div className="text-sm text-green-700">Total Drivers</div>
            <div className="text-2xl font-bold text-green-900">{summary.total}</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm">
            <div className="text-sm text-green-700">Active</div>
            <div className="text-2xl font-bold text-green-900">{summary.active}</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm">
            <div className="text-sm text-green-700">In Training</div>
            <div className="text-2xl font-bold text-green-900">{summary.training}</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm">
            <div className="text-sm text-green-700">Unassigned</div>
            <div className="text-2xl font-bold text-green-900">{summary.unassigned}</div>
          </div>
        </div>

        <div className="bg-white rounded shadow border border-green-200">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-green-50 text-green-800">
                <tr>
                  <th className="px-4 py-3 text-left">Driver ID</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">License</th>
                  <th className="px-4 py-3 text-left">Department</th>
                  <th className="px-4 py-3 text-left">Assigned Vehicle</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr><td colSpan="6" className="px-6 py-12 text-center text-green-600">Loading drivers...</td></tr>
                )}

                {!loading && paged.length === 0 && (
                  <tr><td colSpan="6" className="px-6 py-12 text-center text-green-600">No drivers found.</td></tr>
                )}

                {!loading && paged.map((d, i) => (
                  <tr key={d.id || i} className="border-t hover:bg-green-50">
                    <td className="px-4 py-3">{`DRV-${String((page - 1) * perPage + i + 1).padStart(3,'0')}`}</td>
                    <td className="px-4 py-3">{getUserName(d.user_id)}</td>
                    <td className="px-4 py-3">{d.license_number || '—'}</td>
                    <td className="px-4 py-3">{d.department || '—'}</td>
                    <td className="px-4 py-3">{getVehicleLabel(d.assigned_vehicle_id)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${d.status === 'Active' ? 'bg-green-200 text-green-800' : d.status === 'In Training' ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-200 text-gray-800'}`}>{d.status || '—'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
      </main>

      <Modal open={openAdd} onClose={() => setOpenAdd(false)} title="Register Driver">
        <DriverForm onSuccess={() => { fetchData(); setOpenAdd(false); }} onClose={() => setOpenAdd(false)} />
      </Modal>
    </div>
  );
}
// ...existing code...