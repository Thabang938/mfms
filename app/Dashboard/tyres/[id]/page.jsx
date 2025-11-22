'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';
import SideBar from '@/components/SideBar';
import Modal from '@/components/Modal';
import TireForm from '@/components/Forms/TireForm';
import { FaArrowLeft, FaSyncAlt, FaHistory, FaEdit, FaCar, FaCalendar, FaTools, FaUser } from 'react-icons/fa';

export default function TireDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [tire, setTire] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openEdit, setOpenEdit] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function load() {
      setLoading(true);
      try {
        const { data: tireData, error: tErr } = await supabaseClient
          .from('tires')
          .select('*')
          .eq('id', id)
          .single();
        if (tErr) throw tErr;
        setTire(tireData);

        if (tireData?.vehicle_id) {
          const { data: vData } = await supabaseClient
            .from('vehicles')
            .select('*')
            .eq('id', tireData.vehicle_id)
            .single();
          setVehicle(vData || null);
        }

        const { data: evData } = await supabaseClient
          .from('tire_events')
          .select('*')
          .eq('tire_id', id)
          .order('event_date', { ascending: false });
        setEvents(evData || []);
      } catch (err) {
        console.error('Error loading tire:', err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-green-700">Loading tire details...</p>
      </div>
    );
  }

  if (!tire) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-700">Tire not found</p>
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
              <h1 className="text-3xl font-bold text-green-800">Tire Details</h1>
              <p className="text-sm text-green-600">Track tire condition and maintenance history</p>
            </div>
          </div>

          <button
            onClick={() => setOpenEdit(true)}
            className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition"
          >
            <FaEdit /> Edit Tire
          </button>
        </div>

        {/* Main Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Tire Info */}
          <div className="bg-white rounded-lg shadow border border-green-100 p-6">
            <h2 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
              <FaTools className="text-green-600" /> Tire Information
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-green-600">Brand</p>
                <p className="font-semibold text-green-900">{tire.brand || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-green-600">Serial Number</p>
                <p className="font-semibold text-green-900">{tire.serial_number || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-green-600">Position</p>
                <p className="font-semibold text-green-900">{tire.position || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-green-600">Condition</p>
                <p className={`font-semibold px-2 py-1 rounded text-sm w-fit ${
                  tire.condition === 'Good' ? 'bg-green-100 text-green-900' :
                  tire.condition === 'Fair' ? 'bg-yellow-100 text-yellow-900' :
                  'bg-red-100 text-red-900'
                }`}>
                  {tire.condition || '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Vehicle & Install Info */}
          <div className="bg-white rounded-lg shadow border border-green-100 p-6">
            <h2 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
              <FaCar className="text-green-600" /> Vehicle & Installation
            </h2>
            <div className="space-y-3">
              {vehicle ? (
                <>
                  <div>
                    <p className="text-sm text-green-600">Vehicle</p>
                    <p className="font-semibold text-green-900">
                      {vehicle.registration_number} — {vehicle.make} {vehicle.model}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-green-600">Odometer</p>
                    <p className="font-semibold text-green-900">
                      {vehicle.odometer ? `${Number(vehicle.odometer).toLocaleString()} km` : '—'}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-green-600">—</p>
              )}
              <div>
                <p className="text-sm text-green-600">Install Date</p>
                <p className="font-semibold text-green-900">{tire.install_date || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-green-600">Cost</p>
                <p className="font-semibold text-green-900">
                  {tire.cost ? `R ${Number(tire.cost).toLocaleString()}` : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Pressure & Mileage */}
          <div className="bg-white rounded-lg shadow border border-green-100 p-6">
            <h2 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
              <FaCalendar className="text-green-600" /> Performance Metrics
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-green-600">Pressure (PSI)</p>
                <p className="font-semibold text-green-900">{tire.pressure ? `${tire.pressure} PSI` : '—'}</p>
              </div>
              <div>
                <p className="text-sm text-green-600">Mileage at Record</p>
                <p className="font-semibold text-green-900">
                  {tire.mileage ? `${Number(tire.mileage).toLocaleString()} km` : '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-green-600">Notes</p>
                <p className="text-green-700 bg-green-50 rounded p-2 border border-green-100">
                  {tire.notes || 'No additional notes'}
                </p>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-lg shadow border border-green-100 p-6">
            <h2 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
              <FaSyncAlt className="text-green-600" /> Maintenance Summary
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-green-600">Total Events</p>
                <p className="text-3xl font-bold text-green-900">{events.length}</p>
              </div>
              <div>
                <p className="text-sm text-green-600">Last Event</p>
                <p className="font-semibold text-green-900">
                  {events.length > 0 ? events[0].event_date : '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-green-600">Installation Age</p>
                <p className="font-semibold text-green-900">
                  {tire.install_date
                    ? `${Math.floor((new Date() - new Date(tire.install_date)) / (1000 * 60 * 60 * 24))} days`
                    : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tire Events History */}
        <div className="bg-white rounded-lg shadow border border-green-100 p-6">
          <h2 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
            <FaHistory className="text-green-600" /> Event History
          </h2>

          {events.length === 0 ? (
            <p className="text-green-600 text-center py-8">No events recorded for this tire</p>
          ) : (
            <div className="space-y-3">
              {events.map((ev, i) => (
                <div
                  key={ev.id || i}
                  className="border border-green-100 rounded-lg p-4 bg-green-50 hover:bg-green-100 transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-200 text-green-800 p-2 rounded-lg">
                        <FaUser />
                      </div>
                      <div>
                        <h3 className="font-semibold text-green-900">{ev.event_type || 'Event'}</h3>
                        <p className="text-sm text-green-600">{ev.event_date}</p>
                      </div>
                    </div>
                    {ev.mileage && (
                      <p className="text-sm font-medium text-green-900">
                        {Number(ev.mileage).toLocaleString()} km
                      </p>
                    )}
                  </div>

                  {ev.from_position || ev.to_position ? (
                    <div className="text-sm text-green-700 mt-2 ml-12">
                      {ev.from_position && <p>From: {ev.from_position}</p>}
                      {ev.to_position && <p>To: {ev.to_position}</p>}
                    </div>
                  ) : null}

                  {ev.technician && (
                    <p className="text-sm text-green-600 mt-2 ml-12">
                      <strong>Technician:</strong> {ev.technician}
                    </p>
                  )}

                  {ev.notes && (
                    <p className="text-sm text-green-700 mt-2 ml-12 bg-white p-2 rounded border-l-2 border-green-400">
                      {ev.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit Modal */}
        <Modal open={openEdit} onClose={() => setOpenEdit(false)} title="Edit Tire">
          <TireForm
            initial={tire}
            onSuccess={() => {
              setOpenEdit(false);
              const reload = async () => {
                const { data } = await supabaseClient.from('tires').select('*').eq('id', id).single();
                setTire(data);
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