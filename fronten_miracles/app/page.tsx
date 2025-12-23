import CarouselTextBanner from "@/components/carrousel-text-banner"
import FeatureProducts from "@/components/feature-products"
import { Button } from "@/components/ui/button"
import Link from 'next/link'
 
export default function Home() {
  return (
    <div>
      <CarouselTextBanner/>
      <FeatureProducts/>
    </div>
  )
}