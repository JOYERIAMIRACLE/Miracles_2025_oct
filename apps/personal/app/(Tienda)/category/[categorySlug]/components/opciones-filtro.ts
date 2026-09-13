import { ProductType } from "@/types/product"

// Valores distintos y no vacíos de un campo de texto entre los productos
// dados, alfabéticos — usado para armar las opciones de Talla/Estilo a
// partir de lo que realmente existe en cada categoría, en vez de listas
// fijas que no aplican igual a Anillos que a Cadenas o Dijes.
export function opcionesDe(products: ProductType[], campo: "figura" | "talla"): string[] {
  const valores = new Set<string>()
  for (const p of products) {
    const v = p[campo]
    if (v && v.trim() !== "") valores.add(v.trim())
  }
  return [...valores].sort((a, b) => a.localeCompare(b))
}
