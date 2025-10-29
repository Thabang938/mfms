'use client';
import { useState } from 'react';
import {
  FaCar, FaTools, FaFileAlt, FaExclamationTriangle, FaGasPump,
  FaClipboardList, FaFolderOpen, FaUserTie, FaSignOutAlt, FaHome,
  FaAngleDoubleLeft, FaAngleDoubleRight, FaIdCard, FaDotCircle,
} from 'react-icons/fa';

export default function SideBar() {
  const [expanded, setExpanded] = useState(true);

  return (
    <aside
      className={`bg-green-800 text-white min-h-screen transition-all duration-300 ${
        expanded ? 'w-64' : 'w-20'
      } flex flex-col`}
    >
      {/* Logo and Toggle */}
      <div className="flex items-center justify-between p-4">
        <img src="/logo.jpg" alt="Logo" className="h-10" />
        <button
          onClick={() => setExpanded(!expanded)}
          className="bg-white text-green-800 rounded-full p-2 shadow-md hover:bg-green-100 transition"
        >
          {expanded ? <FaAngleDoubleLeft /> : <FaAngleDoubleRight />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-4 px-4 mt-6">
        <NavItem icon={<FaHome />} label="Dashboard" href="/Dashboard" expanded={expanded} />
        <NavItem icon={<FaCar />} label="Vehicles" href="/Dashboard/vehicles" expanded={expanded} />
        <NavItem icon={<FaTools />} label="Services" href="/Dashboard/services" expanded={expanded} />
        <NavItem icon={<FaGasPump />} label="Fuel Logs" href="/Dashboard/fuel" expanded={expanded} />
        <NavItem icon={<FaExclamationTriangle />} label="Accidents" href="/Dashboard/accidents" expanded={expanded} />
        <NavItem icon={<FaIdCard />} label="Licenses" href="/Dashboard/licenses" expanded={expanded} />
        <NavItem icon={<FaDotCircle />} label="Tyres" href="/Dashboard/tyres" expanded={expanded} />
        <NavItem icon={<FaClipboardList />} label="Reports" href="/Dashboard/reports" expanded={expanded} />
        <NavItem icon={<FaFolderOpen />} label="Documents" href="/Dashboard/documents" expanded={expanded} />
        <NavItem icon={<FaUserTie />} label="Drivers" href="/Dashboard/drivers" expanded={expanded} />
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-green-700">
        <NavItem icon={<FaSignOutAlt />} label="Sign Out" href="/" expanded={expanded} />
      </div>
    </aside>
  );
}

function NavItem({ icon, label, href, expanded }) {
  return (
    <a
      href={href}
      className="flex items-center space-x-3 text-white hover:text-green-300 transition"
    >
      <span className="text-lg">{icon}</span>
      {expanded && <span className="text-sm font-medium">{label}</span>}
    </a>
  );
}