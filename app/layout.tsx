// // src/app/layout.tsx
// import type { Metadata } from "next";
// import { Inter } from "next/font/google";
// import "./globals.css";
// import Sidebar from "@/componets/Sidebar";


// const inter = Inter({ subsets: ["latin"] });

// export const metadata: Metadata = {
//   title: "Sarvam Developer Portal",
//   description: "Frontend Intern Assignment",
// };

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <html lang="en">
//       <body className={`${inter.className} bg-white text-slate-950 antialiased dark:bg-[#07080a] dark:text-slate-50`}>
//         <div className="min-h-screen bg-white dark:bg-[#07080a]">
//           <Sidebar />
//           <main className="min-h-screen lg:pl-[288px]">
//             {children}
//           </main>
//         </div>
//       </body>
//     </html>
//   );
// }

// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/componets/Sidebar"; 
import { ThemeProvider } from "@/componets/ThemeProvider";

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
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-white text-slate-950 antialiased dark:bg-[#07080a] dark:text-slate-50`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
        >
          <div className="min-h-screen bg-white dark:bg-[#07080a]">
            <Sidebar />
            {/* Note the updated padding here: lg:pl-[260px] */}
         <main className="min-h-screen lg:pl-[260px]">
  {children}
</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}