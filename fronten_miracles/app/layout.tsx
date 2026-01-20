import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Layout/navbar";
import Footer from "@/components/Layout/footer";
import { ThemeProvider } from "@/components/Layout/theme-provider";

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
    default: "Joyeria Miracles | Oro y Plata de Alta Calidad",
    template: "%s | Joyeria Miracles"
  },
  description: "Venta de joyeria fina en oro de 10k, 14k y plata 925. ",
  keywords: ["joyeria", "oro", "plata", "anillos de compromiso", "mexico"], // Ayuda a que te encuentren
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning >
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider 
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            
          <Navbar/>
          {children}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}



