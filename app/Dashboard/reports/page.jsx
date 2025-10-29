'use client';
import { useState } from 'react';
import SideBar from '@/components/SideBar';
import { FaFileExport, FaEye } from 'react-icons/fa';

const reportData = [
  {
    title: 'Service History Report',
    description: 'Comprehensive maintenance and service tracking.',
    category: 'Maintenance',
  },
  {
    title: 'Cost Analysis Report',
    description: 'Vehicle-related costs and financial performance.',
    category: 'Financial',
  },
  {
    title: 'Accident Trends Report',
    description: 'Incident tracking and safety analysis.',
    category: 'Safety',
  },
  {
    title: 'Tyre Usage Report',
    description: 'Tyre performance and replacement tracking.',
    category: 'Maintenance',
  },
  {
    title: 'License Compliance Report',
    description: 'Vehicle license status and compliance tracking.',
    category: 'Operations',
  },
  {
    title: 'Fuel Efficiency Report',
    description: 'Fuel consumption and performance analysis.',
    category: 'Operations',
  },
  {
    title: 'Driver Performance Report',
    description: 'Driver behavior and performance metrics.',
    category: 'Safety',
  },
  {
    title: 'Vehicle Utilization Report',
    description: 'Vehicle usage and operational efficiency.',
    category: 'Operations',
  },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('All');

  const summary = {
    generated: 127,
    downloads: 64,
    scheduled: 12,
    custom: 8,
  };

  const filteredReports =
    activeTab === 'All'
      ? reportData
      : reportData.filter((r) => r.category === activeTab);

  function exportToCSV(reportTitle, data) {
    const headers = Object.keys(data[0] || {}).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reportTitle.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="min-h-screen flex bg-green-50">
      <SideBar />

      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-green-800 mb-6">
          Reports Dashboard
        </h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <SummaryCard label="Reports Generated" value={`${summary.generated} this month`} />
          <SummaryCard label="Export Downloads" value={`${summary.downloads} this month`} />
          <SummaryCard label="Scheduled Reports" value={`${summary.scheduled} Active`} />
          <SummaryCard label="Custom Reports" value={`${summary.custom} Created`} />
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          {['All', 'Maintenance', 'Financial', 'Safety', 'Operations'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded ${
                activeTab === tab
                  ? 'bg-green-700 text-white'
                  : 'bg-white text-green-700 border border-green-300'
              } hover:bg-green-600 hover:text-white transition`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Report Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredReports.map((report, i) => (
            <div
              key={i}
              className="bg-white border border-green-200 rounded shadow p-6 flex flex-col justify-between"
            >
              <div>
                <h3 className="text-xl font-semibold text-green-800 mb-2">
                  {report.title}
                </h3>
                <p className="text-sm text-green-700 mb-4">{report.description}</p>
                <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                  {report.category}
                </span>
              </div>
              <div className="mt-4 flex space-x-3">
                <button className="flex items-center bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition text-sm">
                  <FaEye className="mr-2" />
                  Preview
                </button>
                <button
                  className="flex items-center bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 transition text-sm"
                  onClick={() =>
                    exportToCSV(report.title, [
                      { Metric: 'Sample A', Value: 123 },
                      { Metric: 'Sample B', Value: 456 },
                      { Metric: 'Sample C', Value: 789 },
                    ])
                  }
                >
                  <FaFileExport className="mr-2" />
                  Export
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="bg-white p-6 rounded shadow border border-green-200 text-center">
      <h3 className="text-lg font-semibold text-green-700">{label}</h3>
      <p className="text-2xl font-bold text-green-900 mt-2">{value}</p>
    </div>
  );
}