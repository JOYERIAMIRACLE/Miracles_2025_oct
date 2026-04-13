"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"
import { PersonalSidebar } from "./PersonalSidebar"

export function MobileSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="md:hidden p-2 rounded-md hover:bg-slate-800 transition-colors text-slate-400"
        aria-label="Abrir menu"
      >
        <Menu size={20} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 border-r border-slate-800/80 shadow-2xl shadow-black/50 transform transition-transform duration-300 ease-in-out md:hidden ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-end px-4 py-3 border-b border-slate-800/80">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-md hover:bg-slate-800 transition-colors text-slate-500"
            aria-label="Cerrar menu"
          >
            <X size={18} />
          </button>
        </div>
        <div onClick={() => setOpen(false)}>
          <PersonalSidebar />
        </div>
      </div>
    </>
  )
}
