import CarouselTextBanner from "@/app/components/Home/carrousel-text-banner"
import FeatureProducts from "@/app/components/Home/Carrusel-de-productos/feature-products"

import BannerDiscount from "@/app/components/Home/banner-discount"
import ChoseCategory from "@/app/components/Home/chose-category"
import BannerProduct from "@/app/components/Home/bannerproduct"

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