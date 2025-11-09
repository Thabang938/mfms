'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';
import SideBar from '@/components/SideBar';
import Modal from '@/components/Modal';
import DriverForm from '@/components/Forms/DriverForm';
import { FaArrowLeft } from 'react-icons/fa';

export default function DriverDetailPage() {
  const router = useRouter();
  const { id } = useParams();

  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openEdit, setOpenEdit] = useState(false);

  const fetchDriver = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabaseClient
        .from('drivers')
        .select(`
          *,
          user:user_id (name, role, employee_number, user_image)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      setDriver(data);
    } catch (err) {
      console.error('Error fetching driver:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDriver();
  }, [id]);

  if (loading) return <div className="flex items-center justify-center min-h-screen text-green-700">Loading driver...</div>;
  if (!driver) return <div className="flex items-center justify-center min-h-screen text-red-700">Driver not found</div>;

  return (
    <div className="min-h-screen flex bg-green-50">
      <SideBar />

      <main className="flex-1 p-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-green-700 hover:text-green-900"
        >
          <FaArrowLeft /> Back
        </button>

        {/* Header & Edit Button */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-green-800">{driver.user?.name || 'Driver'}</h1>
          <button
            onClick={() => setOpenEdit(true)}
            className="bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 transition"
          >
            Edit Driver
          </button>
        </div>

        {/* Driver Info Card */}
        <div className="bg-white border border-green-100 rounded-xl shadow-sm p-6 flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            {driver.user?.user_image
              ? <img src={driver.user.user_image} alt={driver.user.name} className="w-32 h-32 rounded-full object-cover" />
              : <div className="w-32 h-32 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-3xl">{driver.user?.name?.charAt(0)}</div>
            }
          </div>

          <div className="flex-1 grid grid-cols-2 gap-4 text-green-700">
            <div>Name:</div>
            <div className="font-medium text-green-900">{driver.user?.name || '—'}</div>

            <div>Role:</div>
            <div className="font-medium text-green-900">{driver.user?.role || '—'}</div>

            <div>Employee Number:</div>
            <div className="font-medium text-green-900">{driver.user?.employee_number || '—'}</div>

            <div>License Number:</div>
            <div className="font-medium text-green-900">{driver.license_number || '—'}</div>

            <div>Department:</div>
            <div className="font-medium text-green-900">{driver.department || '—'}</div>

            <div>Status:</div>
            <div className="font-medium text-green-900">{driver.status || '—'}</div>

            <div>Assigned Vehicle:</div>
            <div className="font-medium text-green-900">{driver.assigned_vehicle_id || '—'}</div>

            <div>Expiry Date:</div>
            <div className="font-medium text-green-900">{driver.expiry_date || '—'}</div>
          </div>
        </div>

        {/* Edit Modal */}
        <Modal open={openEdit} onClose={() => setOpenEdit(false)} title="Edit Driver">
          <DriverForm
            initial={driver}
            onSuccess={() => { fetchDriver(); setOpenEdit(false); }}
            onClose={() => setOpenEdit(false)}
          />
        </Modal>
      </main>
    </div>
  );
}
