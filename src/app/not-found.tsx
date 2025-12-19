'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      <Header />
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h1 className="text-4xl font-bold">404</h1>
          <p className="text-xl text-black/70">Seite nicht gefunden</p>
          <p className="text-black/60">
            Die angeforderte Seite existiert nicht.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-black text-white rounded-lg hover:bg-black/80 transition-colors"
          >
            Zur Startseite
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}

