'use client';
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaUserCircle } from "react-icons/fa";

export default function NavBar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-green-50 text-green-900 shadow-sm w-full">
      <nav className="w-full px-6 py-4 flex items-center justify-between">
        {/* Logo and Brand */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/Emalahleni.png"
            alt="Municipal Fleet Management System Logo"
            width={36}
            height={36}
            priority
          />
          <span className="text-2xl font-bold">MFMS</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8 text-lg font-medium">
          <Link href="/" className="hover:text-green-700">Home</Link>
          <Link href="/About" className="hover:text-green-700">About</Link>
          <Link href="/Login" className="flex items-center gap-2 hover:text-green-700">
            <FaUserCircle className="text-2xl" />
            Guest
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden">
          <button
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="p-2 rounded-md border border-green-300 text-green-900"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {/* Mobile Dropdown Menu */}
      {open && (
        <div className="md:hidden bg-green-50 border-t border-green-200 w-full">
          <div className="px-6 py-4 flex flex-col gap-4 text-lg font-medium">
            <Link href="/" className="hover:text-green-700">Home</Link>
            <Link href="/Login" className="flex items-center gap-2 hover:text-green-700">
              <FaUserCircle className="text-2xl" />
              Guest
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}