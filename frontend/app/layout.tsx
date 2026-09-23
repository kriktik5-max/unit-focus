import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono, Spectral } from "next/font/google";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
});

const spectral = Spectral({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "Юнит-Фокус — юнит-экономика для Wildberries, Ozon и Яндекс Маркета",
  description:
    "Бесплатный калькулятор юнит-экономики для селлеров маркетплейсов. Рассчитайте прибыль, маржу, ROI и точку безубыточности за 30 секунд.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${plexSans.variable} ${plexMono.variable} ${spectral.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
