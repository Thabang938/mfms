'use client';
import Link from 'next/link';
import Image from 'next/image';
import { FaSignOutAlt } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

export default function SideBar() {
  const router = useRouter();

  const handleSignOut = () => {
    router.push('/');
  };

  return (
    <aside className="w-64 bg-green-800 text-white p-6 flex flex-col justify-between shadow-lg">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Image src="/logo.jpg" alt="MFMS Logo" width={40} height={40} className="rounded" />
          <span className="text-xl font-bold">MFMS</span>
        </div>
        <nav className="space-y-4 text-lg font-medium">
          <Link href="/dashboard" className="block hover:text-green-300">Dashboard</Link>
          <Link href="/dashboard/vehicles" className="block hover:text-green-300">Vehicles</Link>
          <Link href="/dashboard/services" className="block hover:text-green-300">Services</Link>
          <Link href="/dashboard/licenses" className="block hover:text-green-300">Licenses</Link>
          <Link href="/dashboard/accidents" className="block hover:text-green-300">Accidents</Link>
        </nav>
      </div>
      <button
        onClick={handleSignOut}
        className="mt-6 flex items-center gap-2 text-sm text-red-300 hover:text-red-500 transition"
      >
        <FaSignOutAlt className="text-lg" />
        Sign Out
      </button>
    </aside>
  );
}