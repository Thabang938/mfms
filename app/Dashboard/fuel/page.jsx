'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import SideBar from '@/components/SideBar';
import Modal from '@/components/Modal';
import FuelForm from '../../../components/forms/FuelForm';
import { FaPlus, FaSearch, FaDownload } from 'react-icons/fa';
// ...existing code...

export default function FuelPage() {
  const [fuelLogs, setFuelLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [loading, setLoading] = useState(false);

  // UI state
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [statusFilter, setStatusFilter] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

  // Deterministic currency formatter to avoid server/client locale mismatch
  const formatCurrencyFixed = (value) => {
    return `R ${Number(value || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  async function fetchData() {
    setLoading(true);
    const [fuelRes, vehicleRes] = await Promise.all([
      supabase.from('fuel_logs').select('*').order('purchase_date', { ascending: false }),
      supabase.from('vehicles').select('*'),
    ]);
    setLoading(false);
    if (fuelRes.data) setFuelLogs(fuelRes.data);
    if (vehicleRes.data) setVehicles(vehicleRes.data);
  }

  useEffect(() => { fetchData(); }, []);

  const getVehicleLabel = (id) => {
    const v = vehicles.find(v => v.id === id);
    return v ? `MV-${v.registration_number} — ${v.make || ''} ${v.model || ''}`.trim() : 'Unknown';
  };

  // Filtered list by search/date/status
  const filtered = useMemo(() => {
    const from = dateFrom || '';
    const to = dateTo || '';
    const q = (search || '').trim().toLowerCase();
    return fuelLogs.filter(f => {
      if (statusFilter && (f.status || '') !== statusFilter) return false;
      if (from && f.purchase_date && f.purchase_date < from) return false;
      if (to && f.purchase_date && f.purchase_date > to) return false;
      if (!q) return true;
      const vehicle = getVehicleLabel(f.vehicle_id).toLowerCase();
      return (f.transaction_id || '').toLowerCase().includes(q) ||
             vehicle.includes(q) ||
             (f.station || '').toLowerCase().includes(q);
    });
  }, [fuelLogs, search, dateFrom, dateTo, statusFilter, vehicles]);

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

  function exportCSV() {
    if (!filtered.length) return;
    const rows = filtered.map(r => ({
      transaction_id: r.transaction_id,
      purchase_date: r.purchase_date,
      vehicle: getVehicleLabel(r.vehicle_id),
      liters: r.liters,
      cost: r.cost,
      station: r.station,
      odometer: r.odometer,
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
  }

  return (
    <div className="min-h-screen flex bg-green-50">
      <SideBar />

      <main className="flex-1 p-8">
        <div className="flex items-start justify-between gap-6 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-green-900">Fuel Tracking</h1>
            <p className="text-sm text-green-600 mt-1">Track fuel purchases, cost and fleet consumption.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-green-400" />
              <input
                className="pl-10 pr-4 py-2 border rounded-md w-72 focus:ring-2 focus:ring-green-200 bg-white"
                placeholder="Search transaction, vehicle, station..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                aria-label="Search fuel logs"
              />
            </div>

            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} className="px-3 py-2 border rounded bg-white text-sm" />
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} className="px-3 py-2 border rounded bg-white text-sm" />

            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 border rounded bg-white text-sm">
              <option value="">All</option>
              <option value="Posted">Posted</option>
              <option value="Pending">Pending</option>
              <option value="Reconciled">Reconciled</option>
            </select>

            <button onClick={() => setOpenAdd(true)} className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800">
              <FaPlus /> Add Fuel
            </button>
            <button onClick={exportCSV} className="flex items-center gap-2 bg-white border border-green-200 text-green-700 px-3 py-2 rounded hover:bg-green-50">
              <FaDownload /> Export
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm">
            <div className="text-sm text-green-700">Records (range)</div>
            <div className="text-2xl font-bold text-green-900">{summary.records}</div>
            <div className="text-xs text-green-500 mt-2">From {dateFrom} to {dateTo}</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm">
            <div className="text-sm text-green-700">Total Liters</div>
            <div className="text-2xl font-bold text-green-900">{Number(summary.totalLiters || 0).toLocaleString()} L</div>
            <div className="text-xs text-green-500 mt-2">Fleet consumption in range</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm">
            <div className="text-sm text-green-700">Total Cost</div>
            <div className="text-2xl font-bold text-green-900">{formatCurrencyFixed(summary.totalCost)}</div>
            <div className="text-xs text-green-500 mt-2">Sum of fuel spending</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm">
            <div className="text-sm text-green-700">Avg Price / L</div>
            <div className="text-2xl font-bold text-green-900">{summary.avgPrice ? `R ${summary.avgPrice.toFixed(2)}` : '—'}</div>
            <div className="text-xs text-green-500 mt-2">Weighted average price</div>
          </div>
        </div>

        <div className="bg-white rounded shadow border border-green-200">
          <div className="overflow-x-auto">
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
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {loading && <tr><td colSpan="8" className="px-6 py-12 text-center text-green-600">Loading fuel logs...</td></tr>}
                {!loading && paged.length === 0 && <tr><td colSpan="8" className="px-6 py-12 text-center text-green-600">No records found.</td></tr>}

                {!loading && paged.map((log, i) => (
                  <tr key={log.id || i} className="border-t hover:bg-green-50">
                    <td className="px-4 py-3">{log.transaction_id || `FUEL-${(page - 1) * perPage + i + 1}`}</td>
                    <td className="px-4 py-3">{log.purchase_date || '—'}</td>
                    <td className="px-4 py-3">{getVehicleLabel(log.vehicle_id)}</td>
                    <td className="px-4 py-3">{log.liters ?? '—'} L</td>
                    <td className="px-4 py-3">{formatCurrencyFixed(log.cost)}</td>
                    <td className="px-4 py-3">{log.odometer ? `${Number(log.odometer).toLocaleString()} km` : '—'}</td>
                    <td className="px-4 py-3">{log.station || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${log.status === 'Posted' ? 'bg-green-200 text-green-800' : log.status === 'Pending' ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-200 text-gray-800'}`}>
                        {log.status || '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t bg-white">
            <div className="flex items-center gap-3">
              <button
                className="px-3 py-1 border rounded bg-white text-green-700 disabled:opacity-40"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Prev
              </button>

              <div className="text-sm text-green-900 font-medium">Page {page} / {pageCount}</div>

              <button
                className="px-3 py-1 border rounded bg-white text-green-700 disabled:opacity-40"
                onClick={() => setPage(p => Math.min(pageCount, p + 1))}
                disabled={page === pageCount}
              >
                Next
              </button>
            </div>

            <div className="flex items-center gap-4">
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

      <Modal open={openAdd} onClose={() => setOpenAdd(false)} title="Add Fuel Record">
        <FuelForm onSuccess={() => { fetchData(); setOpenAdd(false); }} onClose={() => setOpenAdd(false)} />
      </Modal>
    </div>
  );
}