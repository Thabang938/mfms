'use client';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  FaCar, FaTools, FaExclamationTriangle, FaGasPump,
  FaClipboardList, FaFolderOpen, FaUserTie, FaHome,
  FaIdCard, FaDotCircle, FaSignOutAlt
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabaseClient } from '@/lib/supabaseClient';

export default function SideBar() {
  const [expanded, setExpanded] = useState(true);
  const [role, setRole] = useState(null);
  const pathname = usePathname();
  const router = useRouter();

  // Fetch logged-in user's role
  useEffect(() => {
    const fetchRole = async () => {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (user) {
        const { data } = await supabaseClient
          .from('users')
          .select('role')
          .eq('auth_id', user.id)
          .single();
        if (data) setRole(data.role);
      }
    };
    fetchRole();
  }, [pathname]);

  // Handle Sign Out
  const handleSignOut = async () => {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      console.error('Sign out error:', error.message);
    } else {
      router.push('/'); // Redirect after session cookie cleared
    }
  };

  // Sidebar items per role
  const navItems = [
    { icon: <FaHome />, label: 'Dashboard', href: '/Dashboard', roles: ['Fleet Manager', 'Technician', 'Admin Clerk', 'Driver'] },
    { icon: <FaCar />, label: 'Vehicles', href: '/Dashboard/vehicles', roles: ['Fleet Manager', 'Technician', 'Driver'] },
    { icon: <FaTools />, label: 'Services', href: '/Dashboard/services', roles: ['Fleet Manager', 'Technician'] },
    { icon: <FaGasPump />, label: 'Fuel Logs', href: '/Dashboard/fuel', roles: ['Fleet Manager', 'Technician', 'Driver'] },
    { icon: <FaExclamationTriangle />, label: 'Accidents', href: '/Dashboard/accidents', roles: ['Fleet Manager', 'Driver'] },
    { icon: <FaIdCard />, label: 'Licenses', href: '/Dashboard/licenses', roles: ['Fleet Manager', 'Admin Clerk'] },
    { icon: <FaDotCircle />, label: 'Tyres', href: '/Dashboard/tyres', roles: ['Fleet Manager', 'Technician', 'Driver'] },
    { icon: <FaClipboardList />, label: 'Reports', href: '/Dashboard/reports', roles: ['Fleet Manager', 'Admin Clerk'] },
    { icon: <FaFolderOpen />, label: 'Documents', href: '/Dashboard/documents', roles: ['Fleet Manager', 'Admin Clerk'] },
    { icon: <FaUserTie />, label: 'Drivers', href: '/Dashboard/drivers', roles: ['Fleet Manager', 'Admin Clerk'] },
  ];

  return (
    <aside
      className={`bg-green-800 text-white min-h-screen transition-all duration-500 ease-in-out shadow-xl
      ${expanded ? 'w-64' : 'w-20'} flex flex-col relative`}
    >
      {/* Logo Section */}
      <div className="flex items-center justify-between p-4 relative border-b border-green-700">
        <motion.img
          src="/logo.jpg"
          alt="Logo"
          className="h-10 rounded-md shadow-sm"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        />

        {/* Toggle Button */}
        <motion.button
          onClick={() => setExpanded(!expanded)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="absolute -right-4 top-1/2 transform -translate-y-1/2 bg-white text-green-800 shadow-md 
                     rounded-full p-2 hover:bg-green-100 transition-all border border-green-200"
        >
          {expanded ? (
            <motion.div initial={{ rotate: 0 }} animate={{ rotate: 180 }}>
              <ChevronLeft size={20} />
            </motion.div>
          ) : (
            <motion.div initial={{ rotate: 180 }} animate={{ rotate: 0 }}>
              <ChevronRight size={20} />
            </motion.div>
          )}
        </motion.button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-2 px-3 mt-4">
        {role &&
          navItems
            .filter(item => item.roles.includes(role))
            .map(item => (
              <NavItem
                key={item.label}
                icon={item.icon}
                label={item.label}
                href={item.href}
                expanded={expanded}
                active={pathname === item.href}
              />
            ))}
      </nav>

      {/* ✅ Sign Out Button */}
      <div className="p-4 border-t border-green-700">
        <button
          onClick={handleSignOut}
          className="flex items-center space-x-3 text-white hover:text-green-300 transition"
        >
          <FaSignOutAlt className="text-lg" />
          {expanded && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}

// Navigation Item Component
function NavItem({ icon, label, href, expanded, active }) {
  return (
    <a
      href={href}
      className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group
        ${active
          ? 'bg-white text-green-800 font-semibold shadow-md'
          : 'text-white hover:bg-green-700 hover:text-white/90'}
      `}
    >
      <span
        className={`text-lg transition-transform duration-300 group-hover:scale-110 ${
          active ? 'text-green-700' : ''
        }`}
      >
        {icon}
      </span>
      {expanded && (
        <span
          className={`text-sm transition-all duration-300 ${
            active ? 'text-green-700' : ''
          }`}
        >
          {label}
        </span>
      )}
    </a>
  );
}
