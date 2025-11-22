'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';
import SideBar from '@/components/SideBar';
import Modal from '@/components/Modal';
import DriverForm from '@/components/Forms/DriverForm';
import { FaArrowLeft, FaEdit, FaUser, FaIdCard, FaBuilding, FaCar, FaCalendar, FaExclamationTriangle } from 'react-icons/fa';

export default function DriverDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [driver, setDriver] = useState(null);
  const [user, setUser] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [accidents, setAccidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openEdit, setOpenEdit] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function load() {
      setLoading(true);
      try {
        const { data: driverData, error: dErr } = await supabaseClient
          .from('drivers')
          .select('*')
          .eq('id', id)
          .single();
        if (dErr) throw dErr;
        setDriver(driverData);

        if (driverData.user_id) {
          const { data: userData } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', driverData.user_id)
            .single();
          setUser(userData || null);
        }

        if (driverData.assigned_vehicle_id) {
          const { data: vehicleData } = await supabaseClient
            .from('vehicles')
            .select('*')
            .eq('id', driverData.assigned_vehicle_id)
            .single();
          setVehicle(vehicleData || null);
        }

        // Fetch accidents for this driver
        const { data: accidentData } = await supabaseClient
          .from('accidents')
          .select('*')
          .eq('driver_id', id)
          .order('date', { ascending: false });
        setAccidents(accidentData || []);
      } catch (err) {
        console.error('Error loading driver:', err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-green-700">Loading driver details...</p>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-700">Driver not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-green-50">
      <SideBar />

      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-green-100 rounded-lg transition"
            >
              <FaArrowLeft className="text-green-700 text-xl" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-green-800">Driver Details</h1>
              <p className="text-sm text-green-600">View and manage driver information</p>
            </div>
          </div>

          <button
            onClick={() => setOpenEdit(true)}
            className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition"
          >
            <FaEdit /> Edit Driver
          </button>
        </div>

        {/* Driver Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow border border-green-100 p-6">
            <h2 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
              <FaUser className="text-green-600" /> Personal Information
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-green-600">Name</p>
                <p className="font-semibold text-green-900">{user?.name || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-green-600">Employee Number</p>
                <p className="font-semibold text-green-900">{user?.employee_number || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-green-600">Department</p>
                <p className="font-semibold text-green-900">{driver.department || '—'}</p>
              </div>
            </div>
          </div>

          {/* License Info */}
          <div className="bg-white rounded-lg shadow border border-green-100 p-6">
            <h2 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
              <FaIdCard className="text-green-600" /> License Information
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-green-600">License Number</p>
                <p className="font-semibold text-green-900">{driver.license_number || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-green-600">Status</p>
                <p className={`font-semibold px-2 py-1 rounded text-sm w-fit ${
                  driver.status === 'Active' ? 'bg-green-100 text-green-900' :
                  driver.status === 'In Training' ? 'bg-blue-100 text-blue-900' :
                  driver.status === 'Suspended' ? 'bg-red-100 text-red-900' :
                  'bg-gray-100 text-gray-900'
                }`}>
                  {driver.status || '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-green-600">Expiry Date</p>
                <p className="font-semibold text-green-900">{driver.expiry_date || '—'}</p>
              </div>
            </div>
          </div>

          {/* Vehicle Assignment */}
          <div className="bg-white rounded-lg shadow border border-green-100 p-6">
            <h2 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
              <FaCar className="text-green-600" /> Vehicle Assignment
            </h2>
            {vehicle ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-green-600">Registration</p>
                  <p className="font-semibold text-green-900">{vehicle.registration_number}</p>
                </div>
                <div>
                  <p className="text-sm text-green-600">Make & Model</p>
                  <p className="font-semibold text-green-900">{vehicle.make} {vehicle.model}</p>
                </div>
                <div>
                  <p className="text-sm text-green-600">Status</p>
                  <p className={`font-semibold px-2 py-1 rounded text-sm w-fit ${
                    vehicle.status === 'Active' ? 'bg-green-100 text-green-900' :
                    vehicle.status === 'Maintenance' ? 'bg-yellow-100 text-yellow-900' :
                    'bg-gray-100 text-gray-900'
                  }`}>
                    {vehicle.status}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-green-600">No vehicle assigned</p>
            )}
          </div>

          {/* Statistics */}
          <div className="bg-white rounded-lg shadow border border-green-100 p-6">
            <h2 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
              <FaExclamationTriangle className="text-green-600" /> Incident Statistics
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-green-600">Total Incidents</p>
                <p className="text-3xl font-bold text-green-900">{accidents.length}</p>
              </div>
              <div>
                <p className="text-sm text-green-600">Under Review</p>
                <p className="font-semibold text-green-900">
                  {accidents.filter(a => a.status === 'Under Review').length}
                </p>
              </div>
              <div>
                <p className="text-sm text-green-600">Resolved</p>
                <p className="font-semibold text-green-900">
                  {accidents.filter(a => a.status === 'Resolved').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Accidents History */}
        <div className="bg-white rounded-lg shadow border border-green-100 p-6 mb-8">
          <h2 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
            <FaExclamationTriangle className="text-green-600" /> Accident History
          </h2>

          {accidents.length === 0 ? (
            <p className="text-green-600 text-center py-8">No accidents recorded for this driver</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-green-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-green-800">Incident ID</th>
                    <th className="px-4 py-3 text-left text-green-800">Date</th>
                    <th className="px-4 py-3 text-left text-green-800">Location</th>
                    <th className="px-4 py-3 text-left text-green-800">Status</th>
                    <th className="px-4 py-3 text-left text-green-800">Cost (R)</th>
                  </tr>
                </thead>
                <tbody>
                  {accidents.map((acc, i) => (
                    <tr key={acc.id || i} className="border-t hover:bg-green-50">
                      <td className="px-4 py-3 font-medium text-green-900">{acc.incident_id || '—'}</td>
                      <td className="px-4 py-3 text-green-700">{acc.date || '—'}</td>
                      <td className="px-4 py-3 text-green-700">{acc.location || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          acc.status === 'Under Review' ? 'bg-yellow-100 text-yellow-800' :
                          acc.status === 'Filed' ? 'bg-blue-100 text-blue-800' :
                          acc.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {acc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-green-900 font-medium">
                        R {Number(acc.estimated_cost || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        <Modal open={openEdit} onClose={() => setOpenEdit(false)} title="Edit Driver">
          <DriverForm
            initial={driver}
            onSuccess={() => {
              setOpenEdit(false);
              // Reload driver data
              const reload = async () => {
                const { data } = await supabaseClient.from('drivers').select('*').eq('id', id).single();
                setDriver(data);
              };
              reload();
            }}
            onClose={() => setOpenEdit(false)}
          />
        </Modal>
      </main>
    </div>
  );
}