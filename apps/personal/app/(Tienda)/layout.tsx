import type { Metadata } from "next";
import Navbar from "@/app/(Tienda)/1tiendacomponentes/navbar";
import Footer from "@/app/(Tienda)/1tiendacomponentes/footer";
import { NotasMejoraTienda } from "@/app/(Tienda)/1tiendacomponentes/notas-mejora-tienda";
import { MedicionTienda } from "@/app/(Tienda)/1tiendacomponentes/medicion-tienda";
import AvisoPrivacidadBanner from "@/app/(Tienda)/1tiendacomponentes/aviso-privacidad-banner";

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
    <div className="relative flex flex-col min-h-screen">
      {/* El Navbar solo aparece en la zona de tienda */}
      <Navbar />

      <main className="flex-grow relative">
        {children}
        <NotasMejoraTienda />
        <MedicionTienda />
      </main>

      {/* El Footer solo aparece en la zona de tienda */}
      <Footer />

      {/* Antes solo vivía en el hero de "/"; ahora que la tienda es el
          inicio, se sube al layout para que se vea en cualquier página de
          entrada (alguien puede llegar por /category, /producto/x, etc.). */}
      <AvisoPrivacidadBanner />
    </div>
  );
}