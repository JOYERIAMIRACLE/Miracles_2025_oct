"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Pencil, MoreVertical } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import Cropper from "react-easy-crop"
import type { Area } from "react-easy-crop"
import { toast } from "sonner"
import { saveIdentidad, useGetIdentidad } from "@/api/identidad-empresa/getIdentidad"
import { uploadMedia } from "@/lib/upload"
import type { IdentidadEmpresa, IdentidadImagen } from "@/types/identidad-empresa"

export function fechaActual() {
  return new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })
}

/** Portado de sdi-portal/components/Trabajo/portal/shared.tsx — mismo mecanismo, acento violeta en vez de naranja. */
export function useSectionTab(sectionId: string, defaultTab: string) {
  const [tab, setTabState] = useState(() => {
    if (typeof window === "undefined") return defaultTab
    const [hashSection, hashTab] = window.location.hash.slice(1).split("/")
    return hashSection === sectionId && hashTab ? hashTab : defaultTab
  })

  function setTab(next: string) {
    setTabState(next)
    history.replaceState(null, "", `#${sectionId}/${next}`)
    window.dispatchEvent(new Event("hashchange"))
  }

  useEffect(() => {
    function onHashChange() {
      const [hashSection, hashTab] = window.location.hash.slice(1).split("/")
      if (hashSection === sectionId && hashTab) setTabState(hashTab)
    }
    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [sectionId])

  return { tab, setTab }
}

export interface TabItem {
  id: string
  label: string
  icon?: LucideIcon
}

export function TabBar({ tabs, active, onChange }: { tabs: TabItem[]; active: string; onChange: (id: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [fadeIzq, setFadeIzq] = useState(false)
  const [fadeDer, setFadeDer] = useState(false)

  const actualizarFades = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setFadeIzq(el.scrollLeft > 4)
    setFadeDer(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    actualizarFades()
    el.addEventListener("scroll", actualizarFades, { passive: true })
    const ro = new ResizeObserver(actualizarFades)
    ro.observe(el)
    return () => { el.removeEventListener("scroll", actualizarFades); ro.disconnect() }
  }, [actualizarFades, tabs.length])

  return (
    <div className="relative min-w-0 w-full bg-white dark:bg-[#2a1b3d] border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
      <div ref={scrollRef} className="overflow-x-auto scrollbar-thin">
        <div className="inline-flex items-center gap-1 p-1.5">
          {tabs.map(t => {
            const Icon = t.icon
            const isActive = active === t.id
            return (
              <button key={t.id} type="button" onClick={() => onChange(t.id)}
                className={[
                  "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors",
                  isActive
                    ? "bg-slate-100 dark:bg-[#2a1b3d] text-violet-600 dark:text-violet-400 font-bold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
                ].join(" ")}>
                {Icon && <Icon size={14} />}
                {t.label}
              </button>
            )
          })}
        </div>
      </div>
      <div className={`pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-linear-to-r from-white dark:from-slate-900 to-transparent transition-opacity duration-200 ${fadeIzq ? "opacity-100" : "opacity-0"}`} />
      <div className={`pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-linear-to-l from-white dark:from-slate-900 to-transparent transition-opacity duration-200 ${fadeDer ? "opacity-100" : "opacity-0"}`} />
    </div>
  )
}

/** Igual que TabBar pero pensada para vivir DENTRO de SeccionHero (children),
    sobre la imagen de fondo con overlay oscuro — pastillas translúcidas en
    vez de cards blancas/slate, para que hero + tabs se lean como una sola
    pieza en vez de una barra flotando debajo de la imagen. */
export function HeroTabs({ tabs, active, onChange }: { tabs: TabItem[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {tabs.map(t => {
        const Icon = t.icon
        const isActive = active === t.id
        return (
          <button key={t.id} type="button" onClick={() => onChange(t.id)}
            className={[
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
              isActive
                ? "bg-white/15 text-white font-bold"
                : "text-white/60 hover:text-white/90 hover:bg-white/5",
            ].join(" ")}>
            {Icon && <Icon size={14} />}
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

/** Portado de shared.tsx de SDI — mismo componente, acento violeta. */
export function PageHeader({
  date, title, breadcrumb, badge, owner,
}: {
  date?: string
  title: string
  breadcrumb?: string[]
  badge?: { label: string; color: "violet" | "emerald" | "amber" }
  owner?: string
}) {
  // Un solo acento (violeta) — sin variación decorativa por color de badge.
  const violetBadge = "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/25"
  const badgeColors = { violet: violetBadge, emerald: violetBadge, amber: violetBadge }
  return (
    <div className="mb-4">
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="flex items-center gap-1 text-[11px] text-slate-500 mb-1.5 flex-wrap">
          {breadcrumb.map((c, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-slate-400 dark:text-slate-700 mx-0.5">›</span>}
              <span className={i === breadcrumb.length - 1 ? "text-violet-600 dark:text-violet-400 font-medium" : ""}>{c}</span>
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h1>
        {badge && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColors[badge.color]}`}>
            {badge.label}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 mt-0.5">
        {!breadcrumb && date && <p className="text-sm text-slate-500">{date}</p>}
        {owner && <span className="text-xs text-slate-500">{!breadcrumb ? "·" : ""} {owner}</span>}
      </div>
    </div>
  )
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white dark:bg-[#2a1b3d] border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-6 ${className}`}>{children}</div>
}

export function Pending({ owner, desc }: { owner: string; desc: string }) {
  return (
    <Card className="flex gap-4 items-start">
      <span className="text-3xl">📝</span>
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Contenido pendiente · {owner}</p>
        <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
      </div>
    </Card>
  )
}

/** Convierte **palabra** en <strong>palabra</strong> — portado de SDI. */
export function boldify(texto: string): React.ReactNode[] {
  const partes = texto.split(/(\*\*[^*]+\*\*)/g)
  return partes.map((parte, i) =>
    parte.startsWith("**") && parte.endsWith("**")
      ? <strong key={i}>{parte.slice(2, -2)}</strong>
      : parte
  )
}

export type IdentidadImagenCampo =
  | "foto_equipo" | "imagen_mision" | "imagen_vision"
  | "portada_principios"
  | "icono_principio_1" | "icono_principio_2" | "icono_principio_3" | "icono_principio_4" | "icono_principio_5"
  | "img_orientador_1" | "img_orientador_2" | "img_orientador_3" | "img_orientador_4"
  | "img_valores_logo"
  | "icono_valor_1" | "icono_valor_2" | "icono_valor_3" | "icono_valor_4" | "icono_valor_5"
  | "logo"

/** Sube una imagen simple (sin recorte) y la guarda en identidad-empresa. */
export function useUploadImagen(campo: IdentidadImagenCampo, documentId: string | null, onUploaded: () => void) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { id } = await uploadMedia(file)
      await saveIdentidad(documentId, { [campo]: id })
      onUploaded()
      toast.success("Imagen actualizada")
    } catch (err) {
      toast.error(`Error · ${(err as Error).message}`)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return { uploading, inputRef, handleFile, trigger: () => inputRef.current?.click() }
}

function cargarImagen(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

async function recortarImagen(imagenUrl: string, area: Area): Promise<File> {
  const img = await cargarImagen(imagenUrl)
  const canvas = document.createElement("canvas")
  canvas.width = area.width
  canvas.height = area.height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("No se pudo procesar la imagen")
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height)
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", 0.92))
  if (!blob) throw new Error("No se pudo generar la imagen recortada")
  return new File([blob], "hero-recorte.jpg", { type: "image/jpeg" })
}

/**
 * Imagen de portada (hero) con recorte — guarda el campo "_original" sin
 * recortar la primera vez que se sube, para que "Ajustar imagen" siempre
 * parta de la foto completa en vez de recortar sobre un recorte anterior.
 */
export type HeroImagenCampo = "portada_conoce" | "portada_depto_mision" | "portada_depto_rh" | "portada_depto_cadena" | "portada_depto_comercial" | "portada_depto_marketing" | "portada_depto_administracion" | "portada_tareas" | "portada_campanas" | "portada_contactos" | "portada_panel" | "portada_ventas" | "portada_inventario" | "portada_documentos" | "portada_marca" | "portada_enlaces" | "portada_sitio_web"

export function useHeroImagen(campo: HeroImagenCampo, documentId: string | null, onUploaded: () => void) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function subir(file: File, actualizarOriginal: boolean) {
    setUploading(true)
    try {
      const { id } = await uploadMedia(file)
      await saveIdentidad(documentId, actualizarOriginal ? { [campo]: id, [`${campo}_original`]: id } : { [campo]: id })
      onUploaded()
      toast.success("Imagen actualizada")
    } catch (err) {
      toast.error(`Error · ${(err as Error).message}`)
    } finally {
      setUploading(false)
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    await subir(file, true)
    if (inputRef.current) inputRef.current.value = ""
  }

  async function saveCrop(file: File) {
    await subir(file, false)
  }

  return { uploading, inputRef, handleFile, saveCrop, trigger: () => inputRef.current?.click() }
}

export function SeccionHero({
  breadcrumb, titulo, descripcion,
  imagenUrl, imagenOriginalUrl,
  puedeEditar, uploading, inputRef, onTrigger, onFileChange, onSaveCrop,
  campoDescripcion, onDescripcionGuardada, documentId,
  children,
}: {
  breadcrumb: string[]
  titulo: string
  descripcion: string
  imagenUrl?: string | null
  imagenOriginalUrl?: string | null
  puedeEditar?: boolean
  uploading?: boolean
  inputRef?: React.RefObject<HTMLInputElement | null>
  onTrigger?: () => void
  onFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSaveCrop?: (file: File) => void
  campoDescripcion?: keyof IdentidadEmpresa
  onDescripcionGuardada?: () => void
  documentId?: string | null
  /** Slot opcional debajo de la descripción, dentro del mismo card con
      imagen de fondo — ej. un TabBar propio para que la sección se vea como
      una sola pieza en vez de hero + barra de tabs separada abajo. */
  children?: React.ReactNode
}) {
  const [showPopup, setShowPopup] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [editandoDesc, setEditandoDesc] = useState(false)
  const [descBorrador, setDescBorrador] = useState(descripcion)
  const [guardandoDesc, setGuardandoDesc] = useState(false)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  function entrarEdicionDesc() {
    setDescBorrador(descripcion)
    setEditandoDesc(true)
  }

  async function guardarDescripcion() {
    if (!campoDescripcion || !descBorrador.trim()) return
    setGuardandoDesc(true)
    try {
      await saveIdentidad(documentId ?? null, { [campoDescripcion]: descBorrador.trim() })
      setEditandoDesc(false)
      onDescripcionGuardada?.()
    } catch (e) {
      toast.error(`Error · ${(e as Error).message}`)
    } finally {
      setGuardandoDesc(false)
    }
  }

  const [showAdjust, setShowAdjust] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [cropArea, setCropArea] = useState<Area | null>(null)
  const onCropComplete = useCallback((_: Area, areaPixels: Area) => setCropArea(areaPixels), [])
  const fuenteAjuste = imagenOriginalUrl ?? imagenUrl ?? null

  function abrirAjuste() {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setShowAdjust(true)
  }

  async function handleGuardarAjuste() {
    if (!fuenteAjuste || !cropArea) return
    try {
      const file = await recortarImagen(fuenteAjuste, cropArea)
      setShowAdjust(false)
      onSaveCrop?.(file)
    } catch (err) {
      toast.error(`Error · ${(err as Error).message}`)
    }
  }

  return (
    <div className="relative rounded-2xl overflow-hidden bg-[#2a1b3d]">
      {imagenUrl ? (
        <>
          <img src={imagenUrl} alt="" className="absolute inset-0 w-full h-full object-cover object-top opacity-50" />
          <div className="absolute inset-0 bg-linear-to-r from-black/60 to-violet-900/30" />
        </>
      ) : (
        <div className="absolute inset-0 bg-linear-to-r from-slate-800 to-slate-900" />
      )}

      {(imagenUrl || puedeEditar) && (
        <div ref={menuRef} className="absolute top-3 right-3 z-20">
          <button type="button" onClick={() => setMenuOpen(o => !o)} title="Opciones de imagen"
            className="h-7 w-7 flex items-center justify-center bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm transition">
            <MoreVertical size={15} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-40 bg-[#2a1b3d] border border-slate-700 rounded-lg shadow-xl overflow-hidden py-1">
              {imagenUrl && (
                <button type="button" onClick={() => { setShowPopup(true); setMenuOpen(false) }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-200 hover:bg-[#2a1b3d] transition">
                  Ver imagen
                </button>
              )}
              {puedeEditar && imagenUrl && (
                <button type="button" onClick={() => { abrirAjuste(); setMenuOpen(false) }} disabled={uploading}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-200 hover:bg-[#2a1b3d] transition disabled:opacity-50">
                  Ajustar imagen
                </button>
              )}
              {puedeEditar && (
                <button type="button" onClick={() => { onTrigger?.(); setMenuOpen(false) }} disabled={uploading}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-200 hover:bg-[#2a1b3d] transition disabled:opacity-50">
                  {uploading ? "Subiendo..." : "Cambiar imagen"}
                </button>
              )}
            </div>
          )}
          {puedeEditar && <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />}
        </div>
      )}

      {showPopup && imagenUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setShowPopup(false)}>
          <div className="relative max-w-5xl w-full" onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => setShowPopup(false)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white text-sm font-semibold flex items-center gap-1">
              ✕ Cerrar
            </button>
            <img src={imagenUrl} alt="" className="w-full h-auto rounded-2xl shadow-2xl" />
          </div>
        </div>
      )}

      {showAdjust && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-[#2a1b3d] rounded-2xl p-4 w-full max-w-2xl">
            <p className="text-sm font-semibold text-white mb-3">Ajustar imagen</p>
            <div className="relative w-full aspect-[7/2] rounded-xl overflow-hidden bg-black">
              {fuenteAjuste ? (
                <Cropper
                  image={fuenteAjuste}
                  crop={crop}
                  zoom={zoom}
                  aspect={3.5}
                  objectFit="cover"
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-white/50">
                  Cargando imagen…
                </div>
              )}
            </div>
            <input type="range" min={1} max={3} step={0.01} value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              className="w-full mt-3 accent-violet-500" />
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setShowAdjust(false)} disabled={uploading}
                className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition disabled:opacity-50">
                Cancelar
              </button>
              <button type="button" onClick={handleGuardarAjuste} disabled={uploading || !cropArea || !fuenteAjuste}
                className="px-4 py-1.5 text-xs font-semibold bg-violet-500 hover:bg-violet-600 text-white rounded-lg transition disabled:opacity-50">
                {uploading ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 p-6">
        <nav className="flex items-center gap-1 text-[11px] text-white/40 mb-2 flex-wrap">
          {breadcrumb.map((c, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-white/30 mx-0.5">›</span>}
              <span className={i === breadcrumb.length - 1 ? "text-violet-300 font-medium" : ""}>{c}</span>
            </span>
          ))}
        </nav>
        <h1 className="text-2xl font-bold text-white mb-1">{titulo}</h1>
        {editandoDesc ? (
          <div className="max-w-xl space-y-2">
            <textarea autoFocus rows={3} value={descBorrador} onChange={e => setDescBorrador(e.target.value)}
              className="w-full text-sm rounded-lg border border-white/20 bg-black/30 text-white placeholder:text-white/40 p-2 focus:outline-none focus:border-violet-400" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditandoDesc(false)}
                className="px-2.5 py-1 text-xs rounded-lg text-white/70 hover:bg-white/10 transition">
                Cancelar
              </button>
              <button type="button" onClick={guardarDescripcion} disabled={guardandoDesc || !descBorrador.trim()}
                className="px-2.5 py-1 text-xs rounded-lg bg-violet-500 hover:bg-violet-600 disabled:opacity-40 text-white font-semibold transition">
                {guardandoDesc ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-1.5 max-w-xl group/desc">
            <p className="text-sm text-white/70 leading-relaxed flex-1">{descripcion}</p>
            {puedeEditar && campoDescripcion && (
              <button type="button" title="Editar descripción" onClick={entrarEdicionDesc}
                className="opacity-0 group-hover/desc:opacity-100 text-white/50 hover:text-violet-300 transition shrink-0 mt-0.5">
                <Pencil size={13} />
              </button>
            )}
          </div>
        )}
        {children && (
          <div className="mt-4 pt-3 border-t border-white/10">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

/** Igual que HeroTabs pero pensada para vivir DENTRO de SeccionHeroContenido,
    sobre el fondo claro/oscuro normal del Portal (no sobre una foto) — usa
    los mismos colores de pastilla activa/inactiva que TabBar. */
export function ContenidoTabs({ tabs, active, onChange }: { tabs: TabItem[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {tabs.map(t => {
        const Icon = t.icon
        const isActive = active === t.id
        return (
          <button key={t.id} type="button" onClick={() => onChange(t.id)}
            className={[
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
              isActive
                ? "bg-slate-100 dark:bg-[#2a1b3d] text-violet-600 dark:text-violet-400 font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
            ].join(" ")}>
            {Icon && <Icon size={14} />}
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

/** Pieza full-bleed de un header tipo SeccionHero: foto + overlay + menú de
    tres puntos (ver/ajustar/cambiar imagen), sin el breadcrumb/título/desc —
    para secciones que quieren un hero a todo el ancho de <main> (como
    PortalHomeHero) en vez de una card encajonada. Ver SeccionHeroContenido
    para la mitad boxed que va debajo. */
export function SeccionHeroFondo({
  imagenUrl, imagenOriginalUrl, puedeEditar,
  uploading, inputRef, onTrigger, onFileChange, onSaveCrop,
}: {
  imagenUrl?: string | null
  imagenOriginalUrl?: string | null
  puedeEditar?: boolean
  uploading?: boolean
  inputRef?: React.RefObject<HTMLInputElement | null>
  onTrigger?: () => void
  onFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSaveCrop?: (file: File) => void
}) {
  const [showPopup, setShowPopup] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  const [showAdjust, setShowAdjust] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [cropArea, setCropArea] = useState<Area | null>(null)
  const onCropComplete = useCallback((_: Area, areaPixels: Area) => setCropArea(areaPixels), [])
  const fuenteAjuste = imagenOriginalUrl ?? imagenUrl ?? null

  function abrirAjuste() {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setShowAdjust(true)
  }

  async function handleGuardarAjuste() {
    if (!fuenteAjuste || !cropArea) return
    try {
      const file = await recortarImagen(fuenteAjuste, cropArea)
      setShowAdjust(false)
      onSaveCrop?.(file)
    } catch (err) {
      toast.error(`Error · ${(err as Error).message}`)
    }
  }

  return (
    <div className="relative overflow-hidden h-80 sm:h-[26rem]">
      {imagenUrl ? (
        <>
          <img src={imagenUrl} alt="" className="absolute inset-0 w-full h-full object-cover object-top opacity-50" />
          <div className="absolute inset-0 bg-linear-to-r from-black/60 to-violet-900/30" />
        </>
      ) : (
        <div className="absolute inset-0 bg-linear-to-r from-slate-800 to-slate-900" />
      )}

      {(imagenUrl || puedeEditar) && (
        <div ref={menuRef} className="absolute top-4 right-6 z-20">
          <button type="button" onClick={() => setMenuOpen(o => !o)} title="Opciones de imagen"
            className="h-7 w-7 flex items-center justify-center bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm transition">
            <MoreVertical size={15} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-40 bg-[#2a1b3d] border border-slate-700 rounded-lg shadow-xl overflow-hidden py-1">
              {imagenUrl && (
                <button type="button" onClick={() => { setShowPopup(true); setMenuOpen(false) }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-200 hover:bg-[#2a1b3d] transition">
                  Ver imagen
                </button>
              )}
              {puedeEditar && imagenUrl && (
                <button type="button" onClick={() => { abrirAjuste(); setMenuOpen(false) }} disabled={uploading}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-200 hover:bg-[#2a1b3d] transition disabled:opacity-50">
                  Ajustar imagen
                </button>
              )}
              {puedeEditar && (
                <button type="button" onClick={() => { onTrigger?.(); setMenuOpen(false) }} disabled={uploading}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-200 hover:bg-[#2a1b3d] transition disabled:opacity-50">
                  {uploading ? "Subiendo..." : "Cambiar imagen"}
                </button>
              )}
            </div>
          )}
          {puedeEditar && <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />}
        </div>
      )}

      {showPopup && imagenUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setShowPopup(false)}>
          <div className="relative max-w-5xl w-full" onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => setShowPopup(false)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white text-sm font-semibold flex items-center gap-1">
              ✕ Cerrar
            </button>
            <img src={imagenUrl} alt="" className="w-full h-auto rounded-2xl shadow-2xl" />
          </div>
        </div>
      )}

      {showAdjust && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-[#2a1b3d] rounded-2xl p-4 w-full max-w-2xl">
            <p className="text-sm font-semibold text-white mb-3">Ajustar imagen</p>
            <div className="relative w-full aspect-[7/2] rounded-xl overflow-hidden bg-black">
              {fuenteAjuste ? (
                <Cropper
                  image={fuenteAjuste}
                  crop={crop}
                  zoom={zoom}
                  aspect={3.5}
                  objectFit="cover"
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-white/50">
                  Cargando imagen…
                </div>
              )}
            </div>
            <input type="range" min={1} max={3} step={0.01} value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              className="w-full mt-3 accent-violet-500" />
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setShowAdjust(false)} disabled={uploading}
                className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition disabled:opacity-50">
                Cancelar
              </button>
              <button type="button" onClick={handleGuardarAjuste} disabled={uploading || !cropArea || !fuenteAjuste}
                className="px-4 py-1.5 text-xs font-semibold bg-violet-500 hover:bg-violet-600 text-white rounded-lg transition disabled:opacity-50">
                {uploading ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** Versión genérica de TareasHeroFondo: dado el nombre de un campo de imagen
    de identidad-empresa, resuelve su fetch/upload/recorte por su cuenta y
    renderiza SeccionHeroFondo — para que una sección nueva no tenga que
    escribir su propio archivo "XHeroFondo.tsx" de una sola línea. */
export function HeroFondoExterno({ campo }: { campo: HeroImagenCampo }) {
  const { identidad, loading, reload } = useGetIdentidad()
  const documentId = identidad?.documentId ?? null
  const hero = useHeroImagen(campo, documentId, reload)
  const imagen = identidad?.[campo] as IdentidadImagen | undefined
  const imagenOriginal = (identidad as Record<string, IdentidadImagen> | null)?.[`${campo}_original`]

  return (
    <SeccionHeroFondo
      imagenUrl={imagen?.url}
      imagenOriginalUrl={imagenOriginal?.url}
      puedeEditar={!loading}
      uploading={hero.uploading}
      inputRef={hero.inputRef}
      onTrigger={hero.trigger}
      onFileChange={hero.handleFile}
      onSaveCrop={hero.saveCrop}
    />
  )
}

/** ─── Receta: dar a una sección un hero full-bleed que se solapa con su
    propio contenido (Tareas, Panel, y cualquier sección futura) ──────────
     1. page.tsx: <HeroFondoExterno campo="portada_x" /> como hermano ANTES
        de <div className="max-w-7xl ...">, igual que las líneas existentes
        para "portal" y "tareas".
     2. La raíz propia de la sección (NO un hijo anidado) recibe
        rounded-sm rounded-tr-3xl (firma "Portal SDI" — ver
        PortalHomeHero.FLOATING_CARD / SeccionPortalHome "wrapper de aire")
        + heroOverlapStyle() vía `style`.
     3. Esa misma raíz renderiza <SeccionHeroContenido> como su PRIMER hijo
        (no un hermano aparte), para que header + contenido se lean como
        una sola pieza.

     Dos bugs reales ya nos mordieron con esto — no los repitas:
     (a) El overlap va en la raíz que define su propio fondo/tamaño, NUNCA
         en un hijo anidado dentro de algo con overflow-x-hidden (o
         cualquier overflow-x != visible sin overflow-y explícito): CSS
         computa overflow-y:auto ahí y recorta en silencio lo que el
         margen negativo empuje POR ENCIMA del borde superior del
         contenedor. overflow-hidden en un elemento no afecta cómo ESE
         MISMO elemento se posiciona en SU PADRE vía margin — solo recorta
         lo anidado adentro.
     (b) El margin-top negativo va en `style`, no en una clase -mt-*,
         cuando la raíz YA tiene una clase margin shorthand en un
         breakpoint mayor (ej. md:-m-6, como en TareasView) — Tailwind
         emite breakpoints en orden ascendente y la regla de mayor
         breakpoint gana en el ancho donde ambas aplican, sin importar el
         orden en className. Si la raíz parte de cero (sin margin
         shorthand — ej. el wrapper de aire de Home, que usa
         -mt-6 sm:-mt-28 como clase normal), no hay conflicto. Usar
         heroOverlapStyle() de todos modos evita tener que razonar caso
         por caso si hay conflicto o no. ─────────────────────────────── */
export function heroOverlapStyle(px = 164): React.CSSProperties {
  return { marginTop: `-${px}px` }
}

/** Fondo compartido de todo lo que NO es el hero full-bleed: <main> (page.tsx)
    y cada vitrina (SeccionVitrina, y la vitrina a medida de Inicio) importan
    ESTA constante en vez de escribir el hex por su cuenta — así no se pueden
    desincronizar entre sí. (El hero en sí, PortalHomeHero, es intencionalmente
    siempre oscuro sin importar el tema — no usa esta constante.) */
export const FONDO_PORTAL = "bg-[#f8f9fa] dark:bg-[#121212]"

/** Raíz compartida de la vitrina que flota sobre un HeroFondoExterno — usar
    esta en vez de copiar el className/style a mano en cada sección nueva:
    un cambio futuro (radio de esquina, color, cuánto se solapa) se hace
    aquí y aplica a todas las secciones que la usan. Tareas queda afuera a
    propósito (su raíz trae de antes -m-4/md:-m-6/min-h/overflow-x-hidden/
    color propio por una razón no relacionada — forzarla aquí pediría una
    válvula de escape que no vale la pena para un componente ya en
    producción). */
export function SeccionVitrina({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative rounded-sm rounded-tr-3xl p-4 sm:p-6 text-slate-900 dark:text-slate-100 ${FONDO_PORTAL} ${className}`}
      style={heroOverlapStyle()}
    >
      {/* Mismo brillo sutil que TareasView, para que todas las secciones
          compartan el mismo acento — no depende de dark/light, mismo tono
          en ambos, igual que la referencia. */}
      <div className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 55% 0%, rgba(139,92,246,0.1) 0%, transparent 55%)" }} />
      <div className="relative space-y-4">
        {children}
      </div>
    </div>
  )
}

/** Pieza boxed de un header tipo SeccionHero: breadcrumb + título + descripción
    (editable) + tabs tras una raya — paleta clara/oscura adaptativa porque vive
    sobre el fondo normal del Portal, no sobre una foto. Ver SeccionHeroFondo
    para la mitad full-bleed que va arriba. */
/** Portado de sdi-portal/components/Trabajo/portal/shared.tsx — barra de
    acento + título uppercase, usada como encabezado de columna (Recursos,
    Calendario, Cumpleaños, etc. en Inicio). Acento violeta en vez de naranja
    (regla de un solo color de MDO). */
export function ColumnHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mt-2 py-1">
      <span className="h-6 w-1.5 rounded-full bg-violet-500 shrink-0" />
      <h3 className="text-lg font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider">{children}</h3>
    </div>
  )
}

/** Portado de sdi-portal/components/Trabajo/portal/shared.tsx — avatar con
    foto o, si no hay, iniciales sobre un degradado. Simplificado a un solo
    degradado violeta (sdi-portal rota 7 colores por colaborador vía
    `color_avatar`; MDO no guarda ese campo a propósito, regla de un solo
    acento). */
export function AvatarColab({ colaborador: c, size = "md" }: { colaborador: { nombre: string; foto: { url: string } | null }; size?: "sm" | "md" | "lg" }) {
  const sz  = size === "sm" ? "h-8 w-8 text-[10px]" : size === "lg" ? "h-16 w-16 text-lg" : "h-10 w-10 text-xs"
  const ini = c.nombre.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
  if (c.foto?.url) return <img src={c.foto.url} alt={c.nombre} className={`${sz} rounded-full object-cover shrink-0`} />
  return (
    <div className={`${sz} rounded-full bg-linear-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-bold shrink-0`}>
      {ini}
    </div>
  )
}

export function SeccionHeroContenido({
  breadcrumb, titulo, descripcion,
  campoDescripcion, onDescripcionGuardada, documentId, puedeEditar,
  children,
}: {
  breadcrumb: string[]
  titulo: string
  descripcion: string
  campoDescripcion?: keyof IdentidadEmpresa
  onDescripcionGuardada?: () => void
  documentId?: string | null
  puedeEditar?: boolean
  children?: React.ReactNode
}) {
  const [editandoDesc, setEditandoDesc] = useState(false)
  const [descBorrador, setDescBorrador] = useState(descripcion)
  const [guardandoDesc, setGuardandoDesc] = useState(false)

  function entrarEdicionDesc() {
    setDescBorrador(descripcion)
    setEditandoDesc(true)
  }

  async function guardarDescripcion() {
    if (!campoDescripcion || !descBorrador.trim()) return
    setGuardandoDesc(true)
    try {
      await saveIdentidad(documentId ?? null, { [campoDescripcion]: descBorrador.trim() })
      setEditandoDesc(false)
      onDescripcionGuardada?.()
    } catch (e) {
      toast.error(`Error · ${(e as Error).message}`)
    } finally {
      setGuardandoDesc(false)
    }
  }

  return (
    <div>
      <nav className="flex items-center gap-1 text-[11px] text-slate-500 mb-2 flex-wrap">
        {breadcrumb.map((c, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-slate-400 dark:text-slate-700 mx-0.5">›</span>}
            <span className={i === breadcrumb.length - 1 ? "text-violet-600 dark:text-violet-400 font-medium" : ""}>{c}</span>
          </span>
        ))}
      </nav>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">{titulo}</h1>
      {editandoDesc ? (
        <div className="max-w-xl space-y-2">
          <textarea autoFocus rows={3} value={descBorrador} onChange={e => setDescBorrador(e.target.value)}
            className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 p-2 focus:outline-none focus:border-violet-400" />
          <div className="flex gap-2">
            <button type="button" onClick={() => setEditandoDesc(false)}
              className="px-2.5 py-1 text-xs rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              Cancelar
            </button>
            <button type="button" onClick={guardarDescripcion} disabled={guardandoDesc || !descBorrador.trim()}
              className="px-2.5 py-1 text-xs rounded-lg bg-violet-500 hover:bg-violet-600 disabled:opacity-40 text-white font-semibold transition">
              {guardandoDesc ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-1.5 max-w-xl group/desc">
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed flex-1">{descripcion}</p>
          {puedeEditar && campoDescripcion && (
            <button type="button" title="Editar descripción" onClick={entrarEdicionDesc}
              className="opacity-0 group-hover/desc:opacity-100 text-slate-400 hover:text-violet-500 dark:hover:text-violet-400 transition shrink-0 mt-0.5">
              <Pencil size={13} />
            </button>
          )}
        </div>
      )}
      {children && (
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
          {children}
        </div>
      )}
    </div>
  )
}
