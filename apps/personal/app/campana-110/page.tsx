import type { Metadata } from "next"
import { Campana110View } from "@/components/Campana110View"

export const metadata: Metadata = {
  title: "¡Jugemos al 110! — SDI",
  description: "Logremos cumplir al 110% la promesa al cliente.",
}

export default function Campana110Page() {
  return <Campana110View />
}
