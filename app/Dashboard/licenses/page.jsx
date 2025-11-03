'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import SideBar from '@/components/SideBar';
import { FaPlus, FaDownload, FaSearch, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Modal from '@/components/Modal';
import LicenseForm from '@/components/forms/LicenseForm';
import dayjs from 'dayjs';

export default function LicensesPage() {
  const [licenses, setLicenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

  async function fetchData() {
    setLoading(true);
    const [licenseRes, vehicleRes] = await Promise.all([
      supabase.from('licenses').select('*').order('expiry_date', { ascending: true }),
      supabase.from('vehicles').select('*'),
    ]);
    setLoading(false);
    if (licenseRes.data) setLicenses(licenseRes.data);
    if (vehicleRes.data) setVehicles(vehicleRes.data);
  }

  useEffect(() => { fetchData(); }, []);

  const getRawDaysLeft = (expiry) => expiry ? dayjs(expiry).diff(dayjs(), 'day') : null;
  const getDaysLeft = (expiry) => {
    const raw = getRawDaysLeft(expiry);
    if (raw == null) return '—';
    return Math.max(0, raw);
  };

  const expiredCount = useMemo(() => licenses.filter(l => getRawDaysLeft(l.expiry_date) < 0).length, [licenses]);
  const dueSoonCount = useMemo(() => licenses.filter(l => {
    const raw = getRawDaysLeft(l.expiry_date);
    return raw >= 0 && raw <= 14;
  }).length, [licenses]);
  const currentCount = useMemo(() => licenses.filter(l => getRawDaysLeft(l.expiry_date) > 14).length, [licenses]);

  const filtered = useMemo(() => {
    let list = licenses.slice();

    if (statusFilter) {
      list = list.filter(l => {
        const raw = getRawDaysLeft(l.expiry_date);
        if (statusFilter === 'Expired') return raw < 0;
        if (statusFilter === 'Due Soon') return raw >= 0 && raw <= 14;
        if (statusFilter === 'Current') return raw > 14;
        return true;
      });
    }

    const q = (search || '').trim().toLowerCase();
    if (q) {
      list = list.filter(l => {
        const v = vehicles.find(v => v.id === l.vehicle_id);
        const reg = v?.registration_number || '';
        const make = v?.make || '';
        const model = v?.model || '';
        return `${reg} ${make} ${model}`.toLowerCase().includes(q);
      });
    }

    return list;
  }, [licenses, vehicles, search, statusFilter]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  useEffect(() => { if (page > pageCount) setPage(1); }, [pageCount]);
  const paged = useMemo(() => filtered.slice((page - 1) * perPage, page * perPage), [filtered, page, perPage]);

  function exportCSV() {
    if (!paged || paged.length === 0) { alert('No records to export.'); return; }
    const rows = paged.map(l => {
      const vehicle = vehicles.find(v => v.id === l.vehicle_id) || {};
      const raw = getRawDaysLeft(l.expiry_date);
      const daysLeft = getDaysLeft(l.expiry_date);
      const statusLabel = (typeof raw === 'number')
        ? (raw < 0 ? 'Expired' : raw <= 14 ? 'Due Soon' : 'Current')
        : '—';
      return {
        id: l.id,
        vehicle: `${vehicle.make || ''} ${vehicle.model || ''}`.trim(),
        registration: vehicle.registration_number || '',
        expiry_date: l.expiry_date || '',
        days_left: typeof daysLeft === 'number' ? daysLeft : '',
        renewal_cost: l.renewal_cost ?? '',
        status: statusLabel,
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
    a.download = `licenses_export_${new Date().toISOString().slice(0, 10)}.csv`;
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
            <h1 className="text-3xl font-bold text-green-800">License Renewals</h1>
            <p className="text-sm text-green-600">Manage expiry dates and renewal records</p>
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
              <FaPlus className="mr-2" /> Record Renewal
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm text-center">
            <div className="text-sm text-green-700">Total Licenses</div>
            <div className="text-3xl font-bold text-green-900">{licenses.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm text-center">
            <div className="text-sm text-green-700">Expired</div>
            <div className="text-3xl font-bold text-red-800">{expiredCount}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm text-center">
            <div className="text-sm text-green-700">Due Soon</div>
            <div className="text-3xl font-bold text-orange-800">{dueSoonCount}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm text-center">
            <div className="text-sm text-green-700">Current</div>
            <div className="text-3xl font-bold text-blue-800">{currentCount}</div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-green-400" />
              <input
                aria-label="Search licenses"
                className="pl-10 pr-4 py-2 border rounded-md w-64 focus:ring-2 focus:ring-green-200 bg-white"
                placeholder="Search registration, make, model..."
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
              <option value="Expired">Expired</option>
              <option value="Due Soon">Due Soon</option>
              <option value="Current">Current</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded shadow border border-green-200 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-green-50 text-green-800">
              <tr>
                <th className="px-4 py-3 text-left">Vehicle</th>
                <th className="px-4 py-3 text-left">Registration</th>
                <th className="px-4 py-3 text-left">Expiry Date</th>
                <th className="px-4 py-3 text-left">Days Left</th>
                <th className="px-4 py-3 text-left">Renewal Cost</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-green-600">Loading licenses...</td></tr>
              )}
              {!loading && paged.length === 0 && (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-green-600">No license records found.</td></tr>
              )}
              {!loading && paged.map((l, i) => {
                const vehicle = vehicles.find(v => v.id === l.vehicle_id);
                const raw = getRawDaysLeft(l.expiry_date);
                const daysLeft = getDaysLeft(l.expiry_date);
                const statusLabel = (typeof raw === 'number') ? (raw < 0 ? 'Expired' : raw <= 14 ? 'Due Soon' : 'Current') : '—';
                return (
                  <tr key={l.id || i} className="border-t hover:bg-green-50">
                    <td className="px-4 py-3">{vehicle ? `${vehicle.make} ${vehicle.model}` : 'Unknown'}</td>
                    <td className="px-4 py-3">{vehicle?.registration_number || '—'}</td>
                    <td className="px-4 py-3">{l.expiry_date || '—'}</td>
                    <td className="px-4 py-3">{typeof daysLeft === 'number' ? `${daysLeft} days` : '—'}</td>
                    <td className="px-4 py-3">R {l.renewal_cost?.toLocaleString() || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${statusLabel === 'Expired' ? 'bg-red-200 text-red-800' : statusLabel === 'Due Soon' ? 'bg-orange-200 text-orange-800' : 'bg-blue-200 text-blue-800'}`}>{statusLabel}</span>
                    </td>
                  </tr>
                );
              })}
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
        <Modal open={openAdd} onClose={() => setOpenAdd(false)} title="Add License">
          <LicenseForm onSuccess={() => { fetchData(); setOpenAdd(false); }} onClose={() => setOpenAdd(false)} />
        </Modal>
      </main>
    </div>
  );
}
