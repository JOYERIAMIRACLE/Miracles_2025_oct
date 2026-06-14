const uid = () => crypto.randomUUID()

export type TipoNodo = "material" | "categoria" | "producto"

export type Caracteristica = { id: string; clave: string; valor: string }
export type Modelo = {
  id:       string
  sku:      string
  nombre:   string
  variedad: string
  stock:    number | null
  precio:   number | null
}

export type CatalogoNodo = {
  id:              string
  tipo:            TipoNodo
  nombre:          string
  notas:           string
  // Solo producto
  sku:             string
  caracteristicas: Caracteristica[]
  modelos:         Modelo[]
  // Árbol
  children:        CatalogoNodo[]
}

export const TIPO_CONFIG: Record<TipoNodo, { label: string; color: string; dot: string; childLabel: string; childTipo: TipoNodo | null }> = {
  material:  { label: "Material",   color: "text-amber-400",   dot: "bg-amber-400",   childLabel: "Categoría", childTipo: "categoria" },
  categoria: { label: "Categoría",  color: "text-blue-400",    dot: "bg-blue-400",    childLabel: "Producto",  childTipo: "producto"  },
  producto:  { label: "Producto",   color: "text-emerald-400", dot: "bg-emerald-400", childLabel: null,        childTipo: null        },
}

export const MATERIALES_INICIALES = ["Oro 10k", "Plata 925"]
export const CATEGORIAS_JOYERIA   = ["Anillos", "Arracadas", "Broqueles", "Aretes", "Cadenas", "Esclavas", "Pulsos", "Dijes", "Rosarios"]

export function nodoVacio(tipo: TipoNodo, nombre = ""): CatalogoNodo {
  return {
    id:              uid(),
    tipo,
    nombre,
    notas:           "",
    sku:             "",
    caracteristicas: [],
    modelos:         [],
    children:        [],
  }
}

export function modeloVacio(): Modelo {
  return { id: uid(), sku: "", nombre: "", variedad: "", stock: null, precio: null }
}

export function caracteristicaVacia(): Caracteristica {
  return { id: uid(), clave: "", valor: "" }
}

export function arbolInicial(): CatalogoNodo[] {
  return MATERIALES_INICIALES.map(mat => ({
    ...nodoVacio("material", mat),
    children: CATEGORIAS_JOYERIA.map(cat => nodoVacio("categoria", cat)),
  }))
}
