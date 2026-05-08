import { CategoriaType, GrupoCategoria } from "@/types/categoria"

// Normaliza nombre para comparación case/accent-insensitive
const norm = (s: string | null | undefined) =>
  (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()

// Devuelve el grupo asociado a un nombre de categoría, o null si no matchea
export function grupoDe(
  nombre: string | null | undefined,
  categorias: CategoriaType[],
): GrupoCategoria | null {
  if (!nombre) return null
  const key = norm(nombre)
  const cat = categorias.find(c => norm(c.nombre) === key)
  return cat?.grupo ?? null
}

// Verdadero si la categoría pertenece a un grupo específico (normalizado)
export function esGrupo(
  nombre: string | null | undefined,
  grupo: GrupoCategoria,
  categorias: CategoriaType[],
): boolean {
  return grupoDe(nombre, categorias) === grupo
}
