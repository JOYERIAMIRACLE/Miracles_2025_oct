import { GameHUDLayout } from "@/components/GameEmpresa/GameHUDLayout"
import { AuthGuard } from "@/components/AuthGuard"
import type { ReactNode } from "react"

export default function EmpresaRPGLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dark">
      <AuthGuard>
        <GameHUDLayout>{children}</GameHUDLayout>
      </AuthGuard>
    </div>
  )
}
