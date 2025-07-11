// RUTA: src/app/layout.tsx

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import AuthProvider from "@/components/providers/auth-provider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Finanzas App - Personal Finance Manager",
  description: "Manage your personal finances with bank integration via Belvo",
};

// El layout raíz también tiene acceso a los params de la ruta
type RootLayoutProps = {
  children: React.ReactNode;
  params: { locale: string };
};

export default function RootLayout({ children, params: { locale } }: RootLayoutProps) {
  return (
    // Ahora el idioma se establece aquí dinámicamente
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* DataFast Analytics */}
        <Script
          src="https://datafa.st/js/script.js"
          data-website-id="6871f0189cf2f572649bba2b"
          data-domain="famfinz.com"
          strategy="afterInteractive"
        />
        
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}