'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProtocolSetupScreen from '@/components/screens/ProtocolSetupScreen';

export default function ProtocolSetupPage() {
  return (
    <div className="min-h-screen bg-white text-black">
      <Header />
      <ProtocolSetupScreen />
      <Footer />
    </div>
  );
}

