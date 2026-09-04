import type { Metadata } from "next"
import CarouselTextBanner from "@/app/(Tienda)/1tiendacomponentes/carrousel-text-banner"
import FeatureProducts    from "@/app/(Tienda)/1tiendacomponentes/feature-products"
import BannerDiscount     from "@/app/(Tienda)/1tiendacomponentes/banner-discount"
import ChoseCategory      from "@/app/(Tienda)/1tiendacomponentes/chose-category"
import BannerProduct      from "@/app/(Tienda)/1tiendacomponentes/bannerproduct"

const SITE_URL = "https://miracles-frontend.pages.dev"
const TITLE = "Tienda | Joyería Miracles"
const DESCRIPTION = "Explora todo el catálogo de Joyería Miracles: anillos, cadenas, aretes, dijes, pulsos y más en oro 10k y plata 925. Envíos a todo México."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/tienda` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/tienda`,
    siteName: "Joyería Miracles",
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
      <CarouselTextBanner />
      <FeatureProducts />
      <BannerDiscount />
      <ChoseCategory />
      <BannerProduct />
    </div>
  )
}
