// [TeleZeta] Root Layout
// Setup fonts, providers, dan metadata dasar
import React from "react";
import type { Metadata } from "next";
import type { Viewport } from "next";
import { AuthProvider } from '@/components/providers/AuthProvider';
import { createClient } from '@/lib/supabase/server';
import "./globals.css";

export const metadata: Metadata = {
  title: "TeleZeta — Platform Telemedicine Indonesia",
  description:
    "TeleZeta adalah platform telemedicine modern untuk konsultasi kesehatan online. Hubungi dokter terpercaya melalui video call dan chat secara real-time.",
  keywords: ["telemedicine", "konsultasi dokter", "kesehatan online", "TeleZeta"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let profile = null;
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    profile = data;
  }

  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,300..700&family=DM+Serif+Display:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <AuthProvider initialUser={user} initialProfile={profile} initialRole={profile?.role as any}>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
