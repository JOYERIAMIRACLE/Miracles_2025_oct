"use client"

import { usePathname } from "next/navigation"

const titles: Record<string, string> = {
  "/gestion-personal":             "Dashboard Personal",
  "/gestion-personal/presupuesto": "Presupuesto",
  "/gestion-personal/patrimonio":  "Patrimonio",
}

export function PersonalHeader() {
  const pathname = usePathname()
  const title = titles[pathname] ?? pathname.split("/").filter(Boolean).pop()
    ?.replace(/-/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase()) ?? "Personal"

  return (
    <header className="h-16 flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 sticky top-0 z-40">
      <h1 className="text-xl font-bold tracking-tight">{title}</h1>
      <div className="h-9 w-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-semibold shadow">
        RR
      </div>
    </header>
  )
}
