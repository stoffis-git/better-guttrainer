'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProtocolResultsScreen from '@/components/screens/ProtocolResultsScreen';

export default function ProtocolResultsPage() {
  return (
    <div className="min-h-screen bg-white text-black">
      <Header />
      <ProtocolResultsScreen />
      <Footer />
    </div>
  );
}

