"use client"

import { useState } from "react"
import { Compass, HeartHandshake, Smile, Church, LifeBuoy, GraduationCap, Camera } from "lucide-react"
import { useSectionTab, TabBar, Card, Pending, SeccionHero, useHeroImagen, useUploadImagen } from "./shared"
import type { IdentidadImagenCampo } from "./shared"
import { useGetIdentidad } from "@/api/identidad-empresa/getIdentidad"

const TABS = [
  { id: "principios",  label: "Principios",           icon: Compass },
  { id: "valores",     label: "Valores",               icon: HeartHandshake },
  { id: "actitudes",   label: "Actitudes",             icon: Smile },
  { id: "espiritual",  label: "Formación Espiritual",  icon: Church },
  { id: "consejeria",  label: "Consejería",            icon: LifeBuoy },
  { id: "onboarding",  label: "Onboarding",            icon: GraduationCap },
]

const ICONOS_PRINCIPIO: IdentidadImagenCampo[] = ["icono_principio_1", "icono_principio_2", "icono_principio_3", "icono_principio_4", "icono_principio_5"]
const IMGS_ORIENTADOR:  IdentidadImagenCampo[] = ["img_orientador_1", "img_orientador_2", "img_orientador_3", "img_orientador_4"]
const ICONOS_VALOR:     IdentidadImagenCampo[] = ["icono_valor_1", "icono_valor_2", "icono_valor_3", "icono_valor_4", "icono_valor_5"]

function IconoUpload({ campo, url, documentId, onUploaded, size = "h-12 w-12" }: {
  campo: IdentidadImagenCampo; url?: string | null; documentId: string | null; onUploaded: () => void; size?: string
}) {
  const { uploading, inputRef, handleFile, trigger } = useUploadImagen(campo, documentId, onUploaded)
  return (
    <div className={`relative shrink-0 group ${size}`}>
      <div className={`${size} rounded-full overflow-hidden bg-violet-50 dark:bg-violet-950/30 border-2 border-violet-100 dark:border-violet-900/50 flex items-center justify-center`}>
        {url ? <img src={url} alt="" className="w-full h-full object-cover" /> : <span className="text-slate-300 dark:text-slate-600 text-xl">🖼️</span>}
      </div>
      <button type="button" onClick={trigger} disabled={uploading}
        className="absolute inset-0 rounded-full bg-black/55 text-white text-[9px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition disabled:opacity-100">
        {uploading ? "..." : <Camera className="h-3.5 w-3.5" />}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}

function ImagenUpload({ campo, url, documentId, onUploaded, className = "" }: {
  campo: IdentidadImagenCampo; url?: string | null; documentId: string | null; onUploaded: () => void; className?: string
}) {
  const { uploading, inputRef, handleFile, trigger } = useUploadImagen(campo, documentId, onUploaded)
  return (
    <div className={`relative group rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 ${className}`}>
      {url
        ? <img src={url} alt="" className="w-full h-full object-cover" />
        : <div className="w-full h-full flex flex-col items-center justify-center gap-2 min-h-40">
            <span className="text-3xl">🖼️</span>
            <span className="text-slate-400 dark:text-slate-500 text-xs font-medium">Sin imagen</span>
          </div>
      }
      <button type="button" onClick={trigger} disabled={uploading}
        className="absolute bottom-2 right-2 px-2.5 py-1 text-[11px] font-semibold bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm transition disabled:opacity-50 opacity-0 group-hover:opacity-100">
        {uploading ? "Subiendo..." : "Cambiar imagen"}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}

function TabPrincipios({ identidad, documentId, onUploaded }: { identidad: ReturnType<typeof useGetIdentidad>["identidad"]; documentId: string | null; onUploaded: () => void }) {
  return (
    <div className="space-y-4">
      <Card>
        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <ImagenUpload campo="portada_principios" url={identidad?.portada_principios?.url} documentId={documentId} onUploaded={onUploaded} className="min-h-72" />
          <div className="min-w-0">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">
              Nuestros <span className="text-violet-500">Principios</span>
            </h3>
            <p className="text-sm text-slate-400 dark:text-slate-500 italic mb-3">Pendiente de definir</p>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Nuestro ADN</p>
            <div className="flex flex-col gap-3">
              {ICONOS_PRINCIPIO.map((campo, i) => (
                <div key={campo} className="flex gap-3 items-start">
                  <IconoUpload campo={campo} url={identidad?.[campo]?.url} documentId={documentId} onUploaded={onUploaded} />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wide">Principio {i + 1}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic mt-0.5">Pendiente de definir</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-0.5">
          Principios que nos Orientan a un Proyecto Común
        </h4>
        <p className="text-xs text-slate-400 dark:text-slate-500 italic mb-4">Pendiente de definir</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {IMGS_ORIENTADOR.map((campo, i) => (
            <div key={campo} className="flex rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900">
              <ImagenUpload campo={campo} url={identidad?.[campo]?.url} documentId={documentId} onUploaded={onUploaded} className="shrink-0 w-52 self-stretch" />
              <div className="flex flex-col justify-center px-4 py-3 flex-1 min-w-0">
                <span className="text-[10px] font-bold text-violet-500 uppercase tracking-widest mb-1">Orientador {i + 1}</span>
                <p className="text-xs text-slate-400 dark:text-slate-500 italic leading-relaxed">Pendiente de definir</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function TabValores({ identidad, documentId, onUploaded }: { identidad: ReturnType<typeof useGetIdentidad>["identidad"]; documentId: string | null; onUploaded: () => void }) {
  return (
    <div className="space-y-4">
      <Card>
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div className="min-w-0 space-y-2">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Nuestros <span className="text-violet-500">Valores</span>
            </h3>
            <p className="text-sm text-slate-400 dark:text-slate-500 italic">Pendiente de definir</p>
          </div>
          <ImagenUpload campo="img_valores_logo" url={identidad?.img_valores_logo?.url} documentId={documentId} onUploaded={onUploaded} className="h-32" />
        </div>
      </Card>

      {ICONOS_VALOR.map((campo, i) => (
        <Card key={campo}>
          <div className="grid sm:grid-cols-[200px_1fr] gap-6 items-center">
            <div className="flex flex-col items-center gap-3 text-center sm:border-r sm:border-slate-100 dark:sm:border-slate-700 sm:pr-6">
              <IconoUpload campo={campo} url={identidad?.[campo]?.url} documentId={documentId} onUploaded={onUploaded} size="h-32 w-32" />
              <p className="font-extrabold text-slate-800 dark:text-slate-100 text-lg uppercase tracking-wide">Valor {i + 1}</p>
            </div>
            <p className="text-sm text-slate-400 dark:text-slate-500 italic">Pendiente de definir</p>
          </div>
        </Card>
      ))}
    </div>
  )
}

function TabActitudes() {
  const actitudes = [1, 2, 3]
  return (
    <Card>
      <div className="grid lg:grid-cols-[240px_1fr] gap-8">
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-tight">
            Nuestras <span className="text-violet-500">Actitudes</span>
          </h3>
          <p className="text-sm text-slate-400 dark:text-slate-500 italic">Pendiente de definir</p>
        </div>
        <div className="space-y-6 lg:border-l lg:border-slate-100 dark:lg:border-slate-700 lg:pl-8">
          {actitudes.map((n, i) => (
            <div key={n} className={`flex gap-5 ${i > 0 ? "pt-6 border-t border-slate-100 dark:border-slate-700" : ""}`}>
              <div className="shrink-0 w-8 text-right">
                <span className="text-3xl font-black text-violet-500/70 leading-none">{n}</span>
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-base leading-snug">Actitud {n}</h4>
                <p className="text-sm text-slate-400 dark:text-slate-500 italic">Pendiente de definir</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

export function SeccionMision() {
  const { tab, setTab } = useSectionTab("mision", "principios")
  const activo = TABS.find(t => t.id === tab) ?? TABS[0]
  const { identidad, loading, reload } = useGetIdentidad()
  const documentId = identidad?.documentId ?? null
  const hero = useHeroImagen("portada_depto_mision", documentId, reload)

  const [visitadas, setVisitadas] = useState<Set<string>>(() => new Set([tab]))
  function cambiarTab(id: string) {
    setTab(id)
    setVisitadas(prev => prev.has(id) ? prev : new Set(prev).add(id))
  }

  function renderTab(id: string) {
    switch (id) {
      case "principios":  return <TabPrincipios identidad={identidad} documentId={documentId} onUploaded={reload} />
      case "valores":      return <TabValores identidad={identidad} documentId={documentId} onUploaded={reload} />
      case "actitudes":    return <TabActitudes />
      case "espiritual":   return <Pending owner="Medallitadeoro" desc="Todavía no existe esta información en Miracles." />
      case "consejeria":   return <Pending owner="Medallitadeoro" desc="Todavía no existe esta información en Miracles." />
      case "onboarding":   return <Pending owner="Medallitadeoro" desc="Todavía no existe esta información en Miracles." />
      default:              return null
    }
  }

  return (
    <div className="space-y-4">
      <SeccionHero
        breadcrumb={["Departamentos", "Misión", activo.label]}
        titulo="Misión"
        descripcion={identidad?.descripcion_depto_mision || "Principios, valores y actitudes que guían nuestra manera de trabajar y relacionarnos en medallitadeoro."}
        campoDescripcion="descripcion_depto_mision"
        onDescripcionGuardada={reload}
        imagenUrl={identidad?.portada_depto_mision?.url}
        imagenOriginalUrl={identidad?.portada_depto_mision_original?.url}
        documentId={documentId}
        puedeEditar={!loading}
        uploading={hero.uploading}
        inputRef={hero.inputRef}
        onTrigger={hero.trigger}
        onFileChange={hero.handleFile}
        onSaveCrop={hero.saveCrop}
      />
      <TabBar tabs={TABS} active={tab} onChange={cambiarTab} />
      {TABS.map(t => visitadas.has(t.id) && (
        <div key={t.id} className={tab === t.id ? "" : "hidden"}>
          {renderTab(t.id)}
        </div>
      ))}
    </div>
  )
}
