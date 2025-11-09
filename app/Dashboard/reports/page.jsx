'use client';
import { useEffect, useMemo, useState } from 'react';
import SideBar from '@/components/SideBar';
import Modal from '@/components/Modal';
import { supabaseClient } from '@/lib/supabaseClient';
import { formatCurrency } from '@/lib/utils';
import { FaFileExport } from 'react-icons/fa';
import { Line, Bar } from 'react-chartjs-2';
import 'chart.js/auto';

const REPORTS = [
  { id: 'service_history', title: 'Service History', desc: 'Maintenance and service records' },
  { id: 'cost_analysis', title: 'Cost Analysis', desc: 'Maintenance + fuel cost breakdown' },
  { id: 'accident_trends', title: 'Accident Trends', desc: 'Incidents by month / severity' },
  { id: 'tyre_usage', title: 'Tyre Usage', desc: 'Tyre replacements and conditions' },
  { id: 'license_compliance', title: 'License Compliance', desc: 'Licenses expiring / overdue' },
  { id: 'fuel_efficiency', title: 'Fuel Efficiency', desc: 'Fleet fuel consumption stats' },
  { id: 'driver_performance', title: 'Driver Performance', desc: 'Driver-related metrics' },
  { id: 'vehicle_utilization', title: 'Vehicle Utilization', desc: 'Usage and availability' },
];

export default function ReportsPage() {
  const [active, setActive] = useState('service_history');
  const [startDate, setStartDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [meta, setMeta] = useState({});
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, startDate, endDate]);

  async function loadReport() {
    setLoading(true);
    try {
      const from = startDate;
      const to = endDate;
      switch (active) {
        case 'service_history': await loadServiceHistory(from, to); break;
        case 'cost_analysis': await loadCostAnalysis(from, to); break;
        case 'accident_trends': await loadAccidentTrends(from, to); break;
        case 'tyre_usage': await loadTyreUsage(from, to); break;
        case 'license_compliance': await loadLicenseCompliance(from, to); break;
        case 'fuel_efficiency': await loadFuelEfficiency(from, to); break;
        case 'driver_performance': await loadDriverPerformance(from, to); break;
        case 'vehicle_utilization': await loadVehicleUtilization(from, to); break;
        default: setReportData([]); setMeta({}); break;
      }
    } catch (err) {
      console.error(err);
      setReportData([]);
      setMeta({ error: err?.message || String(err) });
    } finally {
      setLoading(false);
    }
  }

  async function loadServiceHistory(from, to) {
    const [{ data: services = [] }, { data: vehicles = [] }] = await Promise.all([
      supabaseClient.from('services').select('*').gte('service_date', from).lte('service_date', to).order('service_date', { ascending: false }),
      supabaseClient.from('vehicles').select('id, registration_number, make, model'),
    ]);
    const vehMap = Object.fromEntries((vehicles || []).map(v => [v.id, v]));
    const rows = (services || []).map(s => ({
      id: s.id,
      date: s.service_date,
      vehicle: vehMap[s.vehicle_id] ? `${vehMap[s.vehicle_id].registration_number} — ${vehMap[s.vehicle_id].make} ${vehMap[s.vehicle_id].model}` : s.vehicle_id,
      mileage: s.mileage,
      cost: s.maintenance_cost ?? s.cost ?? 0,
      technician: s.technician,
      status: s.status,
      notes: s.notes,
    }));
    setReportData(rows);
    setMeta({ total: rows.length, totalCost: rows.reduce((a, b) => a + (Number(b.cost) || 0), 0) });
  }

  async function loadCostAnalysis(from, to) {
    const [servicesRes, fuelRes] = await Promise.all([
      supabaseClient.from('services').select('*').gte('service_date', from).lte('service_date', to),
      supabaseClient.from('fuel_logs').select('*').gte('purchase_date', from).lte('purchase_date', to),
    ]);
    const services = servicesRes.data || [];
    const fuel = fuelRes.data || [];
    const serviceCost = services.reduce((s, r) => s + (Number(r.maintenance_cost ?? r.cost) || 0), 0);
    const fuelCost = fuel.reduce((s, r) => s + (Number(r.cost) || 0), 0);
    setReportData([
      { category: 'Maintenance', amount: serviceCost, count: services.length },
      { category: 'Fuel', amount: fuelCost, count: fuel.length },
    ]);
    setMeta({ serviceCost, fuelCost, total: serviceCost + fuelCost });
  }

  async function loadAccidentTrends(from, to) {
    const res = await supabaseClient.from('accidents').select('*').gte('date', from).lte('date', to).order('date', { ascending: false });
    const accidents = res.data || [];
    const byMonth = {};
    const statusCounts = {};
    accidents.forEach(a => {
      const m = (a.date || '').slice(0, 7) || 'unknown';
      byMonth[m] = (byMonth[m] || 0) + 1;
      statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
    });
    const trend = Object.keys(byMonth).sort().map(k => ({ period: k, count: byMonth[k] }));
    setReportData(trend);
    setMeta({ total: accidents.length, statusCounts });
  }

  async function loadTyreUsage(from, to) {
    const [tiresRes, vehiclesRes] = await Promise.all([
      supabaseClient.from('tires').select('*').gte('install_date', from).lte('install_date', to).order('install_date', { ascending: false }),
      supabaseClient.from('vehicles').select('id, registration_number'),
    ]);
    const tires = tiresRes.data || [];
    const vehicles = vehiclesRes.data || [];
    const vehMap = Object.fromEntries(vehicles.map(v => [v.id, v.registration_number]));
    const rows = tires.map(t => ({
      id: t.id,
      vehicle: vehMap[t.vehicle_id] || t.vehicle_id,
      position: t.position,
      brand: t.brand,
      serial: t.serial_number,
      install_date: t.install_date,
      condition: t.condition,
      cost: t.cost,
    }));
    setReportData(rows);
    setMeta({ total: rows.length, byCondition: rows.reduce((acc, r) => { acc[r.condition] = (acc[r.condition] || 0) + 1; return acc; }, {}) });
  }

  async function loadLicenseCompliance(from, to) {
    const [licensesRes, vehiclesRes] = await Promise.all([
      supabaseClient.from('licenses').select('*').gte('expiry_date', from).lte('expiry_date', to).order('expiry_date', { ascending: true }),
      supabaseClient.from('vehicles').select('id, registration_number'),
    ]);
    const licenses = licensesRes.data || [];
    const vehicles = vehiclesRes.data || [];
    const vehMap = Object.fromEntries(vehicles.map(v => [v.id, v.registration_number]));
    const rows = licenses.map(l => ({ id: l.id, vehicle: vehMap[l.vehicle_id] || l.vehicle_id, expiry_date: l.expiry_date, renewal_cost: l.renewal_cost, payment_status: l.payment_status }));
    setReportData(rows);
    setMeta({ total: rows.length, expiringThisPeriod: rows.length });
  }

  async function loadFuelEfficiency(from, to) {
    const [fuelRes, servicesRes] = await Promise.all([
      supabaseClient.from('fuel_logs').select('*').gte('purchase_date', from).lte('purchase_date', to),
      supabaseClient.from('services').select('*').gte('service_date', from).lte('service_date', to),
    ]);
    const fuel = fuelRes.data || [];
    const services = servicesRes.data || [];
    const totalLiters = fuel.reduce((s, f) => s + (Number(f.liters) || 0), 0);
    const totalFuelCost = fuel.reduce((s, f) => s + (Number(f.cost) || 0), 0);
    setReportData([{ metric: 'Total Liters', value: totalLiters }, { metric: 'Total Fuel Cost', value: totalFuelCost }]);
    setMeta({ totalLiters, totalFuelCost, fuelRecords: fuel.length, serviceRecords: services.length });
  }

  async function loadDriverPerformance(from, to) {
    const [driversRes, accidentsRes, servicesRes] = await Promise.all([
      supabaseClient.from('drivers').select('*'),
      supabaseClient.from('accidents').select('*').gte('date', from).lte('date', to),
      supabaseClient.from('services').select('*').gte('service_date', from).lte('service_date', to),
    ]);
    const drivers = driversRes.data || [];
    const accidents = accidentsRes.data || [];
    const services = servicesRes.data || [];
    const driverMap = Object.fromEntries(drivers.map(d => [d.id, { name: d.license_number || d.id }]));
    const summary = drivers.map(d => {
      const id = d.id;
      return {
        driver: driverMap[id]?.name || id,
        incidents: accidents.filter(a => a.driver_id === id).length,
        services: services.filter(s => s.technician === (d.license_number || '')).length,
        status: d.status,
      };
    });
    setReportData(summary);
    setMeta({ drivers: drivers.length });
  }

  async function loadVehicleUtilization(from, to) {
    const [vehiclesRes, servicesRes, fuelRes] = await Promise.all([
      supabaseClient.from('vehicles').select('*'),
      supabaseClient.from('services').select('*').gte('service_date', from).lte('service_date', to),
      supabaseClient.from('fuel_logs').select('*').gte('purchase_date', from).lte('purchase_date', to),
    ]);
    const vehicles = vehiclesRes.data || [];
    const services = servicesRes.data || [];
    const fuel = fuelRes.data || [];
    const rows = vehicles.map(v => {
      const sid = services.filter(s => s.vehicle_id === v.id).length;
      const fid = fuel.filter(f => f.vehicle_id === v.id).length;
      return { vehicle: `${v.registration_number} — ${v.make} ${v.model}`, services: sid, fuelEntries: fid, odometer: v.odometer || 0, status: v.status };
    });
    setReportData(rows);
    setMeta({ totalVehicles: rows.length });
  }

  function exportCSV(title) {
    if (!reportData || reportData.length === 0) return;
    const keys = Object.keys(reportData[0]);
    const header = keys.join(',');
    const rows = reportData.map(r => keys.map(k => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(','));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_${startDate}_${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const chartConfig = useMemo(() => {
    if (active === 'accident_trends' && reportData.length) {
      const labels = reportData.map(r => r.period);
      const data = reportData.map(r => r.count);
      return {
        type: 'line',
        props: {
          data: {
            labels,
            datasets: [
              {
                label: 'Incidents',
                data,
                borderColor: '#166534',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                fill: true,
                tension: 0.2,
              },
            ],
          },
          options: { responsive: true, plugins: { legend: { display: false } } },
        },
      };
    }

    if (active === 'cost_analysis' && reportData.length) {
      const labels = reportData.map(r => r.category);
      const data = reportData.map(r => r.amount);
      return {
        type: 'bar',
        props: {
          data: {
            labels,
            datasets: [
              {
                label: 'Cost (ZAR)',
                data,
                backgroundColor: ['#16a34a', '#10b981'],
              },
            ],
          },
          options: { responsive: true, plugins: { legend: { display: false } } },
        },
      };
    }

    return null;
  }, [active, reportData]);

  const title = REPORTS.find(r => r.id === active)?.title || 'Report';

  return (
    <div className="min-h-screen flex bg-green-50">
      <SideBar />

      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-green-800">Reports</h1>
            <p className="text-sm text-green-600">Run operational reports for the fleet. Select a report and date range.</p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm text-green-700">From</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-3 py-2 border rounded" />
            <label className="text-sm text-green-700">To</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-3 py-2 border rounded" />
            <button onClick={() => { loadReport(); }} className="px-4 py-2 bg-white border border-green-200 rounded text-green-700 hover:bg-green-50">Refresh</button>
            <button onClick={() => exportCSV(title)} className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 flex items-center gap-2">
              <FaFileExport /> Export
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {REPORTS.map(r => (
            <button key={r.id} onClick={() => setActive(r.id)} className={`text-left p-4 rounded border transition ${active === r.id ? 'bg-green-700 text-white border-green-700' : 'bg-white text-green-800 border-green-200 hover:bg-green-50'}`}>
              <div className="font-semibold">{r.title}</div>
              <div className="text-xs text-green-600 mt-1 hidden md:block">{r.desc}</div>
            </button>
          ))}
        </div>

        <div className="bg-white rounded shadow border border-green-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-green-800">{title}</h2>
              <p className="text-sm text-green-600">Showing {reportData.length} rows • {meta?.total ?? ''} • {meta?.totalCost ? formatCurrency(meta.totalCost) : ''}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setPreviewOpen(true); }} className="px-3 py-2 bg-white border border-green-200 rounded text-green-700">Preview</button>
              <button onClick={() => exportCSV(title)} className="px-3 py-2 bg-green-700 text-white rounded hover:bg-green-800">Download CSV</button>
            </div>
          </div>

          {/* summary cards for selected report */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {active === 'cost_analysis' && (
              <>
                <div className="bg-green-50 p-4 rounded border border-green-100">
                  <div className="text-sm text-green-700">Maintenance Cost</div>
                  <div className="text-2xl font-bold text-green-900">{formatCurrency(meta.serviceCost || 0)}</div>
                </div>
                <div className="bg-green-50 p-4 rounded border border-green-100">
                  <div className="text-sm text-green-700">Fuel Cost</div>
                  <div className="text-2xl font-bold text-green-900">{formatCurrency(meta.fuelCost || 0)}</div>
                </div>
                <div className="bg-green-50 p-4 rounded border border-green-100">
                  <div className="text-sm text-green-700">Total</div>
                  <div className="text-2xl font-bold text-green-900">{formatCurrency(meta.total || 0)}</div>
                </div>
              </>
            )}

            {active === 'accident_trends' && (
              <>
                <div className="bg-green-50 p-4 rounded border border-green-100">
                  <div className="text-sm text-green-700">Total Incidents</div>
                  <div className="text-2xl font-bold text-green-900">{meta.total || 0}</div>
                </div>
                <div className="bg-green-50 p-4 rounded border border-green-100">
                  <div className="text-sm text-green-700">Status Summary</div>
                  <div className="text-sm text-green-900 mt-2">{Object.entries(meta.statusCounts || {}).map(([k,v]) => `${k}: ${v}`).join(' • ')}</div>
                </div>
                <div className="bg-green-50 p-4 rounded border border-green-100">
                  <div className="text-sm text-green-700">Range</div>
                  <div className="text-sm text-green-900 mt-2">{startDate} → {endDate}</div>
                </div>
              </>
            )}
          </div>

          {/* chart area */}
          {chartConfig ? (
            <div className="p-4 rounded border border-green-100 bg-white mb-4">
              <div className="h-72">
                {chartConfig.type === 'line' && <Line {...chartConfig.props} />}
                {chartConfig.type === 'bar' && <Bar {...chartConfig.props} />}
              </div>
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-green-50 text-left text-green-800">
                <tr>
                  {reportData[0] ? Object.keys(reportData[0]).slice(0, 8).map((k) => <th key={k} className="px-4 py-3">{k.replace(/_/g, ' ').replace(/\b\w/g, s => s.toUpperCase())}</th>) : <th className="px-4 py-3">No data</th>}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={8} className="px-6 py-12 text-center text-green-600">Loading report...</td></tr>
                )}
                {!loading && reportData.length === 0 && (
                  <tr><td colSpan={8} className="px-6 py-12 text-center text-green-600">No records for selected range.</td></tr>
                )}
                {!loading && reportData.map((row, i) => (
                  <tr key={i} className="border-t hover:bg-green-50">
                    {Object.keys(row).slice(0, 8).map((k) => (
                      <td key={k} className="px-4 py-3 align-top">
                        {typeof row[k] === 'number' && (k.toLowerCase().includes('cost') || k.toLowerCase().includes('amount')) ? formatCurrency(row[k]) : String(row[k] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title={`${title} — Preview`}>
        <div className="space-y-4">
          <div className="text-sm text-green-700">Summary</div>
          <pre className="bg-gray-50 p-3 rounded text-xs text-slate-700 overflow-auto">{JSON.stringify(meta, null, 2)}</pre>

          <div className="text-sm text-green-700">Top 20 rows</div>
          <div className="overflow-auto max-h-72">
            <table className="min-w-full text-sm bg-white">
              <thead className="bg-green-50 text-green-800">
                <tr>{reportData[0] ? Object.keys(reportData[0]).slice(0, 6).map(k => <th key={k} className="px-3 py-2">{k}</th>) : null}</tr>
              </thead>
              <tbody>
                {(reportData.slice(0, 20) || []).map((r, i) => (
                  <tr key={i} className="border-t">
                    {Object.keys(r).slice(0, 6).map(k => <td key={k} className="px-3 py-2">{String(r[k] ?? '—')}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
}
