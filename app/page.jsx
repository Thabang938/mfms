import NavBar from '../components/NavBar';

export default function HomePage() {
  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-green-50 flex flex-col items-center justify-center text-green-900">
        <h1 className="text-5xl font-bold mb-6">Municipal Fleet Management System (MFMS)</h1>
        <p className="text-lg max-w-2xl text-center mb-8">
          A centralized digital platform to manage all municipal vehicles efficiently — track
          maintenance, licenses, tyres, drivers, and reports in one place.
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
