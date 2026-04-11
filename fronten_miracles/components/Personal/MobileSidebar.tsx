"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"
import { PersonalSidebar } from "./PersonalSidebar"

export function MobileSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Botón hamburguesa */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="md:hidden p-2 rounded-md hover:bg-muted transition-colors"
        aria-label="Abrir menú"
      >
        <Menu size={22} />
      </button>

      {/* Overlay oscuro */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-background border-r shadow-xl transform transition-transform duration-300 ease-in-out md:hidden ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-end px-4 py-3 border-b">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>
        <div onClick={() => setOpen(false)}>
          <PersonalSidebar />
        </div>
      </div>
    </>
  )
}
