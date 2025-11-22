'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';
import SideBar from '@/components/SideBar';
import Modal from '@/components/Modal';
import DocumentForm from '@/components/Forms/DocumentForm';
import { FaPlus, FaSearch, FaDownload } from 'react-icons/fa';
import { Toaster } from 'react-hot-toast';
import { Bar, Pie } from 'react-chartjs-2';
import 'chart.js/auto';

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [users, setUsers] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [session, setSession] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabaseClient.auth.getSession();
      setSession(session);
    };
    checkSession();
    const { data: listener } = supabaseClient.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!s) router.push('/Login');
    });
    return () => listener.subscription.unsubscribe();
  }, [router]);

  async function fetchData() {
    if (!session) return;
    setLoading(true);
    try {
      const [vehRes, userRes, docsRes] = await Promise.all([
        supabaseClient.from('vehicles').select('id, registration_number, make, model'),
        supabaseClient.from('users').select('id, name'),
        supabaseClient.from('documents').select('*').order('uploaded_at', { ascending: false }),
      ]);
      if (vehRes.error) throw vehRes.error;
      if (userRes.error) throw userRes.error;
      if (docsRes.error) throw docsRes.error;

      setVehicles(vehRes.data || []);
      setUsers(userRes.data || []);

      const docs = docsRes.data || [];
      const docsWithUrls = await Promise.all(docs.map(async (doc) => {
        if (!doc.storage_path) return { ...doc, signed_url: null };
        try {
          const { data: urlData, error: urlError } = await supabaseClient.storage.from('Documents_Storage').createSignedUrl(doc.storage_path, 300);
          if (urlError) return { ...doc, signed_url: null };
          return { ...doc, signed_url: urlData.signedUrl };
        } catch {
          return { ...doc, signed_url: null };
        }
      }));
      setDocuments(docsWithUrls);
    } catch (err) {
      console.error('Error fetching documents:', err.message);
      setDocuments([]);
      setVehicles([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (session) fetchData(); }, [session]);

  const getVehicleLabel = (id) => {
    const v = vehicles.find(vv => vv.id === id);
    return v ? `MV-${v.registration_number} — ${v.make || ''}`.trim() : 'Unassigned';
  };

  const getUploaderName = (userId) => users.find(u => u.id === userId)?.name || 'System';

  const filtered = useMemo(() => {
    if (!search) return documents;
    const q = search.trim().toLowerCase();
    return documents.filter(d => {
      const v = vehicles.find(vv => vv.id === d.vehicle_id);
      const vehicleLabel = v ? `${v.registration_number} ${v.make}` : '';
      const uploader = getUploaderName(d.uploaded_by);
      return `${vehicleLabel} ${d.doc_type || ''} ${d.name || ''} ${uploader}`.toLowerCase().includes(q);
    });
  }, [documents, vehicles, users, search]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  useEffect(() => { if (page > pageCount) setPage(1); }, [pageCount]);
  const paged = useMemo(() => filtered.slice((page - 1) * perPage, page * perPage), [filtered, page, perPage]);

  const summary = useMemo(() => {
    const byType = {};
    const byUploader = {};
    (documents || []).forEach(d => {
      byType[d.doc_type || 'Unknown'] = (byType[d.doc_type || 'Unknown'] || 0) + 1;
      const name = getUploaderName(d.uploaded_by);
      byUploader[name] = (byUploader[name] || 0) + 1;
    });
    const topUploaders = Object.entries(byUploader).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const vehiclesWithDocs = new Set((documents || []).map(d => d.vehicle_id).filter(Boolean)).size;
    return { total: documents.length, byType, topUploaders, vehiclesWithDocs };
  }, [documents, users]);

  const exportCSV = () => {
    if (!paged || paged.length === 0) { alert('No records to export.'); return; }
    const rows = paged.map(d => {
      const v = vehicles.find(vv => vv.id === d.vehicle_id) || {};
      return {
        vehicle: `${v.registration_number || ''} ${v.make || ''}`.trim(),
        type: d.doc_type || '',
        name: d.name || '',
        uploaded_at: d.uploaded_at ? d.uploaded_at.split?.('T')[0] : '',
        uploaded_by: getUploaderName(d.uploaded_by),
        storage_path: d.storage_path || '',
      };
    });
    const header = Object.keys(rows[0]).join(',');
    const csv = [header, ...rows.map(r => Object.values(r).map(val => `"${String(val ?? '').replace(/"/g,'""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `documents_export_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const typeChartData = useMemo(() => {
    const labels = Object.keys(summary.byType || {});
    const data = labels.map(l => summary.byType[l]);
    return {
      labels,
      datasets: [{
        data,
        backgroundColor: ['#16a34a', '#34d399', '#86efac', '#bbf7d0', '#a7f3d0', '#c7f9e7'],
        borderColor: '#f8faf9',
        borderWidth: 1,
      }],
    };
  }, [summary.byType]);

  const uploaderChartData = useMemo(() => {
    const labels = summary.topUploaders.map(t => t[0]);
    const data = summary.topUploaders.map(t => t[1]);
    return {
      labels,
      datasets: [{
        label: 'Uploads',
        data,
        backgroundColor: '#10b981',
        barThickness: 22,
      }],
    };
  }, [summary.topUploaders]);

  const chartOptions = {
    plugins: { legend: { display: false } },
    maintainAspectRatio: false,
  };

  return (
    <div className="min-h-screen flex bg-green-50">
      <Toaster position="top-right" />
      <SideBar />

      <main className="flex-1 p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-green-800">Document Repository</h1>
            <p className="text-sm text-green-600">Manage vehicle documents and access files securely</p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={exportCSV} className="flex items-center bg-white border border-green-300 text-green-700 px-4 py-2 rounded hover:bg-green-100 transition">
              <FaDownload className="mr-2" /> Export
            </button>
            <button onClick={() => setOpenAdd(true)} className="flex items-center bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 transition">
              <FaPlus className="mr-2" /> Upload Document
            </button>
          </div>
        </div>

        {/* Charts summary area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm text-green-700">Total Documents</div>
                <div className="text-2xl font-bold text-green-900">{summary.total}</div>
              </div>
            </div>
            <div className="mt-3 h-44">
              <Pie data={typeChartData} options={{ ...chartOptions, plugins: { legend: { position: 'right' } } }} />
            </div>
            <div className="text-sm text-green-600 mt-3">Document distribution by type</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm">
            <div className="text-sm text-green-700 mb-2">Top Uploaders</div>
            <div className="h-52">
              <Bar data={uploaderChartData} options={{ ...chartOptions, plugins: { legend: { display: false } } }} />
            </div>
            <div className="text-sm text-green-600 mt-2">Top contributors (last 5)</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm">
            <div className="text-sm text-green-700 mb-2">Recent Documents</div>
            <div className="space-y-2 max-h-52 overflow-auto">
              {(documents || []).slice(0,6).map(d => {
                const v = vehicles.find(vv => vv.id === d.vehicle_id) || {};
                return (
                  <div key={d.id} className="flex items-center justify-between bg-green-50 p-2 rounded">
                    <div className="text-sm text-green-800 truncate w-2/3">{d.name || d.doc_type || 'Document'}</div>
                    <div className="text-xs text-green-600">{v.registration_number ? `MV-${v.registration_number}` : 'Unassigned'}</div>
                  </div>
                );
              })}
              {(documents || []).length === 0 && <div className="text-sm text-green-600">No recent documents</div>}
            </div>
            <div className="text-sm text-green-600 mt-3">Quick list of latest uploads</div>
          </div>
        </div>

        {/* Search & controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-green-400" />
            <input
              aria-label="Search documents"
              className="pl-10 pr-4 py-2 border rounded-md w-64 focus:ring-2 focus:ring-green-200 bg-white"
              placeholder="Search vehicle, type, name, uploader..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-green-700">Rows</div>
            <select className="px-2 py-1 border rounded" value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded shadow border border-green-200 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-green-50 text-green-800">
              <tr>
                <th className="px-4 py-3 text-left">Vehicle</th>
                <th className="px-4 py-3 text-left">Document Type</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Uploaded At</th>
                <th className="px-4 py-3 text-left">Uploaded By</th>
                <th className="px-4 py-3 text-left">View</th>
                <th className="px-4 py-3 text-left">Download</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="7" className="px-6 py-12 text-center text-green-600">Loading documents...</td></tr>}
              {!loading && paged.length === 0 && <tr><td colSpan="7" className="px-6 py-12 text-center text-green-600">No documents found.</td></tr>}
              {!loading && paged.map((doc, i) => {
                const vehicle = vehicles.find(v => v.id === doc.vehicle_id) || {};
                const uploader = getUploaderName(doc.uploaded_by);
                return (
                  <tr key={doc.id || i} className="border-t hover:bg-green-50">
                    <td className="px-4 py-3">{vehicle.registration_number ? `MV-${vehicle.registration_number}` : 'Unassigned'}</td>
                    <td className="px-4 py-3">{doc.doc_type || '—'}</td>
                    <td className="px-4 py-3">{doc.name || '—'}</td>
                    <td className="px-4 py-3">{doc.uploaded_at?.split?.('T')[0] || '—'}</td>
                    <td className="px-4 py-3">{uploader}</td>
                    <td className="px-4 py-3">
                      {doc.signed_url ? (
                        <a href={doc.signed_url} target="_blank" rel="noreferrer" className="text-green-700 underline">View</a>
                      ) : (
                        <span className="text-green-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {doc.signed_url ? (
                        <a href={doc.signed_url} download className="text-green-700 underline">Download</a>
                      ) : (
                        <span className="text-green-500">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t bg-white">
            <div className="flex items-center gap-3">
              <button className="px-3 py-1 border rounded bg-white text-green-700 disabled:opacity-40" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
              <div className="text-sm text-green-900 font-medium">Page {page} / {pageCount}</div>
              <button className="px-3 py-1 border rounded bg-white text-green-700 disabled:opacity-40" onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount}>Next</button>
            </div>

            <div className="text-sm text-green-600">Total: <span className="font-medium text-green-800">{total}</span></div>
          </div>
        </div>

        <Modal open={openAdd} onClose={() => setOpenAdd(false)} title="Upload Document">
          <DocumentForm onSuccess={() => { fetchData(); setOpenAdd(false); }} onClose={() => setOpenAdd(false)} />
        </Modal>
      </main>
    </div>
  );
}