import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/components/AppProvider";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
