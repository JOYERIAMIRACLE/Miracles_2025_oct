import type { Metadata } from "next"
import { SoporteDinamicoLanding } from "@/components/SoporteDinamicoLanding"

export const metadata: Metadata = {
  title: "Soporte Dinámico Industrial",
  description: "Hub de gestión interna · Servir, Solucionar, Simplificar",
}

export default function SoporteDinamicoPage() {
  return <SoporteDinamicoLanding />
}
