import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"

import { ThemeProvider } from "@/app/(Tienda)/1tiendacomponentes/theme-provider"
// import ChatWidget from "@/components/Shared/ChatWidget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  preload: false,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://medalladeoro.com.mx"

export const metadata: Metadata = {
  title: {
    default: "Medalla de Oro | Joyería Fina en Oro y Plata",
    template: "%s | Medalla de Oro",
  },
  description: "Venta de joyería fina en oro de 10k, 14k y plata 925. Envíos a todo México.",
  metadataBase: new URL(SITE),
  icons: { icon: "/favicon.ico" },
}

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "JewelryStore",
  name: "Medalla de Oro",
  alternateName: "Joyería Miracles",
  url: SITE,
  description: "Venta de joyería fina en oro de 10k, 14k y plata 925. Envíos a todo México.",
  email: "contacto@medalladeoro.com.mx",
  telephone: "+528125729510",
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



