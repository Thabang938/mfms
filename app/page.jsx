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
    </>
  );
}