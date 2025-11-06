'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import SideBar from '@/components/SideBar';
import {
  FaPlus, FaDownload, FaSearch, FaChevronLeft, FaChevronRight, FaCarSide
} from 'react-icons/fa';
import Modal from '@/components/Modal';
import LicenseForm from '@/components/Forms/LicenseForm';
import dayjs from 'dayjs';

export default function LicensesPage() {
  const [licenses, setLicenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [perPage, setPerPage] = useState(6);
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
            <p className="text-sm text-green-600">Track, monitor, and manage renewals efficiently</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportCSV}
              className="flex items-center bg-white border border-green-300 text-green-700 px-4 py-2 rounded-md hover:bg-green-100 transition"
            >
              <FaDownload className="mr-2" /> Export
            </button>
            <button
              onClick={() => setOpenAdd(true)}
              className="flex items-center bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 transition"
            >
              <FaPlus className="mr-2" /> Record Renewal
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Licenses" value={licenses.length} color="text-green-900" />
          <StatCard label="Expired" value={expiredCount} color="text-green-900" />
          <StatCard label="Due Soon" value={dueSoonCount} color="text-green-900" />
          <StatCard label="Current" value={currentCount} color="text-green-900" />
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
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

        {/* License Cards */}
        {loading && (
          <div className="text-center text-green-600 py-12">Loading licenses...</div>
        )}
        {!loading && paged.length === 0 && (
          <div className="text-center text-green-600 py-12">No license records found.</div>
        )}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paged.map((l, i) => {
              const vehicle = vehicles.find(v => v.id === l.vehicle_id);
              const raw = getRawDaysLeft(l.expiry_date);
              const daysLeft = getDaysLeft(l.expiry_date);
              const statusLabel = (typeof raw === 'number')
                ? (raw < 0 ? 'Expired' : raw <= 14 ? 'Due Soon' : 'Current')
                : '—';
              const statusColor = statusLabel === 'Expired'
                ? 'bg-red-100 text-red-800'
                : statusLabel === 'Due Soon'
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-blue-100 text-blue-800';

              return (
                <div
                  key={l.id || i}
                  className="bg-white border border-green-100 rounded-xl shadow-sm hover:shadow-md transition p-5 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 text-green-700 p-3 rounded-full">
                        <FaCarSide />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-green-900">
                          {vehicle ? `${vehicle.make} ${vehicle.model}` : 'Unknown Vehicle'}
                        </h2>
                        <p className="text-sm text-green-700">{vehicle?.registration_number || '—'}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-y-2 text-sm text-green-700 mt-2">
                    <div>Expiry Date:</div>
                    <div className="font-medium text-green-900">{l.expiry_date || '—'}</div>

                    <div>Days Left:</div>
                    <div className="font-medium text-green-900">
                      {typeof daysLeft === 'number' ? `${daysLeft} days` : '—'}
                    </div>

                    <div>Renewal Cost:</div>
                    <div className="font-medium text-green-900">
                      R {l.renewal_cost?.toLocaleString() || '—'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && total > 0 && (
          <div className="flex items-center justify-between px-2 py-6 mt-6 border-t border-green-100">
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
              <select
                className="px-2 py-1 border rounded"
                value={perPage}
                onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}
              >
                <option value={6}>6</option>
                <option value={12}>12</option>
                <option value={24}>24</option>
              </select>
              <div className="text-sm text-green-600">
                Total: <span className="font-medium text-green-800">{total}</span>
              </div>
            </div>
          </div>
        )}

        {/* Modal */}
        <Modal open={openAdd} onClose={() => setOpenAdd(false)} title="Add License">
          <LicenseForm onSuccess={() => { fetchData(); setOpenAdd(false); }} onClose={() => setOpenAdd(false)} />
        </Modal>
      </main>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm text-center hover:shadow-md transition">
      <div className="text-sm text-green-700">{label}</div>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
