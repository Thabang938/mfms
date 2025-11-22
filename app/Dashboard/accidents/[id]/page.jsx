'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';
import SideBar from '@/components/SideBar';
import Modal from '@/components/Modal';
import AccidentForm from '@/components/Forms/AccidentForm';
import { FaArrowLeft, FaEdit, FaExclamationTriangle, FaCalendar, FaMapMarkerAlt, FaCar, FaUser, FaFileAlt } from 'react-icons/fa';

export default function AccidentDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [accident, setAccident] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openEdit, setOpenEdit] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function load() {
      setLoading(true);
      try {
        const { data: aData, error: aErr } = await supabaseClient.from('accidents').select('*').eq('id', id).single();
        if (aErr) throw aErr;
        setAccident(aData);

        if (aData.vehicle_id) {
          const { data: v } = await supabaseClient.from('vehicles').select('*').eq('id', aData.vehicle_id).single();
          setVehicle(v || null);
        }

        if (aData.driver_id) {
          const { data: d } = await supabaseClient.from('drivers').select('*, user:user_id (name, employee_number, user_image)').eq('id', aData.driver_id).single();
          setDriver(d || null);
        }
      } catch (err) {
        console.error('Error loading accident:', err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-green-50">
      <p className="text-green-700 text-lg">Loading accident details...</p>
    </div>
  );

  if (!accident) return (
    <div className="flex items-center justify-center min-h-screen bg-green-50">
      <p className="text-red-700 text-lg">Accident not found</p>
    </div>
  );

  const statusColor = accident.status === 'Under Review' ? 'bg-yellow-100 text-yellow-900' :
    accident.status === 'Filed' ? 'bg-blue-100 text-blue-900' :
    accident.status === 'Resolved' ? 'bg-green-100 text-green-900' :
    'bg-gray-100 text-gray-900';

  return (
    <div className="min-h-screen flex bg-green-50">
      <SideBar />
      <main className="flex-1 p-8">
        
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/Dashboard/accidents')}
              className="p-2.5 hover:bg-green-100 rounded-lg transition hover:shadow-md"
              title="Back to Accidents"
            >
              <FaArrowLeft className="text-green-700 text-xl" />
            </button>
            <div>
              <h1 className="text-4xl font-bold text-green-800 flex items-center gap-3">
                <FaExclamationTriangle className="text-green-600" /> Accident Details
              </h1>
              <p className="text-sm text-green-600 mt-1">Incident ID: <span className="font-semibold">{accident.incident_id || accident.id}</span></p>
            </div>
          </div>

          <button
            onClick={() => setOpenEdit(true)}
            className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition shadow-md font-medium"
          >
            <FaEdit /> Update Accident
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Left Column - Incident Overview */}
          <div className="lg:col-span-2">
            
            {/* Incident Summary Card */}
            <div className="bg-white rounded-lg shadow-md border border-green-100 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Date & Time */}
                <div className="flex items-start gap-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <FaCalendar className="text-green-700 text-xl" />
                  </div>
                  <div>
                    <p className="text-sm text-green-600 font-medium">Incident Date</p>
                    <p className="text-lg font-semibold text-green-900">{accident.date || '—'}</p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <FaMapMarkerAlt className="text-green-700 text-xl" />
                  </div>
                  <div>
                    <p className="text-sm text-green-600 font-medium">Location</p>
                    <p className="text-lg font-semibold text-green-900">{accident.location || '—'}</p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-start gap-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <FaExclamationTriangle className="text-green-700 text-xl" />
                  </div>
                  <div>
                    <p className="text-sm text-green-600 font-medium">Status</p>
                    <p className={`text-lg font-semibold px-3 py-1 rounded-full w-fit ${statusColor}`}>
                      {accident.status || '—'}
                    </p>
                  </div>
                </div>

                {/* Insurance Claim */}
                <div className="flex items-start gap-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <FaFileAlt className="text-green-700 text-xl" />
                  </div>
                  <div>
                    <p className="text-sm text-green-600 font-medium">Insurance Claim</p>
                    <p className="text-lg font-semibold text-green-900">
                      {accident.insurance_claim ? '✓ Yes' : 'No'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Damage & Cause */}
            <div className="bg-white rounded-lg shadow-md border border-green-100 p-6 mb-6">
              <h2 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
                <FaFileAlt className="text-green-600" /> Description & Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-green-600 font-medium mb-2">Damage Description</p>
                  <div className="bg-green-50 rounded p-4 border border-green-100 text-green-900 text-sm">
                    {accident.damage || 'No damage description provided'}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-green-600 font-medium mb-2">Cause of Accident</p>
                  <div className="bg-green-50 rounded p-4 border border-green-100 text-green-900 text-sm">
                    {accident.cause || 'No cause provided'}
                  </div>
                </div>
              </div>
            </div>

            {/* Repair Information */}
            {accident.repair_date && (
              <div className="bg-white rounded-lg shadow-md border border-green-100 p-6">
                <h2 className="text-lg font-semibold text-green-800 mb-4">Repair Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Repair Date</p>
                    <p className="text-green-900 font-semibold">{accident.repair_date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-green-600 font-medium">Estimated Cost</p>
                    <p className="text-green-900 font-semibold text-lg">
                      R {Number(accident.estimated_cost || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Vehicle & Driver Info */}
          <div className="space-y-6">
            
            {/* Vehicle Information */}
            <div className="bg-white rounded-lg shadow-md border border-green-100 p-6">
              <h2 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
                <FaCar className="text-green-600" /> Vehicle
              </h2>
              {vehicle ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-green-600 font-medium">Registration</p>
                    <p className="text-green-900 font-semibold">{vehicle.registration_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-600 font-medium">Make & Model</p>
                    <p className="text-green-900 font-semibold">{vehicle.make} {vehicle.model}</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-600 font-medium">Year</p>
                    <p className="text-green-900 font-semibold">{vehicle.year || '—'}</p>
                  </div>
                  <div className="bg-green-50 rounded p-3 border border-green-100 mt-2">
                    <p className="text-xs text-green-600 font-medium">Status</p>
                    <p className={`text-sm font-semibold mt-1 ${
                      vehicle.status === 'Active' ? 'text-green-900' : 'text-yellow-900'
                    }`}>
                      {vehicle.status}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-green-600">Vehicle information not available</p>
              )}
            </div>

            {/* Driver Information */}
            <div className="bg-white rounded-lg shadow-md border border-green-100 p-6">
              <h2 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
                <FaUser className="text-green-600" /> Driver
              </h2>
              {driver ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-green-600 font-medium">Name</p>
                    <p className="text-green-900 font-semibold">{driver.user?.name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-600 font-medium">License Number</p>
                    <p className="text-green-900 font-semibold">{driver.license_number || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-600 font-medium">Employee Number</p>
                    <p className="text-green-900 font-semibold">{driver.user?.employee_number || '—'}</p>
                  </div>
                  <div className="bg-green-50 rounded p-3 border border-green-100 mt-2">
                    <p className="text-xs text-green-600 font-medium">Status</p>
                    <p className="text-sm font-semibold text-green-900 mt-1">{driver.status || '—'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-green-600">No driver assigned to this incident</p>
              )}
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        <Modal open={openEdit} onClose={() => setOpenEdit(false)} title="Update Accident">
          <AccidentForm
            initial={accident}
            onSuccess={() => {
              setOpenEdit(false);
              const reload = async () => {
                const { data } = await supabaseClient.from('accidents').select('*').eq('id', id).single();
                setAccident(data);
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