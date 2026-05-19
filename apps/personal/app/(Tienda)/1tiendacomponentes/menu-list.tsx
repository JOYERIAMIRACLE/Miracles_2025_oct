"use client"

import * as React from "react"
import Link from "next/link"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"

const CATEGORIAS = [
  { nombre: "Anillos",   slug: "anillos",   desc: "Desde solitarios hasta alianzas, en oro 10k y plata 925." },
  { nombre: "Cadenas",   slug: "cadenas",   desc: "Cartier, figaro, cubana y más estilos en diferentes medidas." },
  { nombre: "Esclavas",  slug: "esclavas",  desc: "Elegantes esclavas para dama y caballero." },
  { nombre: "Aretes",    slug: "aretes",    desc: "Argollas, palitos, gota y más diseños para cada ocasión." },
  { nombre: "Broqueles", slug: "broqueles", desc: "Pequeños y elegantes, perfectos para uso diario." },
  { nombre: "Dijes",     slug: "dijes",     desc: "Figuras y símbolos para personalizar tu collar o pulsera." },
  { nombre: "Pulsos",    slug: "pulsos",    desc: "Pulseras y brazaletes en distintos estilos y medidas." },
  { nombre: "Esclavas",  slug: "esclavas",  desc: "Esclavas clásicas y modernas para toda ocasión." },
  { nombre: "Rosarios",  slug: "rosarios",  desc: "Rosarios artesanales en oro 10k y plata 925." },
  { nombre: "Argollas",  slug: "argollas",  desc: "Argollas de compromiso y matrimonio en todos los tamaños." },
]

const MenuList = () => {
  return (
    <NavigationMenu>
      <NavigationMenuList className="flex-wrap">

        {/* Tienda */}
        <NavigationMenuItem>
          <NavigationMenuTrigger>Tienda</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-2 p-4 md:w-[420px] lg:w-[540px] lg:grid-cols-2">
              <li className="lg:col-span-2">
                <NavigationMenuLink asChild>
                  <Link href="/category"
                    className="flex flex-col justify-end rounded-md bg-linear-to-br from-amber-900/40 to-yellow-700/20 p-4 no-underline outline-none focus:shadow-md">
                    <p className="text-lg font-bold text-amber-200">Joyería Miracles</p>
                    <p className="text-sm text-amber-300/70">Oro 10k y Plata 925 · Hecho con calidad</p>
                  </Link>
                </NavigationMenuLink>
              </li>
              {CATEGORIAS.filter((c, i, a) => a.findIndex(x => x.slug === c.slug) === i).map(cat => (
                <ListItem key={cat.slug} href={`/category/${cat.slug}`} title={cat.nombre}>
                  {cat.desc}
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Blog */}
        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href="/blog">Blog</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        {/* Nosotros */}
        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href="/Conoce-Miracles">Nosotros</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

      </NavigationMenuList>
    </NavigationMenu>
  )
}

function ListItem({
  title,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & { href: string }) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link href={href}
          className="block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
          <div className="text-sm font-medium leading-none mb-1">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{children}</p>
        </Link>
      </NavigationMenuLink>
    </li>
  )
}

export default MenuList
