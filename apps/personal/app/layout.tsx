import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"

import { ThemeProvider } from "@/app/(Tienda)/1tiendacomponentes/theme-provider"
// import ChatWidget from "@/components/Shared/ChatWidget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://joyeriamiraclesweb.com"

export const metadata: Metadata = {
  title: {
    default: "Joyería Miracles | Oro y Plata de Alta Calidad",
    template: "%s | Joyería Miracles",
  },
  description: "Venta de joyería fina en oro de 10k, 14k y plata 925. Envíos a todo México.",
  metadataBase: new URL(SITE),
  icons: { icon: "/favicon.ico" },
}

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "JewelryStore",
  name: "Joyería Miracles",
  url: SITE,
  description: "Venta de joyería fina en oro de 10k, 14k y plata 925. Envíos a todo México.",
  email: "miraclejoyeria@gmail.com",
  areaServed: "MX",
  currenciesAccepted: "MXN",
  priceRange: "$$",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          {/* <ChatWidget /> */}
        </ThemeProvider>
        <Toaster richColors position="top-right" closeButton />
      </body>
    </html>
  )
}



