import React from 'react'
import Link from 'next/link'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button' // Recomiendo envolver el trigger en un button

// Misma lista que el menú de escritorio (menu-list.tsx) — antes tenía sus
// propias 7 categorías con rutas "/categoria/*" (español, con acento) que
// nunca existieron; la ruta real siempre fue "/category/*" (inglés), así
// que los 7 links daban 404 en móvil. Ahora refleja exactamente las mismas
// 9 categorías y rutas que el escritorio.
const menuItems = [
  { title: "Anillos",   href: "/category/anillos",   desc: "Desde solitarios hasta alianzas, en oro 10k y plata 925." },
  { title: "Cadenas",   href: "/category/cadenas",   desc: "Cartier, figaro, cubana y más estilos en diferentes medidas." },
  { title: "Esclavas",  href: "/category/esclavas",  desc: "Elegantes esclavas para dama y caballero." },
  { title: "Aretes",    href: "/category/aretes",    desc: "Argollas, palitos, gota y más diseños para cada ocasión." },
  { title: "Broqueles", href: "/category/broqueles", desc: "Pequeños y elegantes, perfectos para uso diario." },
  { title: "Dijes",     href: "/category/dijes",     desc: "Figuras y símbolos para personalizar tu collar o pulsera." },
  { title: "Pulsos",    href: "/category/pulsos",    desc: "Pulseras y brazaletes en distintos estilos y medidas." },
  { title: "Rosarios",  href: "/category/rosarios",  desc: "Rosarios artesanales en oro 10k y plata 925." },
  { title: "Argollas",  href: "/category/argollas",  desc: "Argollas de compromiso y matrimonio en todos los tamaños." },
]

const ItemsMenuMobile = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Abrir menú">
          <Menu className="h-6 w-6" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-4 bg-white dark:bg-zinc-950 shadow-xl border border-border rounded-lg">
        <div className="flex flex-col gap-4">
          <h3 className="font-bold text-lg border-b border-border pb-2">Nuestras Joyas</h3>
          <ul className="flex flex-col gap-3">
            {menuItems.map((item) => (
              <li key={item.title}>
                <Link
                  href={item.href}
                  className="group block p-2 rounded-md hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors"
                >
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                    {item.title}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 italic">
                    {item.desc}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-1 border-t border-border pt-3">
            <Link href="/blog" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:text-amber-600 dark:hover:text-amber-400 p-2 rounded-md hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors">
              Blog
            </Link>
            <Link href="/nosotros" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:text-amber-600 dark:hover:text-amber-400 p-2 rounded-md hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors">
              Nosotros
            </Link>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default ItemsMenuMobile