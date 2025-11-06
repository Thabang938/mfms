import React from 'react';
import NavBar from '@/components/NavBar';

export default function About() {
  return (
    <>
      <NavBar />

      <main className="min-h-screen bg-green-50 flex flex-col items-center justify-center text-green-900 px-6 py-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center">
          About
        </h1>
        <p className="text-lg md:text-xl max-w-3xl text-center mb-6">
          The Municipality Fleet Management System (MFMS) has been developed in-house by the
          <span className="font-semibold"> Emalahleni IT Department</span>.
          It is a comprehensive digital platform designed to efficiently manage all municipal vehicles.
          The system allows you to track vehicle maintenance, licenses, tyres, drivers, and reports in one centralized place.
        </p>
        <p className="text-lg md:text-xl max-w-3xl text-center">
          Our goal is to streamline fleet operations, improve record-keeping, and support the municipality in providing reliable transport services. 
          Every feature has been crafted to meet the unique requirements of the Emalahleni municipality, ensuring data accuracy and operational efficiency.
        </p>
      </main>

      <footer className="w-full bg-green-700 text-white py-4 flex items-center justify-center">
        <p className="text-sm flex items-center">
          <span className="mr-1">&copy;</span> 2025 - by IT Department
        </p>
      </footer>
    </>
  );
}
