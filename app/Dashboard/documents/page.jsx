'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import SideBar from '@/components/SideBar';
import { FaPlus } from 'react-icons/fa';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const [docRes, vehicleRes] = await Promise.all([
        supabase.from('documents').select('*'),
        supabase.from('vehicles').select('*'),
      ]);
      if (docRes.data) setDocuments(docRes.data);
      if (vehicleRes.data) setVehicles(vehicleRes.data);
    }
    fetchData();
  }, []);

  const getVehicleLabel = (id) => {
    const v = vehicles.find((v) => v.id === id);
    return v ? `MV-${v.registration_number} - ${v.make}` : 'Unknown Vehicle';
  };

  const summary = {
    total: documents.length,
    current: documents.filter((d) => d.status === 'Current').length,
    expiring: documents.filter((d) => d.status === 'Expiring Soon').length,
    recent: documents.filter((d) => {
      const uploaded = new Date(d.uploaded_at);
      const now = new Date();
      const diffDays = (now - uploaded) / (1000 * 60 * 60 * 24);
      return diffDays <= 30;
    }).length,
  };

  return (
    <div className="min-h-screen flex bg-green-50">
      <SideBar />

      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-green-800">Document Repository</h1>
          <button className="flex items-center bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 transition">
            <FaPlus className="mr-2" />
            Upload Document
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <SummaryCard label="Total Documents" value={summary.total} />
          <SummaryCard label="Current" value={summary.current} />
          <SummaryCard label="Expiring Soon" value={summary.expiring} />
          <SummaryCard label="Recent Uploads" value={summary.recent} />
        </div>

        {/* Document Table */}
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
              {documents.map((doc, i) => (
                <tr key={i} className="border-t border-green-100 hover:bg-green-50">
                  <td className="px-4 py-2">{getVehicleLabel(doc.vehicle_id)}</td>
                  <td className="px-4 py-2">{doc.doc_type}</td>
                  <td className="px-4 py-2">{doc.name}</td>
                  <td className="px-4 py-2">{doc.uploaded_at?.split('T')[0]}</td>
                  <td className="px-4 py-2">{doc.expiry_date || '—'}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        doc.status === 'Current'
                          ? 'bg-green-200 text-green-800'
                          : doc.status === 'Expiring Soon'
                          ? 'bg-yellow-200 text-yellow-800'
                          : doc.status === 'Archived'
                          ? 'bg-gray-200 text-gray-800'
                          : doc.status === 'Active'
                          ? 'bg-blue-200 text-blue-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-700 hover:underline text-sm"
                    >
                      View
                    </a>
                  </td>
                  <td className="px-4 py-2">
                    <a
                      href={doc.file_url}
                      download
                      className="text-green-700 hover:underline text-sm"
                    >
                      Download
                    </a>
                  </td>
                </tr>
              ))}
              {documents.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-4 py-6 text-center text-green-600">
                    No documents found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="bg-white p-6 rounded shadow border border-green-200 text-center">
      <h3 className="text-lg font-semibold text-green-700">{label}</h3>
      <p className="text-3xl font-bold text-green-900 mt-2">{value}</p>
    </div>
  );
}