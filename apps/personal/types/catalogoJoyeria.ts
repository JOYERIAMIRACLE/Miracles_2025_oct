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
  // ── helpers ──────────────────────────────────────────────────────────────
  const c  = (clave: string, valor: string): Caracteristica => ({ id: uid(), clave, valor })
  const m  = (sku: string, nombre: string, variedad = ""): Modelo =>
    ({ id: uid(), sku, nombre, variedad, stock: null, precio: null })
  const p  = (nombre: string, sku: string, notas: string,
              cs: Caracteristica[], ms: Modelo[]): CatalogoNodo =>
    ({ ...nodoVacio("producto", nombre), sku, notas, caracteristicas: cs, modelos: ms })
  const ct = (nombre: string, notas: string, hijos: CatalogoNodo[]): CatalogoNodo =>
    ({ ...nodoVacio("categoria", nombre), notas, children: hijos })

  // ── Categorías compartidas (factory por prefijo de material) ─────────────
  const mkCategorias = (pfx: "O10" | "P92"): CatalogoNodo[] => [

    // ── Anillos ──────────────────────────────────────────────────────────
    ct("Anillos", "Piezas de dedo. Medir talla del cliente antes de elaborar.", [
      p("Anillo Liso", `${pfx}-ANI-LIS`, "Acabado pulido. Pedir color al cliente.",
        [c("Tipo","Liso"), c("Grosor","2mm"), c("Acabado","Pulido")],
        ["T5","T6","T7","T8","T9","T10","T11","T12"].map(t =>
          m(`${pfx}-ANI-LIS-${t}`, `Talla ${t.slice(1)}`, "Amarillo"))),

      p("Anillo Solitario", `${pfx}-ANI-SOL`, "Llevar a engastador. Piedra: circonita AAA.",
        [c("Tipo","Solitario"), c("Piedra","Circonita AAA"), c("Montura","Garras 4 puntos")],
        ["T5","T6","T7","T8","T9","T10"].map(t =>
          m(`${pfx}-ANI-SOL-${t}`, `Talla ${t.slice(1)}`, "Amarillo"))),

      p("Argolla Matrimonio", `${pfx}-ANI-ARG`, "Vender en par. Grabado interior disponible.",
        [c("Tipo","Argolla"), c("Grosor","3mm"), c("Grabado","Disponible")],
        ["T5","T6","T7","T8","T9","T10","T11","T12"].map(t =>
          m(`${pfx}-ANI-ARG-${t}`, `Talla ${t.slice(1)}`, "Amarillo"))),

      p("Anillo Eternidad", `${pfx}-ANI-ETR`, "Media eternidad o completa. Confirmar con cliente.",
        [c("Tipo","Eternidad"), c("Piedras","Circonitas canal")],
        ["T5","T6","T7","T8","T9"].map(t =>
          m(`${pfx}-ANI-ETR-${t}`, `Talla ${t.slice(1)}`, "Amarillo"))),

      p("Anillo Corazón", `${pfx}-ANI-COR`, "Diseño corazón. Popular San Valentín.",
        [c("Tipo","Diseño"), c("Motivo","Corazón")],
        ["T6","T7","T8","T9"].map(t =>
          m(`${pfx}-ANI-COR-${t}`, `Talla ${t.slice(1)}`, "Amarillo"))),
    ]),

    // ── Arracadas ─────────────────────────────────────────────────────────
    ct("Arracadas", "Argollas grandes tipo aro. Peso = costo clave.", [
      p("Arracadas Lisas", `${pfx}-ARC-LIS`, "Acabado espejo. Peso varía por tamaño.",
        [c("Tipo","Aro liso"), c("Cierre","Bisagra con seguro")],
        ["1.5cm","2cm","2.5cm","3cm","4cm"].map(s =>
          m(`${pfx}-ARC-LIS-${s.replace(".","").replace("cm","")}`, s, "Amarillo"))),

      p("Arracadas Diamantadas", `${pfx}-ARC-DIA`, "Corte diamantado, más brillante.",
        [c("Tipo","Aro diamantado"), c("Corte","Diamantado")],
        ["2cm","3cm","4cm"].map(s =>
          m(`${pfx}-ARC-DIA-${s.replace(".","").replace("cm","")}`, s, "Amarillo"))),

      p("Arracadas Torneadas", `${pfx}-ARC-TOR`, "Diseño torneado/trenzado.",
        [c("Tipo","Torneada/Trenzada")],
        ["2cm","3cm","4cm"].map(s =>
          m(`${pfx}-ARC-TOR-${s.replace(".","").replace("cm","")}`, s, "Amarillo"))),
    ]),

    // ── Broqueles ─────────────────────────────────────────────────────────
    ct("Broqueles", "Aretes pequeños de tornillo. Populares para niñas.", [
      p("Broqueles Bolita", `${pfx}-BRQ-BOL`, "Bolita lisa. Para niñas y adultas.",
        [c("Tipo","Bolita lisa"), c("Cierre","Tornillo")],
        ["4mm","6mm","8mm"].map(s =>
          m(`${pfx}-BRQ-BOL-${s.replace("mm","")}`, s, ""))),

      p("Broqueles Circonita", `${pfx}-BRQ-CIR`, "Con piedra circonita. Más brillante.",
        [c("Tipo","Con piedra"), c("Piedra","Circonita"), c("Cierre","Tornillo")],
        ["4mm","6mm","8mm"].map(s =>
          m(`${pfx}-BRQ-CIR-${s.replace("mm","")}`, s, ""))),

      p("Broqueles Flor", `${pfx}-BRQ-FLR`, "Motivo floral. Popular para primera comunión.",
        [c("Tipo","Diseño floral"), c("Cierre","Tornillo")],
        ["pequeño","mediano"].map(s =>
          m(`${pfx}-BRQ-FLR-${s.slice(0,3).toUpperCase()}`, s, ""))),
    ]),

    // ── Aretes ────────────────────────────────────────────────────────────
    ct("Aretes", "Piezas de oreja con grillete o palito. Variedad amplia.", [
      p("Aretes Gota", `${pfx}-ARE-GOT`, "Diseño colgante tipo gota.",
        [c("Tipo","Gota colgante"), c("Cierre","Grillete")],
        ["chico","mediano","grande"].map(s =>
          m(`${pfx}-ARE-GOT-${s.slice(0,3).toUpperCase()}`, s, ""))),

      p("Aretes Palito", `${pfx}-ARE-PAL`, "Barra larga tipo palito. Minimalistas.",
        [c("Tipo","Palito"), c("Cierre","Mariposa")],
        ["3cm","4cm","5cm"].map(s =>
          m(`${pfx}-ARE-PAL-${s.replace(".","").replace("cm","")}`, s, ""))),

      p("Aretes Chandelier", `${pfx}-ARE-CHA`, "Tipo lámpara con varios colgantes.",
        [c("Tipo","Chandelier"), c("Cierre","Grillete")],
        ["mediano","grande"].map(s =>
          m(`${pfx}-ARE-CHA-${s.slice(0,3).toUpperCase()}`, s, ""))),

      p("Aretes Corazón", `${pfx}-ARE-COR`, "Motivo corazón. Temporada San Valentín.",
        [c("Tipo","Diseño corazón"), c("Cierre","Mariposa")],
        ["pequeño","mediano"].map(s =>
          m(`${pfx}-ARE-COR-${s.slice(0,3).toUpperCase()}`, s, ""))),
    ]),

    // ── Cadenas ───────────────────────────────────────────────────────────
    ct("Cadenas", "El producto más vendido. Peso por gramo define precio.", [
      p("Cadena Cartier", `${pfx}-CAD-CAR`, "Eslabón cartier. La más solicitada.",
        [c("Estilo","Cartier"), c("Grosor","2mm"), c("Cierre","Mosquetón")],
        ["40cm","45cm","50cm","55cm","60cm"].map(s =>
          m(`${pfx}-CAD-CAR-${s.replace("cm","")}`, s, "Amarillo"))),

      p("Cadena Figaro", `${pfx}-CAD-FIG`, "3 eslabones chicos + 1 grande.",
        [c("Estilo","Figaro"), c("Grosor","2.5mm"), c("Cierre","Mosquetón")],
        ["40cm","45cm","50cm","55cm"].map(s =>
          m(`${pfx}-CAD-FIG-${s.replace("cm","")}`, s, "Amarillo"))),

      p("Cadena Cubana", `${pfx}-CAD-CUB`, "Eslabón cubano. Muy popular en caballero.",
        [c("Estilo","Cubana"), c("Grosor","3mm"), c("Cierre","Mosquetón")],
        ["40cm","45cm","50cm","55cm"].map(s =>
          m(`${pfx}-CAD-CUB-${s.replace("cm","")}`, s, "Amarillo"))),

      p("Cadena Veneziana", `${pfx}-CAD-VEN`, "Tipo caja cuadrada. Perfecta para dijes.",
        [c("Estilo","Veneziana"), c("Grosor","1.5mm"), c("Cierre","Mosquetón")],
        ["40cm","45cm","50cm","60cm"].map(s =>
          m(`${pfx}-CAD-VEN-${s.replace("cm","")}`, s, "Amarillo"))),

      p("Cadena Rolo", `${pfx}-CAD-ROL`, "Eslabones redondos tipo rolo.",
        [c("Estilo","Rolo"), c("Grosor","2mm"), c("Cierre","Mosquetón")],
        ["40cm","45cm","50cm"].map(s =>
          m(`${pfx}-CAD-ROL-${s.replace("cm","")}`, s, "Amarillo"))),

      p("Cadena Serpiente", `${pfx}-CAD-SER`, "Perfecta y suave. Tipo omega.",
        [c("Estilo","Serpiente/Omega"), c("Grosor","1.5mm")],
        ["40cm","45cm","50cm"].map(s =>
          m(`${pfx}-CAD-SER-${s.replace("cm","")}`, s, "Amarillo"))),
    ]),

    // ── Esclavas ──────────────────────────────────────────────────────────
    ct("Esclavas", "Pulsera rígida o semirígida. Medir muñeca del cliente.", [
      p("Esclava Lisa", `${pfx}-ESC-LIS`, "Acabado pulido espejo. Clásica.",
        [c("Tipo","Lisa"), c("Ancho","6mm"), c("Cierre","Seguro de caja")],
        ["14cm","16cm","18cm","20cm"].map(s =>
          m(`${pfx}-ESC-LIS-${s.replace("cm","")}`, s, "Amarillo"))),

      p("Esclava Espigas", `${pfx}-ESC-ESP`, "Cadena de espigas plana.",
        [c("Tipo","Espigas"), c("Ancho","8mm"), c("Cierre","Seguro de caja")],
        ["16cm","18cm","20cm"].map(s =>
          m(`${pfx}-ESC-ESP-${s.replace("cm","")}`, s, "Amarillo"))),

      p("Esclava Diamantada", `${pfx}-ESC-DIA`, "Con corte diamantado brillante.",
        [c("Tipo","Diamantada"), c("Ancho","8mm")],
        ["16cm","18cm","20cm"].map(s =>
          m(`${pfx}-ESC-DIA-${s.replace("cm","")}`, s, "Amarillo"))),

      p("Esclava ID", `${pfx}-ESC-ID`, "Placa central con nombre grabado. Bajo pedido.",
        [c("Tipo","Identificación"), c("Grabado","Disponible")],
        ["16cm","18cm","20cm"].map(s =>
          m(`${pfx}-ESC-ID-${s.replace("cm","")}`, s, "Amarillo"))),
    ]),

    // ── Pulsos ────────────────────────────────────────────────────────────
    ct("Pulsos", "Cadenas gruesas estilo pulsera. Diferencia con esclava: flexible.", [
      p("Pulso Cartier", `${pfx}-PUL-CAR`, "Eslabón cartier en pulsera.",
        [c("Estilo","Cartier"), c("Cierre","Mosquetón")],
        ["17cm","18cm","19cm","20cm"].map(s =>
          m(`${pfx}-PUL-CAR-${s.replace("cm","")}`, s, "Amarillo"))),

      p("Pulso Figaro", `${pfx}-PUL-FIG`, "Eslabón figaro en pulsera.",
        [c("Estilo","Figaro"), c("Cierre","Mosquetón")],
        ["17cm","18cm","19cm"].map(s =>
          m(`${pfx}-PUL-FIG-${s.replace("cm","")}`, s, "Amarillo"))),

      p("Pulso Cubano", `${pfx}-PUL-CUB`, "Eslabón cubano. Muy popular caballero.",
        [c("Estilo","Cubano"), c("Grosor","4mm"), c("Cierre","Mosquetón")],
        ["17cm","18cm","19cm","20cm"].map(s =>
          m(`${pfx}-PUL-CUB-${s.replace("cm","")}`, s, "Amarillo"))),

      p("Pulso Esclava Cadena", `${pfx}-PUL-ESC`, "Tipo esclava pero con cadena flexible.",
        [c("Estilo","Cadena esclava"), c("Cierre","Seguro de caja")],
        ["17cm","18cm","19cm"].map(s =>
          m(`${pfx}-PUL-ESC-${s.replace("cm","")}`, s, "Amarillo"))),
    ]),

    // ── Dijes ─────────────────────────────────────────────────────────────
    ct("Dijes", "Colgantes para cadena. Pedir tipo de cadena del cliente.", [
      p("Dije Virgen de Guadalupe", `${pfx}-DIJ-VIR`, "El más vendido. Varios tamaños.",
        [c("Motivo","Virgen de Guadalupe"), c("Técnica","Calado/Fundido")],
        ["pequeño","mediano","grande"].map(s =>
          m(`${pfx}-DIJ-VIR-${s.slice(0,3).toUpperCase()}`, s, ""))),

      p("Dije Cruz", `${pfx}-DIJ-CRZ`, "Cruz clásica o calada.",
        [c("Motivo","Cruz"), c("Variante","Lisa o calada")],
        ["chica","mediana","grande"].map(s =>
          m(`${pfx}-DIJ-CRZ-${s.slice(0,3).toUpperCase()}`, s, ""))),

      p("Dije Corazón", `${pfx}-DIJ-COR`, "Corazón liso o con piedra.",
        [c("Motivo","Corazón")],
        ["pequeño","mediano"].map(s =>
          m(`${pfx}-DIJ-COR-${s.slice(0,3).toUpperCase()}`, s, ""))),

      p("Dije San Judas", `${pfx}-DIJ-SJT`, "Muy solicitado. Fundición detallada.",
        [c("Motivo","San Judas Tadeo"), c("Técnica","Fundición")],
        ["pequeño","mediano","grande"].map(s =>
          m(`${pfx}-DIJ-SJT-${s.slice(0,3).toUpperCase()}`, s, ""))),

      p("Dije Nombre", `${pfx}-DIJ-NOM`, "Personalizado. Bajo pedido. Tiempo 5-7 días.",
        [c("Tipo","Nombre personalizado"), c("Tiempo","5-7 días hábiles")],
        [m(`${pfx}-DIJ-NOM-PER`, "Personalizado", "")]),

      p("Dije Ángel", `${pfx}-DIJ-ANG`, "Ángel de la guarda. Popular para bebés.",
        [c("Motivo","Ángel de la guarda")],
        ["pequeño","mediano"].map(s =>
          m(`${pfx}-DIJ-ANG-${s.slice(0,3).toUpperCase()}`, s, ""))),
    ]),

    // ── Rosarios ──────────────────────────────────────────────────────────
    ct("Rosarios", "Rosarios y pulseras religiosas. Temporada alta: Semana Santa.", [
      p("Rosario 60cm", `${pfx}-ROS-60`, "Largo estándar. Bola 4mm o 6mm.",
        [c("Largo","60cm"), c("Cruz","Incluida"), c("Tipo","Rezar")],
        ["4mm","6mm"].map(s =>
          m(`${pfx}-ROS-60-${s.replace("mm","")}`, `Bola ${s}`, ""))),

      p("Rosario 80cm", `${pfx}-ROS-80`, "Largo doble. Bola más grande.",
        [c("Largo","80cm"), c("Cruz","Incluida")],
        ["6mm","8mm"].map(s =>
          m(`${pfx}-ROS-80-${s.replace("mm","")}`, `Bola ${s}`, ""))),

      p("Pulsera Rosario", `${pfx}-ROS-PUL`, "Rosario de muñeca. Popular todo el año.",
        [c("Tipo","Pulsera"), c("Largo","17-19cm")],
        [m(`${pfx}-ROS-PUL-UNI`, "Talla única", "")]),
    ]),
  ]

  return [
    { ...nodoVacio("material","Oro 10k"),  notas: "Ley 417 (10 quilates). Colores: amarillo, rosa, blanco.",  children: mkCategorias("O10") },
    { ...nodoVacio("material","Plata 925"), notas: "Ley 925. Puede oxidarse con el tiempo. Antialérgica.", children: mkCategorias("P92") },
  ]
}
