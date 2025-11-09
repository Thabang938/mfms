'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';
import SideBar from '@/components/SideBar';
import LicenseForm from '@/components/Forms/LicenseForm';
import { FaArrowLeft, FaInfoCircle, FaCarSide } from 'react-icons/fa';
import dayjs from 'dayjs';

export default function LicenseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [license, setLicense] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchLicense();
  }, [id]);

  async function fetchLicense() {
    try {
      setLoading(true);
      const { data: licenseData, error: licenseError } = await supabaseClient
        .from('licenses')
        .select('*')
        .eq('id', id)
        .single();
      if (licenseError) throw licenseError;
      setLicense(licenseData);

      if (licenseData.vehicle_id) {
        const { data: vehicleData, error: vehicleError } = await supabaseClient
          .from('vehicles')
          .select('*')
          .eq('id', licenseData.vehicle_id)
          .single();
        if (vehicleError) throw vehicleError;
        setVehicle(vehicleData);
      }
    } catch (err) {
      console.error('Error fetching license:', err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-green-700">Loading license...</div>;
  if (!license) return <div className="flex items-center justify-center min-h-screen text-red-600">License not found.</div>;

  if (editing) {
    return (
      <div className="min-h-screen flex bg-green-50">
        <SideBar />
        <main className="flex-1 p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-green-800">Edit License</h1>
            <button onClick={() => setEditing(false)} className="text-green-700 hover:text-green-900 flex items-center gap-2">
              <FaArrowLeft /> Back
            </button>
          </div>
          <LicenseForm initial={license} onSuccess={() => { setEditing(false); fetchLicense(); }} onClose={() => setEditing(false)} />
        </main>
      </div>
    );
  }

  const daysLeft = license.expiry_date ? Math.max(0, dayjs(license.expiry_date).diff(dayjs(), 'day')) : '—';
  const status = license.expiry_date
    ? (dayjs(license.expiry_date).isBefore(dayjs()) ? 'Expired' : daysLeft <= 14 ? 'Due Soon' : 'Current')
    : '—';

  return (
    <div className="min-h-screen flex bg-green-50">
      <SideBar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button onClick={() => router.push('/Dashboard/licenses')} className="flex items-center text-green-700 hover:text-green-900 mb-2">
              <FaArrowLeft className="mr-2" /> Back to Licenses
            </button>
            <h1 className="text-3xl font-bold text-green-800">License Details</h1>
            <p className="text-sm text-green-600">View and edit license information</p>
          </div>
          <button onClick={() => setEditing(true)} className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 flex items-center gap-2">
            Edit License
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-green-100 grid md:grid-cols-2 gap-6">
          <div className="flex items-center gap-3">
            <FaCarSide className="text-green-700 text-2xl" />
            <div>
              <p className="text-sm text-green-600">Vehicle</p>
              <p className="text-green-900 font-semibold">{vehicle ? `${vehicle.make} ${vehicle.model}` : 'Unknown'}</p>
              <p className="text-sm text-green-700">{vehicle?.registration_number || '—'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <FaInfoCircle className="text-green-700 text-2xl" />
            <div>
              <p className="text-sm text-green-600">Status</p>
              <p className="text-green-900 font-semibold">{status}</p>
              <p className="text-sm text-green-700">Days Left: {typeof daysLeft === 'number' ? daysLeft : '—'}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-green-600">Expiry Date</p>
            <p className="text-green-900 font-semibold">{license.expiry_date || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-green-600">Renewal Cost</p>
            <p className="text-green-900 font-semibold">R {license.renewal_cost?.toLocaleString() || '—'}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
