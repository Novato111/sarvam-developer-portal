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
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        <div className="flex min-h-screen">
          {/* Persistent Sidebar */}
          <Sidebar />
          
          {/* Dynamic Main Content Area */}
          <main className="flex-1 ml-64 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}