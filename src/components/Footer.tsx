'use client';

import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black">
      <div className="max-w-[2000px] mx-auto px-6 py-12">
        {/* Main Footer Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Logo and Brand */}
          <div className="space-y-4">
            <a 
              href="https://get-better.co" 
              className="inline-block mb-4"
              aria-label="Zurück zur better Homepage"
            >
              <Image
                src="https://get-better.co/cdn/shop/files/Arrows_Better_white.png?v=1716194899&width=400"
                alt="better"
                width={200}
                height={50}
                className="h-12 w-auto"
                unoptimized
              />
            </a>
            <p className="text-[18px] leading-[30px] text-white font-light">
              2025 ® All rights reserved<br />
              Better Performance GmbH
            </p>
            <p className="text-sm leading-[20px] text-white font-light italic">
              From Hamburg to all great athletes
            </p>
          </div>

          {/* Navigation Links */}
          <div>
            <nav className="flex flex-col gap-2">
              <a
                href="https://get-better.co"
                className="text-[18px] leading-[30px] text-white font-light hover:text-white/80 transition-colors"
              >
                Zur Homepage
              </a>
              <a
                href="https://get-better.co/pages/unsere-story"
                className="text-[18px] leading-[30px] text-white font-light hover:text-white/80 transition-colors"
              >
                Über uns
              </a>
              <a
                href="https://get-better.co/blogs/magazin"
                className="text-[18px] leading-[30px] text-white font-light hover:text-white/80 transition-colors"
              >
                Magazin
              </a>
            </nav>
          </div>

          {/* Legal and Social Links */}
          <div>
            <nav className="flex flex-col gap-2">
              <a
                href="https://instagram.com/get.betterperformance/"
                className="text-[18px] leading-[30px] text-white font-light hover:text-white/80 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram
              </a>
              <a
                href="https://get-better.co/policies/legal-notice"
                className="text-[18px] leading-[30px] text-white font-light hover:text-white/80 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Impressum
              </a>
              <a
                href="https://get-better.co/policies/terms-of-service"
                className="text-[18px] leading-[30px] text-white font-light hover:text-white/80 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                AGBs
              </a>
              <a
                href="https://get-better.co/policies/refund-policy"
                className="text-[18px] leading-[30px] text-white font-light hover:text-white/80 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Widerrufsrecht
              </a>
              <a
                href="https://get-better.co/policies/privacy-policy"
                className="text-[18px] leading-[30px] text-white font-light hover:text-white/80 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Datenschutzerklärung
              </a>
            </nav>
          </div>
        </div>

      </div>
    </footer>
  );
}

