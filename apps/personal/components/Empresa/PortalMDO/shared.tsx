"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Pencil } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import Cropper from "react-easy-crop"
import type { Area } from "react-easy-crop"
import { toast } from "sonner"
import { saveIdentidad } from "@/api/identidad-empresa/getIdentidad"
import { uploadMedia } from "@/lib/upload"
import type { IdentidadEmpresa } from "@/types/identidad-empresa"

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
    <div className="relative min-w-0 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
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
                    ? "bg-slate-100 dark:bg-slate-800 text-violet-600 dark:text-violet-400 font-bold"
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
  const badgeColors = {
    violet:  "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/25",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    amber:   "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
  }
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
  return <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-6 ${className}`}>{children}</div>
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
type HeroImagenCampo = "portada_conoce" | "portada_depto_mision" | "portada_depto_rh" | "portada_depto_cadena"

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
}) {
  const [showPopup, setShowPopup] = useState(false)
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
    <div className="relative rounded-2xl overflow-hidden bg-slate-900">
      {imagenUrl ? (
        <>
          <img src={imagenUrl} alt="" className="absolute inset-0 w-full h-full object-cover object-top opacity-50" />
          <div className="absolute inset-0 bg-linear-to-r from-black/60 to-violet-900/30" />
        </>
      ) : (
        <div className="absolute inset-0 bg-linear-to-r from-slate-800 to-slate-900" />
      )}

      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
        {imagenUrl && (
          <button type="button" onClick={() => setShowPopup(true)}
            className="px-2.5 py-1 text-[11px] font-semibold bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm transition">
            Ver imagen
          </button>
        )}
        {puedeEditar && imagenUrl && (
          <button type="button" onClick={abrirAjuste} disabled={uploading}
            className="px-2.5 py-1 text-[11px] font-semibold bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm transition disabled:opacity-50">
            Ajustar imagen
          </button>
        )}
        {puedeEditar && (
          <>
            <button type="button" onClick={onTrigger} disabled={uploading}
              className="px-2.5 py-1 text-[11px] font-semibold bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm transition disabled:opacity-50">
              {uploading ? "Subiendo..." : "Cambiar imagen"}
            </button>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
          </>
        )}
      </div>

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
          <div className="bg-slate-900 rounded-2xl p-4 w-full max-w-2xl">
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
      </div>
    </div>
  )
}
