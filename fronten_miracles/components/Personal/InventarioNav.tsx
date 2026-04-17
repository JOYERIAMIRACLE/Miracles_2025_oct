"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Wallet, Gem } from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
  { name: "Cuentas",    href: "/gestion-personal/cuentas",    icon: Wallet, desc: "Liquidas y crédito" },
  { name: "Patrimonio", href: "/gestion-personal/patrimonio", icon: Gem,    desc: "Activos, pasivos y préstamos" },
]

export function InventarioNav() {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800 -mt-2 mb-1">
      {tabs.map(t => {
        const isActive = pathname === t.href
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
              isActive
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            <t.icon className="h-4 w-4" />
            <span>{t.name}</span>
            <span className="text-[10px] text-zinc-400 hidden sm:inline">· {t.desc}</span>
          </Link>
        )
      })}
    </div>
  )
}
