'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';
import SideBar from '@/components/SideBar';
import Modal from '@/components/Modal';
import AccidentForm from '@/components/Forms/AccidentForm';
import { FaArrowLeft, FaEdit } from 'react-icons/fa';

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

  if (loading) return <div className="flex items-center justify-center min-h-screen text-green-700">Loading accident...</div>;
  if (!accident) return <div className="flex items-center justify-center min-h-screen text-red-700">Accident not found</div>;

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
              <h1 className="text-2xl font-bold text-green-800">Accident Details</h1>
              <p className="text-sm text-green-600 mt-1">Incident: {accident.incident_id || accident.id}</p>
            </div>
            <div>
              <button onClick={() => setOpenEdit(true)} className="bg-green-700 text-white px-3 py-2 rounded hover:bg-green-800"><FaEdit /> Update</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 text-green-700">
            <div>
              <div className="text-sm">Date</div>
              <div className="font-medium text-green-900">{accident.date || '—'}</div>
            </div>
            <div>
              <div className="text-sm">Location</div>
              <div className="font-medium text-green-900">{accident.location || '—'}</div>
            </div>

            <div>
              <div className="text-sm">Vehicle</div>
              <div className="font-medium text-green-900">{vehicle ? `${vehicle.registration_number} — ${vehicle.make} ${vehicle.model}` : '—'}</div>
            </div>
            <div>
              <div className="text-sm">Driver</div>
              <div className="font-medium text-green-900">{driver?.user?.name || driver?.license_number || '—'}</div>
            </div>

            <div>
              <div className="text-sm">Repair Date</div>
              <div className="font-medium text-green-900">{accident.repair_date || '—'}</div>
            </div>
            <div>
              <div className="text-sm">Status</div>
              <div className="font-medium text-green-900">{accident.status || '—'}</div>
            </div>

            <div className="md:col-span-2">
              <div className="text-sm">Damage & Cause</div>
              <div className="text-green-900 bg-green-50 p-3 rounded border border-green-100 mt-1">
                <div className="font-medium">Damage</div>
                <div className="text-sm">{accident.damage || '—'}</div>
                <div className="font-medium mt-2">Cause</div>
                <div className="text-sm">{accident.cause || '—'}</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Modal open={openEdit} onClose={() => setOpenEdit(false)} title="Update Accident">
        <AccidentForm initial={accident} onSuccess={() => { setOpenEdit(false); /* reload */ }} onClose={() => setOpenEdit(false)} />
      </Modal>
    </div>
  );
}