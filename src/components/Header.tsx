'use client';

import Image from 'next/image';

export default function Header() {
  return (
    <header className="border-b border-black/5 bg-white">
      <nav className="max-w-[2000px] mx-auto px-6 py-6">
        <div className="flex items-center justify-center relative">
          {/* Home Icon - Left Aligned */}
          <a 
            href="https://get-better.co" 
            className="absolute left-0 flex items-center text-black hover:text-black transition-colors"
            aria-label="Zurück zur better Homepage"
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth={2}
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
              />
            </svg>
          </a>

          {/* Logo - Centered */}
          <a 
            href="/" 
            className="flex items-center"
            aria-label="Zurück zum Start"
          >
            <Image
              src="/better_logo_schwarz.png"
              alt="better"
              width={120}
              height={32}
              className="h-5 w-auto"
              priority
            />
          </a>
        </div>
      </nav>
    </header>
  );
}

