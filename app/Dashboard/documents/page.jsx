// ...existing code...
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import SideBar from '@/components/SideBar';
import { FaPlus } from 'react-icons/fa';
import Modal from '@/components/Modal';
import DocumentForm from '@/components/forms/DocumentForm';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [loading, setLoading] = useState(false);

  async function fetchData() {
    setLoading(true);
    const [docRes, vehicleRes] = await Promise.all([
      supabase.from('documents').select('*').order('uploaded_at', { ascending: false }),
      supabase.from('vehicles').select('*'),
    ]);
    setLoading(false);
    if (docRes.data) setDocuments(docRes.data);
    if (vehicleRes.data) setVehicles(vehicleRes.data);
  }

  useEffect(() => { fetchData(); }, []);

  const getVehicleLabel = (id) => {
    const v = vehicles.find(v => v.id === id);
    return v ? `MV-${v.registration_number} - ${v.make}` : 'Unknown Vehicle';
  };

  const summary = {
    total: documents.length,
    current: documents.filter(d => d.status === 'Current').length,
    expiring: documents.filter(d => d.status === 'Expiring Soon').length,
  };

  return (
    <div className="min-h-screen flex bg-green-50">
      <SideBar />
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-green-800">Document Repository</h1>
          <button onClick={() => setOpenAdd(true)} className="flex items-center bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 transition">
            <FaPlus className="mr-2" /> Upload Document
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded shadow border border-green-200 text-center"><h3 className="text-lg font-semibold text-green-700">Total Documents</h3><p className="text-3xl font-bold text-green-900 mt-2">{summary.total}</p></div>
          <div className="bg-white p-6 rounded shadow border border-green-200 text-center"><h3 className="text-lg font-semibold text-green-700">Current</h3><p className="text-3xl font-bold text-green-900 mt-2">{summary.current}</p></div>
          <div className="bg-white p-6 rounded shadow border border-green-200 text-center"><h3 className="text-lg font-semibold text-green-700">Expiring Soon</h3><p className="text-3xl font-bold text-green-900 mt-2">{summary.expiring}</p></div>
        </div>

        <div className="overflow-x-auto bg-white rounded shadow border border-green-200">
          <table className="min-w-full text-sm">
            <thead className="bg-green-100 text-green-800">
              <tr>
                <th className="px-4 py-2 text-left">Vehicle</th>
                <th className="px-4 py-2 text-left">Document Type</th>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Upload Date</th>
                <th className="px-4 py-2 text-left">Expiry Date</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">View</th>
                <th className="px-4 py-2 text-left">Download</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="8" className="px-6 py-8 text-center text-green-600">Loading documents...</td></tr>}
              {!loading && documents.length === 0 && <tr><td colSpan="8" className="px-6 py-8 text-center text-green-600">No documents found.</td></tr>}
              {!loading && documents.map((doc, i) => (
                <tr key={doc.id || i} className="border-t hover:bg-green-50">
                  <td className="px-4 py-3">{getVehicleLabel(doc.vehicle_id)}</td>
                  <td className="px-4 py-3">{doc.doc_type}</td>
                  <td className="px-4 py-3">{doc.name}</td>
                  <td className="px-4 py-3">{doc.uploaded_at?.split?.('T')[0] || '—'}</td>
                  <td className="px-4 py-3">{doc.expiry_date || '—'}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-semibold ${doc.status === 'Current' ? 'bg-green-200 text-green-800' : doc.status === 'Expiring Soon' ? 'bg-yellow-200 text-yellow-800' : 'bg-slate-100 text-slate-600'}`}>{doc.status}</span></td>
                  <td className="px-4 py-3"><a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-green-700 hover:underline text-sm">View</a></td>
                  <td className="px-4 py-3"><a href={doc.file_url} download className="text-green-700 hover:underline text-sm">Download</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <Modal open={openAdd} onClose={() => setOpenAdd(false)} title="Upload Document">
        <DocumentForm onSuccess={() => { fetchData(); setOpenAdd(false); }} onClose={() => setOpenAdd(false)} />
      </Modal>
    </div>
  );
}
// ...existing code...