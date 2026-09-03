/**
 * Script de seed — poblar colección sku-opciones con el catálogo base.
 * Uso: node src/seed/populate-sku-opciones.js <URL_STRAPI> <TOKEN_ADMIN>
 *
 * Ejemplo:
 *   node src/seed/populate-sku-opciones.js https://tu-backend.railway.app eyJhbGci...
 *
 * El token de admin lo obtienes en Strapi Admin → Settings → API Tokens → Create.
 * Tipo: Full Access.
 */

const BASE  = process.argv[2] || "http://localhost:1337"
const TOKEN = process.argv[3] || ""
const URL   = `${BASE}/api/sku-opciones`

const headers = {
  "Content-Type": "application/json",
  ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
}

const DATOS = [
  // ── MATERIALES ──────────────────────────────────────────────
  { categoria:"material", code:"O10", label:"Oro 10k",   meta:{ kind:"gold" }, orden:1 },
  { categoria:"material", code:"O14", label:"Oro 14k",   meta:{ kind:"gold" }, orden:2 },
  { categoria:"material", code:"O18", label:"Oro 18k",   meta:{ kind:"gold" }, orden:3 },
  { categoria:"material", code:"P92", label:"Plata 925", meta:{ kind:"silv" }, orden:4 },

  // ── TIPOS ────────────────────────────────────────────────────
  { categoria:"tipo", code:"CAD", label:"Cadena",    meta:{ catJoya:"Cadenas"   }, orden:1 },
  { categoria:"tipo", code:"ESC", label:"Esclava",   meta:{ catJoya:"Esclavas"  }, orden:2 },
  { categoria:"tipo", code:"ANI", label:"Anillo",    meta:{ catJoya:"Anillos"   }, orden:3 },
  { categoria:"tipo", code:"PUL", label:"Pulsera",   meta:{ catJoya:"Pulsos"    }, orden:4 },
  { categoria:"tipo", code:"ARE", label:"Aretes",    meta:{ catJoya:"Aretes"    }, orden:5 },
  { categoria:"tipo", code:"BRQ", label:"Broqueles", meta:{ catJoya:"Broqueles" }, orden:6 },
  { categoria:"tipo", code:"DIJ", label:"Dije",      meta:{ catJoya:"Dijes"     }, orden:7 },
  { categoria:"tipo", code:"ROS", label:"Rosario",   meta:{ catJoya:"Rosarios"  }, orden:8 },

  // ── ESTILOS (CAD) ────────────────────────────────────────────
  { categoria:"estilo", code:"CAR", label:"Cartier",   parentCode:"CAD", orden:1 },
  { categoria:"estilo", code:"BAR", label:"Barbado",   parentCode:"CAD", orden:2 },
  { categoria:"estilo", code:"FIG", label:"Figaro",    parentCode:"CAD", orden:3 },
  { categoria:"estilo", code:"CUB", label:"Cubano",    parentCode:"CAD", orden:4 },
  { categoria:"estilo", code:"ROL", label:"Rolo",      parentCode:"CAD", orden:5 },
  { categoria:"estilo", code:"VEN", label:"Veneziana", parentCode:"CAD", orden:6 },
  { categoria:"estilo", code:"SER", label:"Serpiente", parentCode:"CAD", orden:7 },
  { categoria:"estilo", code:"BIS", label:"Bismarck",  parentCode:"CAD", orden:8 },

  // ── ESTILOS (ESC) ────────────────────────────────────────────
  { categoria:"estilo", code:"LIS", label:"Lisa",        parentCode:"ESC", orden:1 },
  { categoria:"estilo", code:"ESP", label:"Espigas",     parentCode:"ESC", orden:2 },
  { categoria:"estilo", code:"DIA", label:"Diamantada",  parentCode:"ESC", orden:3 },
  { categoria:"estilo", code:"CUB", label:"Cubana",      parentCode:"ESC", orden:4 },
  { categoria:"estilo", code:"ID",  label:"Con ID",      parentCode:"ESC", orden:5 },
  { categoria:"estilo", code:"CAR", label:"Cartier",     parentCode:"ESC", orden:6 },
  { categoria:"estilo", code:"ROL", label:"Rolo",        parentCode:"ESC", orden:7 },
  { categoria:"estilo", code:"GRU", label:"Grumetta",    parentCode:"ESC", orden:8 },
  { categoria:"estilo", code:"INF", label:"Infinito",    parentCode:"ESC", orden:9 },
  { categoria:"estilo", code:"EST", label:"Estrellas",   parentCode:"ESC", orden:10 },
  { categoria:"estilo", code:"NUD", label:"Nudo Celta",  parentCode:"ESC", orden:11 },
  { categoria:"estilo", code:"LAT", label:"Latido ECG",  parentCode:"ESC", orden:12 },

  // ── ESTILOS (ANI) ────────────────────────────────────────────
  { categoria:"estilo", code:"LIS", label:"Liso",      parentCode:"ANI", orden:1 },
  { categoria:"estilo", code:"SOL", label:"Solitario", parentCode:"ANI", orden:2 },
  { categoria:"estilo", code:"ETR", label:"Eternidad", parentCode:"ANI", orden:3 },
  { categoria:"estilo", code:"COR", label:"Corazón",   parentCode:"ANI", orden:4 },
  { categoria:"estilo", code:"ARG", label:"Argolla",   parentCode:"ANI", orden:5 },

  // ── ESTILOS (PUL) ────────────────────────────────────────────
  { categoria:"estilo", code:"CAR", label:"Cartier",      parentCode:"PUL", orden:1 },
  { categoria:"estilo", code:"FIG", label:"Figaro",       parentCode:"PUL", orden:2 },
  { categoria:"estilo", code:"CUB", label:"Cubano",       parentCode:"PUL", orden:3 },
  { categoria:"estilo", code:"ESC", label:"Tipo esclava", parentCode:"PUL", orden:4 },

  // ── ESTILOS (ARE) ────────────────────────────────────────────
  { categoria:"estilo", code:"GOT", label:"Gota",       parentCode:"ARE", orden:1 },
  { categoria:"estilo", code:"PAL", label:"Palito",     parentCode:"ARE", orden:2 },
  { categoria:"estilo", code:"CHA", label:"Chandelier", parentCode:"ARE", orden:3 },
  { categoria:"estilo", code:"COR", label:"Corazón",    parentCode:"ARE", orden:4 },
  { categoria:"estilo", code:"ARC", label:"Arracada",   parentCode:"ARE", orden:5 },

  // ── ESTILOS (BRQ) ────────────────────────────────────────────
  { categoria:"estilo", code:"BOL", label:"Bolita",     parentCode:"BRQ", orden:1 },
  { categoria:"estilo", code:"CIR", label:"Circonita",  parentCode:"BRQ", orden:2 },
  { categoria:"estilo", code:"FLR", label:"Flor",       parentCode:"BRQ", orden:3 },

  // ── ESTILOS (DIJ) ────────────────────────────────────────────
  { categoria:"estilo", code:"VIR", label:"Virgen",    parentCode:"DIJ", orden:1 },
  { categoria:"estilo", code:"CRZ", label:"Cruz",      parentCode:"DIJ", orden:2 },
  { categoria:"estilo", code:"COR", label:"Corazón",   parentCode:"DIJ", orden:3 },
  { categoria:"estilo", code:"SJT", label:"San Judas", parentCode:"DIJ", orden:4 },
  { categoria:"estilo", code:"NOM", label:"Nombre",    parentCode:"DIJ", orden:5 },
  { categoria:"estilo", code:"ANG", label:"Ángel",     parentCode:"DIJ", orden:6 },

  // ── ESTILOS (ROS) ────────────────────────────────────────────
  { categoria:"estilo", code:"60",  label:"60cm",    parentCode:"ROS", orden:1 },
  { categoria:"estilo", code:"80",  label:"80cm",    parentCode:"ROS", orden:2 },
  { categoria:"estilo", code:"PUL", label:"Pulsera", parentCode:"ROS", orden:3 },

  // ── TALLAS (CAD) ────────────────────────────────────────────
  { categoria:"talla", code:"40", label:"40cm", parentCode:"CAD", orden:1 },
  { categoria:"talla", code:"45", label:"45cm", parentCode:"CAD", orden:2 },
  { categoria:"talla", code:"50", label:"50cm", parentCode:"CAD", orden:3 },
  { categoria:"talla", code:"55", label:"55cm", parentCode:"CAD", orden:4 },
  { categoria:"talla", code:"60", label:"60cm", parentCode:"CAD", orden:5 },

  // ── TALLAS (ESC) ────────────────────────────────────────────
  { categoria:"talla", code:"14", label:"14cm", parentCode:"ESC", orden:1 },
  { categoria:"talla", code:"16", label:"16cm", parentCode:"ESC", orden:2 },
  { categoria:"talla", code:"18", label:"18cm", parentCode:"ESC", orden:3 },
  { categoria:"talla", code:"20", label:"20cm", parentCode:"ESC", orden:4 },
  { categoria:"talla", code:"21", label:"21cm", parentCode:"ESC", orden:5 },
  { categoria:"talla", code:"22", label:"22cm", parentCode:"ESC", orden:6 },

  // ── TALLAS (ANI) ────────────────────────────────────────────
  { categoria:"talla", code:"T5",  label:"T5",  parentCode:"ANI", orden:1 },
  { categoria:"talla", code:"T6",  label:"T6",  parentCode:"ANI", orden:2 },
  { categoria:"talla", code:"T7",  label:"T7",  parentCode:"ANI", orden:3 },
  { categoria:"talla", code:"T8",  label:"T8",  parentCode:"ANI", orden:4 },
  { categoria:"talla", code:"T9",  label:"T9",  parentCode:"ANI", orden:5 },
  { categoria:"talla", code:"T10", label:"T10", parentCode:"ANI", orden:6 },
  { categoria:"talla", code:"T11", label:"T11", parentCode:"ANI", orden:7 },
  { categoria:"talla", code:"T12", label:"T12", parentCode:"ANI", orden:8 },

  // ── TALLAS (PUL) ────────────────────────────────────────────
  { categoria:"talla", code:"17", label:"17cm", parentCode:"PUL", orden:1 },
  { categoria:"talla", code:"18", label:"18cm", parentCode:"PUL", orden:2 },
  { categoria:"talla", code:"19", label:"19cm", parentCode:"PUL", orden:3 },
  { categoria:"talla", code:"20", label:"20cm", parentCode:"PUL", orden:4 },

  // ── TALLAS (ARE / BRQ / DIJ / ROS) ──────────────────────────
  { categoria:"talla", code:"CH",  label:"Chico",   parentCode:"ARE", orden:1 },
  { categoria:"talla", code:"MED", label:"Mediano",  parentCode:"ARE", orden:2 },
  { categoria:"talla", code:"GRD", label:"Grande",  parentCode:"ARE", orden:3 },
  { categoria:"talla", code:"4mm", label:"4mm",     parentCode:"BRQ", orden:1 },
  { categoria:"talla", code:"6mm", label:"6mm",     parentCode:"BRQ", orden:2 },
  { categoria:"talla", code:"8mm", label:"8mm",     parentCode:"BRQ", orden:3 },
  { categoria:"talla", code:"PEQ", label:"Pequeño", parentCode:"DIJ", orden:1 },
  { categoria:"talla", code:"MED", label:"Mediano", parentCode:"DIJ", orden:2 },
  { categoria:"talla", code:"GRD", label:"Grande",  parentCode:"DIJ", orden:3 },
  { categoria:"talla", code:"STD", label:"Estándar",parentCode:"ROS", orden:1 },

  // ── EXTRAS ──────────────────────────────────────────────────
  { categoria:"extra", code:"DIA", label:"Diamantada",  orden:1 },
  { categoria:"extra", code:"PLA", label:"Con placa",   orden:2 },
  { categoria:"extra", code:"PIE", label:"Con piedras", orden:3 },

  // ── PIEDRAS ─────────────────────────────────────────────────
  { categoria:"piedra", code:"ZRC", label:"Circonita", orden:1 },
  { categoria:"piedra", code:"RUB", label:"Rubí",      orden:2 },
  { categoria:"piedra", code:"ZAF", label:"Zafiro",    orden:3 },
  { categoria:"piedra", code:"DIA", label:"Diamante",  orden:4 },
  { categoria:"piedra", code:"OPA", label:"Ópalo",     orden:5 },
]

async function seed() {
  console.log(`Conectando a ${BASE} ...`)
  let ok = 0, err = 0
  for (const item of DATOS) {
    try {
      const res = await fetch(URL, {
        method: "POST",
        headers,
        body: JSON.stringify({ data: item }),
      })
      if (res.ok) { ok++; process.stdout.write(".") }
      else {
        const j = await res.json().catch(() => ({}))
        console.error(`\nERROR ${item.code} (${item.categoria}):`, j.error?.message ?? res.status)
        err++
      }
    } catch (e) {
      console.error(`\nFATAL ${item.code}:`, e.message)
      err++
    }
  }
  console.log(`\n✓ ${ok} insertados, ${err} errores de ${DATOS.length} total`)
}

seed()
