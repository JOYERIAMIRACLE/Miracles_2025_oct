export const MATERIALES_SKU = [
  { code: "O10", label: "Oro 10k",  kind: "gold" as const },
  { code: "O14", label: "Oro 14k",  kind: "gold" as const },
  { code: "O18", label: "Oro 18k",  kind: "gold" as const },
  { code: "P92", label: "Plata 925",kind: "silv" as const },
]

export const TIPOS_SKU = [
  { code: "CAD", label: "Cadena",    catJoya: "Cadenas"   },
  { code: "ESC", label: "Esclava",   catJoya: "Esclavas"  },
  { code: "ANI", label: "Anillo",    catJoya: "Anillos"   },
  { code: "PUL", label: "Pulsera",   catJoya: "Pulsos"    },
  { code: "ARE", label: "Aretes",    catJoya: "Aretes"    },
  { code: "BRQ", label: "Broqueles", catJoya: "Broqueles" },
  { code: "DIJ", label: "Dije",      catJoya: "Dijes"     },
  { code: "ROS", label: "Rosario",   catJoya: "Rosarios"  },
]

export const ESTILOS_SKU: Record<string, { code: string; label: string }[]> = {
  CAD: [
    { code: "CAR", label: "Cartier"    },
    { code: "BAR", label: "Barbado"    },
    { code: "FIG", label: "Figaro"     },
    { code: "CUB", label: "Cubano"     },
    { code: "ROL", label: "Rolo"       },
    { code: "VEN", label: "Veneziana"  },
    { code: "SER", label: "Serpiente"  },
    { code: "BIS", label: "Bismarck"   },
  ],
  ESC: [
    { code: "LIS", label: "Lisa"       },
    { code: "ESP", label: "Espigas"    },
    { code: "DIA", label: "Diamantada" },
    { code: "CUB", label: "Cubana"     },
    { code: "ID",  label: "Con ID"     },
    { code: "CAR", label: "Cartier"    },
  ],
  ANI: [
    { code: "LIS", label: "Liso"       },
    { code: "SOL", label: "Solitario"  },
    { code: "ETR", label: "Eternidad"  },
    { code: "COR", label: "Corazón"    },
    { code: "ARG", label: "Argolla"    },
  ],
  PUL: [
    { code: "CAR", label: "Cartier"    },
    { code: "FIG", label: "Figaro"     },
    { code: "CUB", label: "Cubano"     },
    { code: "ESC", label: "Tipo esclava" },
  ],
  ARE: [
    { code: "GOT", label: "Gota"       },
    { code: "PAL", label: "Palito"     },
    { code: "CHA", label: "Chandelier" },
    { code: "COR", label: "Corazón"    },
    { code: "ARC", label: "Arracada"   },
  ],
  BRQ: [
    { code: "BOL", label: "Bolita"     },
    { code: "CIR", label: "Circonita"  },
    { code: "FLR", label: "Flor"       },
  ],
  DIJ: [
    { code: "VIR", label: "Virgen"     },
    { code: "CRZ", label: "Cruz"       },
    { code: "COR", label: "Corazón"    },
    { code: "SJT", label: "San Judas"  },
    { code: "NOM", label: "Nombre"     },
    { code: "ANG", label: "Ángel"      },
  ],
  ROS: [
    { code: "60",  label: "60cm"       },
    { code: "80",  label: "80cm"       },
    { code: "PUL", label: "Pulsera"    },
  ],
}

export const TALLAS_SKU: Record<string, string[]> = {
  CAD: ["40", "45", "50", "55", "60"],
  ESC: ["14", "16", "18", "20", "22"],
  ANI: ["T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"],
  PUL: ["17", "18", "19", "20"],
  ARE: ["CH", "MED", "GRD"],
  BRQ: ["4mm", "6mm", "8mm"],
  DIJ: ["PEQ", "MED", "GRD"],
  ROS: ["STD"],
}

export const EXTRAS_SKU = [
  { code: "DIA", label: "Diamantada"  },
  { code: "PLA", label: "Con placa"   },
  { code: "PIE", label: "Con piedras" },
]

export const PIEDRAS_SKU = [
  { code: "ZRC", label: "Circonita" },
  { code: "RUB", label: "Rubí"      },
  { code: "ZAF", label: "Zafiro"    },
  { code: "DIA", label: "Diamante"  },
  { code: "OPA", label: "Ópalo"     },
]

export type SkuEntry = {
  id: string
  sku: string
  mat: string
  matLabel: string
  matKind: "gold" | "silv"
  tipo: string
  tipoLabel: string
  tipoCategoria: string
  estilo: string
  estiloLabel: string
  talla: string
  extras: string[]
  nombre: string
}

export function buildSku(mat: string, tipo: string, estilo: string, talla: string, extras: string[]): string {
  return [mat, tipo, estilo, talla, ...extras].filter(Boolean).join("-")
}

export function buildNombre(tipoLabel: string, estiloLabel: string): string {
  return `${tipoLabel} ${estiloLabel}`.trim()
}
