'use strict'
/**
 * Seed: BoxScore, Funnel y CDL
 *
 * Cómo correr:
 *   1. Asegúrate que Strapi esté corriendo en localhost:1337
 *   2. En Strapi admin → Settings → Roles → Public → habilita find/findOne/create
 *      para: boxscore-semanas, ecosistema-mkts, cdl-metricas
 *   3. Desde la raíz del monorepo:
 *        node scripts/seed-indicadores.js
 *
 * NOTA: Los valores de 2025 fueron extraídos de imagen — verifica los
 * porcentajes de email si alguno no coincide con tu fuente original.
 */

const BASE = process.env.STRAPI_URL || 'http://localhost:1337'

async function post(endpoint, data) {
  const res = await fetch(`${BASE}/api/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  })
  const json = await res.json()
  if (!res.ok) {
    console.error(`  ✗ ${endpoint}:`, JSON.stringify(json.error?.message ?? json))
    return null
  }
  return json.data
}

// ─── MES por semana ISO ───────────────────────────────────────────────────────
const MES = {
  // 2025
  33:'Agosto', 34:'Agosto', 35:'Agosto',
  36:'Septiembre', 37:'Septiembre', 38:'Septiembre', 39:'Septiembre', 40:'Septiembre',
  41:'Octubre', 42:'Octubre', 43:'Octubre', 44:'Octubre',
  45:'Noviembre', 46:'Noviembre', 47:'Noviembre', 48:'Noviembre',
  49:'Diciembre', 50:'Diciembre', 51:'Diciembre', 52:'Diciembre',
  // 2026
  2:'Enero', 3:'Enero', 4:'Enero',
  5:'Febrero', 6:'Febrero', 7:'Febrero', 8:'Febrero', 9:'Febrero',
  10:'Marzo', 11:'Marzo', 12:'Marzo', 13:'Marzo',
  14:'Abril', 15:'Abril', 16:'Abril', 17:'Abril', 18:'Abril',
  19:'Mayo', 20:'Mayo',
}

// ─── BOXSCORE ─────────────────────────────────────────────────────────────────
// Columnas: semana, anio,
//   tasaApertura, tasaClics, tasaRechazos,
//   traficoDirectoCorp, traficoDirectoStore,
//   impresionesCorp, impresionesStore,
//   traficoOrganicoCorp, traficoOrganicoStore,
//   impresionesSEM, traficoPagaSEM, clicsSEM, conversionesSEM,
//   impresionesCYA, clicsCYA, conversionesCYA,
//   impresionesIC, clicsIC, conversionesIC,
//   traficoGeneral
const BS = [
  // ── 2025 (WK33–WK52) ──────────────────────────────────────────────────────
  [33,2025, 44.5,2.4, 6.2, 795,   509,   722000,13914,  9082,405,  19460,1302,1153,34, 17900,1073,24, 1560,110,7,  9143],
  [34,2025, 40.0,5.0, 5.6, 1040, 3245,   822000,16035,  9831,414,  19850, 384,1077,38, 18600, 970,34, 1290,101,5, 13994],
  [35,2025, 38.4,4.3, 5.3, 1105, 5146,  1001000,14900, 10773,481,  16160, 736, 839,51, 14900, 975,29, 1260,110,4, 17415],
  [36,2025, 26.0,8.0, 6.9, 1158, 2567,  1090000,16257, 11313,496,  12670, 503, 638,21, 11400, 541,11, 1270, 97,0, 15246],
  [37,2025, 27.8,10.3,10.3,1453, 2665,  1162000,18340, 10663,506,  19252, 850, 928,21, 18700,1729,10,  552,130,4, 16411],
  [38,2025, 36.1,7.3, 7.3, 1209, 3719,  1090000,15743,  9389,540,  15500, 599, 776,15, 15500, 541,21,    0,  0,0, 15685],
  [39,2025, 28.0,8.0, 8.4, 1116, 9635,  1090000,18794, 10909,543,  20898, 775,1152,21, 20500, 980,12,  398, 42,4, 22950],
  [40,2025, 25.8,8.2, 8.2, 1116, 4240,  1070000,19790,  9745,601,  17090, 601, 937,19, 15800, 883,20, 1290,104,5, 16811],
  [41,2025, 25.2,7.6, 7.6, 1190,10156,  1070000,19279,  9389,623,  16030, 721, 944,25, 14800, 831,15, 1230, 91,12,21885],
  [42,2025, 25.6,8.8, 8.8,  973,19080,  1007000,18913,  9389,634,  17050, 601,1038,19, 15900,1032,18, 1150,108,10,30708],
  [43,2025, 45.8,8.6, 8.6,  758, 5278,  1070000,20111, 10100,637,  17560, 700,1100,27, 16200,1066,10, 1360,120,8, 17424],
  [44,2025, 25.8,8.0, 8.0,  998, 1034,   960000,20645,  6612,599,   8560, 461, 641,15,  7170, 496,17, 1390,145,8, 10669],
  [45,2025, 24.1,9.6, 9.6, 1424, 1319,   960000,19595,  7117,574,  12447, 834, 834,26, 11500, 818,26,  947, 98,7,  9438],
  [46,2025, 21.5,8.8, 8.8, 1025, 6719,   872000,19612,  7110,623,  14090,1072,1072,15, 12800,1077,18, 1290,169,14,16969],
  [47,2025, 19.7,8.6, 8.6,  939, 9491,   875000,18754,  6719,565,  11950, 852, 852,21, 10900, 818,22, 1050,114,10,18881],
  [48,2025, 21.4,8.3, 8.3, 1603, 3599,   950000,19091,  7458,468,  12890, 975, 975,17, 11800, 796,12, 1090, 78,8, 13649],
  [49,2025, 18.7,6.5, 6.5, 1025, 8880,  1001000,17524,  6535,559,  12234, 341, 341,18, 11500, 369,9,   734, 43,1, 17680],
  [50,2025, 19.1,7.7, 7.7,  939, 8762,  1000000,17471,  8473,534,  12266, 844, 817,22, 11700, 750,18,  566, 53,8, 13741],
  [51,2025, 15.8,5.4, 5.4,  887, 8091,   996000,11464,  8947,426,  10907, 804, 804,12, 10300, 681,14,  607, 88,3, 12398],
  [52,2025, 15.8,5.9, 5.9, 1054, 7562,   769000,11464,  5972,206,   5783, 403, 403,26,  5700, 403,12,   83, 75,0,  9935],
  // ── 2026 (WK2–WK20) ───────────────────────────────────────────────────────
  [ 2,2026, 15.1,4.5, 4.5,  808, 8232,   791000,17556, 13371,530,   5880, 399, 742,18,  5630, 618,23,  250, 88,5, 13371],
  [ 5,2026, 20.0,2.4, 5.2, 1071, 5152,   875000,23500,  6999,648,  12806, 753,1044,18, 12100, 956,10,  706, 88,8, 14623],
  [ 6,2026, 15.7,2.4, 5.6, 1175, 6156,   950000,19900,  7933,558,   9907, 611, 810,18,  9240, 734,10,  667, 76,8, 16433],
  [ 7,2026, 21.8,2.5, 6.1, 1184, 6074,  1001000,24800,  9182,674,  10743, 591, 836,26, 10200, 766,14,  543, 70,12,17705],
  [ 8,2026, 24.0,3.7, 4.9, 1233, 3935,  1000000,24300,  7718,688,  12059, 731,1010,19, 11500, 931,13,  559, 79,6, 14305],
  [ 9,2026, 25.0,7.3, 7.6, 1324, 4950,   996000,22600,  7384,699,   6965, 461, 566,15,  6380, 491,10,  585, 75,5, 14818],
  [10,2026, 21.3,3.3, 5.5, 1190, 4959,  1010000,22700,  7670,671,  13953, 705,1041,21, 13200, 969,18,  753, 72,3, 15195],
  [11,2026, 20.7,2.9, 5.7, 1131, 3501,   969000,21000,  7288,636,  15961, 710,1170,22, 15400,1090,13,  561, 80,9, 13266],
  [12,2026, 23.6,27.6,5.8, 1098, 2681,   966000,18600,  7110,409,   7321, 356, 631,12,  6810, 568,5,   511, 63,7, 11654],
  [13,2026, 23.6,3.7, 6.1, 1149, 2531,   922000,19800,  7337,602,  10961, 600, 817,16, 10500, 766,8,   461, 51,8, 12219],
  [14,2026, 19.8,3.5, 6.0,  734, 1359,   581000,16200,  3909,439,   5151, 262, 385,6,   5030, 373,5,   121, 12,1,  6703],
  [15,2026, 25.6,3.3, 7.3,  913, 1216,   829000,18000,  5637,579,  13568, 646, 958,20, 13000, 881,16,  568,  4,4,  8991],
  [16,2026, 25.1,32.7,6.5, 1114, 1066,  1000000,19000,  7424,585,  19434, 922,1262,35, 18800,1200,27,  634, 62,8, 11111],
  [17,2026, 22.0,35.3,8.9, 1542, 2018,   839000,20600,  8947,918,  13271, 792, 926,20, 12900, 892,17,  371, 34,3, 14217],
  [18,2026, 20.7,3.3, 7.1, 1013, 4336,   681000,16300,  5972,489,      0,  12,   0,0,      0,   0,0,     0,  0,0, 11822],
  [19,2026, 35.3,7.0, 8.7,  887, 4015,   769000,17400,  6536,599,  16363, 702,1050,18, 15900,1010,14,  463, 40,4, 12739],
  [20,2026, 20.9,35.7,9.3, 1054, 5462,   781000,17900,  6854,573,  21166, 808,1213,34, 20400,1150,27,  766, 63,7, 14751],
]

// ─── FUNNEL (datos de ejemplo mensuales) ──────────────────────────────────────
// [mes, anio, canal, impresiones, visitas, clics, leads, contactosNuevos, compras, montoCompras]
const FUNNEL = [
  ['Agosto',     2025, 'Todos los canales', 200000,1800,360,32,12,4,  18000],
  ['Septiembre', 2025, 'Todos los canales', 225000,2150,430,38,15,5,  22500],
  ['Octubre',    2025, 'Todos los canales', 285000,2700,540,50,20,7,  31500],
  ['Noviembre',  2025, 'Todos los canales', 245000,2300,460,41,16,6,  27000],
  ['Diciembre',  2025, 'Todos los canales', 158000,1480,296,26,10,4,  18000],
  ['Enero',      2026, 'Todos los canales', 185000,1750,350,31,11,4,  18000],
  ['Febrero',    2026, 'Todos los canales', 218000,2080,416,37,14,5,  22500],
  ['Marzo',      2026, 'Todos los canales', 248000,2360,472,43,17,6,  27000],
  ['Abril',      2026, 'Todos los canales', 196000,1870,374,33,13,5,  22500],
  ['Mayo',       2026, 'Todos los canales', 220000,2100,420,38,14,5,  22500],
]

// ─── CDL (datos de ejemplo mensuales) ────────────────────────────────────────
// [semana, mes, anio, nuevosLeads, cantCampanas, ventas, retencion, clientes, costo,
//  contNancy, encNancy, contRichard, encRichard]
const CDL = [
  [null,'Agosto',     2025, 32,6,  18000,78,4,2200, 8,4.0, 6,3.8],
  [null,'Septiembre', 2025, 38,8,  22500,80,5,2100,10,4.1, 8,3.9],
  [null,'Octubre',    2025, 50,10, 31500,82,7,1980,12,4.3,10,4.1],
  [null,'Noviembre',  2025, 41,8,  27000,81,6,2050,10,4.2, 8,4.0],
  [null,'Diciembre',  2025, 26,5,  18000,79,4,2300, 7,3.9, 5,3.7],
  [null,'Enero',      2026, 31,7,  18000,79,4,2200, 8,4.0, 6,3.8],
  [null,'Febrero',    2026, 37,8,  22500,80,5,2100,10,4.2, 8,4.0],
  [null,'Marzo',      2026, 43,10, 27000,83,6,1950,12,4.4,10,4.2],
  [null,'Abril',      2026, 33,9,  22500,80,5,2100,11,4.1, 8,3.9],
  [null,'Mayo',       2026, 38,11, 25000,82,5,2000,13,4.3,10,4.1],
]

// ─── Runner ───────────────────────────────────────────────────────────────────

async function seedBoxscore() {
  console.log('\n📊 BoxScore semanas...')
  let ok = 0
  for (const r of BS) {
    const [semana, anio,
      tasaApertura, tasaClics, tasaRechazos,
      traficoDirectoCorp, traficoDirectoStore,
      impresionesCorp, impresionesStore,
      traficoOrganicoCorp, traficoOrganicoStore,
      impresionesSEM, traficoPagaSEM, clicsSEM, conversionesSEM,
      impresionesCYA, clicsCYA, conversionesCYA,
      impresionesIC, clicsIC, conversionesIC,
      traficoGeneral,
    ] = r
    const result = await post('boxscore-semanas', {
      semana, mes: MES[semana], anio,
      tasaApertura, tasaClics, tasaRechazos,
      traficoDirectoCorp, traficoDirectoStore,
      impresionesCorp, impresionesStore,
      traficoOrganicoCorp, traficoOrganicoStore,
      impresionesSEM, traficoPagaSEM, clicsSEM, conversionesSEM,
      impresionesCYA, clicsCYA, conversionesCYA,
      impresionesIC, clicsIC, conversionesIC,
      traficoGeneral,
    })
    if (result) { process.stdout.write(`  ✓ WK${semana} ${anio}\n`); ok++ }
  }
  console.log(`  → ${ok}/${BS.length} semanas insertadas`)
}

async function seedFunnel() {
  console.log('\n🔁 Funnel mensual...')
  let ok = 0
  for (const r of FUNNEL) {
    const [mes, anio, canal, impresiones, visitas, clics, leads,
           contactosNuevos, compras, montoCompras] = r
    const result = await post('ecosistema-mkts', {
      mes, anio, canal, impresiones, visitas, clics, leads,
      contactosNuevos, compras, montoCompras, notas: null,
    })
    if (result) { process.stdout.write(`  ✓ ${mes} ${anio}\n`); ok++ }
  }
  console.log(`  → ${ok}/${FUNNEL.length} meses insertados`)
}

async function seedCdl() {
  console.log('\n👥 CDL mensual...')
  let ok = 0
  for (const r of CDL) {
    const [semana, mes, anio, nuevosLeads, cantidadCampanas,
           ventasCuentasNuevas, porcentajeRetencion, clientesNuevos, costoAdquisicion,
           contenidosNancy, puntajeEncuestaNancy,
           contenidosRichard, puntajeEncuestaRichard] = r
    const result = await post('cdl-metricas', {
      semana, mes, anio, nuevosLeads, cantidadCampanas,
      ventasCuentasNuevas, porcentajeRetencion, clientesNuevos, costoAdquisicion,
      contenidosNancy, puntajeEncuestaNancy,
      contenidosRichard, puntajeEncuestaRichard,
    })
    if (result) { process.stdout.write(`  ✓ ${mes} ${anio}\n`); ok++ }
  }
  console.log(`  → ${ok}/${CDL.length} meses insertados`)
}

;(async () => {
  console.log(`\n🌱 Seed → ${BASE}`)
  await seedBoxscore()
  await seedFunnel()
  await seedCdl()
  console.log('\n✅ Listo\n')
})()
