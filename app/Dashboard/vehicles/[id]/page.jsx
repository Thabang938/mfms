'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';
import SideBar from '@/components/SideBar';
import VehicleForm from '@/components/Forms/VehicleForm';
import { 
  FaArrowLeft, 
  FaEdit, 
  FaCar, 
  FaCalendar, 
  FaGasPump, 
  FaBuilding, 
  FaInfoCircle 
} from 'react-icons/fa';

export default function VehicleDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [vehicle, setVehicle] = useState(null);
  const [signedUrl, setSignedUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  // --- Fetch vehicle ---
  useEffect(() => {
    if (!id) return;
    fetchVehicle();
  }, [id]);

  async function fetchVehicle() {
    try {
      setLoading(true);
      const { data, error } = await supabaseClient
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setVehicle(data);

      // Generate signed URL if image exists
      if (data.vehicle_image) {
        const { data: urlData, error: urlError } = await supabaseClient.storage
          .from('Documents_Storage')
          .createSignedUrl(data.vehicle_image, 60); // valid for 60 seconds
        if (urlError) throw urlError;
        setSignedUrl(urlData.signedUrl);
      } else {
        setSignedUrl(null);
      }
    } catch (err) {
      console.error('Error fetching vehicle:', err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-green-700">
        Loading vehicle details...
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-600">
        Vehicle not found.
      </div>
    );
  }

  // --- Editing view ---
  if (editing) {
    return (
      <div className="min-h-screen flex bg-green-50">
        <SideBar />
        <main className="flex-1 p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-green-800">Edit Vehicle</h1>
            <button
              onClick={() => setEditing(false)}
              className="text-green-700 hover:text-green-900 flex items-center gap-2"
            >
              <FaArrowLeft /> Back
            </button>
          </div>

          <VehicleForm
            initial={vehicle}
            onSuccess={() => {
              setEditing(false);
              fetchVehicle();
            }}
            onClose={() => setEditing(false)}
          />
        </main>
      </div>
    );
  }

  // --- Vehicle detail view ---
  return (
    <div className="min-h-screen flex bg-green-50">
      <SideBar />
      <main className="flex-1 p-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => router.push('/Dashboard/vehicles')}
              className="flex items-center text-green-700 hover:text-green-900 mb-2"
            >
              <FaArrowLeft className="mr-2" /> Back to Vehicles
            </button>
            <h1 className="text-3xl font-bold text-green-800">
              {vehicle.registration_number}
            </h1>
            <p className="text-sm text-green-600">Vehicle Information Overview</p>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 transition"
          >
            <FaEdit className="mr-2" /> Edit
          </button>
        </div>

        {/* Vehicle Image */}
        <div className="mb-6 w-full max-h-96 rounded-lg overflow-hidden flex items-center justify-center bg-green-50 shadow">
          {signedUrl ? (
            <img
              src={signedUrl}
              alt={vehicle.registration_number}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="text-center text-green-400">
              <FaCar className="text-5xl mb-2 mx-auto" />
              <p>No image uploaded for this vehicle.</p>
            </div>
          )}
        </div>

        {/* Vehicle Details */}
        <div className="bg-white rounded-lg shadow p-6 grid md:grid-cols-2 gap-6 border border-green-100">
          <Detail label="Registration Number" value={vehicle.registration_number} icon={<FaCar />} />
          <Detail label="Make" value={vehicle.make || '—'} icon={<FaCar />} />
          <Detail label="Model" value={vehicle.model || '—'} icon={<FaCar />} />
          <Detail label="Year" value={vehicle.year || '—'} icon={<FaCalendar />} />
          <Detail label="VIN" value={vehicle.vin || '—'} icon={<FaInfoCircle />} />
          <Detail label="Department" value={vehicle.department || '—'} icon={<FaBuilding />} />
          <Detail label="Fuel Type" value={vehicle.fuel_type || '—'} icon={<FaGasPump />} />
          <Detail label="Odometer" value={vehicle.odometer ? `${Number(vehicle.odometer).toLocaleString()} km` : '—'} icon={<FaCar />} />
          <Detail label="Status" value={vehicle.status} icon={<FaInfoCircle />} />
          <div className="md:col-span-2">
            <h3 className="text-green-800 font-semibold mb-2 flex items-center">
              <FaInfoCircle className="mr-2" /> Description
            </h3>
            <p className="text-green-700 bg-green-50 rounded p-3 border border-green-100">
              {vehicle.description || 'No description provided.'}
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}

function Detail({ label, value, icon }) {
  return (
    <div className="flex items-center gap-3 bg-green-50 p-4 rounded-lg border border-green-100">
      <div className="text-green-600 text-xl">{icon}</div>
      <div>
        <p className="text-sm text-green-600">{label}</p>
        <p className="text-green-900 font-semibold">{value}</p>
      </div>
    </div>
  );
}
