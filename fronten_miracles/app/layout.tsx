import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"

import { ThemeProvider } from "@/app/(Tienda)/1tiendacomponentes/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    // Título por defecto si una página no tiene uno propio
    default: "Joyería Miracles | Oro y Plata de Alta Calidad",
    // El %s será reemplazado por el título de cada página específica
    template: "%s | Joyería Miracles"
  },
  description: "Venta de joyería fina en oro de 10k, 14k y plata 925.",
  icons: {
    icon: "/favicon.ico", // Asegúrate de tener este archivo en /public
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning >
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider 
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            
          
          {children}
          
        </ThemeProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}



