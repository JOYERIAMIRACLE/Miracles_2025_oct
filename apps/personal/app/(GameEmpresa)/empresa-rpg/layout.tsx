import { GameHUDLayout } from "@/components/GameEmpresa/GameHUDLayout"
import type { ReactNode } from "react"

export default function EmpresaRPGLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dark">
      <GameHUDLayout>{children}</GameHUDLayout>
    </div>
  )
}
