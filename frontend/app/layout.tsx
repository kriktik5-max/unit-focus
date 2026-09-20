import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Юнит-Фокус — юнит-экономика для Wildberries, Ozon и Яндекс Маркета",
  description: "Бесплатный калькулятор юнит-экономики для селлеров маркетплейсов. Рассчитайте прибыль, маржу, ROI и точку безубыточности за 30 секунд.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
