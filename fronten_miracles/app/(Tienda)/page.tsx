import CarouselTextBanner from "@/app/(Tienda)/1tiendacomponentes/carrousel-text-banner"
import FeatureProducts from "@/app/(Tienda)/1tiendacomponentes/feature-products"

import BannerDiscount from "@/app/(Tienda)/1tiendacomponentes/banner-discount"
import ChoseCategory from "@/app/(Tienda)/1tiendacomponentes/chose-category"
import BannerProduct from "@/app/(Tienda)/1tiendacomponentes/bannerproduct"

export default function Home() {
  return (
    <div>
      <CarouselTextBanner />
      <FeatureProducts />
      <BannerDiscount />
      <ChoseCategory />
      <BannerProduct />
      <p>empresa</p>
      <p>blog</p>
      <p>subscripciuon</p>
    </div>
  )
}