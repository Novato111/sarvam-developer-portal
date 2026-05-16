// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/componets/Sidebar";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sarvam Developer Portal",
  description: "Frontend Intern Assignment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-slate-950 antialiased dark:bg-[#07080a] dark:text-slate-50`}>
        <div className="min-h-screen bg-white dark:bg-[#07080a]">
          <Sidebar />
          <main className="min-h-screen lg:pl-[288px]">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
