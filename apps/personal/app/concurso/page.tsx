import type { Metadata } from "next"
import { ConcursoView } from "@/components/ConcursoView"

export const metadata: Metadata = {
  title: "Somos Diferentes Innovando — SDI",
  description: "Concurso interno de innovación SDI. Comparte tu propuesta.",
}

export default function ConcursoPage() {
  return <ConcursoView />
}
