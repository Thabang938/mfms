'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';
import SideBar from '@/components/SideBar';
import Modal from '@/components/Modal';
import TireForm from '@/components/Forms/TireForm';
import { FaArrowLeft, FaSyncAlt, FaHistory } from 'react-icons/fa';

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
        const { data: tireData, error: tErr } = await supabaseClient.from('tires').select('*').eq('id', id).single();
        if (tErr) throw tErr;
        setTire(tireData);

        if (tireData?.vehicle_id) {
          const { data: vData } = await supabaseClient.from('vehicles').select('*').eq('id', tireData.vehicle_id).single();
          setVehicle(vData || null);
        }

        const { data: ev } = await supabaseClient.from('tire_events').select('*').eq('tire_id', id).order('event_date', { ascending: false });
        setEvents(ev || []);
      } catch (err) {
        console.error('Error loading tire:', err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <div className="flex items-center justify-center min-h-screen text-green-700">Loading tire...</div>;
  if (!tire) return <div className="flex items-center justify-center min-h-screen text-red-700">Tire not found</div>;

  return (
    <div className="min-h-screen flex bg-green-50">
      <SideBar />
      <main className="flex-1 p-8">
        <button onClick={() => router.back()} className="mb-4 flex items-center gap-2 text-green-700 hover:text-green-900">
          <FaArrowLeft /> Back
        </button>

        <div className="bg-white rounded shadow border border-green-100 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-green-800">Tire Details</h1>
              <p className="text-sm text-green-600 mt-1">{tire.brand} • {tire.serial_number}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setOpenEdit(true)} className="bg-green-700 text-white px-3 py-2 rounded hover:bg-green-800">Edit</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 text-green-700">
            <div>
              <div className="text-sm">Position</div>
              <div className="font-medium text-green-900">{tire.position || '—'}</div>
            </div>
            <div>
              <div className="text-sm">Install Date</div>
              <div className="font-medium text-green-900">{tire.install_date || '—'}</div>
            </div>
            <div>
              <div className="text-sm">Vehicle</div>
              <div className="font-medium text-green-900">{vehicle ? `${vehicle.registration_number} — ${vehicle.make} ${vehicle.model}` : '—'}</div>
            </div>
            <div>
              <div className="text-sm">Odometer</div>
              <div className="font-medium text-green-900">{vehicle?.odometer ? `${Number(vehicle.odometer).toLocaleString()} km` : '—'}</div>
            </div>
            <div className="md:col-span-2">
              <div className="text-sm">Notes</div>
              <div className="text-green-900 bg-green-50 p-3 rounded border border-green-100 mt-1">{tire.notes || '—'}</div>
            </div>
          </div>

          <h2 className="mt-6 text-lg font-semibold text-green-800 flex items-center gap-2"><FaHistory /> Events</h2>
          <div className="mt-3">
            {events.length === 0 && <div className="text-green-600">No events recorded.</div>}
            {events.map(ev => (
              <div key={ev.id} className="border rounded p-3 mb-2 bg-white">
                <div className="flex items-center justify-between text-sm text-green-700">
                  <div>{ev.event_type} — {ev.event_date}</div>
                  <div className="font-medium text-green-900">{ev.technician || '—'}</div>
                </div>
                <div className="text-green-700 mt-1">{ev.notes || ''}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Modal open={openEdit} onClose={() => setOpenEdit(false)} title="Edit Tire">
        <TireForm initial={tire} onSuccess={() => { setOpenEdit(false); /* reload */ }} onClose={() => setOpenEdit(false)} />
      </Modal>
    </div>
  );
}