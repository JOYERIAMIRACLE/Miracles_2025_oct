import type { Metadata } from "next"
import HeroTienda          from "./1tiendacomponentes/hero-tienda"
import CertificadosStrip   from "./1tiendacomponentes/certificados-strip"
import CategoriaGrid       from "./1tiendacomponentes/categoria-grid"
import ComprarPorMaterial  from "./1tiendacomponentes/compra-por-material"
import TopVentas           from "./1tiendacomponentes/top-ventas"
import ComprarPorOcasion   from "./1tiendacomponentes/compra-por-ocasion"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://medalladeoro.com.mx"

const TITLE = "Medalla de Oro | Oro y Plata de Alta Calidad"
const DESCRIPTION = "Joyería fina en oro de 10k y plata 925: anillos, cadenas, aretes, dijes, pulsos y más. Envíos a todo México."

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Medalla de Oro",
    type: "website",
    images: [{ url: `${SITE_URL}/portada%20home.jpg.jpg`, width: 1200, height: 630, alt: "Medalla de Oro" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [`${SITE_URL}/portada%20home.jpg.jpg`],
  },
}

export default function HomePage() {
  return (
    <div>
      <HeroTienda />
      <CertificadosStrip />
      <CategoriaGrid />
      <ComprarPorOcasion />
      <TopVentas />
      <ComprarPorMaterial />
    </div>
  )
}
