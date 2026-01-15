import CarouselTextBanner from "@/components/Home/carrousel-text-banner"
import FeatureProducts from "@/components/Carrusel-de-productos/feature-products"
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import BannerDiscount from "@/components/banner-discount"
import ChoseCategory from "@/components/chose-category"
import BannerProduct from "@/components/bannerproduct"
 
export default function Home() {
  return (
    <div>
      <CarouselTextBanner/>
      <FeatureProducts/>
      <BannerDiscount/>
      <ChoseCategory/>
      <BannerProduct/>
    </div>
  )
}