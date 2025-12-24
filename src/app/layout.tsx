import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AppProvider } from "@/components/AppProvider";

// Load Amberes Grotesk font using Next.js font optimization
// Path is relative to project root (where next.config.ts is located)
// From src/app/layout.tsx, we need to go up two levels to reach project root
const amberesGrotesk = localFont({
  src: [
    {
      path: "../../public/fonts/amberes-grotesk/amberes-grotesk.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/amberes-grotesk/amberes-grotesk.woff",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-amberes",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Gut-Training Protokoll-Generator | Optimiere deine Energiezufuhr",
  description:
    "Entdecke dein Potenzial für eine optimierte Fueling-Strategie und erhalte dein persönliches Gut-Training-Protokoll – basierend auf aktueller Sportwissenschaft.",
  keywords: [
    "gut training",
    "Magen-Darm-Training",
    "Endurance",
    "Ausdauer",
    "Kohlenhydrate",
    "Carbs",
    "Triathlon",
    "Radfahren",
    "Laufen",
    "Ultra",
  ],
  icons: {
    icon: [
      {
        url: "https://cdn.shopify.com/s/files/1/0873/9700/7685/files/better_favicon_light.png?v=1716194944",
        type: "image/png",
      },
    ],
    shortcut: "https://cdn.shopify.com/s/files/1/0873/9700/7685/files/better_favicon_light.png?v=1716194944",
    apple: "https://cdn.shopify.com/s/files/1/0873/9700/7685/files/better_favicon_light.png?v=1716194944",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={amberesGrotesk.variable}>
      <body className="antialiased">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
