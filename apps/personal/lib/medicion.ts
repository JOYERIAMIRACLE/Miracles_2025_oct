// Medición propia de la Tienda: first-party, sin cookies de terceros y sin datos
// personales. Solo ids aleatorios (sesión y visitante) y de dónde llegó la visita.
// El backend (apps/backend/src/medicion.js) valida y limpia todo lo que se envía.
import { getToken } from "@/lib/auth"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const HOST_PRODUCCION = /(^|\.)medalladeoro\.com\.mx$/
const HOST_PROPIO = /(^|\.)(medalladeoro\.com(\.mx)?|pages\.dev)$/
const DIAS_PRIMER_TOQUE = 90

export type Toque = {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  referrer?: string
  via?: string
  landing?: string
  t?: number
}
export type Atribucion = { sid: string; vid: string; ft: Toque | null; lt: Toque | null }
export type EventoMedicion =
  | "page_viewed" | "cart_item_added" | "cart_checkout_started" | "contact_clicked" | "search_performed"

function seguro<T>(fn: () => T, respaldo: T): T {
  try { return fn() } catch { return respaldo }
}

function leerJson<T>(clave: string, storage: Storage): T | null {
  return seguro(() => {
    const crudo = storage.getItem(clave)
    return crudo ? (JSON.parse(crudo) as T) : null
  }, null)
}

function guardarJson(clave: string, valor: unknown, storage: Storage) {
  seguro(() => storage.setItem(clave, JSON.stringify(valor)), undefined)
}

/** No se mide con DNT/GPC, navegadores automatizados, staff con sesión ni fuera de producción. */
function rechazaMedicion(): boolean {
  if (typeof window === "undefined") return true
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean; msDoNotTrack?: string }
  const w = window as Window & { doNotTrack?: string }
  if (nav.doNotTrack === "1" || w.doNotTrack === "1" || nav.msDoNotTrack === "1" || nav.globalPrivacyControl === true) return true
  if (nav.webdriver) return true
  if (seguro(() => localStorage.getItem("mdo_no_track") === "1", false)) return true
  if (seguro(() => !!getToken(), false)) return true
  if (!HOST_PRODUCCION.test(location.hostname) && process.env.NEXT_PUBLIC_MEDICION !== "1") return true
  return false
}

function nuevoId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID()
  return Array.from(crypto.getRandomValues(new Uint8Array(16))).map((b) => b.toString(16).padStart(2, "0")).join("")
}

function idPersistente(clave: string, storage: Storage): string {
  const existente = seguro(() => storage.getItem(clave), null)
  if (existente) return existente
  const id = nuevoId()
  seguro(() => storage.setItem(clave, id), undefined)
  return id
}

function appIntegrada(): string {
  const ua = navigator.userAgent
  if (/Instagram/i.test(ua)) return "instagram"
  if (/FBAN|FBAV|FB_IAB|FBIOS/i.test(ua)) return "facebook"
  if (/musical_ly|TikTok|BytedanceWebview/i.test(ua)) return "tiktok"
  return ""
}

function leerToque(): Toque {
  const toque: Toque = { landing: location.pathname }
  const params = new URLSearchParams(location.search)
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content"] as const) {
    const v = params.get(k)
    if (v) toque[k] = v.slice(0, 80)
  }
  const ref = seguro(() => (document.referrer ? new URL(document.referrer).hostname : ""), "")
  if (ref && ref !== location.hostname && !HOST_PROPIO.test(ref)) toque.referrer = ref
  const via = appIntegrada()
  if (via) toque.via = via
  return toque
}

const esDirecto = (t: Toque) => !t.utm_source && !t.referrer && !t.via

// Los utm_* solo sirven para medir la llegada; se quitan de la barra para que
// nadie los copie y los reparta en enlaces compartidos.
function limpiarUtmDeLaUrl() {
  seguro(() => {
    const url = new URL(location.href)
    let cambio = false
    for (const k of [...url.searchParams.keys()]) {
      if (k.startsWith("utm_")) { url.searchParams.delete(k); cambio = true }
    }
    if (cambio) history.replaceState(history.state, "", url.pathname + url.search + url.hash)
  }, undefined)
}

// Toque de esta sesión (una sola captura por pestaña). Primer toque: el primero
// de los últimos 90 días; si era "directo" y luego llega uno identificable, lo
// reemplaza (directo es un hueco de medición, no una fuente). Último toque: el
// más reciente que no sea directo.
function iniciarSesion(): Toque {
  const guardado = leerJson<Toque>("mdo_toque", sessionStorage)
  if (guardado) return guardado
  const toque = leerToque()
  guardarJson("mdo_toque", toque, sessionStorage)

  const ahora = Date.now()
  const ft = leerJson<Toque>("mdo_ft", localStorage)
  const vencido = !!ft?.t && ahora - ft.t > DIAS_PRIMER_TOQUE * 86_400_000
  if (!ft || vencido || (esDirecto(ft) && !esDirecto(toque))) guardarJson("mdo_ft", { ...toque, t: ahora }, localStorage)
  if (!esDirecto(toque)) guardarJson("mdo_lt", { ...toque, t: ahora }, localStorage)
  limpiarUtmDeLaUrl()
  return toque
}

function yaSeVio(ruta: string): boolean {
  const vistas = new Set(leerJson<string[]>("mdo_pv", sessionStorage) ?? [])
  if (vistas.has(ruta)) return true
  vistas.add(ruta)
  guardarJson("mdo_pv", [...vistas].slice(-200), sessionStorage)
  return false
}

export function track(evento: EventoMedicion, extra: { producto?: string; detalle?: string } = {}) {
  if (rechazaMedicion()) return
  const ruta = location.pathname
  if (evento === "page_viewed" && yaSeVio(ruta)) return
  const toque = iniciarSesion()
  const producto = extra.producto ?? (evento === "page_viewed" && ruta.startsWith("/producto/") ? ruta.split("/")[2] : undefined)
  fetch(`${BASE}/api/tienda/actividad`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      evento,
      sid: idPersistente("mdo_sid", sessionStorage),
      vid: idPersistente("mdo_vid", localStorage),
      pagina: ruta,
      toque,
      producto,
      detalle: extra.detalle?.slice(0, 80),
    }),
    keepalive: true,
    credentials: "omit",
  }).catch(() => {})
}

/** Origen de la visita para adjuntarlo a un formulario; undefined si no se mide. */
export function getAtribucion(): Atribucion | undefined {
  if (rechazaMedicion()) return undefined
  iniciarSesion()
  return {
    sid: idPersistente("mdo_sid", sessionStorage),
    vid: idPersistente("mdo_vid", localStorage),
    ft: leerJson<Toque>("mdo_ft", localStorage),
    lt: leerJson<Toque>("mdo_lt", localStorage),
  }
}
