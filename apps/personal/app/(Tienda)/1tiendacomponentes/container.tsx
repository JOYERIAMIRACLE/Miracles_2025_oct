import { cn } from "@/lib/utils"
import type { ComponentPropsWithoutRef, ElementType } from "react"

// Único punto de verdad para el ancho encajonado de la Tienda — antes cada
// sección escribía a mano su propio max-w-*/px-* y los cuatro esquemas de
// padding iban a la deriva. Container solo controla max-width + centrado +
// gutters horizontales; padding vertical, fondo y bordes los sigue poniendo
// cada sección vía className.
const CONTAINER_SIZES = {
  default: "max-w-6xl", // 1152px — grids, listados, producto/categoría/carrito/cuenta, y la fila interna de navbar/hero/footer
  narrow: "max-w-3xl", // 768px — contenido editorial/de lectura larga (legales, blog individual, nosotros, contacto)
} as const

type ContainerProps<T extends ElementType> = {
  as?: T
  size?: keyof typeof CONTAINER_SIZES
} & Omit<ComponentPropsWithoutRef<T>, "as">

export default function Container<T extends ElementType = "div">({
  as,
  size = "default",
  className,
  ...props
}: ContainerProps<T>) {
  const Tag = (as ?? "div") as ElementType
  return <Tag className={cn("w-full mx-auto px-6 md:px-8 lg:px-12", CONTAINER_SIZES[size], className)} {...props} />
}
