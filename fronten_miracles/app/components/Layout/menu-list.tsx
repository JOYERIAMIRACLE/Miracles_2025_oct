"use client"

// IMPORTACIONES
import * as React from "react"
import Link from "next/link"
import { CircleCheckIcon, CircleHelpIcon, CircleIcon } from "lucide-react"


import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/app/components/Layout/navigation-menu"

// MANUAL DE DATOS
const components: { title: string; href: string; description: string }[] = [
  {
    title: "Alert Dialog",
    href: "/docs/primitives/alert-dialog",
    description:
      "A modal dialog that interrupts the user with important content and expects a response.",
  },
  {
    title: "Hover Card",
    href: "/docs/primitives/hover-card",
    description:
      "For sighted users to preview content available behind a link.",
  },
  {
    title: "Progress",
    href: "/docs/primitives/progress",
    description:
      "Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.",
  },
  {
    title: "Scroll-area",
    href: "/docs/primitives/scroll-area",
    description: "Visually or semantically separates content.",
  },
  {
    title: "Tabs",
    href: "/docs/primitives/tabs",
    description:
      "A set of layered sections of content—known as tab panels—that are displayed one at a time.",
  },
  {
    title: "Tooltip",
    href: "/docs/primitives/tooltip",
    description:
      "A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.",
  },
  {
    title: "Toolti000000p",
    href: "/docs/primitives/tooltip00000000",
    description:
      "00000000000A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.",
  },
]

// COMPONENTE

const MenuList = () => {

  // VISUALIZACION
  return (

    // CAMPO DE MENU DE NAVEGACION
    <NavigationMenu >

      {/* LISTA DE BOTONES */}
      <NavigationMenuList className="flex-wrap">

        {/* BOTON 1 */}
        <NavigationMenuItem>
          <NavigationMenuTrigger>Nosotros</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-2 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
              <li className="row-span-3">
                <NavigationMenuLink asChild>
                  <a
                    className="from-muted/50 to-muted flex h-full w-full flex-col justify-start items-start
                 rounded-md bg-linear-to-b p-2 no-underline outline-hidden transition-all duration-200 select-none focus:shadow-md md:p-4"
                    href="/Conoce-Miracles"
                  >
                    <div className="mb-2 text-lg  font-medium ">
                      Joyeria Miracles
                    </div>
                    <p>icono dinamico de ranking - Ranking y opiniones (cantidad de opiniones)</p>
                    <p className="text-muted-foreground text-sm leading-tight">
                      Oro y plata para cualqueir ocación especial 
                    </p>
                    <p className="text-blue-500 mt-2">
                        Conoce Miracles...
                    </p>
                  </a>
                </NavigationMenuLink>
              </li>
              
              <ListItem href="/Historias-de-exito-Miracles" title="Historias de exito Miracles">
                Conoce los storytelling más relevantes para el proposito de Miracles
              </ListItem>
              <ListItem href="/Metodos-de-Servicio-Miracles" title="Metodos de Servicio Miracles ">
                Descubre todo lo que podemos hacer por ti 
              </ListItem>
              <ListItem className="flex flex-col " href="/Contactanos" title="Contactanos ">
                <div  className="flex flex-col ">
                  <div className="text-blue-500" >Tel:</div>
                  <div className="text-blue-500" >Whatsapp:</div>
                  <div className="text-blue-500" >Correo:</div>
                  

                </div>
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>


        {/* BOTON 2 */}
        <NavigationMenuItem>
          <NavigationMenuTrigger>Components</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-2 sm:w-[400px] md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              {components.map((component) => (
                <ListItem
                  key={component.title}
                  title={component.title}
                  href={component.href}
                >
                  {component.description}
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>


        {/* BOTON 3 */}
        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href="/docs">Docs</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        {/* BOTON 4 */}
        <NavigationMenuItem className="hidden md:block">
          <NavigationMenuTrigger>List</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[300px] gap-4">
              <li>
                <NavigationMenuLink asChild>
                  <Link href="#">
                    <div className="font-medium">Components</div>
                    <div className="text-muted-foreground">
                      Browse all components in the library.
                    </div>
                  </Link>
                </NavigationMenuLink>
                <NavigationMenuLink asChild>
                  <Link href="#">
                    <div className="font-medium">Documentation</div>
                    <div className="text-muted-foreground">
                      Learn how to use the library.
                    </div>
                  </Link>
                </NavigationMenuLink>
                <NavigationMenuLink asChild>
                  <Link href="#">
                    <div className="font-medium">Blog</div>
                    <div className="text-muted-foreground">
                      Read our latest blog posts.
                    </div>
                  </Link>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem> 


      {/* CIERRE DE LISTA DE MENU */}
      </NavigationMenuList>
    </NavigationMenu>
  )
}


// BLOQUE DE LISTA
function ListItem({
  title,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & { href: string }) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link href={href}>
          <div className="text-sm leading-none font-medium">{title}</div>
          <div className="text-muted-foreground line-clamp-2 text-sm leading-snug">
            {children}
          </div>
        </Link>
      </NavigationMenuLink>
    </li>
  )
}


export default MenuList 