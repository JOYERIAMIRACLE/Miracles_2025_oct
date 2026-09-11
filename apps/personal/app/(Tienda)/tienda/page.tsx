import type { Metadata } from "next"
import HeroTienda          from "@/app/(Tienda)/1tiendacomponentes/hero-tienda"
import CertificadosStrip   from "@/app/(Tienda)/1tiendacomponentes/certificados-strip"
import CategoriaGrid       from "@/app/(Tienda)/1tiendacomponentes/categoria-grid"
import ComprarPorMaterial  from "@/app/(Tienda)/1tiendacomponentes/compra-por-material"
import TopVentas           from "@/app/(Tienda)/1tiendacomponentes/top-ventas"
import ComprarPorOcasion   from "@/app/(Tienda)/1tiendacomponentes/compra-por-ocasion"

const SITE_URL = "https://miracles-frontend.pages.dev"
const TITLE = "Tienda | Medalla de Oro"
const DESCRIPTION = "Explora todo el catálogo de Medalla de Oro: anillos, cadenas, aretes, dijes, pulsos y más en oro 10k y plata 925. Envíos a todo México."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/tienda` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/tienda`,
    siteName: "Medalla de Oro",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
}

export default function TiendaPage() {
  return (
    <div>
      <HeroTienda />
      <CertificadosStrip />
      <CategoriaGrid />
      <ComprarPorMaterial />
      <TopVentas />
      <ComprarPorOcasion />
    </div>
  )
}
