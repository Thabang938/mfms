'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import SideBar from '@/components/SideBar';
import { FaPlus, FaSearch, FaChevronLeft, FaChevronRight, FaDownload } from 'react-icons/fa';
import Modal from '@/components/Modal';
import AccidentForm from '../../../components/forms/AccidentForm';

export default function AccidentsPage() {
  const [accidents, setAccidents] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

  async function fetchData() {
    setLoading(true);
    const [accidentRes, vehicleRes, driverRes] = await Promise.all([
      supabase.from('accidents').select('*').order('date', { ascending: false }),
      supabase.from('vehicles').select('*'),
      supabase.from('drivers').select('*'),
    ]);
    setLoading(false);
    if (accidentRes.data) setAccidents(accidentRes.data);
    if (vehicleRes.data) setVehicles(vehicleRes.data);
    if (driverRes.data) setDrivers(driverRes.data);
  }

  useEffect(() => { fetchData(); }, []);

  const getVehicleLabel = (id) => {
    const v = vehicles.find(v => v.id === id);
    return v ? `${v.make} ${v.model} (${v.year || '—'})` : 'Unknown Vehicle';
  };

  const getDriverName = (id) => {
    const d = drivers.find(d => d.id === id);
    return d ? d.license_number || d.id : 'Unknown Driver';
  };

  const filtered = useMemo(() => {
    if (!search) return accidents;
    const q = search.trim().toLowerCase();
    return accidents.filter(a => {
      const vehicle = vehicles.find(v => v.id === a.vehicle_id);
      const driver = drivers.find(d => d.id === a.driver_id);
      const vehicleLabel = vehicle ? `${vehicle.make} ${vehicle.model} ${vehicle.year || ''}` : '';
      const driverLabel = driver ? driver.license_number || '' : '';
      return (
        `${a.incident_id || ''} ${vehicleLabel} ${a.location || ''} ${driverLabel} ${a.status || ''}`
          .toLowerCase()
          .includes(q)
      );
    });
  }, [accidents, vehicles, drivers, search]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  useEffect(() => { if (page > pageCount) setPage(1); }, [pageCount]);
  const paged = useMemo(() => filtered.slice((page - 1) * perPage, page * perPage), [filtered, page, perPage]);

  const summary = useMemo(() => ({
    total: accidents.length,
    active: accidents.filter(a => a.status === 'Under Review' || a.status === 'Filed').length,
    claims: accidents.filter(a => a.insurance_claim).length,
    cost: accidents.reduce((sum, a) => sum + (a.estimated_cost || 0), 0),
  }), [accidents]);

  function exportCSV() {
    if (!paged || paged.length === 0) { alert('No records to export.'); return; }
    const rows = paged.map((a) => {
      const vehicle = vehicles.find(v => v.id === a.vehicle_id) || {};
      const driver = drivers.find(d => d.id === a.driver_id) || {};
      return {
        incident_id: a.incident_id || '',
        date: a.date || '',
        vehicle: `${vehicle.make || ''} ${vehicle.model || ''}`.trim(),
        registration: vehicle.registration_number || '',
        location: a.location || '',
        driver: driver.license_number || driver.id || '',
        status: a.status || '',
        estimated_cost: a.estimated_cost ?? '',
        insurance_claim: a.insurance_claim ? 'Yes' : 'No',
      };
    });

    const header = Object.keys(rows[0]).join(',');
    const csv = [header, ...rows.map(r =>
      Object.values(r)
        .map(val => `"${String(val ?? '')?.replace(/"/g, '""')}"`)
        .join(',')
    )].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accidents_export_${new Date().toISOString().slice(0, 10)}.csv`;
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
            <h1 className="text-3xl font-bold text-green-800">Accident Reporting</h1>
            <p className="text-sm text-green-600">Track and manage vehicle incidents and claims</p>
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
              <FaPlus className="mr-2" /> Report Accident
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm text-center">
            <div className="text-sm text-green-700">Total Incidents</div>
            <div className="text-2xl font-bold text-green-900">{summary.total}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm text-center">
            <div className="text-sm text-green-700">Active Cases</div>
            <div className="text-2xl font-bold text-green-900">{summary.active}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm text-center">
            <div className="text-sm text-green-700">Claims</div>
            <div className="text-2xl font-bold text-green-900">{summary.claims}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm text-center">
            <div className="text-sm text-green-700">Total Estimated Cost</div>
            <div className="text-2xl font-bold text-green-900">R {summary.cost.toLocaleString()}</div>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-green-400" />
              <input
                aria-label="Search accidents"
                className="pl-10 pr-4 py-2 border rounded-md w-64 focus:ring-2 focus:ring-green-200 bg-white"
                placeholder="Search ID, vehicle, driver, location..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded shadow border border-green-200 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-green-50 text-green-800">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Vehicle</th>
                <th className="px-4 py-3 text-left">Location</th>
                <th className="px-4 py-3 text-left">Driver</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Estimated Cost</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-green-600">Loading accident reports...</td></tr>
              )}
              {!loading && paged.length === 0 && (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-green-600">No accident reports found.</td></tr>
              )}
              {!loading && paged.map((a, i) => (
                <tr key={a.id || i} className="border-t hover:bg-green-50">
                  <td className="px-4 py-3">{a.incident_id || `INC-${i+1}`}</td>
                  <td className="px-4 py-3">{a.date || '—'}</td>
                  <td className="px-4 py-3">{getVehicleLabel(a.vehicle_id)}</td>
                  <td className="px-4 py-3">{a.location || '—'}</td>
                  <td className="px-4 py-3">{getDriverName(a.driver_id)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${a.status === 'Under Review' ? 'bg-yellow-200 text-yellow-800' : a.status === 'Filed' ? 'bg-blue-200 text-blue-800' : a.status === 'Resolved' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">R {Number(a.estimated_cost || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
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
        <Modal open={openAdd} onClose={() => setOpenAdd(false)} title="Report Accident">
          <AccidentForm onSuccess={() => { fetchData(); setOpenAdd(false); }} onClose={() => setOpenAdd(false)} />
        </Modal>
      </main>
    </div>
  );
}
