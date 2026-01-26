import type { Metadata } from "next";
import Navbar from "@/components/Layout/navbar";
import Footer from "@/components/Layout/footer";

export const metadata: Metadata = {
  // Este título se inyectará en el %s del Root Layout
  title: "Tienda Oficial", 
  description: "Explora nuestra colección exclusiva de anillos, cadenas y pulseras en oro y plata. Envíos seguros a todo México.",
  keywords: ["joyería", "oro 14k", "plata 925", "anillos de compromiso", "México"],
};

export default function TiendaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* El Navbar solo aparece en la zona de tienda */}
      <Navbar />
      
      <main className="flex-grow">
        {children}
      </main>
      
      {/* El Footer solo aparece en la zona de tienda */}
      <Footer />
    </div>
  );
}