import React from 'react'
import Link from 'next/link'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button' // Recomiendo envolver el trigger en un button

const menuItems = [
  { title: "Aretes", href: "/categoria/aretes", desc: "Accesorios para realzar tu belleza." },
  { title: "Cadenas", href: "/categoria/cadenas", desc: "Complemento perfecto en oro y plata." },
  { title: "Dijes", href: "/categoria/dijes", desc: "Figuras increíbles para personalizar." },
  { title: "Anillos", href: "/categoria/anillos", desc: "Personalidad y estilo a tus manos." },
  { title: "Argollas", href: "/categoria/argollas", desc: "Simboliza tu amor eterno." },
  { title: "Esclavas", href: "/categoria/esclavas", desc: "Elegancia en cada pieza." },
  { title: "Rosarios", href: "/categoria/rosarios", desc: "Fe y devoción en oro y plata." },
]

const ItemsMenuMobile = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Abrir menú">
          <Menu className="h-6 w-6" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-4 bg-white shadow-xl border rounded-lg">
        <div className="flex flex-col gap-4">
          <h3 className="font-bold text-lg border-b pb-2">Nuestras Joyas</h3>
          <ul className="flex flex-col gap-3">
            {menuItems.map((item) => (
              <li key={item.title}>
                <Link 
                  href={item.href} 
                  className="group block p-2 rounded-md hover:bg-zinc-50 transition-colors"
                >
                  <div className="text-sm font-semibold text-zinc-900 group-hover:text-blue-600">
                    {item.title}
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-2 italic">
                    {item.desc}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default ItemsMenuMobile